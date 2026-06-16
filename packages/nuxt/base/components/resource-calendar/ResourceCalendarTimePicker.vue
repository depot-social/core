<template>
  <div class="flex gap-3">
    <div class="form-control">
      <label :for="`${id}-start-time`" class="label label-text">
        {{ $t('pickupTime') }}
      </label>
      <select
        :id="`${id}-start-time`"
        :name="`${id}-start-time`"
        class="select select-bordered"
        @change="onChangeStart"
        :disabled="!selection.start || !selection.end"
      >
        <option
          v-for="time in times"
          :key="time"
          :value="time"
          :selected="time === selectedStartTime"
        >
          {{ time }}
        </option>
      </select>
    </div>
    <div>
      <div class="form-control">
        <label :for="`${id}-end-time`" class="label label-text">
          {{ $t('returnTime') }}
        </label>
        <select
          :id="`${id}-end-time`"
          :name="`${id}-end-time`"
          class="select select-bordered"
          @change="onChangeEnd"
          :disabled="!selection.start || !selection.end"
        >
          <option
            v-for="time in times"
            :key="time"
            :value="time"
            :selected="time === selectedEndTime"
          >
            {{ time }}
          </option>
        </select>
      </div>
    </div>
    <div class="form-control">
      <label :for="`${id}-units`" class="label label-text">
        {{ $t('quantity') }}
      </label>
      <select
        :id="`${id}-units`"
        :name="`${id}-units`"
        class="select select-bordered"
        @change="onChangeUnits"
        :disabled="!selection.start || !selection.end"
      >
        <option
          v-for="i in Array.from(
            Array(selection.maxAvailableUnits || 1),
            (_, i) => i + 1
          )"
          :key="i"
          :value="i"
          :selected="selection.units === i"
        >
          {{ i.toString() }} {{ $t('pieces') }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { format, set } from 'date-fns';
import { random } from 'lodash-es';
import type {
  CalendarActiveSelection,
  OnChangeDateParams,
} from '../calendar/calendar.props';

interface Props {
  selection: CalendarActiveSelection;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  changeDate: [updatedDates: OnChangeDateParams];
}>();

const appConfig = useAppConfig();

const id = ref(`time-picker-${random(9999, 99999)}`);

const selectedStartTime = computed(() =>
  props.selection.start ? format(props.selection.start, 'HH:mm') : null
);

const selectedEndTime = computed(() =>
  props.selection.end ? format(props.selection.end, 'HH:mm') : null
);

const times = computed(() => {
  // Generate half-hour steps from bookable time begin to end
  // Note: This could also be achieved using date-fns.eachHourOfInterval
  let _times = [];

  for (
    let i = appConfig.ResourceCalendarStartTimeFrom;
    i <= appConfig.ResourceCalendarEndTimeTill;
    i++
  ) {
    _times.push(`${i < 10 ? '0' : ''}${i}:00`);

    if (i !== appConfig.ResourceCalendarEndTimeTill) {
      _times.push(`${i < 10 ? '0' : ''}${i}:30`);
    }
  }

  return _times;
});

const onChangeStart = (ev: Event) => {
  if (!props.selection.start || !props.selection.end) return;

  const target = ev.target as HTMLSelectElement;
  const value = target.value;
  const splittedVal = value.split(':');

  emit('changeDate', {
    start: set(props.selection.start, {
      hours: parseInt(splittedVal[0]),
      minutes: parseInt(splittedVal[1]),
    }),
    end: props.selection.end,
  });
};

const onChangeEnd = (ev: Event) => {
  if (!props.selection.start || !props.selection.end) return;

  const target = ev.target as HTMLSelectElement;
  const value = target.value;
  const splittedVal = value.split(':');

  emit('changeDate', {
    start: props.selection.start,
    end: set(props.selection.end, {
      hours: parseInt(splittedVal[0]),
      minutes: parseInt(splittedVal[1]),
    }),
  });
};

const onChangeUnits = (ev: Event) => {
  const target = ev.target as HTMLSelectElement;
  const value = target.value;
  props.selection.units = Number(value);
};
</script>
