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
            name="customer.firstName"
          >
            <UInput v-model="state.customer.firstName" required />
          </UFormField>
          <UFormField :label="$t('lastName')" name="customer.lastName">
            <UInput v-model="state.customer.lastName" required />
          </UFormField>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <UFormField
            :label="$t('streetAndNumber')"
            name="customerAddress.street"
          >
            <UInput v-model="state.customerAddress.street" />
          </UFormField>
          <UFormField :label="$t('postalCode')" name="customerAddress.zip">
            <UInput v-model="state.customerAddress.zip" />
          </UFormField>
          <UFormField :label="$t('city')" name="customerAddress.place">
            <UInput v-model="state.customerAddress.place" />
          </UFormField>
        </div>
        <UFormField :label="$t('email')" name="customer.email">
          <UInput v-model="state.customer.email" type="email" required />
        </UFormField>
      </div>
    </section>

    <section class="flex gap-3 flex-col mt-24 max-w-full">
      <div class="basis-1/3">
        <span class="text-lg">{{ $t('notesToLender') }}</span>
        <p class="text-gray-700">{{ $t('notesToLenderDescription') }}</p>
      </div>
      <div>
        <UFormField :label="$t('notes')" name="commentCustomer">
          <UTextarea v-model="state.commentCustomer" :rows="4" class="w-full" />
        </UFormField>
        <UFormField name="checkTermsConditions" class="mt-4">
          <UCheckbox
            v-model="state.checkTermsConditions"
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
import type { Resource, User, Booking } from '@depot/shared';
import * as v from 'valibot';

interface Props {
  formData: Partial<Booking>;
  resource?: Resource;
  user?: User;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: Partial<Booking>];
}>();

// Form schema
const schema = v.pipe(
  v.object({
    customer: v.object({
      firstName: v.pipe(
        v.string(),
        v.nonEmpty($t('validation_required')),
        v.minLength(2, $t('validation_minLength2'))
      ),
      lastName: v.pipe(
        v.string(),
        v.nonEmpty($t('validation_required')),
        v.minLength(2, $t('validation_minLength2'))
      ),
      email: v.pipe(
        v.string(),
        v.nonEmpty($t('validation_required')),
        v.email($t('validation_invalidEmail'))
      ),
    }),
    customerAddress: v.object({
      street: v.string(),
      zip: v.string(),
      place: v.string(),
    }),
    commentCustomer: v.string(),
    checkTermsConditions: v.pipe(
      v.boolean(),
      v.transform((val) => val === true, $t('validation_consentRequired'))
    ),
  })
);

type BookingForm = v.InferInput<typeof schema>;

const state = reactive<BookingForm>({
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
  checkTermsConditions: props.formData.checkTermsConditions || false,
});

const submitting = ref(false);

const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (submitting.value) {
    return;
  }

  submitting.value = true;

  try {
    const bookingData: Partial<Booking> = {
      ...props.formData,
      customer: state.customer,
      customerAddress: state.customerAddress,
      commentCustomer: state.commentCustomer,
      checkTermsConditions: state.checkTermsConditions,
    };

    emit('submit', bookingData);
  } finally {
    submitting.value = false;
  }
};
</script>
