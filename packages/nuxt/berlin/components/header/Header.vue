<template>
  <header class="w-full h-[70px] flex items-center justify-between px-6">
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

    <div class="flex items-center gap-8">
      <NuxtLink to="#faq" class="text-[16px] font-semibold no-underline">
        FAQ
      </NuxtLink>

      <NuxtLink
        href="https://engagiertes.berlin/de/einreichen/raum/"
        class="text-[16px] font-semibold no-underline flex items-center gap-2"
        target="_blank"
        external
      >
        Raum einreichen

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
      </NuxtLink>

      <NuxtLinkLocale
        v-if="user"
        :to="{ name: 'user' }"
        class="min-w-9 px-1 py-0.5 rounded-md bg-violet-100 border-2 border-black items-center justify-center flex text-base font-medium"
      >
        {{ userInitials }}
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
