<template>
  <div class="group relative rounded-lg md:rounded-2xl overflow-hidden">
    <NuxtImg
      v-if="resource.images && resource.images[0]"
      :key="resource.id"
      :src="resource.images[0].url"
      width="265"
      :alt="resource.images[0].alternativeText ?? ''"
      class="transition-all h-auto w-full bg-white"
    />
    <div
      class="opacity-0 group-hover:opacity-100 flex flex-col justify-between transition-all duration-300 absolute inset-0 bg-[rgba(0,0,0,0.35)] p-4 text-white backdrop-blur"
    >
      <span class="line-clamp-2">{{ resource.title }}</span>
      <a
        :href="getResourcePath(resource.slug)"
        class="btn btn-primary"
      >
        {{ $t('viewResource') }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Resource as DepotResource } from '@depot/shared';
import { getResourcePath } from '~/base/utils/paths';

interface Props {
  resource: DepotResource;
}

defineProps<Props>();
</script>
