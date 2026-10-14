<template>
  <main id="main">
    <div class="flex items-start min-h-screen">
      <div
        class="pt-16 lg:pt-42 md:basis-1/2 basis-full flex flex-col gap-2 md:gap-4 py-8 px-8 lg:px-12 xl:px-24 max-h-screen overflow-scroll"
      >
        <div class="xl:max-w-[65ch]">
          <slot />
        </div>
      </div>
      <div
        class="basis-1/2 relative max-h-screen overflow-hidden self-stretch bg-secondary hidden md:block"
      >
        <img
          class="w-full h-full object-cover object-right"
          :src="HERO_IMAGE_URL"
          width="1800"
          height="1800"
          alt="Hero image"
        />
        <span
          class="absolute right-2 bottom-2 z-10 badge badge-sm badge-transparent"
        >
          &copy;
          <a
            href="https://jannikestelling.com/"
            target="_blank"
            rel="nofollow noreferrer"
          >
            Jannike Stelling
          </a>
        </span>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
/* Split-screen layout for use in login-related pages
 * @see https://nuxt.com/docs/guide/directory-structure/layouts
 */

const HERO_IMAGE_URL = `https://api-resources.berlin.depot.social/uploads/engagierte_berlin_flow_0d6962bd3e.jpg`;
</script>
