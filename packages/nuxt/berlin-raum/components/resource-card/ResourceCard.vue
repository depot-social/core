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
              v-if="isLayer('berlin-raum')"
              d="M25.0001 20.1421V7.8581C25.6823 7.68314 26.3061 7.33079 26.8082 6.8368C27.3102 6.34281 27.6726 5.72478 27.8586 5.04546C28.0445 4.36613 28.0474 3.64969 27.8669 2.96889C27.6865 2.28808 27.3291 1.66714 26.8311 1.16911C26.3331 0.671084 25.7121 0.3137 25.0313 0.133242C24.3505 -0.0472161 23.6341 -0.0443215 22.9547 0.141632C22.2754 0.327585 21.6574 0.689975 21.1634 1.19201C20.6694 1.69405 20.317 2.31785 20.1421 3.0001H7.8581C7.68314 2.31785 7.33079 1.69405 6.8368 1.19201C6.34281 0.689975 5.72478 0.327585 5.04546 0.141632C4.36613 -0.0443215 3.64969 -0.0472161 2.96889 0.133242C2.28808 0.3137 1.66714 0.671084 1.16911 1.16911C0.671084 1.66714 0.3137 2.28808 0.133242 2.96889C-0.0472161 3.64969 -0.0443215 4.36613 0.141632 5.04546C0.327585 5.72478 0.689975 6.34281 1.19201 6.8368C1.69405 7.33079 2.31785 7.68314 3.0001 7.8581V20.1421C2.31785 20.317 1.69405 20.6694 1.19201 21.1634C0.689975 21.6574 0.327585 22.2754 0.141632 22.9547C-0.0443215 23.6341 -0.0472161 24.3505 0.133242 25.0313C0.3137 25.7121 0.671084 26.3331 1.16911 26.8311C1.66714 27.3291 2.28808 27.6865 2.96889 27.8669C3.64969 28.0474 4.36613 28.0445 5.04546 27.8586C5.72478 27.6726 6.34281 27.3102 6.8368 26.8082C7.33079 26.3061 7.68314 25.6823 7.8581 25.0001H20.1421C20.317 25.6823 20.6694 26.3061 21.1634 26.8082C21.6574 27.3102 22.2754 27.6726 22.9547 27.8586C23.6341 28.0445 24.3505 28.0474 25.0313 27.8669C25.7121 27.6865 26.3331 27.3291 26.8311 26.8311C27.3291 26.3331 27.6865 25.7121 27.8669 25.0313C28.0474 24.3505 28.0445 23.6341 27.8586 22.9547C27.6726 22.2754 27.3102 21.6574 26.8082 21.1634C26.3061 20.6694 25.6823 20.317 25.0001 20.1421ZM24.0001 2.0001C24.3957 2.0001 24.7823 2.11739 25.1112 2.33716C25.4401 2.55692 25.6965 2.86928 25.8479 3.23473C25.9992 3.60018 26.0388 4.00231 25.9617 4.39028C25.8845 4.77824 25.694 5.1346 25.4143 5.41431C25.1346 5.69401 24.7782 5.8845 24.3903 5.96167C24.0023 6.03884 23.6002 5.99923 23.2347 5.84786C22.8693 5.69648 22.5569 5.44013 22.3372 5.11124C22.1174 4.78234 22.0001 4.39566 22.0001 4.0001C22.0007 3.46985 22.2116 2.9615 22.5866 2.58655C22.9615 2.21161 23.4698 2.0007 24.0001 2.0001ZM2.0001 4.0001C2.0001 3.60453 2.11739 3.21785 2.33716 2.88896C2.55692 2.56006 2.86928 2.30371 3.23473 2.15234C3.60018 2.00096 4.00231 1.96135 4.39028 2.03853C4.77824 2.1157 5.1346 2.30618 5.41431 2.58588C5.69401 2.86559 5.8845 3.22195 5.96167 3.60992C6.03884 3.99788 5.99923 4.40001 5.84786 4.76546C5.69648 5.13092 5.44013 5.44327 5.11124 5.66303C4.78234 5.8828 4.39566 6.0001 4.0001 6.0001C3.46983 5.99957 2.96143 5.78868 2.58647 5.41372C2.21151 5.03877 2.00063 4.53037 2.0001 4.0001ZM4.0001 26.0001C3.60453 26.0001 3.21785 25.8828 2.88896 25.663C2.56006 25.4433 2.30371 25.1309 2.15234 24.7655C2.00096 24.4 1.96135 23.9979 2.03853 23.6099C2.1157 23.222 2.30618 22.8656 2.58588 22.5859C2.86559 22.3062 3.22195 22.1157 3.60992 22.0385C3.99788 21.9614 4.40001 22.001 4.76546 22.1523C5.13092 22.3037 5.44327 22.5601 5.66303 22.889C5.8828 23.2179 6.0001 23.6045 6.0001 24.0001C5.99949 24.5303 5.78858 25.0387 5.41364 25.4136C5.0387 25.7886 4.53034 25.9995 4.0001 26.0001ZM20.1421 23.0001H7.8581C7.679 22.3126 7.31973 21.6852 6.81734 21.1829C6.31495 20.6805 5.68764 20.3212 5.0001 20.1421V7.8581C5.68759 7.6789 6.31485 7.3196 6.81723 6.81723C7.3196 6.31485 7.6789 5.68759 7.8581 5.0001H20.1421C20.3212 5.68764 20.6805 6.31495 21.1829 6.81734C21.6852 7.31973 22.3126 7.679 23.0001 7.8581V20.1421C22.3125 20.3211 21.6852 20.6804 21.1828 21.1828C20.6804 21.6852 20.3211 22.3125 20.1421 23.0001ZM24.0001 26.0001C23.6045 26.0001 23.2179 25.8828 22.889 25.663C22.5601 25.4433 22.3037 25.1309 22.1523 24.7655C22.001 24.4 21.9614 23.9979 22.0385 23.6099C22.1157 23.222 22.3062 22.8656 22.5859 22.5859C22.8656 22.3062 23.222 22.1157 23.6099 22.0385C23.9979 21.9614 24.4 22.001 24.7655 22.1523C25.1309 22.3037 25.4433 22.5601 25.663 22.889C25.8828 23.2179 26.0001 23.6045 26.0001 24.0001C25.9994 24.5303 25.7884 25.0386 25.4135 25.4135C25.0386 25.7884 24.5303 25.9994 24.0001 26.0001Z"
              fill="#121212"
            />
            <path
              v-else
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

const { isLayer } = useActiveLayer();

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
