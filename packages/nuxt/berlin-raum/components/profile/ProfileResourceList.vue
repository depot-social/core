<template>
  <div class="flex flex-col gap-8 mb-12">
    <div class="flex flex-col gap-2">
      <h3 class="text-xl">{{ $t('berlin_resources_myRooms') }}</h3>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-6">
      <UButton
        color="primary"
        variant="outline"
        class="aspect-square items-center flex rounded-[30px] leading-tight"
        :to="localePath('resources-add')"
      >
        {{ $t('berlin_resources_addNewRoom') }}
      </UButton>
      <div v-for="resource in publishedResources" :key="resource.id">
        <BerlinResourceCardSmall :resource="resource" />
      </div>
    </div>

    <h3>Prüfung ausstehend</h3>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-6">
      <div v-for="resource in draftResources" :key="resource.id">
        <BerlinResourceCardSmall :resource="resource" :disabled="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';

const localePath = useLocalePath();

interface Props {
  resources: Resource[];
}

type ResourceWithPublishedAt = Resource & {
  documentId?: string | null;
  publishedAt?: string | null;
};

const props = defineProps<Props>();

// Strapi can return draft and published variants of the same resource.
// Group by documentId so each logical resource is rendered only once.
const resourceGroups = computed(() => {
  const groupedResources = new Map<string, ResourceWithPublishedAt[]>();

  props.resources.forEach((resource) => {
    const normalizedResource = resource as ResourceWithPublishedAt;
    const key = normalizedResource.documentId || String(normalizedResource.id);
    const existingGroup = groupedResources.get(key);

    if (existingGroup) {
      existingGroup.push(normalizedResource);
      return;
    }

    groupedResources.set(key, [normalizedResource]);
  });

  return Array.from(groupedResources.values());
});

const publishedResources = computed(() =>
  resourceGroups.value
    .map((group) => group.find((resource) => Boolean(resource.publishedAt)))
    .filter(
      (resource): resource is ResourceWithPublishedAt => Boolean(resource)
    )
);

const draftResources = computed(() =>
  resourceGroups.value
    .filter((group) => !group.some((resource) => Boolean(resource.publishedAt)))
    .map((group) => group[0])
    .filter(
      (resource): resource is ResourceWithPublishedAt => Boolean(resource)
    )
);
</script>
