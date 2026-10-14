<template>
  <!-- Success state -->
  <div v-if="registrationSuccess" class="col-span-full flex flex-col gap-4">
    <h1 class="text-2xl font-bold!">{{ $t('register_youHaveMail') }}</h1>
    <p>{{ $t('register_emailConfirmationText') }}</p>
    <p>{{ $t('register_checkSpamFolder') }}</p>
  </div>

  <!-- Registration form -->
  <div v-else class="flex flex-col gap-4">
    <NuxtLink to="/" class="text-2lg font-light! mb-4">
      ← {{ $t('register_backToHome') }}
    </NuxtLink>

    <h1 class="text-3xl! font-bold! leading-none!">
      {{
        isLayer('berlin-raum')
          ? $t('berlin_registerAtRaum')
          : $t('berlin_registerAtAusleihe')
      }}
    </h1>

    <p class="text-balance">
      {{
        isLayer('berlin-raum')
          ? $t('berlin_register_raumMemberBenefits')
          : $t('berlin_register_ausleiheMemberBenefits')
      }}
    </p>

    <p class="text-2lg!">
      {{ $t('register_alreadyMember') }}{{ ` ` }}
      <NuxtLink :to="getLoginPath()" class="link-underline">
        {{ $t('register_goToLogin') }}
      </NuxtLink>
    </p>

    <div v-if="registerError" class="alert alert-error mt-2" role="alert">
      {{ $t('register_errorTitle') }} {{ registerError }}
    </div>

    <BerlinUserProfileForm
      :is-edit-form="false"
      :loading="registerInProgress"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import type { Strapi5Error } from '@nuxtjs/strapi';
import { getLoginPath } from '~/base/utils/paths';
import type { UserProfileFormSubmitPayload } from '~/berlin-raum/components/user-profile-form/types';

useHead({
  title: $t('register_pageTitle'),
});

const { register } = useStrapiAuth();
const { isLayer } = useActiveLayer();

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
      organizationName?: string;
      address:
        | { street?: string; zip?: string; place?: string }
        | Record<string, never>;
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

    const organizationName = formPayload.organizationName?.trim();
    if (organizationName) {
      registerPayload.organizationName = organizationName;
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
