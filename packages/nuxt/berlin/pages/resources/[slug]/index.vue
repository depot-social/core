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
        <!-- Resource quick Info + Map -->
        <div
          class="col-span-12 md:col-span-6 lg:col-span-5 md:sticky md:top-[20px] self-start mb-8"
        >
          <h1
            v-if="berlinResourceType?.roomName"
            class="text-3xl xl:text-6xl mb-6 font-bold leading-tightest"
          >
            {{ berlinResourceType?.roomName }}
          </h1>

          <div
            class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-5 mb-8"
          >
            <div v-if="berlinResourceType?.roomSizeSqm" class="flex flex-col">
              <span class="text-base font-light leading-tight">
                {{ $t('berlin_resource_roomSizeSqm') }}
              </span>
              <span class="text-xl font-semibold">
                {{ berlinResourceType?.roomSizeSqm }}
              </span>
            </div>

            <div v-if="berlinResourceType?.maxCapacity" class="flex flex-col">
              <span class="text-base font-light leading-tight">
                {{ $t('berlin_resource_maxCapacity') }}
              </span>
              <span class="text-xl font-semibold">
                {{
                  berlinResourceType?.maxCapacity?.replace(/\s*[-–—]\s*/g, '-')
                }}
              </span>
            </div>

            <div v-if="accessibilityText" class="flex flex-col">
              <span class="text-base font-light leading-tight">
                {{ $t('berlin_resource_accessibilityState') }}
              </span>
              <span class="text-xl font-semibold leading-none">
                {{ accessibilityText }}
              </span>
            </div>

            <div v-if="isPaid" class="flex flex-col">
              <span class="text-base font-light leading-tight">
                {{ $t('berlin_resource_usageType') }}
              </span>
              <span class="text-xl font-semibold leading-none">
                {{ $t('berlin_resource_isPaid') }}
              </span>
            </div>
          </div>

          <BaseResourceMap
            :class="'m-0!'"
            :resource="resource"
            :with-link="false"
          />
        </div>

        <!-- Resource Information -->
        <div class="col-span-12 md:col-span-6 md:col-start-7">
          <h2 class="font-semibold text-xl mt-6 mb-5 sm:mb-7">Informationen</h2>
          <div
            class="grid sm:grid-cols-[200px_1fr] md:grid-cols-[100px_1fr] lg:grid-cols-[155px_1fr] *:leading-snug *:even:mb-5 sm:*:even:mb-0 *:font-light sm:*:flex sm:*:items-start sm:*:py-[1.15rem] sm:*:border-b *:border-b-secondary gap-x-6"
          >
            <template v-if="berlinResourceType?.provider">
              <span class="text-sm sm:border-t-2 sm:border-t-gray-700">
                {{ $t('berlin_resource_provider') }}
              </span>
              <span class="text-lg sm:border-t-2 sm:border-t-gray-700">
                {{ berlinResourceType?.provider }}
              </span>
            </template>
            <template v-if="district">
              <span class="text-sm">{{ $t('berlin_resource_district') }}</span>
              <span class="text-base lg:text-lg">
                {{ district?.name }}
              </span>
            </template>
            <template v-if="resource?.address?.street">
              <span class="text-sm">{{ $t('berlin_resource_address') }}</span>
              <span class="text-base lg:text-lg">
                {{ resource.address?.street }}
              </span>
            </template>
            <template v-if="resource?.address?.zip">
              <span class="text-sm">{{ $t('berlin_resource_zip') }}</span>
              <span class="text-base lg:text-lg">
                {{ resource.address?.zip }}
              </span>
            </template>
            <template v-if="resource?.links && resource.links.length > 0">
              <span class="text-sm">{{ $t('berlin_resource_website') }}</span>
              <span>
                <NuxtLink
                  :href="resource?.links[0]?.url"
                  class="text-base font-light lg:text-lg break-all hover:underline underline-offset-2 decoration-1"
                  external
                >
                  {{
                    resource?.links[0]?.url?.match(/^https?:\/\/[^\/]+/)?.[0] ??
                    resource?.links[0]?.url
                  }}
                </NuxtLink>
              </span>
            </template>
            <template v-if="berlinResourceType?.initialRoomName">
              <span class="text-sm">{{
                $t('berlin_resource_initialRoomName')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.initialRoomName }}
              </span>
            </template>
            <template v-if="berlinResourceType?.roomName">
              <span class="text-sm">{{ $t('berlin_resource_roomName') }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.roomName }}
              </span>
            </template>
            <template v-if="berlinResourceType?.roomSizeSqm">
              <span class="text-sm">{{
                $t('berlin_resource_roomSizeSqm')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.roomSizeSqm }}
              </span>
            </template>
            <template v-if="berlinResourceType?.maxCapacity">
              <span class="text-sm">{{
                $t('berlin_resource_maxCapacity')
              }}</span>
              <span class="text-base lg:text-lg">
                {{
                  berlinResourceType?.maxCapacity?.replace(/\s*[-–—]\s*/g, '-')
                }}
              </span>
            </template>
            <template v-if="berlinResourceType?.facilities">
              <span class="text-sm">{{
                $t('berlin_resource_facilities')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.facilities }}
              </span>
            </template>
            <template v-if="berlinResourceType?.facilitiesAdditionalInfo">
              <span class="text-sm">{{
                $t('berlin_resource_facilitiesAdditionalInfo')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.facilitiesAdditionalInfo }}
              </span>
            </template>
            <template v-if="accessibilityText">
              <span class="text-sm">{{
                $t('berlin_resource_accessibilityState')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ accessibilityText }}
              </span>
            </template>
            <template v-if="berlinResourceType?.accessibilityInfo">
              <span class="text-sm">{{
                $t('berlin_resource_accessibilityInfo')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.accessibilityInfo }}
              </span>
            </template>
            <template v-if="berlinResourceType?.usageHours">
              <span class="text-sm">{{
                $t('berlin_resource_usageHours')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.usageHours }}
              </span>
            </template>
            <template v-if="berlinResourceType?.usageFeeDetails">
              <span class="text-sm">{{
                $t('berlin_resource_usageFeeDetails')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.usageFeeDetails }}
              </span>
            </template>
            <template v-if="berlinResourceType?.contactPerson">
              <span class="text-sm">{{
                $t('berlin_resource_contactPerson')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.contactPerson }}
              </span>
            </template>
            <template v-if="berlinResourceType?.contactPhone">
              <span class="text-sm">{{
                $t('berlin_resource_contactPhone')
              }}</span>
              <span class="text-base lg:text-lg">
                {{ berlinResourceType?.contactPhone }}
              </span>
            </template>
            <template v-if="berlinResourceType?.offerPublishedAt">
              <span class="text-sm">{{
                $t('berlin_resource_offerPublishedAt')
              }}</span>
              <span class="text-base lg:text-lg">
                {{
                  berlinResourceType?.offerPublishedAt
                    ? new Date(
                        berlinResourceType.offerPublishedAt
                      ).toLocaleDateString('de-DE')
                    : ''
                }}
              </span>
            </template>
          </div>

          <div class="flex mt-7 mb-8 md:mt-28">
            <UButton
              color="primary"
              variant="outline"
              :to="
                localePath({
                  name: 'bookings-add',
                  query: { resource_id: documentId },
                })
              "
            >
              {{ $t('berlin_booking_form_requestRoom') }}
            </UButton>
          </div>
        </div>
      </div>
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
import type { BerlinResourceType, Resource } from '@depot/shared';
import {
  getAccessibilityText,
  getResourceType,
  ResourceTypeComponent,
} from '@depot/shared';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { PAGE_NOT_FOUND } from '~/base/utils/errors';

const imageGrid = ref<HTMLElement | null>(null); // Create a ref to link to your element
const clientWidth = ref(0);

let resizeObserver: ResizeObserver | null = null;

const localePath = useLocalePath();

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

// Fetch data immediately

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
      'district',
      'purposes',
      'links',
      'resourceTypes',
      'address',
      'prices',
      'categories',
      'attributes.attribute',
      // 'resourceTypes.berlinResourceType',
      // 'resourceTypes.contingentResourceType',
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
const { documentId, title, images, resourceTypes, district } = resource;

const berlinResourceType = getResourceType(
  resourceTypes ?? [],
  ResourceTypeComponent.BERLIN_RESOURCE_TYPE
) as BerlinResourceType | undefined;

const isPaid = computed(() => {
  return (
    resource.attributes?.some((attr) => attr?.attribute?.slug === 'is-paid') ??
    false
  );
});

const accessibilityText = computed(() => {
  return getAccessibilityText(berlinResourceType?.accessibilityState);
});

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
