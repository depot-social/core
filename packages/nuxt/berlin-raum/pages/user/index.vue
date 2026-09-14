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

    <div class="xl:container px-8 pt-12 pb-18">
      <div class="flex justify-center mt-10 items-center">
        <span class="text-base font-medium text-primary mr-auto">{{
          $t('myProfile')
        }}</span>
        <div class="join mr-auto">
          <NuxtLink
            :to="getUserProfilePath()"
            class="btn btn-primary join-item"
          >
            Übersicht
          </NuxtLink>
          <!-- <button class="btn btn-info join-item">{{ $t('messages') }}</button> -->
          <NuxtLink :to="getUserSettingsPath()" class="btn btn-info join-item">
            {{ $t('settings') }}
          </NuxtLink>
        </div>
      </div>

      <div class="bg-white mt-4 pt-8 flex flex-col">
        <BerlinProfileResourceList :resources="resources || []" />
        <DashboardCalendar
          :dashboard="dashboard"
          :display-availabilities="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  AvailabilitiesGetDashboardResponseData,
  User,
} from '@depot/shared';
import DashboardCalendar from '~/base/components/profile/DashboardCalendar.vue';

useHead({
  title: $t('myProfile'),
});

definePageMeta({
  middleware: 'auth',
});

const { fetchUser } = useStrapiAuth();
const strapiUrl = useStrapiUrl();

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
