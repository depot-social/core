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
          class="w-full h-full object-cover object-center"
          :src="hero.url"
          width="1800"
          height="1800"
          alt="Hero image"
        />
        <span
          class="absolute right-2 bottom-2 z-10 badge badge-sm badge-transparent"
        >
          &copy;
          <a :href="hero.link" target="_blank" rel="nofollow noreferrer">
            {{ hero.author }} / Unsplash
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

const UPLOADS = 'https://api-resources.berlin.depot.social/uploads';

// this set assumes Unsplash as images source
const HERO_IMAGES = [
  {
    url: `${UPLOADS}/luba_glazunova_uk_T_Zr_F_Nq_CXU_unsplash_9639bd26d7.webp`,
    author: 'Luba Glazunova',
    link: 'https://unsplash.com/photos/ukTZrFNqCXU',
  },
  {
    url: `${UPLOADS}/filipp_romanovski_f9g_4_Pn_X_Us_unsplash_64a1b7d15f.webp`,
    author: 'Filipp Romanovski',
    link: 'https://unsplash.com/photos/_f9g-4PnXUs',
  },
  {
    url: `${UPLOADS}/alex_tyson_h_K9h_Rjs2d_Dw_unsplash_453252411c.webp`,
    author: 'Alex Tyson',
    link: 'https://unsplash.com/photos/hK9hRjs2dDw',
  },
];

// Picked once on the server and reused on the client (no hydration mismatch)
const heroIndex = useState('split-screen-hero', () =>
  Math.floor(Math.random() * HERO_IMAGES.length)
);
const hero = computed(() => HERO_IMAGES[heroIndex.value]!);
</script>
