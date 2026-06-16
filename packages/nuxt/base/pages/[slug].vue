<template>
  <div class="container mx-auto px-4 py-10">
    <div v-if="page">
      <h1 class="text-3xl font-bold mb-6">{{ page.headline }}</h1>
      <div class="prose max-w-none" v-html="markdownContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SingleTypePage } from '@depot/shared';
import { marked } from 'marked';
import { PAGE_NOT_FOUND } from '~/base/utils/errors';

const route = useRoute();
const slug = route.params.slug as string;

if (!slug) {
  throw createError({
    statusCode: 404,
    statusMessage: PAGE_NOT_FOUND,
  });
}

const { find } = useStrapi();

const pageResponse = await useAsyncData(`page-${slug}`, () =>
  find<SingleTypePage>('pages', {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: ['seo.openGraph.ogImage', 'seo.metaImage'],
  })
);

if (!pageResponse.data || pageResponse.data.value?.data.length === 0) {
  throw createError({
    statusCode: 404,
    statusMessage: PAGE_NOT_FOUND,
  });
}

const page = computed(
  () => pageResponse.data.value!.data[0] as unknown as SingleTypePage
);

useSeo(page.value);

const markdownContent = computed(() => {
  return marked(page.value?.content ?? '');
});
</script>
