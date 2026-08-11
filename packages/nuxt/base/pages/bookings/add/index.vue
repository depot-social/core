<template>
  <div>
    <div
      v-if="errorMessage"
      class="col-span-full flex flex-col items-center text-center"
    >
      <div class="alert alert-error mt-2" role="alert">
        {{ errorMessage }}
      </div>
    </div>

    <div
      v-else-if="pending"
      class="col-span-full flex flex-col items-center text-center"
    >
      <div class="loading loading-spinner loading-lg" />
      <p class="mt-4">{{ $t('loading') }}</p>
    </div>

    <div v-else class="flex min-h-screen justify-between bg-base-100">
      <div class="basis-2/3 flex flex-col items-start gap-8 px-24 py-12">
        <button class="link no-underline" @click="$router.back()">
          <i class="ph ph-arrow-left" /> {{ $t('viewResource') }}
        </button>
        <h1 class="text-xl">{{ $t('yourBookingRequest') }}</h1>
        <p>
          <strong>{{ $t('almostDone') }}</strong> {{ $t('addMoreInformation') }}
        </p>
        <BaseBookingForm
          :form-data="bookingFormData"
          :resource="resource"
          :user="user"
          @submit="onSubmit"
        />
      </div>
      <BaseBookingFormSidebar :booking="bookingFormData" :resource="resource" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Booking form for "ContingentResourceType"
import type { Resource, User, Booking, BookingRequest } from '@depot/shared';
import { fetchMaxAvailableUnits } from '~/base/utils/availabilities';
import { getResourcePath, getBookingPath } from '~/base/utils/paths';
import { PAGE_NOT_FOUND, MISSING_PARAMETERS_ERROR } from '~/base/utils/errors';

useHead({
  title: $t('bookingRequest_pageTitle'),
});

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const { findOne, create } = useStrapi();

// Get query parameters
const resourceDocumentId = route.query.resource_id as string;
const start = route.query.start as string;
const end = route.query.end as string;
const unitsParam = route.query.units as string;

// Validate required parameters
if (!resourceDocumentId || !start || !end) {
  throw createError({
    statusCode: 422,
    statusMessage: MISSING_PARAMETERS_ERROR,
  });
}

const units = Number(unitsParam);

// Get user data
const user = useStrapiUser() as Ref<User>;

// Fetch resource data
const { data: resource, pending } = await useAsyncData('resource', async () => {
  try {
    const response = await findOne<Resource>(
      'resources',
      resourceDocumentId,
      {
        populate: [
          'images',
          'resourceTypes',
          'address',
          'prices',
          'categories',
          'user',
        ],
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

const { data: maxAvailableUnits } = await useAsyncData(
  `maxAvailableUnits-${resourceDocumentId}-${start}-${end}`,
  async () => {
    try {
      return await fetchMaxAvailableUnits({
        start,
        end,
        resourceId: resourceDocumentId,
      });
    } catch (e) {
      console.error('Error checking availability', e);
      return 0;
    }
  },
  {
    server: true,
  }
);

const toast = useToast();

// Redirect if no units available
if (maxAvailableUnits.value === 0) {
  toast.add({
    title: $t('noUnitsAvailable'),
    description: $t('noUnitsAvailableDescription'),
  });

  await navigateTo(getResourcePath(resource.value?.slug || ''));
}

// Adjust units if more requested than available
const finalUnits = Math.min(units, maxAvailableUnits.value || 0);

// Initialize booking form data
const bookingFormData = reactive<Partial<Booking>>({
  start,
  end,
  status: 'requested',
  bookedUnits: finalUnits,
  title: '',
  resource: resource.value,
  resourceOwner: resource.value?.user as User,
  customer: {
    ...user.value,
    firstName: user.value.firstName || '',
    lastName: user.value.lastName || '',
    email: user.value.email || '',
  },
  customerAddress: {
    street: user.value.address?.street || '',
    place: user.value.address?.place || '',
    zip: user.value.address?.zip || '',
  },
  commentCustomer: '',
  checkTermsConditions: false,
});

const errorMessage = ref('');

const onSubmit = async (formData: Partial<Booking>) => {
  try {
    const bookingRequest: BookingRequest = {
      ...formData,
      start: formData.start,
      end: formData.end,
      bookedUnits: formData.bookedUnits,
      resource: {
        documentId: resourceDocumentId,
      },
    };

    const response = await create<Booking>('bookings', bookingRequest);

    if (!response || !response.data) {
      throw new Error('Failed to create booking');
    }

    await navigateTo(getBookingPath(response.data.documentId));
  } catch (error) {
    console.error('Booking submission error:', error);
    errorMessage.value = $t('bookingSubmissionError');
  }
};
</script>
