<template>
  <div class="bg-secondary">
    <div
      class="px-6 xl:px-0 grid grid-cols-12 gap-5 max-w-[1620px] mx-auto pt-6 lg:pt-16"
    >
      <div
        class="col-span-12 xl:col-span-10 xl:col-start-2 grid grid-cols-12 gap-5"
      >
        <div
          class="col-span-12 md:col-span-6 lg:col-span-5 md:sticky md:top-[20px] self-start mb-8"
        >
          <BerlinBookingFormSidebar :booking="berlinBookingFormData" />
        </div>

        <div class="col-span-12 md:col-span-6 md:col-start-7">
          <div
            v-if="errorMessage"
            class="col-span-12 md:col-span-6 md:col-start-7 flex flex-col items-center text-center"
          >
            <div class="alert alert-error mt-2 font-semibold" role="alert">
              {{ errorMessage }}
            </div>
          </div>

          <BerlinBookingForm
            v-if="!submitSuccess"
            :form-data="berlinBookingFormData"
            @submit="onSubmit"
          />
          <div v-else>
            <h2 class="text-2xl font-bold mb-4">
              {{ $t('berlin_booking_form_bookingSuccess') }}
            </h2>
            <p class="text-lg">
              {{ $t('berlin_booking_form_bookingSuccessDescription') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Booking form for "BerlinResourceType"
import type { BerlinBooking, Resource } from '@depot/shared';
import { BerlinBookingIntend, BerlinBookingPersonCount } from '@depot/shared';

import { MISSING_PARAMETERS_ERROR, PAGE_NOT_FOUND } from '~/base/utils/errors';

useHead({
  title: $t('berlin_booking_form_pageTitle'),
});

const route = useRoute();
const { findOne, create } = useStrapi();

// Get query parameters
const resourceId = route.query.resource_id as string;

// Validate required parameters
if (!resourceId) {
  throw createError({
    statusCode: 422,
    statusMessage: MISSING_PARAMETERS_ERROR,
  });
}

// Fetch resource data
const { data: resource } = await useAsyncData('resource', async () => {
  try {
    const response = await findOne<Resource>(
      'resources',
      resourceId.toString(),
      {
        populate: ['images', 'resourceTypes', 'address', 'categories'],
      }
    );

    if (!response?.data) {
      throw createError({
        statusCode: 404,
        statusMessage: PAGE_NOT_FOUND,
      });
    }

    return response.data as Resource;
  } catch (e) {
    console.error('Error loading resource', e);
    throw createError({
      statusCode: 404,
      statusMessage: PAGE_NOT_FOUND,
    });
  }
});

// Initialize Berlin booking form data
const berlinBookingFormData = reactive<Partial<BerlinBooking>>({
  projectTitle: '',
  projectDescription: '',
  associationRegistrationNumber: '',
  projectWebsite: '',
  intend: BerlinBookingIntend.OPEN_EVENT,
  personCount: BerlinBookingPersonCount.ONE_TO_TEN,
  // start: today
  start: new Date().toISOString().split('T')[0],
  // end: tomorrow
  end: new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split('T')[0],
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  acceptAGB: false,
  resource: resource.value,
});

const errorMessage = ref('');

const submitSuccess = ref(false);

const onSubmit = async (formData: Partial<BerlinBooking>) => {
  try {
    const response = await create<BerlinBooking>('emails/berlin-booking', {
      ...formData,
      resource: {
        id: resourceId.toString() as unknown as number,
      },
    });

    if (!response || !(response as unknown as { success: boolean }).success) {
      throw new Error('Failed to create booking');
    }

    submitSuccess.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.error('Booking submission error:', error);
    errorMessage.value = $t('berlin_booking_form_bookingSubmissionError');
  }
};
</script>
