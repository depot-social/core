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
      <BerlinHeaderLogin />
    </div>
  </header>
</template>
