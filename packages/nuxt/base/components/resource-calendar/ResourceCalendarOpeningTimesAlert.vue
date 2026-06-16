<template>
  <div
    v-if="contingentResourceType?.openingTimes"
    role="alert"
    class="alert bg-gray-100 border-0 mt-6"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      class="stroke-current shrink-0 w-6 h-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
    <p>
      <strong>
        {{ $t('providerOpeningTimes') }}
      </strong>
      {{ contingentResourceType.openingTimes }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Resource, ContingentResourceType } from '@depot/shared';
import { getResourceType, ResourceTypeComponent } from '@depot/shared';

const props = defineProps<{
  resource: Resource;
}>();

const contingentResourceType = getResourceType(
  props.resource.resourceTypes,
  ResourceTypeComponent.CONTINGENT_RESOURCE_TYPE
) as ContingentResourceType | undefined;
</script>
