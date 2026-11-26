<template>
  <BerlinSubpageContent v-if="subpage" :subpage="subpage" />

  <div v-else-if="page" class="container mx-auto px-4 py-10">
    <h1 class="text-3xl font-bold mb-6">{{ page.headline }}</h1>
    <div class="prose max-w-none" v-html="pageContentHtml" />
  </div>
</template>

<script setup lang="ts">
import type { SingleTypePage, Subpage } from '@depot/shared';
import { marked } from 'marked';
import { PAGE_NOT_FOUND } from '~/base/utils/errors';

/**
 * Root level slug: renders a Subpage from Strapi, falls back to a plain Page.
 */
definePageMeta({
  // Subpages bring their own FAQ section, hide the layout FAQ
  layoutFaq: false,
});

const route = useRoute();
const slug = route.params.slug as string;

if (!slug) {
  throw createError({ statusCode: 404, statusMessage: PAGE_NOT_FOUND });
}

const { find } = useStrapi();

const { data } = await useAsyncData(`slug-${slug}`, async () => {
  const subpageResponse = await find<Subpage>('subpages', {
    filters: { slug: { $eq: slug } },
    populate: {
      header: { populate: ['image', 'backgroundColor'] },
      sections: {
        on: {
          'single-type-blocks.text-section': { populate: ['callToAction'] },
          'single-type-blocks.faqs': { populate: ['faqs'] },
        },
      },
      seo: { populate: ['metaImage', 'openGraph.ogImage'] },
    },
  }).catch(() => null);

  const subpage = (subpageResponse?.data as Subpage[] | undefined)?.[0];
  if (subpage) return { subpage, page: null };

  const pageResponse = await find<SingleTypePage>('pages', {
    filters: { slug: { $eq: slug } },
    populate: ['seo.openGraph.ogImage', 'seo.metaImage'],
  });

  const page = (pageResponse.data as SingleTypePage[])[0] ?? null;
  return { subpage: null, page };
});

const subpage = computed(() => data.value?.subpage ?? null);
const page = computed(() => data.value?.page ?? null);

if (!subpage.value && !page.value) {
  throw createError({ statusCode: 404, statusMessage: PAGE_NOT_FOUND });
}

if (subpage.value) {
  useSeo({
    seo: subpage.value.seo,
    headline: subpage.value.header?.headline ?? subpage.value.title,
  });
} else if (page.value) {
  useSeo(page.value);
}

const pageContentHtml = computed(() => marked(page.value?.content ?? ''));
</script>
