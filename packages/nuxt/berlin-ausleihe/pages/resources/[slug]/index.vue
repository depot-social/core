<template>
  <div
    class="px-6 xl:px-0 grid grid-cols-12 gap-5 max-w-[1620px] mx-auto mt-6 lg:mt-10"
  >
    <header class="col-span-12 xl:col-span-10 xl:col-start-2">
      <NuxtLinkLocale
        :to="{ name: 'resources' }"
        class="text-2lg font-light mb-6 block"
      >
        {{ $t('berlin_resource_toOverview') }}
      </NuxtLinkLocale>

      <div v-if="images && images.length > 0">
        <div
          ref="imageGrid"
          class="resource-image-grid | gap-1.5 lg:gap-2.5 rounded-[30px] overflow-clip"
          :class="`has-${Math.min(images.length, 5)}-images`"
          :style="{
            '--containerWidth': clientWidth + 'px',
          }"
        >
          <div
            v-for="(image, i) in images.slice(0, 5)"
            :id="`item${i}`"
            :key="i"
            class="relative w-lg lg:w-4xl"
          >
            <NuxtImg
              :src="image.url"
              width="768"
              loading="lazy"
              :alt="image.alternativeText ?? ''"
              :title="
                (image.alternativeText ? image.alternativeText + '. ' : '') +
                $t('resource_clickToEnlarge')
              "
              class="w-full h-full cursor-pointer"
              @click="openImageModal(image)"
            />
          </div>
        </div>
      </div>
    </header>

    <main
      class="bg-white col-span-12 xl:col-span-10 xl:col-start-2 rounded-t-2xl pb-5 md:pb-8 lg:pb-16 mt-4 lg:mt-16"
    >
      <div class="grid grid-cols-12 gap-5">
        <!-- Resource quick information and map -->
        <div
          class="col-span-12 md:col-span-6 lg:col-span-5 md:sticky md:top-[20px] self-start mb-8 space-y-6"
        >
          <h1
            v-if="resource?.title"
            class="text-3xl xl:text-6xl mb-6 font-bold leading-tightest"
          >
            {{ resource.title }}
          </h1>

          <span class="sr-only">{{ $t('resource_description') }}</span>
          <div class="html-content" v-html="markdownDescription" />

          <div
            class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-5 mb-8"
          >
            <div class="flex flex-col">
              <ul class="flex gap-4">
                <li v-if="isNotForProfitOnly" class="badge bg-white badge-sm">
                  {{ $t('resource_onlyForNonprofits') }}
                </li>
                <li class="badge badge-primary badge-sm hidden">
                  {{ $t('resource_popularResource') }}
                </li>
              </ul>
              <div class="stats py-2 mt-auto bg-transparent">
                <div
                  v-if="contingentResourceType?.availableUnits"
                  class="stat flex flex-col"
                >
                  <div class="stat-value text-2lg">
                    {{ contingentResourceType?.availableUnits }}
                    {{ $t('pieces') }}
                  </div>
                  <div class="stat-title">
                    {{ $t('resource_availableUnits') }}
                  </div>
                </div>
                <div v-if="regularPrice" class="stat flex flex-col">
                  <div class="stat-value text-2lg">
                    {{ formatPrice(regularPrice) }}
                  </div>
                  <div class="stat-title">
                    {{ getDurationText(regularPrice) }}
                  </div>
                </div>
                <div v-if="notForProfitPrice" class="stat flex flex-col">
                  <div class="stat-value text-2lg">
                    {{ formatPrice(notForProfitPrice) }}
                  </div>
                  <div class="stat-title">
                    {{ getDurationText(notForProfitPrice) }}
                  </div>
                  <div class="stat-desc flex items-center gap-1">
                    {{ $t('resource_forNonprofits') }}
                    <div
                      class="tooltip tooltip-info cursor-pointer"
                      :data-tip="$t('resource_whatDoesThisMean')"
                    >
                      <span class="ph ph-info text-lg text-primary"></span>
                    </div>
                  </div>
                </div>
                <div v-if="deposit" class="stat flex flex-col">
                  <div class="stat-value text-2lg">
                    {{ formatPrice({ value: deposit }) }}
                  </div>
                  <div class="stat-title">{{ $t('resource_deposit') }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="resource.user" class="flex flex-col">
            <span class="text-base font-medium">{{
              $t('resource_provider')
            }}</span>
            <div class="flex items-start mt-3 gap-3">
              <div class="avatar avatar-placeholder">
                <div class="bg-primary text-white rounded-full w-18">
                  <span>
                    {{ getUsernameAbbreviationFromUser(user) }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col">
                <p class="font-sans">
                  {{ getUsernameFromUser(user) }}
                </p>
                <p class="text-gray-800">
                  {{ $t('resource_memberSince') }}
                  {{ formatDate(user.createdAt, 'MMM yyyy') }}
                </p>
                <!-- <ul class="flex gap-2 mt-4 text-base">
                <li class="badge badge-sm border-0">4 Ressourcen</li>
                <li class="badge badge-sm badge-accent">
                  <i class="ph ph-checks mr-2"></i>
                  Gemeinwohl Akteur
                </li>
              </ul> -->
              </div>
            </div>
          </div>

          <div v-if="resource.address">
            <BaseResourceMap
              class="m-0!"
              :resource="resource"
              :with-link="false"
            >
              <span class="text-base font-medium pb-3 block">{{
                $t('resource_location')
              }}</span>
            </BaseResourceMap>
          </div>
        </div>

        <!-- Resource information -->
        <div class="col-span-12 md:col-span-6 md:col-start-7">
          <h2 class="font-semibold text-xl mt-6 mb-5 sm:mb-7">
            {{ $t('berlin_resource_title') }}
          </h2>

          <div
            class="grid sm:grid-cols-[200px_1fr] md:grid-cols-[100px_1fr] lg:grid-cols-[155px_1fr] *:leading-snug *:even:mb-5 sm:*:even:mb-0 *:font-light sm:*:flex sm:*:items-start sm:*:py-[1.15rem] sm:*:border-b *:border-b-secondary gap-x-6"
          >
            <template v-if="resource.district">
              <span class="text-sm">
                {{ $t('berlin_resource_district') }}
              </span>

              <span class="text-base lg:text-lg">
                {{ resource.district.name }}
              </span>
            </template>

            <!-- TODO: Show Adress only :when: -->
            <template v-if="resource.address?.street">
              <span class="text-sm">
                {{ $t('berlin_resource_address') }}
              </span>

              <span class="text-base lg:text-lg">
                {{ resource.address.street }}
              </span>
            </template>

            <template v-if="resource.address?.zip">
              <span class="text-sm">
                {{ $t('berlin_resource_zip') }}
              </span>

              <span class="text-base lg:text-lg">
                {{ resource.address.zip }}
              </span>
            </template>

            <template v-if="resource.links?.length">
              <span class="text-sm">
                {{ $t('berlin_resource_website') }}
              </span>

              <span>
                <NuxtLink
                  :href="resource.links[0]?.url"
                  class="text-base font-light lg:text-lg break-all hover:underline underline-offset-2 decoration-1"
                  external
                >
                  {{
                    resource.links[0]?.url?.match(/^https?:\/\/[^/]+/)?.[0] ??
                    resource.links[0]?.url
                  }}
                </NuxtLink>
              </span>
            </template>
          </div>

          <div class="flex mt-7 mb-8 md:mt-28">
            <BerlinResourceCalendar
              :resource="resource"
              :availabilities="availabilities"
            />
          </div>
        </div>
      </div>

      <section
        v-if="similarResources && similarResources.length >= 1"
        class="bg-orange-100 py-8"
      >
        <div class="container bg-white rounded-2xl py-5 lg:py-12">
          <div class="container">
            <h3 class="text-2lg font-medium text-black text-center">
              {{ $t('resource_moreResourcesFromCategory') }}
              <span class="marker">
                {{ similarResourcesCategory && similarResourcesCategory.title }}
              </span>
              :
            </h3>
            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-base mt-10"
            >
              <BaseResourceCard
                v-for="resource in similarResources"
                :key="resource.id"
                :resource="resource"
              />
            </div>
            <div
              v-if="similarResources.length >= 3"
              class="w-full text-center mt-5 md:mt-8"
            >
              <NuxtLinkLocale
                :to="{ name: 'resources' }"
                class="btn btn-primary btn-lg shadow-xl"
              >
                {{ $t('resource_allResourcesFromCategory') }}
              </NuxtLinkLocale>
            </div>
          </div>
        </div>
      </section>
    </main>

    <dialog
      ref="imageModal"
      class="modal"
      :class="{ 'modal-open': selectedImage }"
      @click="closeImageModal"
    >
      <div class="modal-box max-w-max p-0" @click.stop>
        <div class="flex justify-end p-4 absolute top-2 right-2">
          <button
            class="btn btn-sm btn-circle bg-white btn-outline"
            @click="closeImageModal"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="flex justify-center items-center h-full">
          <NuxtImg
            v-if="selectedImage"
            :src="selectedImage.url"
            :alt="selectedImage.alternativeText ?? ''"
            class="max-w-full max-h-full object-contain"
            width="1024"
          />
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type {
  AvailabilitiesGetCalendarResponseData,
  ContingentResourceType,
  Resource,
} from '@depot/shared';
import {
  getResourceType,
  getUsernameAbbreviationFromUser,
  getUsernameFromUser,
  ResourceTypeComponent,
} from '@depot/shared';
import { format } from 'date-fns';
import { marked } from 'marked';
import { onMounted, onUnmounted, ref } from 'vue';
import { useDateFormat } from '~/base/composables/useDateFormat';
import { PAGE_NOT_FOUND } from '~/base/utils/errors';

const imageGrid = ref<HTMLElement | null>(null); // Create a ref to link to your element
const clientWidth = ref(0);
const { formatDate } = useDateFormat();

let resizeObserver: ResizeObserver | null = null;

// Get route params
const route = useRoute();
const slug = route.params.slug as string;

if (!slug) {
  throw createError({
    statusCode: 404,
    statusMessage: PAGE_NOT_FOUND,
  });
}

const { find } = useStrapi();

let similarResources: Resource[] = [];

// Fetch resource by slug
const resourceResponse = await useAsyncData(`resource-${slug}`, () =>
  find<Resource>('resources', {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: [
      'images',
      'resourceTypes',
      'district',
      'address',
      'prices',
      'categories',
      'user',
    ],
  })
);

if (
  !resourceResponse.data ||
  !resourceResponse.data.value ||
  resourceResponse.data.value?.data.length === 0
) {
  throw createError({
    statusCode: 404,
    statusMessage: PAGE_NOT_FOUND,
  });
}

const resource = resourceResponse.data.value?.data[0] as unknown as Resource;
const {
  documentId,
  title,
  description,
  images,
  resourceTypes,
  categories,
  user,
} = resource;

const contingentResourceType = getResourceType(
  resourceTypes ?? [],
  ResourceTypeComponent.CONTINGENT_RESOURCE_TYPE
) as ContingentResourceType | undefined;

const markdownDescription = computed(() =>
  description ? marked(description) : ''
);

const similarResourcesCategory =
  categories && categories.length > 0 ? categories[0] : null;

// Fetch similar resources
if (similarResourcesCategory) {
  const categoryId = similarResourcesCategory.id;

  if (categoryId) {
    const similarResourcesResponse = await useAsyncData(
      'similarResources',
      () =>
        find<Resource>('resources', {
          populate: ['images', 'user'],
          filters: {
            $and: [
              {
                categories: {
                  $eq: categoryId,
                },
              },
              {
                id: {
                  $ne: resource.id,
                },
              },
            ],
          },
          pagination: {
            pageSize: 3,
            page: 1,
          },
        })
    );

    if (similarResourcesResponse.data.value) {
      similarResources = similarResourcesResponse.data.value.data;
    }
  }
}

// Fetch calendar data
const start = new Date();
const end = new Date();
end.setDate(end.getDate() + 182);

const calendarResponse = await useAsyncData('calendar', () =>
  find<AvailabilitiesGetCalendarResponseData>(
    `plugin-availabilities/calendar?start=${format(
      start,
      'yyyy-MM-dd'
    )}&end=${end.toISOString()}&resource_id=${documentId}`
  )
);

const availabilities = calendarResponse.data
  .value as unknown as AvailabilitiesGetCalendarResponseData;

// Use pricing composable
const {
  regularPrice,
  notForProfitPrice,
  deposit,
  isNotForProfitOnly,
  formatPrice,
  getDurationText,
} = useResourcePricing(resource);

// Modal state
const selectedImage = ref<{
  url: string;
  alternativeText?: string | null;
} | null>(null);
const imageModal = ref<HTMLDialogElement | null>(null);

// Modal methods
const openImageModal = (image: {
  url: string;
  alternativeText?: string | null;
}) => {
  selectedImage.value = image;
  if (imageModal.value) {
    imageModal.value.showModal();
  }
};

const closeImageModal = () => {
  selectedImage.value = null;
  if (imageModal.value) {
    imageModal.value.close();
  }
};

// Handle escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && selectedImage.value) {
    closeImageModal();
  }
};

// Add event listener for escape key
// setup resize observer
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);

  if (imageGrid.value) {
    // Initial width measurement
    clientWidth.value = imageGrid.value.clientWidth;

    // Use ResizeObserver for more efficient and specific element resizing
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === imageGrid.value) {
          clientWidth.value = entry.contentRect.width;
        }
      }
    });
    resizeObserver.observe(imageGrid.value);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);

  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

useHead({
  title: () => `${title} – ${$t('discoverResources')}`,
});
</script>
