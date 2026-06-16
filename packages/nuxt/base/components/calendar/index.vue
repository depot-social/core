<template>
  <CalendarView v-bind="$props">
    <!-- Usage: <BaseCalendar><template #day="{ day, dayId, availableUnits, selectionStore, onClickDate }">...</template></BaseCalendar> -->
    <template v-if="$slots.day" #day="daySlotProps">
      <slot name="day" v-bind="daySlotProps" />
    </template>
  </CalendarView>
</template>

<script setup lang="ts">
import CalendarView from './calendar.view.vue';
import type { CalendarDaySlotProps, CalendarViewProps } from './calendar.props';

defineProps<CalendarViewProps>();
defineSlots<{
  day(props: CalendarDaySlotProps): unknown;
}>();
</script>
