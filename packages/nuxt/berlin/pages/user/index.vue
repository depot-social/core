<template>
  <div class="xl:container px-8 pt-12 pb-18">
    <div class="flex justify-between mt-10 items-center">
      <span class="text-base font-medium text-primary">{{
        $t('myProfile')
      }}</span>
      <div class="join hidden">
        <button class="btn btn-primary join-item">
          {{ $t('dashboard') }}
        </button>
        <button class="btn btn-info join-item">{{ $t('messages') }}</button>
        <button class="btn btn-info join-item">{{ $t('settings') }}</button>
      </div>
    </div>

    <div class="bg-white mt-4 pt-8 flex flex-col">
      <BerlinProfileResourceList :resources="resources || []" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '@depot/shared';
import { getPopulates } from '@depot/shared';

useHead({
  title: $t('myProfile'),
});

definePageMeta({
  middleware: 'auth',
});

const user = useStrapiUser() as Ref<User | null>;

const config = useRuntimeConfig();
const token = useStrapiToken();

if (!token.value) {
  const { redirectToLoginWithToast } = useAuthRedirect();
  await redirectToLoginWithToast();
}

const userData = token.value
  ? await $fetch<User>(
      `${config.public.strapiUrl}/api/users/me?${getPopulates({
        populate: [
          'resources.user',
          'resources.images',
          'resources.user.organization',
          'resources.resourceTypes',
        ],
      }).join('&')}`,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    )
  : null;

const resources = computed(() => userData?.resources || []);
</script>
