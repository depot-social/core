<template>
  <div class="pt-8 w-full relative">
    <div>
      <div class="absolute w-full justify-between flex items-center">
        <button
          type="button"
          @click="gotoPreviousMonth"
          class="text-lg text-gray-500 hover:text-gray-800"
          :title="$t('showPreviousMonth')"
        >
          <i class="ph ph-caret-left">
            <span class="sr-only">{{ $t('previousMonth') }}</span>
          </i>
        </button>
        <button
          @click="gotoNextMonth"
          type="button"
          class="text-lg text-gray-500 hover:text-gray-800"
          :title="$t('showNextMonth')"
        >
          <i class="ph ph-caret-right">
            <span class="sr-only">{{ $t('nextMonth') }}</span>
          </i>
        </button>
      </div>

      <div class="flex gap-8">
        <CalendarMonthView
          v-for="(_, index) in Array.from(Array(normalizedMonthsCount).keys())"
          :key="random(99999)"
          :on-click-date="onClickDate"
          :availabilities="availabilities"
          :selection-store="selectionStore"
          :month="
            index === 0 ? currentMonth : add(currentMonth, { months: index })
          "
        >
          <template v-if="$slots.day" #day="daySlotProps">
            <slot name="day" v-bind="daySlotProps" />
          </template>
        </CalendarMonthView>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { random } from 'lodash-es';
import {
  add,
  eachDayOfInterval,
  isAfter,
  isBefore,
  set,
  startOfToday,
} from 'date-fns';
import CalendarMonthView from './calendarMonthView.vue';
import type {
  CalendarDaySlotProps,
  CalendarViewProps,
  CalendarSelectionStore,
  OnChangeDateParams,
} from './calendar.props';

const props = withDefaults(defineProps<CalendarViewProps>(), {
  monthsCount: 1,
  startDate: () => startOfToday(),
  endDate: null,
  allowGotoPast: false,
  availabilities: undefined,
});
defineSlots<{
  day(props: CalendarDaySlotProps): unknown;
}>();

const emit = defineEmits<{
  changeDate: [updatedDates: OnChangeDateParams];
}>();

const appConfig = useAppConfig();

const currentMonth = ref<Date>(props.startDate);
const normalizedMonthsCount = computed(() => Math.max(props.monthsCount, 1));

const selectionStore = reactive<CalendarSelectionStore>({
  startDate: props.startDate,
  endDate: props.endDate,
  selectionActive: false,
});

const datesAreSelectable = (start: Date, end: Date): boolean => {
  if (isAfter(start, end)) {
    return false;
  }

  if (props.availabilities) {
    const interval = eachDayOfInterval({ start, end });
    return !interval.some((date) => {
      const formattedDate = date.toISOString().split('T')[0];
      const availabilityForDate = props.availabilities!.find(
        (availability) =>
          availability.day === formattedDate &&
          availability.availableUnits === 0
      );

      return availabilityForDate ? true : false;
    });
  }

  return true;
};

const onClickDate = async (date: Date) => {
  if (!selectionStore.selectionActive) {
    // Start selection
    selectionStore.startDate = date;
    selectionStore.endDate = null;
  } else if (selectionStore.startDate) {
    // End selection
    const selectable = await datesAreSelectable(selectionStore.startDate, date);
    if (!selectable) {
      selectionStore.selectionActive = false;
      return;
    }

    selectionStore.endDate = date;
  }

  selectionStore.selectionActive = !selectionStore.selectionActive;

  // Emit callback with default start- and end-times
  // @todo If currently selected times are not default times and not "00:00",
  // do not update hours
  emit('changeDate', {
    start: selectionStore.startDate
      ? set(selectionStore.startDate, {
          hours: appConfig.ResourceCalendarStartTimeFrom,
        })
      : null,
    end: selectionStore.endDate
      ? set(selectionStore.endDate, {
          hours: appConfig.ResourceCalendarEndTimeTill,
        })
      : null,
  });
};

onMounted(() => {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      selectionStore.selectionActive = false;
    }
  };

  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      selectionStore.selectionActive = false;
    }
  };

  document.removeEventListener('keydown', onKeydown);
});

const gotoPreviousMonth = () => {
  const firstDayPrevMonth = add(currentMonth.value, { months: -1 });
  if (!props.allowGotoPast && isBefore(firstDayPrevMonth, startOfToday())) {
    return;
  }

  currentMonth.value = firstDayPrevMonth;
};

const gotoNextMonth = () => {
  const firstDayNextMonth = add(currentMonth.value, { months: 1 });
  currentMonth.value = firstDayNextMonth;
};
</script>
