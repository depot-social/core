<template>
  <section
    class="relative z-10 flex flex-col px-6 py-6 md:py-8"
    :class="!backgroundColor && fallbackBackgroundClass"
    :style="backgroundColor ? { backgroundColor } : undefined"
  >
    <div class="flex flex-col lg:flex-row w-full">
      <div class="flex flex-col">
        <h1
          class="font-bold! leading-none! tracking-tight text-[42px]! sm:text-[62px]! md:text-[96px]! whitespace-pre-line"
        >
          {{ headline }}
        </h1>

        <div
          v-if="sublineHtml"
          class="relative z-10 mt-6 md:mt-10 mb-8 max-w-[480px] text-balance *:text-lg! md:*:text-2lg! [&_p]:font-medium! [&_p+p]:mt-3 [&_a]:font-bold! [&_a]:text-black! [&_a]:underline! [&_a]:underline-offset-2 [&_a:hover]:no-underline"
          v-html="sublineHtml"
        />
      </div>

      <figure class="mb-6 lg:mb-0 lg:ml-auto">
        <component
          :is="header?.imageLinkUrl ? NuxtLink : 'div'"
          v-if="image"
          :to="header?.imageLinkUrl || undefined"
          class="block"
        >
          <img
            v-if="isSvg"
            :src="useStrapiMedia(image.url)"
            :alt="image.alternativeText ?? ''"
            :class="imageClass"
          />

          <NuxtImg
            v-else
            :src="image.url"
            :height="image.height ? Math.min(image.height, 940) : undefined"
            :alt="image.alternativeText ?? ''"
            :class="imageClass"
          />
        </component>

        <slot v-else name="illustration" />
      </figure>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import type { PageHeader } from '@depot/shared';
import { marked } from 'marked';

const NuxtLink = resolveComponent('NuxtLink');

const props = defineProps<{
  header?: PageHeader | null;
  fallbackHeadline: string;
  fallbackBackgroundClass: string;
}>();

const imageClass =
  'w-auto max-w-full object-contain h-72 m-auto md:m-0 sm:h-[250px] md:h-[298px] lg:h-[340px] xl:h-[420px]';

const headline = computed(
  () => props.header?.headline?.trim() || props.fallbackHeadline
);

const backgroundColor = computed(
  () => props.header?.backgroundColor || undefined
);

const sublineHtml = computed(() =>
  props.header?.subline?.trim()
    ? marked(props.header.subline, { async: false, breaks: true })
    : ''
);

const image = computed(() =>
  props.header?.image?.url ? props.header.image : undefined
);

const isSvg = computed(() => image.value?.mime === 'image/svg+xml');
</script>
