<template>
  <aside
    class="basis-full lg:basis-1/3 bg-white py-8 px-5 xl:px-8 rounded-[30px] lg:rounded-none lg:shadow-inner"
  >
    <div class="sticky top-0 pt-5">
      <NuxtImg
        v-if="resource?.images?.[0]"
        :src="resource.images[0].url"
        :alt="resource.images[0].alternativeText ?? ''"
        class="self-center object-cover aspect-square rounded-lg w-[150px] h-[150px]"
      />
      <div
        v-else
        class="w-[150px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center"
      >
        <i class="ph ph-image text-4xl text-gray-400" />
      </div>

      <div class="flex flex-col gap-5 mt-8">
        <header>
          <span class="text-2lg mb-6 font-bold leading-tightest">
            {{ resource?.title }}
          </span>
        </header>

        <div
          class="grid sm:grid-cols-[100px_1fr] *:leading-snug *:even:mb-5 sm:*:even:mb-0 *:font-light sm:*:flex sm:*:items-start sm:*:py-[1.15rem] sm:*:border-b *:border-b-secondary gap-x-6"
        >
          <p class="text-sm">{{ $t('lender') }}:</p>
          <div class="flex flex-col">
            <p class="font-bold!">
              <template v-if="isOrganization">
                {{ organizationName }}
              </template>
              <template v-else>
                {{ booking.resourceOwner?.firstName }}
                {{ booking.resourceOwner?.lastName }}
              </template>
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

          <p class="text-sm">{{ $t('timeframe') }}</p>
          <p class="font-bold!">
            <span
              v-if="pending"
              class="loading loading-dots loading-xs"
              :aria-label="$t('loading')"
            />

            <template v-else-if="priceDurationLabel">
              {{ priceDurationLabel }}
            </template>

            ({{ formatDate(booking.start) }} Uhr –
            {{ formatDate(booking.end) }} Uhr)
          </p>

          <p class="text-sm">{{ $t('units') }}</p>

          <p class="font-bold! flex gap-3">
            {{ booking.bookedUnits }} {{ $t('pieces') }}
          </p>
        </div>
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
          <div class="flex justify-between py-1 text-base *:font-light">
            <dt>{{ $t('deposit') }}</dt>
            <dd>{{ formatPrice(price.depositValue || 0) }}</dd>
          </div>
          <div class="flex justify-between py-1 text-base *:font-light">
            <dt>{{ $t('taxes') }}</dt>
            <dd>{{ formatPrice(price.vatValue || 0) }}</dd>
          </div>
          <div class="flex justify-between py-1 text-base *:font-light">
            <dt>{{ $t('rentalFee') }}</dt>
            <dd>{{ formatPrice(price.resourceValue || 0) }}</dd>
          </div>
          <div
            class="border-t pt-4 mt-3 border-grey-200 flex justify-between text-black text-base *:font-bold"
          >
            <dt>{{ $t('total') }}</dt>
            <dd>{{ formatPrice(price.value || 0) }}</dd>
          </div>
        </dl>
      </div>

      <slot></slot>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Booking, Resource } from '@depot/shared';
import { getUsernameFromUser, priceToString } from '@depot/shared';
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

const isOrganization = computed(() => {
  return !!props.resource?.user?.organization;
});

const organizationName = computed(() => {
  return props.resource?.user
    ? getUsernameFromUser(props.resource.user)
    : undefined;
});
</script>
