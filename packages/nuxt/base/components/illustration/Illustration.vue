<template>
  <div class="illustration">
    <NuxtImg
      v-if="illustration"
      :src="illustration.url"
      :alt="illustration.alternativeText || ''"
      :width="illustration.width"
      :height="illustration.height"
      class="w-full h-auto"
    />
  </div>
</template>

<script setup lang="ts">
interface StrapiMedia {
  id: number;
  url: string;
  width: number;
  height: number;
  alternativeText?: string | null;
  caption?: string | null;
  name: string;
  mime: string;
  size: number;
  ext: string;
  hash: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Props {
  illustration?: StrapiMedia | null;
}
const props = defineProps<Props>();
</script>

<style scoped>
.illustration {
  @apply flex justify-center items-center;
}
</style>
