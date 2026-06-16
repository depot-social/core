<template>
  <div class="container px-10">
    <h3 class="text-xl">{{ $t('myResources') }}</h3>
    <div class="p-4 flex gap-8 bg-white rounded-2xl overflow-x-auto">
      <div>
        <NuxtLink
          :to="getResourcesAddPath()"
          class="btn btn-primary btn-full btn-lg h-[200px]"
        >
          <h2 class="text-md p-5">{{ $t('addNewResource') }}</h2>
        </NuxtLink>
      </div>
      <div v-for="resource in resources" :key="resource.id" class="w-[260px]">
        <BaseResourceCard :resource="resource" :image-size="260" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import { getResourcesAddPath } from '~/base/utils/paths';

interface Props {
  resources: Resource[];
}

defineProps<Props>();
</script>
