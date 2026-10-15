<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3 class="text-xl">{{ $t('myBookings') }}</h3>
      <div class="join">
        <button
          v-for="option in filters"
          :key="option"
          type="button"
          :class="[
            'btn join-item',
            filter === option ? 'btn-primary' : 'btn-info',
          ]"
          @click="filter = option"
        >
          {{ $t(`bookingFilter_${option}`) }}
        </button>
      </div>
    </div>

    <UTable
      :data="bookings"
      :columns="columns"
      :empty="$t('noBookings')"
      :ui="{ tbody: '[&>tr]:data-[selectable=true]:cursor-pointer' }"
      @select="onSelect"
    >
      <template #resource-cell="{ row }">
        <div class="flex items-center gap-3">
          <NuxtImg
            v-if="row.original.resource?.images?.[0]?.url"
            :src="row.original.resource.images[0].url"
            :alt="row.original.resource.images[0].alternativeText ?? ''"
            width="48"
            height="48"
            class="size-12 rounded-lg object-cover"
          />
          <span class="font-medium text-black">
            {{ row.original.resource?.title ?? row.original.title }}
          </span>
        </div>
      </template>
      <template #period-cell="{ row }">
        {{ formatDate(row.original.start, 'dd.MM.yyyy HH:mm') }} –
        {{ formatDate(row.original.end, 'dd.MM.yyyy HH:mm') }}
      </template>

      <template #person-cell="{ row }">
        {{
          getUserName(
            row.original.isOwn
              ? row.original.resourceOwner
              : row.original.customer
          )
        }}
      </template>

      <template #type-cell="{ row }">
        <span
          :class="[
            'badge badge-sm',
            row.original.isOwn ? 'badge-outline' : 'badge-primary',
          ]"
        >
          {{
            row.original.isOwn
              ? $t('bookingType_own')
              : $t('bookingType_incoming')
          }}
        </span>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
import type { AvailabilitiesGetDashboardResponseData } from '@depot/shared';
import type { TableColumn, TableRow } from '@nuxt/ui';
import { getBookingPath } from '~/base/utils/paths';
import {
  getBookingList,
  getUserName,
  type BookingFilter,
  type BookingListItem,
} from './dashboardBookingList';

const props = defineProps<{
  dashboard?: AvailabilitiesGetDashboardResponseData | null;
}>();

const { formatDate } = useDateFormat();

const filters: BookingFilter[] = ['all', 'past', 'upcoming'];
const filter = ref<BookingFilter>('upcoming');

const bookings = computed(() =>
  props.dashboard ? getBookingList(props.dashboard, filter.value) : []
);

const columns: TableColumn<BookingListItem>[] = [
  { id: 'resource', header: $t('resource') },
  { id: 'period', header: $t('bookingPeriod') },
  { id: 'person', header: $t('person') },
  { id: 'type', header: $t('bookingType') },
];

const onSelect = (_: Event, row: TableRow<BookingListItem>) =>
  navigateTo(getBookingPath(row.original.documentId));
</script>
