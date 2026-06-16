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
      v-else-if="pendingDashboard"
      class="col-span-full flex flex-col items-center text-center"
    >
      <div class="loading loading-spinner loading-lg" />
      <p class="mt-4">{{ $t('loading') }}</p>
    </div>

    <div v-else class="container px-0">
      <div class="flex justify-between mt-10 items-center">
        <span class="text-base font-medium text-primary">{{
          $t('dashboard')
        }}</span>
        <div class="join hidden">
          <button class="btn btn-primary join-item">
            {{ $t('dashboard') }}
          </button>
          <button class="btn btn-info join-item">{{ $t('messages') }}</button>
          <button class="btn btn-info join-item">{{ $t('settings') }}</button>
        </div>
      </div>
      <div class="bg-white rounded-3xl mt-4 pt-8 flex flex-col">
        <BaseProfileResourceList :resources="resources || []" />
        <div class="bg-orange-200 mt-6 rounded-2xl py-20">
          <DashboardCalendar :dashboard="dashboard" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  User,
  AvailabilitiesGetDashboardResponseData,
} from '@depot/shared';
import DashboardCalendar from '~/base/components/profile/DashboardCalendar.vue';

useHead({
  title: $t('myProfile'),
});

definePageMeta({
  middleware: 'auth',
});

const { fetchUser } = useStrapiAuth();
const strapiUrl = useStrapiUrl()

const userData = (await fetchUser()) as Ref<User | null>;

const resources = computed(() => userData.value?.resources || []);

// Fetch dashboard data
const { data: dashboard, pending: pendingDashboard } = await useAsyncData(
  'dashboard',
  async () => {
    try {
      // Get JWT token from cookies for authenticated request
      const token = useStrapiToken();

      const response = await $fetch<AvailabilitiesGetDashboardResponseData>(
        `${strapiUrl}/plugin-availabilities/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        }
      );

      return response;
    } catch (e) {
      console.error('Error loading dashboard', e);
    }
  }
  // {
  //   server: false, // Client-side only since we need cookies
  // }
);

const errorMessage = ref('');
</script>
