<template>
  <BaseLeafletMap
    v-slot="{ index }"
    :markers="resourceMarkers"
    :fit-bounds="true"
    class-names="md:basis-1/2 xl:basis-1/3 rounded-xl md:sticky top-[20px] md:max-h-[calc(100vh-40px)] md:order-2 w-full"
  >
    <BaseResourceMapResourceMarker
      v-if="markerEntries[index]"
      :resource="markerEntries[index].resource"
    />
  </BaseLeafletMap>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import { getMarkerForResource } from '~/base/utils/map';

const props = defineProps<{
  resources: Resource[];
}>();

const markerEntries = computed(() =>
  props.resources.flatMap((resource) => {
    const marker = getMarkerForResource(resource);
    return marker ? [{ resource, marker }] : [];
  })
);

const resourceMarkers = computed(() =>
  markerEntries.value.map((entry) => entry.marker)
);
</script>
