<template>
  <div>
    <NuxtLink to="/" class="link no-underline">
      <i class="ph ph-arrow-left" /> {{ $t('login_backToHome') }}
    </NuxtLink>

    <h1 class="text-xl pt-10">{{ $t('login_signInToDepot') }}</h1>

    <p class="mt-2">
      {{ $t('login_noMemberYet') }}
      <NuxtLink :to="getRegisterPath()" class="font-bold text-primary">
        {{ $t('login_registerNow') }}
      </NuxtLink>
    </p>

    <div v-if="loginError" class="alert alert-error mt-2" role="alert">
      {{ $t('login_errorTitle') }}
      {{ loginError }}
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4 pt-4"
      @submit="onSubmit"
    >
      <UFormField :label="$t('login_emailOrUsername')" name="username">
        <UInput v-model="state.username" required />
      </UFormField>

      <UFormField :label="$t('login_password')" name="password">
        <UInput v-model="state.password" type="password" required />
      </UFormField>

      <NuxtLink
        :to="getRequestResetPasswordPath()"
        class="font-bold text-primary font-text self-end"
      >
        {{ $t('login_forgotPassword') }}
      </NuxtLink>

      <UButton
        type="submit"
        class=""
        :loading="loginInProgress"
        :disabled="loginInProgress"
      >
        {{ $t('login_signIn') }}
      </UButton>
    </UForm>

    <!-- <div class="divider font-text">{{ $t('login_orSignInVia') }}</div>

    <div class="flex gap-2 items-start">
      <UButton variant="outline" class="badge badge-primary">Facebook</UButton>
      <UButton variant="outline" class="badge badge-primary">Apple</UButton>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import type { Strapi5Error } from '@nuxtjs/strapi';
import * as v from 'valibot';
import {
  getRegisterPath,
  getRequestResetPasswordPath,
  getUserProfilePath,
} from '~/base/utils/paths';

useHead({
  title: $t('login_pageTitle'),
});

const { login } = useStrapiAuth();
const route = useRoute();
const toast = useToast();

const schema = v.pipe(
  v.object({
    username: v.pipe(v.string(), v.minLength(6, $t('validation_minLength'))),
    password: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(6, $t('validation_minLength')),
      v.maxLength(30, $t('validation_maxLength')),
      v.regex(/[a-z]/, $t('validation_passwordLowercase')),
      v.regex(/[A-Z]/, $t('validation_passwordUppercase')),
      v.regex(/[0-9]/, $t('validation_passwordNumber'))
    ),
  })
);

type LoginForm = v.InferInput<typeof schema>;

const state = reactive<LoginForm>({
  username: '',
  password: '',
});

const loginInProgress = ref(false);
const loginError = ref('');

onMounted(() => {
  const authRequiredQuery = Array.isArray(route.query.auth_required)
    ? route.query.auth_required[0]
    : route.query.auth_required;

  if (authRequiredQuery === '1') {
    toast.add({
      title: $t('auth_loginRequiredToAccessPage'),
      color: 'warning',
    });
  }
});

const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (loginInProgress.value) {
    return;
  }

  loginError.value = '';
  loginInProgress.value = true;

  try {
    await login({
      identifier: state.username,
      password: state.password,
    });

    const redirectQuery = Array.isArray(route.query.redirect)
      ? route.query.redirect[0]
      : route.query.redirect;
    const redirectPath = getSafeRedirectPath(redirectQuery);

    await navigateTo(redirectPath ?? getUserProfilePath());
  } catch (error: unknown) {
    console.error('Login error:', error);

    // Handle Strapi error response format
    const errorObj = error as Strapi5Error;
    if (errorObj?.error?.message) {
      loginError.value = errorObj.error.message;
    } else {
      loginError.value = $t('login_unknownError');
    }
  } finally {
    loginInProgress.value = false;
  }
};

definePageMeta({
  layout: 'split-screen',
});
</script>
