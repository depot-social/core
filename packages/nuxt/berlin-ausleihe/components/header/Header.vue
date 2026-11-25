<template>
  <header
    class="sticky top-0 z-20 w-full h-[70px] flex flex-wrap items-center justify-between px-4 sm:px-6 bg-white border-b border-default"
  >
    <NuxtLinkLocale :to="{ name: 'resources' }">
      <div class="flex items-center gap-2.5">
        <svg
          class="flex w-6 h-6 lg:w-8 lg:h-8 aspect-square"
          aria-hidden="true"
        >
          <use href="/illustrations/ausleihe.svg#fragment" />
        </svg>

        <span class="text-2lg font-normal">
          ausleihe.<span class="font-semibold hidden sm:inline"
            >engagiertes.berlin</span
          >
        </span>
      </div>
    </NuxtLinkLocale>

    <div class="flex items-center gap-5 ml-auto">
      <NuxtLink
        to="https://engagiertes.berlin"
        class="hidden sm:block text-[16px] font-light no-underline"
        target="_blank"
        external
      >
        &larr; {{ $t('berlin_to_parent') }}
      </NuxtLink>

      <NuxtLink to="#faq" class="text-[16px] font-semibold no-underline">
        FAQ
      </NuxtLink>

      <BerlinHeaderLogin v-if="isEnabled('login')" />
      <BerlinMenu />
    </div>
  </header>
</template>

<script setup lang="ts">
const { isEnabled } = useFeature();
</script>
