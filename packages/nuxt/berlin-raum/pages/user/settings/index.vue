<template>
  <div>
    <div class="xl:container px-8 pt-12 pb-18">
      <div class="flex justify-center mt-10 items-center">
        <span class="text-base font-medium text-primary mr-auto">{{
          $t('myProfile')
        }}</span>
        <div class="join mr-auto">
          <NuxtLink :to="getUserProfilePath()" class="btn btn-info join-item">
            Übersicht
          </NuxtLink>
          <!-- <button class="btn btn-info join-item">{{ $t('messages') }}</button> -->
          <NuxtLink
            :to="getUserSettingsPath()"
            class="btn btn-primary join-item"
          >
            {{ $t('settings') }}
          </NuxtLink>
        </div>
      </div>

      <div class="px-8 mt-4 py-8 flex flex-col">
        <BerlinUserProfileForm
          class="w-full"
          :is-edit-form="true"
          :loading="submitting"
          :initial-data="formInitialData"
          @submit="onSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@depot/shared';
import type { Ref } from 'vue';
import { getUserProfilePath } from '~/base/utils/paths';
import type {
  UserProfileFormInitialData,
  UserProfileFormSubmitPayload,
} from '~/berlin-raum/components/user-profile-form/types';
useHead({
  title: $t('myProfile'),
});

definePageMeta({
  middleware: 'auth',
});

const { fetchUser } = useStrapiAuth();
const strapiClient = useStrapiClient();
const _user = useStrapiUser() as Ref<User | null>;

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
  organizationName: '',
  link: {
    url: '',
    title: '',
  },
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
    organizationName: userData.value.organizationName ?? '',
    link: {
      url: userData.value.link?.url ?? '',
      title: userData.value.link?.title ?? '',
    },
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

  const organizationName = payload.organizationName?.trim();
  if (organizationName) {
    updatePayload.organizationName = organizationName;
  }

  const phone = payload.phone?.trim();
  if (phone) {
    updatePayload.phone = phone;
  }

  // Always send the link so clearing the URL removes it from the profile
  updatePayload.link = payload.link ?? null;

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
