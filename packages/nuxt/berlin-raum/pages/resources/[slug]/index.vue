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
      <BerlinResourceDetailsRaum
        :resource="resource"
        :resource-type="berlinResourceType"
        :accessibility-text="accessibilityText"
        :is-paid="isPaid"
      />
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

console.log('resource', resource);

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
