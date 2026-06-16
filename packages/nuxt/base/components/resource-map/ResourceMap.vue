<template>
  <div
    v-if="resource && resourceMarker && currentLocation"
    class="m-[-1rem] mt-[-1.25rem] mb-0 md:m-0 w-full overflow-hidden h-[250px]"
  >
    <slot></slot>
    <BaseLeafletMap
      :location="currentLocation"
      :markers="[resourceMarker]"
      class-names="rounded-t-xl rounded-b-0 md:rounded-b-xl"
      :circle-radius="Number(config.public.randomLocationRadius)"
    >
      <BaseResourceMapResourceMarker :resource="resource" :with-link />
    </BaseLeafletMap>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import { getMarkerForResource } from '~/base/utils/map';

const props = withDefaults(
  defineProps<{
    resource: Resource;
    withLink?: boolean;
  }>(),
  {
    withLink: true,
  }
);

const config = useRuntimeConfig();

const resourceMarker = computed(() => getMarkerForResource(props.resource));

const currentLocation = computed(() => {
  if (!resourceMarker.value) return null;

  return {
    point: resourceMarker.value.point,
    zoom: 15,
  };
});
</script>
