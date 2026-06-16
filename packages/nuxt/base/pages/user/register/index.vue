<template>
  <!-- Success state -->
  <div
    v-if="registrationSuccess"
    class="col-span-full flex flex-col gap-4 items-center text-center"
  >
    <div class="max-w-[400px] mb-2">
      <figure>
        <img
          src="/illustrations/illustration_confirm_mail.svg"
          alt="Search illustration"
          class="w-[400px] max-w-full"
        />
      </figure>
    </div>
    <h1 class="text-2xl">{{ $t('register_youHaveMail') }}</h1>
    <p>{{ $t('register_emailConfirmationText') }}</p>
    <p>{{ $t('register_checkSpamFolder') }}</p>
  </div>

  <!-- Registration form -->
  <div v-else>
    <NuxtLink to="/" class="link no-underline">
      <i class="ph ph-arrow-left" /> {{ $t('register_backToHome') }}
    </NuxtLink>

    <h1 class="text-xl pt-8">{{ $t('register_signUpToDepot') }}</h1>

    <p class="mt-2">{{ $t('register_memberBenefits') }}</p>

    <p class="my-4">
      <strong>{{ $t('register_alreadyMember') }}{{ ` ` }}</strong>
      <NuxtLink :to="getLoginPath()" class="font-bold text-primary">
        {{ $t('register_goToLogin') }}
      </NuxtLink>
    </p>

    <div v-if="registerError" class="alert alert-error mt-2" role="alert">
      {{ $t('register_errorTitle') }} {{ registerError }}
    </div>

    <BaseUserProfileForm
      :is-edit-form="false"
      :loading="registerInProgress"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import type { Strapi5Error } from '@nuxtjs/strapi';
import type { UserProfileFormSubmitPayload } from '~/base/components/user-profile-form/types';
import { getLoginPath } from '~/base/utils/paths';

useHead({
  title: $t('register_pageTitle'),
});

const { register } = useStrapiAuth();

const registerInProgress = ref(false);
const registerError = ref('');
const registrationSuccess = ref(false);

const onSubmit = async (formPayload: UserProfileFormSubmitPayload) => {
  if (registerInProgress.value) {
    return;
  }

  registerError.value = '';
  registerInProgress.value = true;

  try {
    const address = {
      street: formPayload.address.street?.trim() || undefined,
      zip: formPayload.address.zip?.trim() || undefined,
      place: formPayload.address.place?.trim() || undefined,
    };
    const emailTrimmed = formPayload.email.trim();
    const registerPayload: {
      username: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      address: { street?: string; zip?: string; place?: string } | Record<string, never>;
      salutation?: 'mrs' | 'mr' | 'na';
      phone?: string;
    } = {
      username: emailTrimmed,
      email: emailTrimmed,
      password: formPayload.password as string,
      firstName: formPayload.firstName,
      lastName: formPayload.lastName,
      address: Object.values(address).some((value) => Boolean(value))
        ? address
        : {},
    };

    if (formPayload.salutation) {
      registerPayload.salutation = formPayload.salutation;
    }

    const phone = formPayload.phone?.trim();
    if (phone) {
      registerPayload.phone = phone;
    }

    await register(registerPayload);

    registrationSuccess.value = true;
  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Handle Strapi error response format
    const errorObj = error as Strapi5Error;
    if (errorObj?.error?.message) {
      registerError.value = errorObj.error.message;
    } else {
      registerError.value = $t('register_unknownError');
    }
  } finally {
    registerInProgress.value = false;
  }
};

definePageMeta({
  layout: 'split-screen',
});
</script>
