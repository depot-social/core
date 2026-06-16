<template>
  <ul :id="id" role="listbox" :class="containerClass">
    <li v-if="error" class="opacity-60">
      <span>{{ error }}</span>
    </li>
    <li
      v-else-if="
        query && query !== '' && (!resources || resources.length === 0)
      "
      class="opacity-60"
    >
      <span>{{ $t('noResourcesFound') }}</span>
    </li>
    <li v-else v-for="resource in resources" :key="resource.id">
      <a :href="getResourcePath(resource.slug)">
        <div class="flex items-center gap-3">
          <NuxtImg
            v-if="resource.images && resource.images[0]"
            :src="resource.images[0].url"
            width="56"
            height="56"
            class="rounded-md bg-white object-cover"
            :alt="resource.images[0].alternativeText ?? ''"
          />
          <div class="line-clamp-2">{{ resource.title }}</div>
        </div>
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import { getResourcePath } from '~/base/utils/paths';

interface Props {
  id: string;
  resources: readonly Resource[];
  loading: boolean;
  error: string | null;
  containerClass?: string;
  query?: string;
}

withDefaults(defineProps<Props>(), {
  containerClass:
    'dropdown-content gap-1 mt-1 z-[1] menu p-2 shadow bg-white rounded-box w-full',
});

defineEmits<{
  (e: 'mouse-leave'): void;
}>();
</script>
