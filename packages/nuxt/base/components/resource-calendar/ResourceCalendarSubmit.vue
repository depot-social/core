<template>
  <button
    v-if="userIsLoggedIn"
    type="submit"
    class="btn btn-primary self-end"
    @click="onSubmit"
    :disabled="!canSubmit || isRedirecting"
  >
    <span v-if="isRedirecting" class="loading loading-spinner"></span>
    <span v-else>{{ $t('requestBooking') }}</span>
  </button>
  <a v-else href="/user/login" class="btn btn-primary self-end">
    <span v-if="isRedirecting" class="loading loading-spinner"></span>
    <span v-else>{{ $t('loginAndRequestBooking') }}</span>
  </a>
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';
import { getBookingsAddPath } from '~/base/utils/paths';
import type { CalendarActiveSelection } from '../calendar/calendar.props';
import type { User } from '@depot/shared';

interface Props {
  selection: CalendarActiveSelection;
  resourceId: string;
}

const props = defineProps<Props>();

// @todo placeholder authentication - replace with real auth later
const user = useStrapiUser() as Ref<User | null>;
const userIsLoggedIn = computed(() => user.value !== null);
const isRedirecting = ref(false);
const canSubmit = computed(() =>
  Boolean(
    props.resourceId &&
      props.selection.start &&
      props.selection.end &&
      props.selection.units > 0
  )
);

const onSubmit = async () => {
  if (!canSubmit.value || isRedirecting.value) {
    return;
  }

  // @todo ensure available_units returned is actually >= 1

  isRedirecting.value = true;

  await navigateTo({
    path: getBookingsAddPath(),
    query: {
      resource_id: props.resourceId,
      start: props.selection.start!.toISOString(),
      end: props.selection.end!.toISOString(),
      units: props.selection.units.toString(),
    },
  });
};
</script>
