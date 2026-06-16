<template>
  <main id="main">
    <div class="flex items-center min-h-screen bg-white">
      <div
        class="md:basis-1/2 basis-full flex flex-col gap-2 md:gap-4 py-8 px-8 md:px-18 lg:px-24 max-h-screen overflow-scroll"
      >
        <BaseToasts />
        <slot />
      </div>
      <div
        class="basis-1/2 relative max-h-screen overflow-hidden self-stretch bg-secondary hidden md:block"
      >
        <img
          class="w-full h-full object-cover"
          :src="HERO_IMAGE_URL"
          width="1800"
          height="1800"
          alt="Hero image"
        />
        <span
          class="absolute right-2 bottom-2 z-10 badge badge-sm badge-transparent"
        >
          &copy; Reiseuhu on
          <a
            href="https://unsplash.com/de/fotos/menschen-die-tagsuber-auf-der-fussgangerzone-in-der-nahe-des-braunen-betongebaudes-gehen-t_tc6J_oUfo"
            target="_blank"
            rel="nofollow noreferrer"
          >
            Unsplash
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

const HERO_IMAGE_URL = `https://images.unsplash.com/photo-1600078318098-b159b43088ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&h=1800&q=80`;
</script>
