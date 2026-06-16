<template>
  <section id="faq" class="bg-violet-100">
    <div class="xl:container px-8 flex flex-wrap gap-8 md:gap-0 pt-12 pb-18">
      <h2
        v-if="resourcesSearchPage.faqSectionHeadline"
        class="tracking-tight basis-full md:basis-1/2 text-[36px] 2xl:text-[63px] font-bold"
      >
        {{ resourcesSearchPage.faqSectionHeadline }}
      </h2>
      <div class="basis-full md:basis-1/2">
        <BaseCollapse
          name="resource-faq"
          :items="collapseItems"
          :default-active-item="activeCollapseItem"
          @change="onChangeActiveCollapseItem"
          isStacked
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SingleTypeResourcesSearchPage } from '@depot/shared';
import { marked } from 'marked';

const { find } = useStrapi();

const resourcesSearchPageResponse = await find<SingleTypeResourcesSearchPage>(
  'resources-search-page',
  {
    populate: ['faqs'],
  }
);

const activeCollapseItem = ref<number>(0);

const onChangeActiveCollapseItem = (i: number) => {
  activeCollapseItem.value = i;
};

if (!resourcesSearchPageResponse.data) {
  throw createError({
    statusCode: 500,
    statusMessage:
      'Single Type "resourcesSearchPage" should exist at API, be readable and be published.',
  });
}
const resourcesSearchPage =
  resourcesSearchPageResponse.data as unknown as SingleTypeResourcesSearchPage;

const collapseItems = computed(
  () =>
    resourcesSearchPage.faqs?.map((faq) => ({
      title: faq.question,
      content: marked(faq.answer) || '',
    })) || []
);
</script>
