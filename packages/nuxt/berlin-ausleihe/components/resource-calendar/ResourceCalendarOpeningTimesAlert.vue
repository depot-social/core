<template>
  <p
    v-if="contingentResourceType?.openingTimes"
    role="note"
    class="mt-6 flex items-start gap-2 text-sm text-gray-500"
  >
    <i class="ph ph-info text-base" aria-hidden="true" />
    <span>
      {{ $t('providerOpeningTimes') }}
      {{ contingentResourceType.openingTimes }}
    </span>
  </p>
</template>

<script setup lang="ts">
import type { ContingentResourceType, Resource } from '@depot/shared';
import { getResourceType, ResourceTypeComponent } from '@depot/shared';

const props = defineProps<{
  resource: Resource;
}>();

const contingentResourceType = getResourceType(
  props.resource.resourceTypes,
  ResourceTypeComponent.CONTINGENT_RESOURCE_TYPE
) as ContingentResourceType | undefined;
</script>
