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
      class="flex flex-col lg:flex-row lg:min-h-screen justify-between bg-secondary"
    >
      <div
        class="basis-full lg:basis-2/3 flex flex-col items-start gap-8 px-8 xl:px-24 py-12"
      >
        <button class="link no-underline" @click="$router.back()">
          <i class="ph ph-arrow-left" /> {{ $t('backToPreviousPage') }}
        </button>
        <h1 class="text-xl">
          <template v-if="userIsCustomer">
            {{ $t('yourBookingRequest') }}
            {{ $t('from') }}
          </template>
          <template v-else>
            {{ $t('bookingRequestFrom') }}
            {{ booking?.customer?.firstName }} {{ booking?.customer?.lastName }}
            {{ $t('from') }}
          </template>
          {{ createdAtDisplay }}
        </h1>

        <div
          role="alert"
          :class="[
            'alert',
            booking?.bookingStatus === 'confirmed'
              ? 'alert-success'
              : booking?.bookingStatus === 'cancelled'
              ? 'alert-error'
              : 'alert-info',
          ]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="stroke-current shrink-0 w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            <span class="badge">
              {{ $t('bookingStatus') }}: {{ booking?.bookingStatus }}
            </span>
            <NuxtLink
              :to="`/api/rental-agreement/${booking.documentId}`"
              v-if="booking?.bookingStatus === 'confirmed'"
              >Verleihvertrag</NuxtLink
            >
          </span>
        </div>

        <BaseBookingForm :form-data="bookingFormData" @submit="onSubmit" />
      </div>

      <BerlinBookingFormSidebar
        :booking="bookingFormData"
        :resource="booking?.resource"
      >
        <div class="flex flex-wrap gap-4 mt-12">
          <UButton
            v-if="userIsResourceOwner"
            class="w-full sm:w-auto"
            @click="onConfirm"
          >
            {{ $t('confirmBooking') }}
          </UButton>
          <UButton class="w-full sm:w-auto" variant="outline" @click="onCancel">
            {{ $t('cancelBooking') }}
          </UButton>
        </div>
      </BerlinBookingFormSidebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Booking, UpdateBookingRequest, User } from '@depot/shared';
import type { BookingFormValues } from '~/base/components/booking-form/schema';
import { getStrapiErrorMessage, PAGE_NOT_FOUND } from '~/base/utils/errors';

useHead({
  title: $t('bookingRequest_pageTitle'),
});

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const { findOne, update } = useStrapi();

const id = route.params.id as string;

const user = useStrapiUser() as Ref<User>;

const { data: booking } = await useAsyncData('booking', async () => {
  try {
    const response = await findOne<Booking>('bookings', id, {
      populate: [
        'resource',
        'resource.images',
        'resource.prices',
        'resource.address',
        'resource.user',
        'resource.user.organization',
        'customer',
        'customerAddress',
        'resourceOwner',
      ],
    });

    if (!response?.data) {
      throw createError({
        statusCode: 404,
        statusMessage: PAGE_NOT_FOUND,
      });
    }

    return response.data as Booking;
  } catch (e) {
    console.error('Error loading booking', e);
    throw createError({
      statusCode: 404,
      statusMessage: PAGE_NOT_FOUND,
    });
  }
});

const createdAtDisplay = computed(() => {
  const createdAt = (booking.value as Booking | undefined)?.createdAt;
  return createdAt ? new Date(createdAt).toLocaleDateString('de-DE') : '';
});

const userIsCustomer = computed(
  () =>
    booking.value && user.value && booking.value.customer?.id === user.value.id
);

const userIsResourceOwner = computed(
  () =>
    booking.value &&
    user.value &&
    (booking.value.resourceOwner?.id ?? booking.value.resource?.user?.id) ===
      user.value.id
);

const bookingFormData = reactive<Partial<Booking>>({});

watchEffect(() => {
  if (!booking.value) return;
  Object.assign(bookingFormData, {
    id: booking.value.id,
    start: booking.value.start,
    end: booking.value.end,
    bookingStatus: booking.value.bookingStatus,
    bookedUnits: booking.value.bookedUnits,
    title: booking.value.title ?? '',
    resource: booking.value.resource,
    resourceOwner: booking.value.resourceOwner ?? booking.value.resource?.user,
    customer: booking.value.customer,
    customerAddress: {
      street: booking.value.customerAddress?.street || '',
      place: booking.value.customerAddress?.place || '',
      zip: booking.value.customerAddress?.zip || '',
    },
    commentCustomer: booking.value.commentCustomer ?? '',
  } satisfies Partial<Booking>);
});

const errorMessage = ref('');
const toast = useToast();

const onSubmit = async (formData: BookingFormValues) => {
  errorMessage.value = '';

  try {
    if (!booking.value?.documentId || !booking.value.resource?.documentId) {
      throw new Error('Missing booking id');
    }
    const bookingRequest = {
      start: booking.value.start,
      end: booking.value.end,
      bookingStatus: booking.value.bookingStatus,
      bookedUnits: booking.value.bookedUnits,
      title: booking.value.title,
      resource: {
        documentId: booking.value.resource.documentId,
      },
      customerAddress: formData.customerAddress,
      commentCustomer: formData.commentCustomer,
    } satisfies UpdateBookingRequest;
    const response = await update<Booking>(
      'bookings',
      booking.value.documentId,
      bookingRequest
    );

    if (!response || !response.data) {
      throw new Error('Failed to update booking');
    }

    toast.add({
      title: $t('saved'),
      description: $t('changesSaved'),
    });
  } catch (err) {
    console.error('Booking update error:', err);
    errorMessage.value = getStrapiErrorMessage(err, $t('bookingUpdateError'));
  }
};

const onConfirm = async () => {
  try {
    if (!booking.value?.documentId) return;
    const response = await update<Booking>(
      'bookings',
      booking.value.documentId,
      {
        bookingStatus: 'confirmed',
      } satisfies UpdateBookingRequest
    );
    if (response?.data) {
      booking.value = response.data as Booking;
      toast.add({
        title: $t('bookingConfirmed'),
      });
    }
  } catch (e) {
    console.error('Confirm booking error:', e);
    toast.add({
      title: $t('error'),
      description: getStrapiErrorMessage(e, $t('actionFailed')),
      color: 'error',
    });
  }
};

const onCancel = async () => {
  try {
    if (!booking.value?.documentId) return;
    const response = await update<Booking>(
      'bookings',
      booking.value.documentId,
      {
        bookingStatus: 'cancelled',
      } satisfies UpdateBookingRequest
    );
    if (response?.data) {
      booking.value = response.data as Booking;
      toast.add({
        title: $t('bookingCancelled'),
      });
    }
  } catch (e) {
    console.error('Cancel booking error:', e);
    toast.add({
      title: $t('error'),
      description: getStrapiErrorMessage(e, $t('actionFailed')),
      color: 'error',
    });
  }
};
</script>
