<template>
  <div class="mt-2 xl:mt-6 flex flex-col">
    <header class="container flex flex-col lg:flex-row gap-3 lg:gap-8">
      <div
        v-if="images && images.length > 0"
        class="lg:basis-5/12 rounded-t-xl"
      >
        <div class="carousel rounded-xl overflow-hidden">
          <div
            v-for="(image, i) in images"
            :id="`item${i}`"
            :key="i"
            class="carousel-item relative w-full"
          >
            <NuxtImg
              :src="image.url"
              width="768"
              :alt="image.alternativeText ?? ''"
              :title="
                (image.alternativeText ? image.alternativeText + '. ' : '') +
                $t('resource_clickToEnlarge')
              "
              class="w-full h-full cursor-pointer"
              @click="openImageModal(image)"
            />
            <!-- <i class="absolute top-4 right-4 ph ph-star text-md md:text-xl transition-all bg-white p-2 px-3 aspect-square text-primary border-2 border-black rounded-full cursor-pointer"></i> -->
          </div>
        </div>
        <div v-if="images.length >= 2" class="flex w-full py-2 gap-2">
          <a v-for="(image, i) in images" :key="i" :href="`#item${i}`">
            <NuxtImg
              :src="image.url"
              width="80"
              height="80"
              :alt="image.alternativeText ?? ''"
              class="w-full h-full rounded opacity-60 transition-opacity hover:opacity-100"
            />
          </a>
        </div>
      </div>
      <div class="flex flex-col gap-4 md:basis-6/12 lg:basis-2/3">
        <span class="text-base font-medium text-primary">
          <!-- @todo once category pages are ready, turn into breadcrumb -->
          {{ simliarResourcesCategory && simliarResourcesCategory.title }}
        </span>
        <h1 class="text-xl md:text-2xl xl:text-3xl">{{ title }}</h1>
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
              {{ contingentResourceType?.availableUnits }} {{ $t('pieces') }}
            </div>
            <div class="stat-title">{{ $t('resource_availableUnits') }}</div>
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
    </header>

    <main class="bg-white rounded-t-2xl mt-4 md:mt-8 py-5 md:py-8 lg:py-16">
      <div class="container md:max-w-[75%] xl:max-w-[58.3%] hidden md:block">
        <span class="sr-only">{{ $t('resource_description') }}</span>
        <div class="html-content" v-html="markdownDescription" />
      </div>
      <div class="container flex flex-col md:flex-row md:mt-12">
        <div class="lg:basis-5/12">
          <div v-if="user">
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
                  {{ format(user.createdAt, 'MMM yyyy') }}
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
          <div v-if="resource.address" class="mt-8">
            <BaseResourceMap :resource="resource" :with-link="false">
              <span class="text-base font-medium pb-3 block">{{
                $t('resource_location')
              }}</span>
            </BaseResourceMap>
          </div>
        </div>
        <div class="md:hidden mt-8 html-content" v-html="markdownDescription" />
        <div class="md:basis-2/3 md:pl-12 self-end">
          <div class="border-2 border-black rounded-xl py-6 px-4">
            <BaseResourceCalendar
              :resource="resource"
              :availabilities="availabilities"
            />
          </div>
        </div>
      </div>

      <!-- @todo Info zum Anbieter, ggf. Info-Dokumente ("Links"), lastly SEO -->
    </main>
    <section
      v-if="similarResources && similarResources.length >= 1"
      class="bg-orange-100 py-8"
    >
      <div class="container bg-white rounded-2xl py-5 lg:py-12">
        <div class="container">
          <h3 class="text-2lg font-medium text-black text-center">
            {{ $t('resource_moreResourcesFromCategory') }}
            <span class="marker">
              {{ simliarResourcesCategory && simliarResourcesCategory.title }}
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

    <dialog
      ref="imageModal"
      class="modal"
      :class="{ 'modal-open': selectedImage }"
      @click="closeImageModal"
    >
      <div class="modal-box max-w-none p-0" @click.stop>
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
  BerlinResourceType,
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
import { computed, ref } from 'vue';
import { useResourcePricing } from '~/base/composables/useResourcePricing';
import { PAGE_NOT_FOUND } from '~/base/utils/errors';

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
      'address',
      'prices',
      'categories',
      'user',
      'resourceTypes.berlinResourceType',
      'resourceTypes.contingentResourceType',
    ],
  })
);

if (!resourceResponse.data || resourceResponse.data.value?.data.length === 0) {
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

const berlinResourceType = getResourceType(
  resourceTypes ?? [],
  ResourceTypeComponent.BERLIN_RESOURCE_TYPE
) as BerlinResourceType | undefined;

const contingentResourceType = getResourceType(
  resourceTypes ?? [],
  ResourceTypeComponent.CONTINGENT_RESOURCE_TYPE
) as ContingentResourceType | undefined;

const markdownDescription = computed(() =>
  description ? marked(description) : ''
);

const simliarResourcesCategory =
  categories && categories.length > 0 ? categories[0] : null;

// Modal state
const selectedImage = ref<{
  url: string;
  alternativeText?: string | null;
} | null>(null);
const imageModal = ref<HTMLDialogElement | null>(null);

// Fetch similar resources
if (simliarResourcesCategory) {
  const categoryId = simliarResourcesCategory.id;

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
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

useHead({
  title: () => `${title} – ${$t('discoverResources')}`,
});
</script>
