<!-- components/resource-details/Ausleihe.vue -->

<script setup lang="ts">
import type { Resource } from '@depot/shared';

interface BerlinRentalResourceType {
  itemName?: string;
  quantity?: number;
  condition?: string;
  dimensions?: string;
  includedAccessories?: string;
  pickupDetails?: string;
  depositDetails?: string;
  usageFeeDetails?: string;
}

defineProps<{
  resource: Resource;
  rentalResourceType?: BerlinRentalResourceType;
  isPaid: boolean;
}>();
</script>

<template>
  <div>
    <div
      class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-y-5 mb-8"
    >
      <div v-if="rentalResourceType?.quantity" class="flex flex-col">
        <span class="text-base font-light leading-tight">
          {{ $t('berlin_resource_capacity') }}
        </span>

        <span class="text-xl font-semibold">
          {{ rentalResourceType.quantity }}
        </span>
      </div>

      <div v-if="rentalResourceType?.condition" class="flex flex-col">
        <span class="text-base font-light leading-tight">
          {{ $t('berlin_resource_condition') }}
        </span>

        <span class="text-xl font-semibold">
          {{ rentalResourceType.condition }}
        </span>
      </div>

      <div v-if="rentalResourceType?.pickupDetails" class="flex flex-col">
        <span class="text-base font-light leading-tight">
          {{ $t('berlin_resource_pickupDetails') }}
        </span>

        <span class="text-xl font-semibold">
          {{ rentalResourceType.pickupDetails }}
        </span>
      </div>

      <div v-if="isPaid" class="flex flex-col">
        <span class="text-base font-light leading-tight">
          {{ $t('berlin_resource_usageType') }}
        </span>

        <span class="text-xl font-semibold">
          {{ $t('berlin_resource_isPaid') }}
        </span>
      </div>
    </div>

    <BaseResourceMap
      v-if="resource.address"
      class="m-0!"
      :resource="resource"
      :with-link="false"
    />
  </div>
</template>
