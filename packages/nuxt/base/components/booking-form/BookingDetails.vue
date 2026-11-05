<template>
  <section class="w-full flex flex-col gap-6">
    <p class="alert alert-info">{{ $t('bookingImmutableNotice') }}</p>
    <div>
      <h2 class="text-lg">{{ $t('contactData') }}</h2>
      <dl class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <dt>{{ $t('firstNameOrOrganization') }}</dt>
          <dd>{{ booking.customer?.firstName || '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('lastName') }}</dt>
          <dd>{{ booking.customer?.lastName || '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('email') }}</dt>
          <dd>{{ booking.customer?.email || '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('streetAndNumber') }}</dt>
          <dd>{{ booking.customerAddress?.street || '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('postalCode') }}</dt>
          <dd>{{ booking.customerAddress?.zip || '—' }}</dd>
        </div>
        <div>
          <dt>{{ $t('city') }}</dt>
          <dd>{{ booking.customerAddress?.place || '—' }}</dd>
        </div>
      </dl>
    </div>
    <div>
      <h2 class="text-lg">{{ $t('notesToLender') }}</h2>
      <p class="whitespace-pre-wrap mt-3">
        {{ booking.commentCustomer || '—' }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Booking } from '@depot/shared';
defineProps<{ booking: Booking }>();
</script>
