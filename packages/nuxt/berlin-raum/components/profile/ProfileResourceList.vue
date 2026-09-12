<template>
  <div class="flex flex-col gap-8 mb-12">
    <div class="flex flex-col gap-2">
      <h3 class="text-xl">
        {{
          isLayer('berlin-raum')
            ? $t('berlin_resources_myRooms')
            : $t('berlin_resources_myResources')
        }}
      </h3>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-6">
      <UButton
        color="primary"
        variant="outline"
        class="w-auto aspect-square items-center flex rounded-[30px] leading-tight"
        :to="localePath('resources-add')"
      >
        {{ $t('berlin_resources_addNewRoom') }}
      </UButton>

      <div v-for="resource in publishedResources" :key="resource.id">
        <BerlinResourceCardSmall :resource="resource" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';

const localePath = useLocalePath();
const { isLayer } = useActiveLayer();

type ResourceWithPublication = Resource & {
  documentId?: string | null;
  publishedAt?: string | null;
};

const props = defineProps<{
  resources: ResourceWithPublication[];
}>();

const publishedResources = computed(() => {
  const published = new Map<string, ResourceWithPublication>();

  for (const resource of props.resources) {
    if (!resource.publishedAt) continue;

    const key = resource.documentId || String(resource.id);

    // Keep the first published version of each document.
    if (!published.has(key)) {
      published.set(key, resource);
    }
  }

  return [...published.values()];
});
</script>
