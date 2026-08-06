<template>
  <header
    class="w-full h-[70px] flex flex-wrap items-center justify-between px-6"
  >
    <NuxtLinkLocale :to="{ name: 'resources' }">
      <div class="flex items-center gap-2.5">
        <svg
          class="flex w-6 h-6 lg:w-8 lg:h-8 aspect-square"
          aria-hidden="true"
        >
          <use href="/illustrations/raum.svg#fragment" />
        </svg>

        <span class="text-2lg font-normal hidden sm:inline">
          raum<span class="font-semibold">.engagiertes.berlin</span>
        </span>
      </div>
    </NuxtLinkLocale>

    <div class="flex items-center gap-5 ml-auto">
      <NuxtLink
        to="https://engagiertes.berlin"
        class="text-[16px] font-light no-underline"
        target="_blank"
        external
      >
        &larr; {{ $t('berlin_to_parent') }}
      </NuxtLink>

      <NuxtLink to="#faq" class="text-[16px] font-semibold no-underline">
        FAQ
      </NuxtLink>

      <NuxtLinkLocale
        :to="{ name: 'resources-add' }"
        class="text-[16px] font-semibold no-underline flex items-center gap-2"
      >
        {{ $t('berlin_resources_addRoom') }}

        <svg
          class="flex-shrink-0 w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 32 32"
        >
          <path
            fill="#121212"
            d="M28 27H4a2 2 0 0 1-2-2v-5h2v5h24v-5h2v5a2 2 0 0 1-2 2Z"
          />
          <path
            fill="#121212"
            d="M25 20H7v2h18v-2ZM25 15H7v2h18v-2ZM25 10H7v2h18v-2ZM25 5H7v2h18V5Z"
          />
        </svg>
      </NuxtLinkLocale>

      <NuxtLinkLocale
        v-if="user"
        :to="{ name: 'user' }"
        class="min-w-9 px-1 py-0.5 rounded-md bg-violet-100 border-2 border-black items-center justify-center flex text-base font-medium"
      >
        {{ userInitials }}
      </NuxtLinkLocale>
      <NuxtLinkLocale
        v-else
        :to="{ name: 'user-login' }"
        class="flex items-center text-base gap-1 text-[16px] font-semibold"
      >
        {{ $t('berlin_login_signIn') }}

        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M26 30H14C13.4696 30 12.9609 29.7893 12.5858 29.4142C12.2107 29.0391 12 28.5304 12 28V25H14V28H26V4H14V7H12V4C12 3.46957 12.2107 2.96086 12.5858 2.58579C12.9609 2.21071 13.4696 2 14 2H26C26.5304 2 27.0391 2.21071 27.4142 2.58579C27.7893 2.96086 28 3.46957 28 4V28C28 28.5304 27.7893 29.0391 27.4142 29.4142C27.0391 29.7893 26.5304 30 26 30Z"
            fill="#121212"
          />
          <path
            d="M14.59 20.59L18.17 17H4V15H18.17L14.59 11.41L16 10L22 16L16 22L14.59 20.59Z"
            fill="#121212"
          />
        </svg>
      </NuxtLinkLocale>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { User } from '@depot/shared';

const user = useStrapiUser() as Ref<User | null>;

const getInitial = (value?: string | null): string => {
  const normalized = value?.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : '';
};

// User first and last name abbreviated to initials for display in header.
const userInitials = computed(() => {
  const currentUser = user.value;
  if (!currentUser) return '';

  const initials = `${getInitial(currentUser.firstName)}${getInitial(
    currentUser.lastName
  )}`;
  if (initials) return initials;

  const username = currentUser.username?.trim() ?? '';
  return username.slice(0, 2).toUpperCase();
});
</script>
