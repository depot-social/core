<template>
  <div v-if="booking">
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
            {{ $t('bookingRequestFrom') }}<br />
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
              {{ $t('bookingStatus') }}:
              {{ $t(`bookingStatus_${booking.bookingStatus}`) }}
            </span>
            <NuxtLink
              :to="`/api/rental-agreement/${booking.documentId}`"
              v-if="booking?.bookingStatus === 'confirmed'"
              >Verleihvertrag</NuxtLink
            >
          </span>
        </div>

        <BaseBookingDetails :booking="booking" />
      </div>

      <BerlinBookingFormSidebar
        :booking="booking"
        stored-price
        :resource="booking?.resource"
      >
        <BaseBookingActions
          :can-confirm="canConfirm"
          :can-cancel="canCancel"
          :submitting="submitting"
          @confirm="onConfirm"
          @cancel="onCancel"
        />
      </BerlinBookingFormSidebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseBookingDetails from '~/base/components/booking-form/BookingDetails.vue';
import BaseBookingActions from '~/base/components/booking-form/BookingActions.vue';
import { useBookingDetails } from '~/base/composables/useBookingDetails';

useHead({ title: $t('bookingRequest_pageTitle') });
definePageMeta({ middleware: 'auth' });
const route = useRoute();
const {
  booking,
  userIsCustomer,
  createdAtDisplay,
  canConfirm,
  canCancel,
  submitting,
  onConfirm,
  onCancel,
} = await useBookingDetails(route.params.id as string);
</script>
