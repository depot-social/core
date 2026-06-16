<template>
  <div class="mt-10 lg:pt-[100px] max-w-screen overflow-hidden">
    <figure
      :class="['absolute z-[-1]', 'top-[-62%] right-0']"
      aria-hidden="true"
    >
      <img src="/icons/home_header_circle.svg" alt="" />
    </figure>
    <figure
      :class="['absolute z-[-1]', 'left-[-10%] top-[-15%]']"
      aria-hidden="true"
    >
      <img src="/icons/home_header_rect.svg" alt="" />
    </figure>
    <figure
      :class="['absolute z-[-1]', 'left-[35%] top-[85vh]']"
      aria-hidden="true"
    >
      <img src="/icons/home_header_plus.svg" alt="" />
    </figure>
    <figure
      :class="['absolute z-[-1]', 'left-[50%] top-[35vh]']"
      aria-hidden="true"
    >
      <img src="/icons/home_header_d.svg" alt="" />
    </figure>

    <BaseHomeHeaderSection v-if="homepage" :homepage="homepage" />
    <BaseHomeAccordionSection v-if="homepage" :homepage="homepage" />
    <BaseHomeResourcesSection v-if="homepage" :homepage="homepage" />
  </div>
</template>

<script setup lang="ts">
import type { SingleTypeHomepage } from '@depot/shared';

useHead({
  title: () => $t('home'),
});

const { find } = useStrapi();

const { data } = await useAsyncData('homepage', () =>
  find<SingleTypeHomepage>('homepage', {
    populate: [
      'accordionAccordion.accordionItems.illustration',
      'headerResources.images',
    ],
  })
);

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage:
      'Single Type "Homepage" should exist at API, be readable and be published.',
  });
}

const homepage = data.value.data as unknown as SingleTypeHomepage;

// useSeo(homepage);
</script>

<style scoped>
/* Animation for fade-in effect */
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
