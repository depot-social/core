<template>
  <div
    class="fixed z-40 top-0 right-0 left-0 bottom-0 h-full w-full"
    style="background-color: rgba(0, 0, 0, 0.8)"
    @click.self="onClose"
  >
    <form
      class="p-4 max-w-xl mx-auto relative absolute left-0 right-0 overflow-hidden mt-24"
      @submit.prevent="onSubmit"
    >
      <div
        class="shadow absolute right-0 top-0 w-10 h-10 rounded-full bg-white text-gray-500 hover:text-gray-800 inline-flex items-center justify-center cursor-pointer"
        @click="onClose"
      >
        <svg
          class="fill-current w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M16.192 6.344L11.949 10.586 7.707 6.344 6.293 7.758 10.535 12 6.293 16.242 7.707 17.656 11.949 13.414 16.192 17.656 17.606 16.242 13.364 12 17.606 7.758z"
          />
        </svg>
      </div>

      <div
        class="shadow w-full rounded-lg bg-white overflow-hidden w-full block p-8"
      >
        <h2 class="font-bold text-2xl mb-6 text-gray-800 border-b pb-2">
          {{ $t('availability') }}
          {{ availability.documentId ? $t('edit') : $t('add') }}
        </h2>

        <p class="mb-4 text-gray-400 italic">
          {{ $t('availabilitiesNoImpactOnBookings') }}
        </p>

        <div v-if="errorMessage" class="alert alert-error mb-4">
          {{ errorMessage }}
        </div>

        <div class="mb-4">
          <label
            class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
          >
            {{ $t('title') }} ({{ $t('optional') }})
          </label>
          <input
            v-model="formData.title"
            class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
            type="text"
            :placeholder="$t('availabilityTitlePlaceholder')"
          />
        </div>

        <div class="mb-4">
          <label
            class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
          >
            {{ $t('resource') }}
          </label>
          <select
            v-model="formData.resourceDocumentId"
            class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500 grow"
          >
            <option
              v-for="resource in resources"
              :key="resource.documentId"
              :value="resource.documentId"
            >
              {{ resource.title }}
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label
            class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
          >
            {{ $t('quantity') }}
            <select
              v-model.number="formData.availableUnits"
              class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500 grow"
            >
              <option v-for="i in 10" :key="i" :value="i - 1">
                {{ i - 1 }} {{ $t('pieces') }}
              </option>
            </select>
          </label>
        </div>

        <div class="flex gap-2 mb-4">
          <div class="grow">
            <label
              class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
            >
              {{ $t('start') }} ({{ $t('day') }})
            </label>
            <input
              v-model="formData.startDate"
              class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              type="date"
              @change="updateStartDate"
            />
          </div>
          <div class="grow-[2]">
            <label
              class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
            >
              {{ $t('start') }} ({{ $t('time') }})
            </label>
            <input
              v-model="formData.startTime"
              class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              type="time"
              @change="updateStartTime"
            />
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <div class="grow">
            <label
              class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
            >
              {{ $t('end') }} ({{ $t('day') }})
            </label>
            <input
              v-model="formData.endDate"
              class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              type="date"
              @change="updateEndDate"
            />
          </div>
          <div class="grow-[2]">
            <label
              class="text-gray-800 block mb-1 font-bold text-sm tracking-wide"
            >
              {{ $t('end') }} ({{ $t('time') }})
            </label>
            <input
              v-model="formData.endTime"
              class="bg-gray-200 appearance-none border-2 border-gray-200 rounded-lg w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              type="time"
              @change="updateEndTime"
            />
          </div>
        </div>

        <div class="mt-8 text-right">
          <span
            v-if="availability.documentId"
            tabindex="0"
            class="text-red-700 underline cursor-pointer mr-4"
            @click="onDelete"
          >
            {{ $t('delete') }}
          </span>
          <button
            type="button"
            class="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm mr-2"
            @click="onClose"
          >
            {{ $t('cancel') }}
          </button>
          <button
            type="submit"
            class="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 border border-gray-700 rounded-lg shadow-sm"
          >
            {{ $t('saveAvailability') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Availability, Resource } from '@depot/shared';
import { format, parseISO } from 'date-fns';
import { reactive, watch } from 'vue';

interface Props {
  availability: Availability;
  resources: Resource[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [availability: Availability, isNew: boolean];
  delete: [availability: Availability];
}>();

const config = useRuntimeConfig();

const arbitraryDateAsDate = (date: Date | string | undefined): Date =>
  date ? (typeof date === 'string' ? new Date(date) : date) : new Date();

const formData = reactive({
  title: props.availability.title || '',
  resourceDocumentId:
    props.availability.resource?.documentId ||
    props.resources[0]?.documentId ||
    null,
  availableUnits: props.availability.availableUnits || 0,
  startDate: format(
    arbitraryDateAsDate(props.availability.start),
    'yyyy-MM-dd'
  ),
  startTime: format(arbitraryDateAsDate(props.availability.start), 'HH:mm'),
  endDate: format(arbitraryDateAsDate(props.availability.end), 'yyyy-MM-dd'),
  endTime: format(arbitraryDateAsDate(props.availability.end), 'HH:mm'),
});

const errorMessage = ref('');

// Update availability when form data changes
const updateAvailability = () => {
  const startDate = parseISO(formData.startDate);
  const endDate = parseISO(formData.endDate);

  props.availability.title = formData.title;
  props.availability.availableUnits = formData.availableUnits;
  props.availability.resource = props.resources.find(
    (resource) => resource.documentId === formData.resourceDocumentId
  );
  props.availability.start = new Date(
    format(startDate, 'yyyy-MM-dd') + 'T' + formData.startTime
  );
  props.availability.end = new Date(
    format(endDate, 'yyyy-MM-dd') + 'T' + formData.endTime
  );
};

const updateStartDate = () => {
  updateAvailability();
};

const updateStartTime = () => {
  updateAvailability();
};

const updateEndDate = () => {
  updateAvailability();
};

const updateEndTime = () => {
  updateAvailability();
};

const onClose = () => {
  emit('close');
};

const onDelete = async () => {
  if (!props.availability.documentId) {
    return;
  }

  if (!confirm($t('confirmDeleteAvailability'))) {
    return;
  }

  try {
    const cookies = useCookie('strapi_jwt');
    const jwt = cookies.value;

    if (!jwt) {
      errorMessage.value = $t('authorizationRequired');
      return;
    }

    await $fetch(
      `${config.public.strapiUrl}/api/availabilities/${props.availability.documentId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    emit('delete', props.availability);
    emit('close');
  } catch (e) {
    console.error('Error deleting availability', e);
    errorMessage.value = $t('errorDeletingAvailability');
  }
};

const onSubmit = async () => {
  errorMessage.value = '';

  updateAvailability();

  if (!props.availability.resource) {
    errorMessage.value = $t('pleaseSelectResource');
    return;
  }

  const isNew = !props.availability.documentId;

  try {
    const cookies = useCookie('strapi_jwt');
    const jwt = cookies.value;

    if (!jwt) {
      errorMessage.value = $t('authorizationRequired');
      return;
    }

    const requestBody = {
      title: props.availability.title,
      start: props.availability.start,
      end: props.availability.end,
      availableUnits: props.availability.availableUnits,
      resource: {
        documentId: props.availability.resource.documentId,
      },
    };

    let response;

    if (isNew) {
      response = await $fetch(
        `${config.public.strapiUrl}/api/availabilities?populate[]=resource`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: {
            data: requestBody,
          },
        }
      );
    } else {
      response = await $fetch(
        `${config.public.strapiUrl}/api/availabilities/${props.availability.documentId}?populate[]=resource`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: {
            data: requestBody,
          },
        }
      );
    }

    if (!response || !response.data) {
      throw new Error('Failed to save availability');
    }

    const savedAvailability = response.data as Availability;
    emit('save', savedAvailability, isNew);
    emit('close');
  } catch (e) {
    console.error('Error saving availability', e);
    errorMessage.value = $t('errorSavingAvailability');
  }
};
</script>
