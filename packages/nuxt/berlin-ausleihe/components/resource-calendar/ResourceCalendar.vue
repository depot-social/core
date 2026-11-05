<template>
  <div class="flex flex-col w-full min-w-0 mx-auto">
    <h3 class="text-xl font-semibold m-0">{{ $t('checkAvailability') }}</h3>

    <UCalendar
      v-model="selectedRange"
      range
      :number-of-months="isMd ? 2 : 1"
      :week-starts-on="1"
      :fixed-weeks="false"
      :year-controls="false"
      :view-control="false"
      :prev-month="{ color: 'neutral', variant: 'ghost' }"
      :next-month="{ color: 'neutral', variant: 'ghost' }"
      weekday-format="short"
      :min-value="today"
      :is-date-unavailable="isDateUnavailable"
      :locale="locale"
      class="mt-6"
    />

    <hr class="my-8 text-secondary" />

    <div
      v-if="activeSelection.start && activeSelection.end"
      class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-6"
    >
      <p
        :class="[
          'text-base! lg:text-2lg! font-semibold!',
          !selectionActive && 'invisible',
        ]"
      >
        {{ formatDate(activeSelection.start, 'EEEEEE dd.MM.yyyy') }} –
        {{ formatDate(activeSelection.end, 'EEEEEE dd.MM.yyyy') }}
      </p>

      <span
        :class="[
          'rounded-md bg-very-bright-gray px-2.5 py-2 text-sm lg:text-base font-semibold',
          !selectionActive && 'invisible',
        ]"
      >
        {{ activeSelection.maxAvailableUnits }} {{ $t('available') }}
      </span>
    </div>

    <BerlinResourceCalendarOpeningTimesAlert :resource="resource" />
    <div class="flex flex-col gap-4">
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
// import '@phosphor-icons/web/regular';
import { differenceInCalendarDays, set } from 'date-fns';
import {
  computed,
  defineProps,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue';
import type {
  CalendarActiveSelection,
  OnChangeDateParams,
} from '~/base/components/calendar/calendar.props';
import { useDateFormat } from '~/base/composables/useDateFormat';
import { fetchMaxAvailableUnits } from '~/base/utils/availabilities';

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

// Show two months from the tailwind `md` breakpoint on, one month below
const isMd = ref(false);
let mdMediaQuery: MediaQueryList | undefined;
const onMdChange = (event: MediaQueryListEvent) => {
  isMd.value = event.matches;
};

onMounted(() => {
  mdMediaQuery = window.matchMedia('(min-width: 48rem)');
  isMd.value = mdMediaQuery.matches;
  mdMediaQuery.addEventListener('change', onMdChange);
});

onBeforeUnmount(() => {
  mdMediaQuery?.removeEventListener('change', onMdChange);
});

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
