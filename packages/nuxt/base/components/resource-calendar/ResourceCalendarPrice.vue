<template>
  <div :class="!_price?.value && 'opacity-0'">
    <span class="text-md">{{ $t('price') }}</span>
    <div class="flex">
      <p>
        <strong>{{ priceToString(_price?.value || 0) }}</strong>
        {{ priceDuration }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Price } from '@depot/shared';
import { priceToString } from '@depot/shared';
import type { CalendarActiveSelection } from '../calendar/calendar.props';
import { fetchResourcePrice } from '~/base/utils/prices';

interface Props {
  selection: CalendarActiveSelection;
  resourceId: string;
}

const props = defineProps<Props>();

const _price = ref<Price | null>(null);
const priceDuration = ref(' 3 Tage');

const getReadablePriceDuration = (price: Price): string =>
  !price || !price.duration
    ? ''
    : ` ${$t('for')} ${price.duration} ${
        price.durationType === 'hourly'
          ? price.duration === 1
            ? $t('hour')
            : $t('hours')
          : price.duration === 1
          ? $t('day')
          : $t('days')
      }`;

// Watch for changes in selection to fetch new price
watch(
  [
    () => props.selection.start,
    () => props.selection.end,
    () => props.selection.units,
  ],
  async () => {
    if (
      !props.selection.start ||
      !props.selection.end ||
      !props.selection.units ||
      !props.resourceId
    ) {
      _price.value = null;
      return;
    }

    try {
      const response = await fetchResourcePrice({
        resourceId: props.resourceId,
        start: props.selection.start.toISOString(),
        end: props.selection.end.toISOString(),
        units: props.selection.units,
      });

      if (response) {
        _price.value = response;
        priceDuration.value = getReadablePriceDuration(response);
      }
    } catch (e) {
      console.log('Error fetching price', e);
      _price.value = null;
    }
  },
  { immediate: true }
);
</script>
