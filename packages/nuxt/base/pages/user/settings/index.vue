<template>
  <main class="bg-orange-100 min-h-screen">
    <div
      v-if="errorMessage"
      class="container pt-4 flex flex-col items-center text-center"
    >
      <div
        class="alert alert-error mt-2 max-w-2xl"
        role="alert"
        aria-live="assertive"
      >
        {{ errorMessage }}
      </div>
    </div>

    <div class="container py-8 md:py-10 lg:py-12">
      <div
        class="w-full flex flex-col items-start gap-6 md:gap-8 rounded-3xl bg-base-100 p-6 md:p-10 lg:p-12"
      >
        <NuxtLink
          :to="getUserProfilePath()"
          class="link no-underline text-orange-800 hover:text-orange-700"
        >
          <i class="ph ph-arrow-left" aria-hidden="true" />
          {{ $t('backToDashboard') }}
        </NuxtLink>

        <div class="w-full rounded-2xl bg-orange-100 px-5 py-4 md:px-6 md:py-5">
          <h1 class="text-2xl md:text-3xl font-semibold text-black mt-2">
            {{ $t('userSettings_title') }}
          </h1>
          <p class="text-base text-gray-800 max-w-3xl mt-2">
            {{ $t('userSettings_description') }}
          </p>
        </div>

        <div
          class="w-full rounded-2xl border-2 border-black bg-white p-5 md:p-7"
        >
          <BaseUserProfileForm
            class="w-full"
            :is-edit-form="true"
            :loading="submitting"
            :initial-data="formInitialData"
            @submit="onSubmit"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { User } from '@depot/shared';
import type { Ref } from 'vue';
import type {
  UserProfileFormInitialData,
  UserProfileFormSubmitPayload,
} from '~/base/components/user-profile-form/types';
import { getUserProfilePath } from '~/base/utils/paths';

useHead({
  title: $t('userSettings_pageTitle'),
});

definePageMeta({
  middleware: 'auth',
});

const { fetchUser } = useStrapiAuth();
const strapiClient = useStrapiClient();
const user = useStrapiUser() as Ref<User | null>;

const userData = (await fetchUser()) as Ref<User | null>;

if (!userData.value) {
  const { redirectToLoginWithToast } = useAuthRedirect();
  await redirectToLoginWithToast();
}

const formInitialData = reactive<UserProfileFormInitialData>({
  email: '',
  firstName: '',
  lastName: '',
  salutation: undefined,
  phone: '',
  address: {
    street: '',
    zip: '',
    place: '',
  },
});

watchEffect(() => {
  if (!userData.value) return;
  const salutation =
    userData.value.salutation === 'mrs' ||
    userData.value.salutation === 'mr' ||
    userData.value.salutation === 'na'
      ? userData.value.salutation
      : undefined;

  Object.assign(formInitialData, {
    email: userData.value.email ?? '',
    firstName: userData.value.firstName ?? '',
    lastName: userData.value.lastName ?? '',
    salutation,
    phone: userData.value.phone ?? '',
    address: {
      street: userData.value.address?.street ?? '',
      zip: userData.value.address?.zip ?? '',
      place: userData.value.address?.place ?? '',
    },
  } satisfies UserProfileFormInitialData);
});

const submitting = ref(false);
const errorMessage = ref('');
const toast = useToast();

const onSubmit = async (payload: UserProfileFormSubmitPayload) => {
  if (submitting.value) {
    return;
  }

  if (!userData.value?.id) {
    throw new Error('Missing user id');
  }

  submitting.value = true;
  errorMessage.value = '';

  const address = {
    street: payload.address.street?.trim() || undefined,
    zip: payload.address.zip?.trim() || undefined,
    place: payload.address.place?.trim() || undefined,
  };

  const updatePayload: Record<string, unknown> = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    address: Object.values(address).some((value) => Boolean(value))
      ? address
      : {},
  };

  if (payload.salutation) {
    updatePayload.salutation = payload.salutation;
  }

  const phone = payload.phone?.trim();
  if (phone) {
    updatePayload.phone = phone;
  }

  try {
    await strapiClient<User>(`/users/me`, {
      method: 'PATCH',
      body: updatePayload,
    });
    await fetchUser();

    toast.add({
      title: $t('userSettings_successTitle'),
      description: $t('userSettings_successDescription'),
    });
  } catch (error) {
    if (import.meta.dev) {
      console.error('Profile update failed:', error);
    }
    errorMessage.value = $t('userSettings_submissionError');
    toast.add({
      title: $t('userSettings_submissionError'),
      color: 'error',
    });
  } finally {
    submitting.value = false;
  }
};
</script>
