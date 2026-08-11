<template>
  <UForm :schema="schema" :state="state" class="w-full" @submit="onSubmit">
    <section class="flex flex-col gap-6">
      <div class="">
        <span class="text-lg">{{ $t('contactData') }}</span>
        <p class="text-gray-700 pt-2">{{ $t('contactDataDescription') }}</p>
      </div>
      <div class="max-w-full flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-2">
          <UFormField
            :label="$t('firstNameOrOrganization')"
            name="booking.customer.firstName"
          >
            <UInput v-model="state.booking.customer.firstName" required />
          </UFormField>
          <UFormField :label="$t('lastName')" name="booking.customer.lastName">
            <UInput v-model="state.booking.customer.lastName" required />
          </UFormField>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <UFormField
            :label="$t('streetAndNumber')"
            name="booking.customerAddress.street"
          >
            <UInput v-model="state.booking.customerAddress.street" />
          </UFormField>
          <UFormField
            :label="$t('postalCode')"
            name="booking.customerAddress.zip"
          >
            <UInput v-model="state.booking.customerAddress.zip" />
          </UFormField>
          <UFormField :label="$t('city')" name="booking.customerAddress.place">
            <UInput v-model="state.booking.customerAddress.place" />
          </UFormField>
        </div>
        <UFormField :label="$t('email')" name="booking.customer.email">
          <UInput
            v-model="state.booking.customer.email"
            type="email"
            required
          />
        </UFormField>
      </div>
    </section>

    <section class="flex gap-3 flex-col mt-24 max-w-full">
      <div class="basis-1/3">
        <span class="text-lg">{{ $t('notesToLender') }}</span>
        <p class="text-gray-700">{{ $t('notesToLenderDescription') }}</p>
      </div>
      <div>
        <UFormField :label="$t('notes')" name="booking.commentCustomer">
          <UTextarea
            v-model="state.booking.commentCustomer"
            :rows="4"
            class="w-full"
          />
        </UFormField>
        <UFormField name="termsAccepted" class="mt-4">
          <UCheckbox
            v-model="state.termsAccepted"
            required
            :label="$t('acceptTermsAndConditions')"
          />
        </UFormField>
      </div>
    </section>

    <div class="flex justify-between mt-6 max-w-full">
      <UButton
        type="submit"
        class="btn btn-primary"
        :loading="submitting"
        :disabled="submitting"
      >
        {{ $t('requestBooking') }}
      </UButton>
      <UButton
        variant="outline"
        class="btn btn-secondary btn-outline"
        :aria-label="$t('cancelBookingAndGoBack')"
        @click="$router.back()"
      >
        {{ $t('cancel') }}
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  createBookingFormSchema,
  type BookingFormInitialData,
  type BookingFormInput,
  type BookingFormValues,
} from './schema';

interface Props {
  formData: BookingFormInitialData;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: BookingFormValues];
}>();

const schema = createBookingFormSchema({
  required: $t('validation_required'),
  minLength2: $t('validation_minLength2'),
  invalidEmail: $t('validation_invalidEmail'),
  consentRequired: $t('validation_consentRequired'),
});

const state = reactive<BookingFormInput>({
  booking: {
    customer: {
      firstName: props.formData.customer?.firstName || '',
      lastName: props.formData.customer?.lastName || '',
      email: props.formData.customer?.email || '',
    },
    customerAddress: {
      street: props.formData.customerAddress?.street || '',
      zip: props.formData.customerAddress?.zip || '',
      place: props.formData.customerAddress?.place || '',
    },
    commentCustomer: props.formData.commentCustomer || '',
  },
  termsAccepted: false,
});

const submitting = ref(false);

const onSubmit = (event: FormSubmitEvent<BookingFormValues>) => {
  if (submitting.value) {
    return;
  }

  submitting.value = true;

  try {
    emit('submit', event.data);
  } finally {
    submitting.value = false;
  }
};
</script>
