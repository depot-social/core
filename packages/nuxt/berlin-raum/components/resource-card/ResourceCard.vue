<template>
  <article
    class="xx-aspect-[360/590] xx-md:aspect-[360/570] group rounded-[30px] shadow-lg duration-300"
  >
    <NuxtLinkLocale
      :to="{ name: 'resources-slug', params: { slug: resource.slug } }"
      class="flex h-full flex-col gap-6"
    >
      <div
        class="relative w-full rounded-t-[30px] basis-[43%] shrink-0 overflow-hidden aspect-[424/294] bg-[#D9D9D9]"
      >
        <NuxtImg
          v-if="resourceImages && resourceImages[0]?.url"
          :src="resourceImages[0].url"
          :width="imageSize"
          :height="imageSize"
          :alt="resourceImages[0].alternativeText ?? ''"
          class="object-cover aspect-[424/294] object-center w-full h-full"
        />

        <figure class="relative grid place-content-center h-full" v-else>
          <span
            class="relative z-[1] px-2 tracking-[-2%] font-semibold text-lg bg-white border-2 border-black rounded-md"
            >{{ $t('berlin_resource_exampleImage') }}</span
          >
          <img
            src="/placeholder.jpg"
            class="absolute inset-0 object-cover aspect-[424/294] object-center w-full h-full"
            :alt="$t('berlin_resource_exampleImage')"
          />
        </figure>
      </div>

      <div class="flex-grow flex flex-col flex-1 gap-2.5 2xl:gap-4 px-6 pb-6">
        <header>
          <svg
            class="aspect-square w-[28px] mb-2"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M26.59 11.31L28 9.9L18 0L16.69 1.42L17.87 2.6L6.38 12.32L4.66 10.61L3.25 12L8.91 17.68L0 26.58L1.41 28L10.32 19.09L16 24.75L17.39 23.33L15.68 21.62L25.4 10.13L26.59 11.31ZM14.26 20.2L7.8 13.74L19.29 4L24 8.71L14.26 20.2Z"
              fill="#121212"
            />
          </svg>

          <h2
            lang="de"
            class="leading-tight text-xl hyphens-auto text-black font-semibold"
          >
            <span v-if="berlinResourceType?.roomName">
              {{ berlinResourceType.roomName }}
            </span>
            <span v-else>
              {{ resource.title }}
            </span>
          </h2>
        </header>

        <footer class="flex flex-col gap-4 h-full">
          <div
            class="flex flex-wrap gap-x-4 text-2lg leading-snug font-light text-black"
          >
            <span v-if="berlinResourceType?.roomSizeSqm">
              {{ berlinResourceType.roomSizeSqm }}qm
            </span>

            <span v-if="berlinResourceType?.maxCapacity">
              {{ berlinResourceType.maxCapacity?.replace(/\s*[-–—]\s*/g, '-') }}
              Personen
            </span>

            <span v-if="isPaid">
              {{ $t('berlin_resource_isPaid') }}
            </span>

            <span v-if="accessibilityText">
              {{ accessibilityText }}
            </span>
          </div>

          <p
            v-if="berlinResourceType?.provider"
            class="text-base leading-snug font-light mt-auto"
          >
            {{ berlinResourceType.provider }}
          </p>
        </footer>
      </div>
    </NuxtLinkLocale>
  </article>
</template>

<script setup lang="ts">
import type { BerlinResourceType, Resource } from '@depot/shared';
import {
  getAccessibilityText,
  getResourceType,
  ResourceTypeComponent,
} from '@depot/shared';
import { computed } from 'vue';

interface Props {
  resource: Resource;
  imageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  imageSize: 365,
});

const resourceImages = computed(() => props.resource.images ?? []);

const berlinResourceType = computed(() => {
  return getResourceType(
    props.resource.resourceTypes ?? [],
    ResourceTypeComponent.BERLIN_RESOURCE_TYPE
  ) as BerlinResourceType | undefined;
});

const isPaid = computed(() => {
  return (
    props.resource.attributes?.some(
      (attr) => attr?.attribute?.slug === 'is-paid'
    ) ?? false
  );
});

const accessibilityText = computed(() => {
  return getAccessibilityText(berlinResourceType.value?.accessibilityState);
});
</script>
