<template>
  <div class="flex flex-col w-full mx-auto">
    <BaseResourceCalendarSelectionOverview :selection="activeSelection" />
    <BaseCalendar
      :months-count="2"
      @change-date="onChangeDate"
      :availabilities="availabilities ? availabilities.dates : []"
    />
    <BaseResourceCalendarOpeningTimesAlert :resource="resource" />
    <div
      class="mt-4 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center"
    >
      <BaseResourceCalendarTimePicker
        @change-date="onChangeDate"
        :selection="activeSelection"
      />
      <BaseResourceCalendarPrice
        :selection="activeSelection"
        :resource-id="resource.documentId"
      />
    </div>
    <div class="mt-2 self-end">
      <BaseResourceCalendarSubmit
        :resource-id="resource.documentId"
        :selection="activeSelection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { differenceInCalendarDays } from 'date-fns';
import type {
  Resource,
  AvailabilitiesGetCalendarResponseData,
} from '@depot/shared';
import type {
  CalendarActiveSelection,
  OnChangeDateParams,
} from '../calendar/calendar.props';
import { fetchMaxAvailableUnits } from '~/base/utils/availabilities';

const props = defineProps<{
  resource: Resource;
  availabilities: AvailabilitiesGetCalendarResponseData;
}>();

const activeSelection = reactive<CalendarActiveSelection>({
  maxAvailableUnits: 0,
  start: null,
  end: null,
  daysCount: 0,
  units: 0,
});

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
