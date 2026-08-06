<template>
  <aside>
    <div class="">
      <div class="w-full">
        <NuxtLinkLocale
          :to="{ name: 'resources' }"
          class="text-2lg font-light mb-4 block"
        >
          {{ $t('berlin_resource_toOverview') }}
        </NuxtLinkLocale>

        <h1
          v-if="berlinResourceType?.roomName"
          class="text-3xl xl:text-6xl mb-6 font-bold leading-tightest"
        >
          {{ berlinResourceType?.roomName }}
        </h1>

        <div class="grid grid-cols-2 gap-6 mb-8">
          <div v-if="berlinResourceType?.roomSizeSqm" class="flex flex-col">
            <span class="text-base font-light leading-tight">
              {{ $t('berlin_resource_roomSizeSqm') }}
            </span>
            <span class="text-xl font-semibold">
              {{ berlinResourceType.roomSizeSqm }}
            </span>
          </div>

          <div v-if="berlinResourceType?.maxCapacity" class="flex flex-col">
            <span class="text-base font-light leading-tight">
              {{ $t('berlin_resource_maxCapacity') }}
            </span>
            <span class="text-xl font-semibold">
              {{ berlinResourceType.maxCapacity?.replace(/\s*[-–—]\s*/g, '-') }}
            </span>
          </div>

          <div v-if="accessibilityText" class="flex flex-col">
            <span class="text-base font-light leading-tight">
              {{ $t('berlin_resource_accessibilityState') }}
            </span>
            <span class="text-xl font-semibold">
              {{ accessibilityText }}
            </span>
          </div>
        </div>
        <BaseResourceMap
          :class="'m-0!'"
          :resource="booking.resource"
          :with-link="false"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { BerlinBooking, BerlinResourceType } from '@depot/shared';
import {
  getAccessibilityText,
  getResourceType,
  ResourceTypeComponent,
} from '@depot/shared';
import { computed } from 'vue';

interface Props {
  booking: Partial<BerlinBooking>;
}

const props = defineProps<Props>();

const berlinResourceType = computed(() => {
  return getResourceType(
    props.booking.resource?.resourceTypes ?? [],
    ResourceTypeComponent.BERLIN_RESOURCE_TYPE
  ) as BerlinResourceType | undefined;
});

const accessibilityText = computed(() =>
  getAccessibilityText(berlinResourceType.value?.accessibilityState)
);
</script>
