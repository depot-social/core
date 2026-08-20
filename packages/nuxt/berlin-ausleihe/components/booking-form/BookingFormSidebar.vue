<template>
  <aside class="basis-1/3 bg-secondary py-8 px-8">
    <div class="sticky top-5 pt-5">
      <div class="flex gap-5">
        <NuxtImg
          v-if="resource?.images?.[0]"
          :src="resource.images[0].url"
          :alt="resource.images[0].alternativeText ?? ''"
          class="object-cover aspect-square rounded-lg w-[150px] h-[150px]"
        />
        <div
          v-else
          class="w-[150px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center"
        >
          <i class="ph ph-image text-4xl text-gray-400" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-base">{{ resource?.title }}</span>
        </div>
      </div>

      <div class="mt-8">
        <div class="flex justify-between">
          <p>{{ $t('lender') }}:</p>
          <div class="flex flex-col items-end">
            <p class="font-bold pt-1">
              {{ booking.resourceOwner?.firstName }}
              {{ booking.resourceOwner?.lastName }}
            </p>
            <p>
              {{
                resource?.address?.street
                  ? ` ${resource?.address?.street},`
                  : ''
              }}
              {{ resource?.address?.zip }}
              {{ resource?.address?.place }}
            </p>
          </div>
        </div>
        <p class="flex justify-between mt-3">
          <span>{{ $t('timeframe') }}</span>
          <span class="font-bold flex gap-3">
            <span
              v-if="pending"
              class="loading loading-dots loading-xs"
              :aria-label="$t('loading')"
            />
            <template v-else-if="priceDurationLabel">
              {{ priceDurationLabel }}
            </template>
            ({{ formatDate(booking.start) }} - {{ formatDate(booking.end) }})
          </span>
        </p>
        <p class="flex justify-between mt-3">
          {{ $t('units') }}
          <span class="font-bold flex gap-3">
            {{ booking.bookedUnits }} {{ $t('pieces') }}
          </span>
        </p>
      </div>

      <!-- Price calculation -->
      <div v-if="pending" class="mt-4">
        <div class="animate-pulse flex flex-col gap-2 mt-8">
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/3"></div>
          <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <div v-else-if="error" class="mt-4 p-4 bg-red-50 text-red-700 rounded">
        {{ error.message }}
      </div>

      <div v-else-if="price" class="mt-4">
        <dl class="flex flex-col gap-2 mt-8 text-gray-800">
          <div
            class="p border-t py-1 pt-7 border-grey-200 flex justify-between"
          >
            <dt>{{ $t('deposit') }}</dt>
            <dd>{{ formatPrice(price.depositValue || 0) }}</dd>
          </div>
          <div class="p py-1 flex justify-between">
            <dt>{{ $t('taxes') }}</dt>
            <dd>{{ formatPrice(price.vatValue || 0) }}</dd>
          </div>
          <div class="p py-1 flex justify-between">
            <dt>{{ $t('rentalFee') }}</dt>
            <dd>{{ formatPrice(price.resourceValue || 0) }}</dd>
          </div>
          <div
            class="border-t pt-4 mt-3 border-grey-200 flex justify-between text-black"
          >
            <dt>{{ $t('total') }}</dt>
            <dd>{{ formatPrice(price.value || 0) }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Booking, Resource } from '@depot/shared';
import { priceToString } from '@depot/shared';
import { format, parseISO } from 'date-fns';
import { fetchResourcePrice } from '~/base/utils/prices';

interface Props {
  booking: Partial<Booking>;
  resource?: Resource;
}

const props = defineProps<Props>();

// Format date helper
const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return format(parseISO(dateString), 'dd.MM.yyyy, HH:mm');
};

// Format price helper
const formatPrice = (value: number) => {
  return priceToString(value);
};

// Fetch price data
const {
  data: price,
  pending,
  error,
} = await useAsyncData(
  `bookingPrice-${props.resource?.documentId || 'unknown'}-${
    props.booking.start || 'no-start'
  }-${props.booking.end || 'no-end'}-${props.booking.bookedUnits || 0}`,
  async () => {
    if (
      !props.booking.start ||
      !props.booking.end ||
      !props.booking.bookedUnits ||
      !props.resource?.documentId
    ) {
      return null;
    }

    try {
      return await fetchResourcePrice({
        resourceId: props.resource.documentId,
        start: props.booking.start,
        end: props.booking.end,
        units: props.booking.bookedUnits,
      });
    } catch (e) {
      console.error('Error fetching price:', e);
      throw new Error($t('errorLoadingPrices'));
    }
  },
  {
    server: true,
  }
);

const priceDurationLabel = computed(() => {
  if (!price.value) return '';

  const translationKey =
    price.value.durationType === 'hourly'
      ? price.value.duration === 1
        ? 'hour'
        : 'hours'
      : price.value.duration === 1
      ? 'day'
      : 'days';

  return `${price.value.duration} ${$t(translationKey)}`;
});
</script>
