<template>
  <div class="flex justify-between">
    <span class="text-base font-medium">{{ $t('checkAvailability') }}</span>
    <div
      :class="[
        'flex flex-col self-end items-end gap-2',
        !selectionActive && 'opacity-0',
      ]"
    >
      <span class="badge badge-info bg-black text-white badge-xs ml-2">
        {{ selection.start && selection.end && selection.maxAvailableUnits }}
        {{ $t('available') }}
      </span>
      <p>
        <span v-if="selection.start">{{
          formatDate(selection.start, 'EEEE, d. MMMM yyyy')
        }}</span>
        <span v-if="selection.end">
          -
          {{ formatDate(selection.end, 'EEEE, d. MMMM yyyy') }}
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarActiveSelection } from '../calendar/calendar.props';
import { useDateFormat } from '~/base/composables/useDateFormat';

interface Props {
  selection: CalendarActiveSelection;
}

const props = defineProps<Props>();
const { formatDate } = useDateFormat();

const selectionActive = computed(
  () => props.selection.start && props.selection.end
);
</script>
