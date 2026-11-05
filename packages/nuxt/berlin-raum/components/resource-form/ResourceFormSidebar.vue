<template>
  <aside>
    <div class="flex flex-col gap-6 h-max">
      <NuxtLinkLocale
        :to="{ name: 'user' }"
        class="text-2lg font-light block"
      >
        {{ $t('berlin_resource_toOverview') }}
      </NuxtLinkLocale>

      <h1 v-if="title" class="text-2xl md:text-3xl font-semibold leading-tight">
        {{ title }}
      </h1>

      <div v-if="imagesWithUrl.length" class="grid grid-cols-2 gap-3">
        <NuxtImg
          v-for="(image, index) in imagesWithUrl"
          :key="image.id ?? image.url"
          :src="image.url"
          :alt="image.alternativeText ?? ''"
          :width="index === 0 ? 400 : 200"
          :height="index === 0 ? 400 : 200"
          class="w-full aspect-square object-cover rounded-[20px]"
          :class="{ 'col-span-2': index === 0 }"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { UploadedImage } from '@depot/shared';

const props = withDefaults(
  defineProps<{
    title?: string;
    images?: UploadedImage[];
  }>(),
  {
    title: '',
    images: () => [],
  }
);

const imagesWithUrl = computed(() =>
  props.images.filter((image) => Boolean(image.url))
);
</script>
