<template>
  <div
    :class="[
      'calendar [&:nth-child(2)]:hidden [&:nth-child(2)]:md:block w-full md:basis-6/12',
      calendarHasStartDay && 'calendar--has-start',
      selectionStore.selectionActive && 'calendar--selected',
    ]"
  >
    <div class="md:grid">
      <div class="flex flex-col items-center">
        <span class="flex-auto text-black">
          {{ format(month, 'MMMM yyyy') }}
        </span>
      </div>
      <div
        class="grid grid-cols-7 font-text mt-8 text-xs text-center text-gray-500"
      >
        <div>Mo</div>
        <div>Di</div>
        <div>Mi</div>
        <div>Do</div>
        <div>Fr</div>
        <div>Sa</div>
        <div>So</div>
      </div>
      <div class="grid grid-cols-7 font-text text-sm">
        <template v-for="(day, dayId) in days" :key="dayId">
          <slot name="day" v-bind="getDaySlotProps(day, dayId)">
            <CalendarDay v-bind="getDaySlotProps(day, dayId)" />
          </slot>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
} from 'date-fns';
import CalendarDay from './calendarDay.vue';
import type {
  CalendarDaySlotProps,
  CalendarMonthViewProps,
} from './calendar.props';

const props = defineProps<CalendarMonthViewProps>();
defineSlots<{
  day(props: CalendarDaySlotProps): unknown;
}>();

const calendarHasStartDay = computed(() =>
  props.selectionStore.startDate
    ? isSameMonth(props.month, props.selectionStore.startDate as Date)
    : false
);

const days = computed(() =>
  eachDayOfInterval({
    // If you prefer to have prev/next month visible, use startOfWeek/endOfWeek
    start: startOfMonth(props.month),
    end: endOfMonth(props.month),
  })
);

const getAvailableUnitsFromDay = (day: Date): undefined | number => {
  if (!props.availabilities) {
    return;
  }

  const dayDate = format(day, 'yyyy-MM-dd');
  const dayAvailability = props.availabilities.find(
    (availability) => availability.day === dayDate
  );

  return dayAvailability ? dayAvailability.availableUnits : undefined;
};

const onClickDate = (date: Date) => {
  props.onClickDate(date);
};

const getDaySlotProps = (day: Date, dayId: number): CalendarDaySlotProps => ({
  day,
  dayId,
  availableUnits: getAvailableUnitsFromDay(day),
  selectionStore: props.selectionStore,
  onClickDate,
});
</script>
