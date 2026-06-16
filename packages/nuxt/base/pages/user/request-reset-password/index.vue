<template>
  <div>
    <div
      v-if="requestSuccess"
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
      <h1 class="text-2xl">{{ $t('reset_youHaveMail') }}</h1>
      <p>{{ $t('reset_emailSentText') }}</p>
      <p>{{ $t('reset_checkSpamFolder') }}</p>
    </div>

    <div v-else>
      <NuxtLink to="/" class="link no-underline">
        <i class="ph ph-arrow-left" /> {{ $t('reset_backToHome') }}
      </NuxtLink>

      <h1 class="text-xl pt-8">{{ $t('reset_requestNewPassword') }}</h1>

      <p class="mt-2">{{ $t('reset_instructions') }}</p>

      <p class="mt-2">
        <strong>{{ $t('reset_passwordFound') }}{{ ` ` }}</strong>
        <NuxtLink :to="getLoginPath()" class="font-bold text-primary">
          {{ $t('reset_goToLogin') }}
        </NuxtLink>
      </p>

      <div v-if="requestError" class="alert alert-error mt-2" role="alert">
        {{ $t('reset_errorTitle') }} {{ requestError }}
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="flex flex-col gap-4 pt-4"
        @submit="onSubmit"
      >
        <UFormField :label="$t('reset_email')" name="email">
          <UInput v-model="state.email" type="email" required />
        </UFormField>

        <UButton
          type="submit"
          class="btn btn-full btn-primary block mt-4 w-full"
          :loading="requestInProgress"
          :disabled="requestInProgress"
        >
          {{ $t('reset_requestLink') }}
        </UButton>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Strapi5Error } from '@nuxtjs/strapi';
import * as v from 'valibot';
import { getLoginPath } from '~/base/utils/paths';

useHead({
  title: $t('reset_pageTitle'),
});

const { forgotPassword } = useStrapiAuth();

const schema = v.pipe(
  v.object({
    email: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.email($t('validation_invalidEmail'))
    ),
  })
);

type RequestResetPassword = v.InferInput<typeof schema>;

const state = reactive<RequestResetPassword>({
  email: '',
});

const requestInProgress = ref(false);
const requestError = ref('');
const requestSuccess = ref(false);

const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (requestInProgress.value) {
    return;
  }

  requestError.value = '';
  requestInProgress.value = true;

  try {
    await forgotPassword({ email: state.email });

    requestSuccess.value = true;
  } catch (error: unknown) {
    console.error('Request reset password error:', error);

    const errorObj = error as Strapi5Error;
    if (errorObj?.error?.message) {
      requestError.value = errorObj.error.message;
    } else {
      requestError.value = $t('reset_unknownError');
    }
  } finally {
    requestInProgress.value = false;
  }
};

definePageMeta({
  layout: 'split-screen',
});
</script>
