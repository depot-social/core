<template>
  <div
    :key="day.toString()"
    :class="[
      'date',
      dayId === 0 && colStartClasses[getDay(day)],
      isBeforeToday && 'date--before-today',
      isBeforeSelection && 'date--before-selection',
      isStartOrEndDay && 'date--selected',
      isBetweenSelection && 'date--between-selection',
      typeof availableUnits !== 'undefined' &&
        availableUnits === 0 &&
        'date--unavailable',
    ]"
    :title="
      availableUnits ? $t('resourcesAvailable', { count: availableUnits }) : ''
    "
  >
    <button
      type="button"
      @click="onClickDate(day)"
      :class="[
        !isStartOrEndDay && isToday(day) && 'date__btn--today-unselected',
        isStartOrEndDay && isToday(day) && 'date__btn--today-selected',
        isStartOrEndDay && !isToday(day) && 'date__btn--selected',
        !isStartOrEndDay && 'date__btn--selectable',
        (isStartOrEndDay || isToday(day)) && 'font-semibold',
      ]"
    >
      <time :dateTime="format(day, 'yyyy-MM-dd')">{{ format(day, 'd') }}</time>
    </button>
    <div v-if="!isBeforeToday" class="date__indicator"></div>
  </div>
</template>

<script setup lang="ts">
import {
  clamp,
  format,
  getDay,
  isBefore,
  isEqual,
  isSameDay,
  isToday,
  startOfToday,
} from 'date-fns';
import { computed } from 'vue';
import type { CalendarDaySlotProps } from './calendar.props';

const props = defineProps<CalendarDaySlotProps>();

// Moves the first day of the week to Monday
const colStartClasses = [
  '',
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
];

const hasStartDay = computed(() => props.selectionStore.startDate !== null);
const hasEndDay = computed(() => props.selectionStore.endDate !== null);

const isBeforeToday = computed(
  () => isBefore(props.day, startOfToday()) || false
);

const isBeforeSelection = computed(
  () => isBefore(props.day, props.selectionStore.startDate as Date) || false
);

const isStartOrEndDay = computed(
  () =>
    (hasStartDay.value
      ? isEqual(props.day, props.selectionStore.startDate as Date)
      : false) ||
    (hasEndDay.value
      ? isEqual(props.day, props.selectionStore.endDate as Date)
      : false)
);

const isBetweenSelection = computed(
  () =>
    (!props.selectionStore.selectionActive &&
      !isBeforeSelection.value &&
      !isStartOrEndDay.value &&
      hasStartDay.value &&
      hasEndDay.value &&
      !isSameDay(
        clamp(props.day, {
          start: props.selectionStore.startDate as Date,
          end: props.selectionStore.endDate as Date,
        }),
        props.selectionStore.endDate as Date
      )) ||
    false
);

const onClickDate = (day: Date) => {
  props.onClickDate(day);
};
</script>

<style scoped>
@reference '~/base/assets/css/main.css';

/** Good old plain non-SASS, non-styled-component CSS ;) */

/** purgecss start ignore **/
.calendar .date {
  @apply py-1;
}

.calendar .date > button {
  @apply text-gray-900 mx-auto flex h-8 w-8 items-center justify-center rounded-[5px];
}

/**
 * Date ranges; this is where things get interesting ;)
 * Where semantically important, plain CSS was used. Where not, Tailwind.
 * Current approach is working well for two calendars.
 * For three or more, the calendar--selected would need to be applied
 * in the calendar wrapper component so that it can target all child calendars
 * which do not have the start-date selected.
 *
 * @todo [low] When non-first calendar is selected, but mouse left container,
 * all fields after start are in range
 * @todo [low] When selection is active, all fields after --unavailable should be
 * non-pointable (wrapped in comments). This was removed as bringing in new problems
 * when selecting a start date after --unavailable. More JS, like date.date--is-after may
 * shed more light
 * @todo [medium] To avoid duplicates and unwanted hierarchies, switch to var() for declaring state
**/

/* Starts range style */
.calendar.calendar--selected .date--selected ~ * > button,
  /* No active selection */
  .calendar:not(.calendar--selected) .date.date--between-selection > button,
  /* Active selection, sibling calendar */
  .calendar:hover.calendar--selected:not(.calendar--has-start) .date > button {
  @apply bg-gray-400;
}

/* Stops range style */
/* Non-active selection, sibling calendar */
.calendar.calendar--selected:not(.calendar--has-start) .date:hover ~ * > button,
.calendar.calendar--selected .date:hover ~ * > button {
  @apply bg-transparent;
}

/*
.calendar.calendar--selected .date.date--unavailable ~ * {
  @apply pointer-events-none;
}*/

/* End date button */
.calendar.calendar--selected:hover .date:hover > button {
  @apply bg-orange-300 text-white rounded-[5px];
}

/* Everything before range or non-bookable **/
.calendar .date.date--before-today,
.calendar.calendar--selected .date--before-selection,
.calendar .date.date--unavailable {
  @apply opacity-50 pointer-events-none;
}

/* everything before range or after non-bookable */
.calendar.calendar--selected .date--before-selection > button
/*.calendar.calendar--selected .date.date--unavailable > button,
.calendar.calendar--selected .date.date--unavailable ~ * > button */ {
  @apply bg-transparent;
}

/** "dot" indicator below **/
.calendar .date .date__indicator {
  @apply w-1 h-1 mx-auto mt-1;
}

.calendar .date .date__indicator:before {
  @apply content-[''] block w-1 h-1 rounded-full bg-green-400;
}

/** non-bookable */
.calendar .date.date--unavailable .date__indicator:before {
  @apply bg-red-800;
}
/** purgecss end ignore **/

.calendar .date .date__btn--today-unselected {
  @apply text-red-500;
}

.calendar .date .date__btn--today-selected {
  @apply bg-gray-400;
}

.calendar .date .date__btn--selected {
  @apply bg-orange-800 text-white;
}

.calendar .date .date__btn--selectable {
  @apply hover:bg-gray-200;
}
</style>
