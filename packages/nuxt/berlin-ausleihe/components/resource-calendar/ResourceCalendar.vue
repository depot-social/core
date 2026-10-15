<template>
  <div class="flex flex-col w-full min-w-0 mx-auto">
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <h3 class="text-xl font-semibold m-0">{{ $t('checkAvailability') }}</h3>
      <span
        :class="[
          'rounded-md bg-very-bright-gray px-2 py-1 text-sm',
          !selectionActive && 'invisible',
        ]"
      >
        {{ activeSelection.maxAvailableUnits }} {{ $t('available') }}
      </span>
    </div>
    <p :class="['mt-2 text-right text-base', !selectionActive && 'invisible']">
      <template v-if="activeSelection.start && activeSelection.end">
        {{ formatDate(activeSelection.start, 'EEEEEE dd.MM.yyyy') }} -
        {{ formatDate(activeSelection.end, 'EEEEEE dd.MM.yyyy') }}
      </template>
      <template v-else>&nbsp;</template>
    </p>
    <UCalendar
      v-model="selectedRange"
      range
      :number-of-months="2"
      :week-starts-on="1"
      :fixed-weeks="false"
      :year-controls="false"
      :view-control="false"
      :prev-month="monthButton"
      :next-month="monthButton"
      weekday-format="short"
      :min-value="today"
      :is-date-unavailable="isDateUnavailable"
      :locale="locale"
      class="mt-6"
    />
    <BerlinResourceCalendarOpeningTimesAlert :resource="resource" />
    <div class="mt-8 flex flex-col gap-4">
      <BerlinResourceCalendarTimePicker
        :selection="activeSelection"
        @change-date="onChangeDate"
        @change-units="activeSelection.units = $event"
      />
      <BaseResourceCalendarPrice
        v-if="pricesEnabled"
        :selection="activeSelection"
        :resource-id="resource.documentId"
      />
    </div>
    <div class="mt-10 w-full">
      <BerlinResourceCalendarSubmit
        :resource-id="resource.documentId"
        :selection="activeSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  AvailabilitiesGetCalendarResponseData,
  Resource,
} from '@depot/shared';
import {
  getLocalTimeZone,
  today as getToday,
  type DateValue,
} from '@internationalized/date';
import { differenceInCalendarDays, set } from 'date-fns';
import '@phosphor-icons/web/regular';
import { computed, reactive, shallowRef, watch } from 'vue';
import { fetchMaxAvailableUnits } from '~/base/utils/availabilities';
import { useDateFormat } from '~/base/composables/useDateFormat';
import type {
  CalendarActiveSelection,
  OnChangeDateParams,
} from '~/base/components/calendar/calendar.props';

const props = defineProps<{
  resource: Resource;
  availabilities?: AvailabilitiesGetCalendarResponseData;
}>();

const pricesEnabled = usePricesEnabled();
const { formatDate } = useDateFormat();
const { locale } = useI18n();
const appConfig = useAppConfig();

const timeZone = getLocalTimeZone();
const today = getToday(timeZone);

const selectedRange = shallowRef<{
  start: DateValue | undefined;
  end: DateValue | undefined;
}>();

// Days without available units, as "yyyy-MM-dd" (same format as DateValue.toString())
const unavailableDays = computed(
  () =>
    new Set(
      (props.availabilities?.dates ?? [])
        .filter((date) => date.availableUnits === 0)
        .map((date) => date.day)
    )
);

// The global UButton config adds daisyUI "btn" classes; reset them for the arrows
const monthButton = {
  class: 'btn-ghost btn-circle btn-sm mt-0 w-auto text-orange-300 shadow-none',
};

const isDateUnavailable = (date: DateValue) =>
  unavailableDays.value.has(date.toString());

const activeSelection = reactive<CalendarActiveSelection>({
  maxAvailableUnits: 0,
  start: null,
  end: null,
  daysCount: 0,
  units: 0,
});

const selectionActive = computed(
  () => activeSelection.start !== null && activeSelection.end !== null
);

let latestSelectionRequest = 0;

const setSelectionDates = ({ start, end }: OnChangeDateParams) => {
  activeSelection.start = start;
  activeSelection.end = end;
  activeSelection.daysCount =
    start && end ? differenceInCalendarDays(end, start) + 1 : 0;
};

const resetMaxAvailableUnits = () => {
  activeSelection.maxAvailableUnits = 0;
};

const resetUnits = () => {
  activeSelection.units = 0;
};

const applyMaxAvailableUnits = (maxAvailableUnits: number) => {
  activeSelection.maxAvailableUnits = maxAvailableUnits;
  activeSelection.units =
    maxAvailableUnits > 0
      ? Math.min(activeSelection.units || 1, maxAvailableUnits)
      : 0;
};

// Apply default pickup/return times whenever a new range is picked
watch(selectedRange, (range) => {
  onChangeDate({
    start: range?.start
      ? set(range.start.toDate(timeZone), {
          hours: appConfig.ResourceCalendarStartTimeFrom,
        })
      : null,
    end: range?.end
      ? set(range.end.toDate(timeZone), {
          hours: appConfig.ResourceCalendarEndTimeTill,
        })
      : null,
  });
});

const onChangeDate = async (updatedDates: OnChangeDateParams) => {
  const requestId = ++latestSelectionRequest;

  setSelectionDates(updatedDates);
  resetMaxAvailableUnits();

  if (!updatedDates.start || !updatedDates.end) {
    resetUnits();
    return;
  }

  try {
    const maxAvailableUnits = await fetchMaxAvailableUnits({
      start: updatedDates.start.toISOString(),
      end: updatedDates.end.toISOString(),
      resourceId: props.resource.documentId,
    });

    if (requestId !== latestSelectionRequest) {
      return;
    }

    applyMaxAvailableUnits(maxAvailableUnits);
  } catch (e) {
    if (requestId === latestSelectionRequest) {
      resetMaxAvailableUnits();
      resetUnits();
    }

    console.log('Error fetching maxAvailable units', e);
  }
};
</script>
