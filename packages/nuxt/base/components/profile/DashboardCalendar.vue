<template>
  <div class="container px-10">
    <div class="flex items-center justify-between">
      <h3 class="text-xl text-bold">{{ $t('bookingsAndAvailabilities') }}</h3>
      <div class="flex items-center gap-6">
        <h2 class="text-lg leading-none">
          {{ format(currentMonthStart, 'MMMM yyyy') }}
        </h2>
        <div class="join">
          <button class="join-item btn btn-info" type="button" @click="gotoPrevMonth">
            <i class="ph ph-caret-left">
              <span class="sr-only">{{ $t('previousMonth') }}</span>
            </i>
          </button>
          <button class="join-item btn btn-info" type="button" @click="gotoToday">
            {{ $t('today') }}
          </button>
          <button class="join-item btn btn-info" type="button" @click="gotoNextMonth">
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
            <time :dateTime="format(day, 'yyyy-MM-dd')">{{ format(day, 'd') }}</time>
          </button>

          <div class="dashboard-calendar__events">
            <p
              v-for="event in getVisibleEventsForDay(day)"
              :key="event.id"
              :class="[
                'dashboard-calendar__event',
                event.type === 'availability'
                  ? 'dashboard-calendar__event--availability'
                  : 'dashboard-calendar__event--booking',
              ]"
              :title="`${formatTime(event.start)} - ${formatTime(event.end)}${event.title ? `: ${event.title}` : ''}`"
            >
              <span class="dashboard-calendar__event-time">
                {{ formatTime(event.start) }} - {{ formatTime(event.end) }}
              </span>
              <span v-if="event.title">{{ event.title }}</span>
            </p>

            <button
              v-if="getHiddenEventsCountForDay(day) > 0"
              type="button"
              class="dashboard-calendar__more"
              @click="showAllEventsForDay(day)"
            >
              +{{ getHiddenEventsCountForDay(day) }} {{ $t('more') }}
            </button>
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
  endOfDay,
  format,
  getDay,
  isBefore,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfToday,
} from 'date-fns';

interface Props {
  dashboard: AvailabilitiesGetDashboardResponseData;
}

type DashboardEvent = {
  id: string;
  type: 'availability' | 'booking';
  title: string;
  start: Date;
  end: Date;
};

const MAX_EVENTS_PER_DAY = 3;

const colStartClasses = [
  '',
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
];

const props = defineProps<Props>();

const calendarKey = ref(0);
const currentMonthStart = ref(startOfMonth(startOfToday()));
const eventsDisplayedCount = ref<Record<string, number>>({});

const formatTime = (value: Date) => format(value, 'HH:mm') + ' ' + $t('oClock');

const toDate = (value: string | Date) =>
  value instanceof Date ? value : new Date(value);

const mapAvailabilityToEvent = (availability: Availability): DashboardEvent => ({
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
});

const normalizedEvents = computed<DashboardEvent[]>(() => {
  const availabilities = props.dashboard.availabilities.map(mapAvailabilityToEvent);
  const bookingsResourceOwner = props.dashboard.bookingsResourceOwner.map((booking) =>
    mapBookingToEvent(booking, 'owner')
  );
  const bookingsCustomer = props.dashboard.bookingsCustomer.map((booking) =>
    mapBookingToEvent(booking, 'customer')
  );

  return [...availabilities, ...bookingsResourceOwner, ...bookingsCustomer].sort(
    (left, right) => {
      const startDiff = left.start.getTime() - right.start.getTime();
      if (startDiff !== 0) return startDiff;
      if (left.type === right.type) return 0;
      return left.type === 'availability' ? -1 : 1;
    }
  );
});

const getEventsForDay = (day: Date): DashboardEvent[] => {
  const normalizedDay = startOfDay(day);

  return normalizedEvents.value.filter((event) =>
    isWithinInterval(normalizedDay, {
      start: startOfDay(event.start),
      end: endOfDay(event.end),
    })
  );
};

const getDayKey = (day: Date) => format(day, 'yyyy-MM-dd');

const getEventsDisplayedCountForDay = (day: Date): number =>
  eventsDisplayedCount.value[getDayKey(day)] ?? MAX_EVENTS_PER_DAY;

const getVisibleEventsForDay = (day: Date): DashboardEvent[] =>
  getEventsForDay(day).slice(0, getEventsDisplayedCountForDay(day));

const getHiddenEventsCountForDay = (day: Date): number =>
  Math.max(getEventsForDay(day).length - getEventsDisplayedCountForDay(day), 0);

const showAllEventsForDay = (day: Date) => {
  const dayKey = getDayKey(day);
  eventsDisplayedCount.value[dayKey] = getEventsForDay(day).length;
};

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
  @apply min-h-[9rem] border border-gray-100 rounded-md px-1 py-1 flex flex-col gap-1;
}

.dashboard-calendar__day .date__header {
  @apply w-8 h-8 rounded-[5px] text-gray-900 text-sm font-semibold hover:bg-gray-200;
}

.dashboard-calendar__events {
  @apply flex flex-col gap-1;
}

.dashboard-calendar__event {
  @apply text-[10px] leading-tight rounded px-1 py-[2px] truncate;
}

.dashboard-calendar__event--availability {
  @apply text-[#006E80] bg-[#DFFFFC];
}

.dashboard-calendar__event--booking {
  @apply text-[#C82F09] bg-[#FFEDD5];
}

.dashboard-calendar__event-time {
  @apply mr-1 font-medium;
}

.dashboard-calendar__more {
  @apply text-[10px] text-gray-500;
}
</style>
