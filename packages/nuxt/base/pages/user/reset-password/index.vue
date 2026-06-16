<template>
  <div>
    <NuxtLink to="/" class="link no-underline">
      <i class="ph ph-arrow-left" /> {{ $t('resetPassword_backToHome') }}
    </NuxtLink>

    <h1 class="text-xl pt-8">{{ $t('resetPassword_resetPassword') }}</h1>

    <div v-if="resetError" class="alert alert-error mt-2" role="alert">
      {{ $t('resetPassword_errorTitle') }} {{ resetError }}
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4 pt-4"
      @submit="onSubmit"
    >
      <UFormField :label="$t('resetPassword_password')" name="password">
        <UInput v-model="state.password" type="password" required />
      </UFormField>

      <UFormField
        :label="$t('resetPassword_confirmPassword')"
        name="passwordConfirmation"
      >
        <UInput v-model="state.passwordConfirmation" type="password" required />
      </UFormField>

      <UButton
        type="submit"
        class="btn btn-full btn-primary block mt-4 w-full"
        :loading="resetInProgress"
        :disabled="resetInProgress"
      >
        {{ $t('resetPassword_resetPassword') }}
      </UButton>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { Strapi5Error } from '@nuxtjs/strapi';
import * as v from 'valibot';

useHead({
  title: $t('resetPassword_pageTitle'),
});

const { resetPassword } = useStrapiAuth();
const router = useRouter();
const route = useRoute();

const code = route.query.code as string;

if (!code) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Reset code is required',
  });
}

const toast = useToast();

const schema = v.pipe(
  v.object({
    code: v.string(),
    password: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(6, $t('validation_minLength')),
      v.maxLength(30, $t('validation_maxLength')),
      v.regex(/[a-z]/, $t('validation_passwordLowercase')),
      v.regex(/[A-Z]/, $t('validation_passwordUppercase'))
    ),
    passwordConfirmation: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['passwordConfirmation']],
      (input) => input.password === input.passwordConfirmation,
      $t('validation_passwordsMustMatch')
    ),
    ['passwordConfirmation']
  )
);

type ResetPassword = v.InferInput<typeof schema>;

const state = reactive<ResetPassword>({
  code,
  password: '',
  passwordConfirmation: '',
});

const resetInProgress = ref(false);
const resetError = ref('');

const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (resetInProgress.value) {
    return;
  }

  resetError.value = '';
  resetInProgress.value = true;

  try {
    await resetPassword({
      code: state.code,
      password: state.password,
      passwordConfirmation: state.passwordConfirmation,
    });

    toast.add({
      title: $t('resetPassword_success'),
    });

    router.push('/');
  } catch (error: unknown) {
    console.error('Reset password error:', error);

    const errorObj = error as Strapi5Error;
    if (errorObj?.error?.message) {
      resetError.value = errorObj.error.message;
    } else {
      resetError.value = $t('resetPassword_unknownError');
    }
  } finally {
    resetInProgress.value = false;
  }
};

definePageMeta({
  layout: 'split-screen',
});
</script>
