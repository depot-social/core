<template>
  <div class="container px-10">
    <div class="flex items-center justify-between">
      <h3 class="text-xl text-bold">{{ $t('bookingsAndAvailabilities') }}</h3>
      <div class="flex items-center gap-6">
        <h2 class="text-lg leading-none">
          {{ formatDate(currentMonthStart, 'MMMM yyyy') }}
        </h2>
        <div class="join">
          <button
            class="join-item btn btn-info"
            type="button"
            @click="gotoPrevMonth"
          >
            <i class="ph ph-caret-left">
              <span class="sr-only">{{ $t('previousMonth') }}</span>
            </i>
          </button>
          <button
            class="join-item btn btn-info"
            type="button"
            @click="gotoToday"
          >
            {{ $t('today') }}
          </button>
          <button
            class="join-item btn btn-info"
            type="button"
            @click="gotoNextMonth"
          >
            <i class="ph ph-caret-right">
              <span class="sr-only">{{ $t('nextMonth') }}</span>
            </i>
          </button>
        </div>
      </div>
    </div>

    <BaseCalendar
      :key="calendarKey"
      :start-date="currentMonthStart"
      :months-count="2"
      :allow-goto-past="true"
    >
      <template #day="{ day, dayId, onClickDate }">
        <div
          :class="[
            'date dashboard-calendar__day',
            dayId === 0 && colStartClasses[getDay(day)],
            isBefore(day, startOfToday()) && 'date--before-today',
          ]"
        >
          <button
            type="button"
            class="date__header"
            :title="format(day, 'yyyy-MM-dd')"
            @click="onClickDate(day)"
          >
            <time :dateTime="format(day, 'yyyy-MM-dd')">{{
              format(day, 'd')
            }}</time>
          </button>

          <div
            class="dashboard-calendar__range-lanes"
            :style="{ height: `${getRangeLaneCount(day) * 1.5}rem` }"
          >
            <template
              v-for="segment in getRangeSegmentsStartingOn(day)"
              :key="`${segment.event.id}-${format(
                segment.start,
                'yyyy-MM-dd'
              )}`"
            >
              <NuxtLink
                v-if="
                  segment.event.type === 'booking' &&
                  segment.event.bookingDocumentId
                "
                :to="getBookingPath(segment.event.bookingDocumentId)"
                :class="getRangeClasses(segment)"
                :style="getRangeStyle(segment)"
                :title="getEventLabel(segment.event)"
              >
                <span class="dashboard-calendar__event-time">
                  {{ formatTime(segment.event.start) }} -
                  {{ formatTime(segment.event.end) }}
                </span>
                <span v-if="segment.event.title">{{
                  segment.event.title
                }}</span>
              </NuxtLink>
              <p
                v-else
                :class="getRangeClasses(segment)"
                :style="getRangeStyle(segment)"
                :title="getEventLabel(segment.event)"
              >
                <span class="dashboard-calendar__event-time">
                  {{ formatTime(segment.event.start) }} -
                  {{ formatTime(segment.event.end) }}
                </span>
                <span v-if="segment.event.title">{{
                  segment.event.title
                }}</span>
              </p>
            </template>
          </div>
        </div>
      </template>
    </BaseCalendar>
  </div>
</template>

<script setup lang="ts">
import type {
  AvailabilitiesGetDashboardResponseData,
  Availability,
  Booking,
} from '@depot/shared';
import {
  addMonths,
  format,
  getDay,
  isBefore,
  startOfMonth,
  startOfToday,
} from 'date-fns';
import { useDateFormat } from '~/base/composables/useDateFormat';
import { getBookingPath } from '~/base/utils/paths';
import {
  createDashboardRangeLayout,
  getDashboardCalendarDateKey,
  type DashboardEvent,
  type DashboardRangeSegment,
} from './dashboardCalendarRanges';

interface Props {
  dashboard: AvailabilitiesGetDashboardResponseData;
  displayAvailabilities?: boolean;
}

const colStartClasses = [
  '',
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
];

const props = withDefaults(defineProps<Props>(), {
  displayAvailabilities: true,
});
const { formatDate } = useDateFormat();

const calendarKey = ref(0);
const currentMonthStart = ref(startOfMonth(startOfToday()));

const formatTime = (value: Date) => format(value, 'HH:mm') + ' ' + $t('oClock');

const getEventLabel = (event: DashboardEvent): string =>
  `${formatTime(event.start)} - ${formatTime(event.end)}${
    event.title ? `: ${event.title}` : ''
  }`;

const toDate = (value: string | Date) =>
  value instanceof Date ? value : new Date(value);

const mapAvailabilityToEvent = (
  availability: Availability
): DashboardEvent => ({
  id: `availability-${availability.id}`,
  type: 'availability',
  title: availability.title,
  start: toDate(availability.start),
  end: toDate(availability.end),
});

const mapBookingToEvent = (
  booking: Booking,
  source: 'owner' | 'customer'
): DashboardEvent => ({
  id: `booking-${source}-${booking.id}`,
  type: 'booking',
  title: `${$t('booking')} ${booking.title}`,
  start: toDate(booking.start),
  end: toDate(booking.end),
  bookingDocumentId: booking.documentId,
});

const normalizedEvents = computed<DashboardEvent[]>(() => {
  const availabilities = props.displayAvailabilities
    ? props.dashboard.availabilities.map(mapAvailabilityToEvent)
    : [];
  const bookingsResourceOwner = props.dashboard.bookingsResourceOwner.map(
    (booking) => mapBookingToEvent(booking, 'owner')
  );
  const bookingsCustomer = props.dashboard.bookingsCustomer.map((booking) =>
    mapBookingToEvent(booking, 'customer')
  );

  return [
    ...availabilities,
    ...bookingsResourceOwner,
    ...bookingsCustomer,
  ].sort((left, right) => {
    const startDiff = left.start.getTime() - right.start.getTime();
    if (startDiff !== 0) return startDiff;
    if (left.type === right.type) return 0;
    return left.type === 'availability' ? -1 : 1;
  });
});

const visibleMonths = computed(() => [
  currentMonthStart.value,
  addMonths(currentMonthStart.value, 1),
]);

const rangeLayout = computed(() =>
  createDashboardRangeLayout(normalizedEvents.value, visibleMonths.value)
);

const getRangeSegmentsStartingOn = (day: Date): DashboardRangeSegment[] =>
  rangeLayout.value.segmentsByStartDay.get(getDashboardCalendarDateKey(day)) ??
  [];

const getRangeLaneCount = (day: Date): number =>
  rangeLayout.value.laneCountByDay.get(getDashboardCalendarDateKey(day)) ?? 0;

const getRangeStyle = (segment: DashboardRangeSegment) => ({
  top: `${segment.lane * 1.5}rem`,
  width: `calc(${segment.span * 100}% + ${(segment.span - 1) * 2}px)`,
});

const getRangeClasses = (segment: DashboardRangeSegment) => [
  'dashboard-calendar__event dashboard-calendar__range',
  segment.event.type === 'availability'
    ? 'dashboard-calendar__event--availability'
    : 'dashboard-calendar__event--booking',
];

const refreshCalendar = () => {
  calendarKey.value += 1;
};

const gotoPrevMonth = () => {
  currentMonthStart.value = addMonths(currentMonthStart.value, -1);
  refreshCalendar();
};

const gotoNextMonth = () => {
  currentMonthStart.value = addMonths(currentMonthStart.value, 1);
  refreshCalendar();
};

const gotoToday = () => {
  currentMonthStart.value = startOfMonth(startOfToday());
  refreshCalendar();
};
</script>

<style scoped>
@reference '~/base/assets/css/main.css';

.dashboard-calendar__day {
  @apply relative min-h-[9rem] border border-gray-100 rounded-md py-1 flex flex-col gap-1;
}

.dashboard-calendar__day .date__header {
  @apply ml-1 w-8 h-8 rounded-[5px] text-gray-900 text-sm font-semibold hover:bg-gray-200;
}

.dashboard-calendar__range-lanes {
  @apply relative w-full shrink-0;
}

.dashboard-calendar__event {
  @apply text-[10px] leading-tight px-1 truncate;
}

.dashboard-calendar__range {
  @apply absolute left-0 z-10 h-5 flex items-center rounded;
}

.dashboard-calendar__event--availability {
  @apply text-[#006E80] bg-[#DFFFFC];
}

.dashboard-calendar__event--booking {
  @apply text-[#C82F09] bg-[#FFEDD5] cursor-pointer;
}

.dashboard-calendar__event-time {
  @apply mr-1 font-medium;
}
</style>
