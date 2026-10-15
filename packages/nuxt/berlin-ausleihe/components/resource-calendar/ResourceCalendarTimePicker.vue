<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
    <UFormField :label="$t('pickupTime')" :ui="formFieldUi">
      <USelect
        v-model="startTime"
        :items="timeItems"
        :disabled="disabled"
        :placeholder="$t('berlin_calendar_selectDateFirst')"
        :ui="selectUi"
        class="w-full"
      />
    </UFormField>
    <UFormField :label="$t('returnTime')" :ui="formFieldUi">
      <USelect
        v-model="endTime"
        :items="timeItems"
        :disabled="disabled"
        :placeholder="$t('berlin_calendar_selectDateFirst')"
        :ui="selectUi"
        class="w-full"
      />
    </UFormField>
    <UFormField :label="$t('quantity')" :ui="formFieldUi">
      <USelect
        v-model="units"
        :items="unitItems"
        :disabled="disabled || !hasAvailableUnits"
        :placeholder="
          disabled ? $t('berlin_calendar_selectDateFirst') : `0 ${$t('pieces')}`
        "
        :ui="selectUi"
        class="w-full"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format, set } from 'date-fns';
import type {
  CalendarActiveSelection,
  OnChangeDateParams,
} from '~/base/components/calendar/calendar.props';

interface Props {
  selection: CalendarActiveSelection;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  changeDate: [updatedDates: OnChangeDateParams];
  changeUnits: [units: number];
}>();

const appConfig = useAppConfig();
const { t } = useI18n();

const formFieldUi = { label: 'font-text font-normal text-sm' };
const selectUi = {
  base: 'shadow-none! h-14 border! border-solid! border-black!',
  content: 'px-0!',
};

const disabled = computed(() => !props.selection.start || !props.selection.end);

const timeItems = computed(() => {
  // Half-hour steps from bookable time begin to end
  const items: { label: string; value: string }[] = [];

  for (
    let hour = appConfig.ResourceCalendarStartTimeFrom;
    hour <= appConfig.ResourceCalendarEndTimeTill;
    hour++
  ) {
    const paddedHour = hour.toString().padStart(2, '0');
    const minutes =
      hour === appConfig.ResourceCalendarEndTimeTill ? ['00'] : ['00', '30'];

    for (const minute of minutes) {
      const value = `${paddedHour}:${minute}`;
      items.push({ label: `${value} ${t('oClock')}`, value });
    }
  }

  return items;
});

const hasAvailableUnits = computed(() => props.selection.maxAvailableUnits > 0);

const unitItems = computed(() =>
  Array.from({ length: props.selection.maxAvailableUnits }, (_, i) => ({
    label: `${i + 1} ${t('pieces')}`,
    value: i + 1,
  }))
);

const withTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return set(date, { hours, minutes });
};

const startTime = computed({
  get: () =>
    props.selection.start ? format(props.selection.start, 'HH:mm') : undefined,
  set: (time) => {
    if (!time || !props.selection.start || !props.selection.end) return;

    emit('changeDate', {
      start: withTime(props.selection.start, time),
      end: props.selection.end,
    });
  },
});

const endTime = computed({
  get: () =>
    props.selection.end ? format(props.selection.end, 'HH:mm') : undefined,
  set: (time) => {
    if (!time || !props.selection.start || !props.selection.end) return;

    emit('changeDate', {
      start: props.selection.start,
      end: withTime(props.selection.end, time),
    });
  },
});

const units = computed({
  get: () => (props.selection.units > 0 ? props.selection.units : undefined),
  set: (value) => {
    if (!value || value > props.selection.maxAvailableUnits) return;

    emit('changeUnits', value);
  },
});
</script>
