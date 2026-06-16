<template>
  <header
    class="flex relative flex-col lg:flex-row min-h-[70vh] text-center lg:text-left"
  >
    <div class="container xl:mt-[35px]">
      <div class="lg:w-[58%] flex flex-col gap-8 lg:gap-10">
        <h1 class="text-2lg lg:text-3xl">
          {{ homepage?.headerHeadline ?? '' }}
        </h1>
        <p class="text-base lg:text-lg text-gray-700">
          {{ homepage?.headerDescription ?? '' }}
        </p>
        <div
          class="mt-2 lg:10 flex flex-col lg:flex-row items-center gap-5 lg:gap-10"
        >
          <div class="relative grow dropdown">
            <BaseResourcesSearch />
          </div>
          <a href="#resources" class="link no-underline grow-1">
            <i class="ph ph-binoculars text-xl"></i>
            <span class="link link-hover">{{ $t('discoverResources') }}</span>
          </a>
        </div>
      </div>
    </div>
    <div class="hero-grid">
      <div>
        <HeaderResourceCard
          v-if="
            homepage.headerResources[0] && homepage.headerResources[0].images[0]
          "
          :resource="homepage.headerResources[0]"
        />
        <HeaderResourceCard
          v-if="
            homepage.headerResources[1] && homepage.headerResources[1].images[0]
          "
          :resource="homepage.headerResources[1]"
        />
      </div>
      <div class="mt-[-50px]">
        <HeaderResourceCard
          v-if="
            homepage.headerResources[2] && homepage.headerResources[2].images[0]
          "
          :resource="homepage.headerResources[2]"
        />
        <HeaderResourceCard
          v-if="
            homepage.headerResources[3] && homepage.headerResources[3].images[0]
          "
          :resource="homepage.headerResources[3]"
        />
      </div>
      <div class="mt-[30px]">
        <HeaderResourceCard
          v-if="
            homepage.headerResources[4] && homepage.headerResources[4].images[0]
          "
          :resource="homepage.headerResources[4]"
        />
        <HeaderResourceCard
          v-if="
            homepage.headerResources[5] && homepage.headerResources[5].images[0]
          "
          :resource="homepage.headerResources[5]"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SingleTypeHomepage } from '@depot/shared';
import HeaderResourceCard from './HeaderResourceCard.vue';

defineProps<{
  homepage: SingleTypeHomepage;
}>();
</script>

<style>
@reference '~/base/assets/css/main.css';

.hero-grid {
  @apply relative lg:absolute right-0 lg:right-[-40px] top-0 w-full lg:w-[43vw] grid grid-cols-3 px-3 lg:px-0 gap-3 lg:gap-5 lg:z-0 z-[-1] mt-[5rem] lg:mt-0;
}

.hero-grid > div {
  @apply grid gap-3 lg:gap-5 auto-rows-min animate-fadein opacity-0;
}

.hero-grid > div:nth-child(2) {
  animation-delay: 0.15s;
}

.hero-grid > div:nth-child(3) {
  animation-delay: 0.3s;
}

.hero-grid > div img {
  @apply transition-all h-auto w-full bg-white;
}

@keyframes fadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fadein {
  animation: fadein 0.5s ease-in-out forwards;
}
</style>
