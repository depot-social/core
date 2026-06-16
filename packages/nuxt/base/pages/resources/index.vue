<template>
  <div class="flex flex-col gap-4">
    <div class="relative container w-full md:max-w-[30%] px-0 mt-8">
      <BaseResourcesSearchInput
        :query="state.searchQuery"
        @change-query="onChangeQuery"
      />
    </div>
    <div class="flex mt-3 pl-5">
      <ul class="flex pr-10 py-2 gap-3 w-fit overflow-x-auto">
        <BaseResourcesSearchCategoryList
          :categories="categoriesResponse.data"
          :selected-category="state.selectedCategory"
          :display-reset="true"
          @category-select="setSelectedCategory"
        />
      </ul>
      <div
        class="absolute right-0 h-[140px] w-[150px] bg-gradient-to-r from-transparent to-base-100 cursor-e-resize"
        aria-hidden="true"
      ></div>
    </div>
    <div
      class="bg-white rounded-2xl py-6 transition-all"
      :class="state.loading && 'opacity-40'"
    >
      <div class="flex gap-8 md:gap-4 px-3 md:px-5 flex-col md:flex-row">
        <BaseResourceListMap :resources="addressResources" />
        <div
          v-if="state.resources.length === 0"
          class="basis-full md:basis-1/2 xl:basis-2/3 grid grid-flow-row gap-x-5 gap-y-8 text-neutral-600 grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        >
          <BaseResourcesListEmpty />
        </div>
        <div
          v-else
          class="basis-full md:basis-1/2 xl:basis-2/3 grid grid-flow-row gap-x-5 gap-y-8 text-neutral-600 grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        >
          <BaseResourceCard
            v-for="resource in state.resources"
            :key="resource.id"
            :resource="resource"
          />
        </div>
        <BaseResourcesSearchPagination :state="state" :set-page="setPage" />
      </div>
    </div>
    <div class="mt-20 container">
      <h2
        v-if="resourcesSearchPage.faqSectionHeadline"
        class="text-2xl text-center mb-12 text-black"
      >
        {{ resourcesSearchPage.faqSectionHeadline }}
      </h2>
      <BaseCollapse name="resource-faq" :items="faqs" isStacked />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  Category,
  FAQ,
  Resource,
  SingleTypeResourcesSearchPage,
} from '@depot/shared';
import { debounce } from 'lodash-es';
import type { CollapseItem } from '~/base/components/collapse/Collapse.vue';

const { find } = useStrapi();

const resourcesSearchPageResponse = await find<SingleTypeResourcesSearchPage>(
  'resources-search-page',
  {
    populate: ['faqs'],
  }
);

if (!resourcesSearchPageResponse.data) {
  throw createError({
    statusCode: 500,
    statusMessage:
      'Single Type "resourcesSearchPage" should exist at API, be readable and be published.',
  });
}

const resourcesSearchPage =
  resourcesSearchPageResponse.data as unknown as SingleTypeResourcesSearchPage;

// useSeo(resourcesSearchPage)

const addressResourcesResponse = await find<Resource>('resources', {
  populate: [
    'address',
  ],
  pagination: {
    page: 1,
    pageSize: 1000,
  },
});

const addressResources = addressResourcesResponse.data;

const resourcesResponse = await find<Resource>('resources', {
  populate: [
    'categories',
    'prices',
    'images',
    'resourceTypes',
    'user',
    'address',
  ],
  pagination: {
    page: 1,
    pageSize: 16,
  },
});

const resources = resourcesResponse.data;

const faqsToCollapseItems = (faqs: FAQ[]): CollapseItem[] =>
  faqs.map((faq) => ({
    title: faq.question,
    content: faq.answer,
    linkPath: getFaqsPath(faq.slug),
    linkText: '',
    linkClassnames: 'btn-primary',
  }));

const faqs = faqsToCollapseItems(resourcesSearchPage.faqs);

const categoriesResponse = await find<Category>('categories');

const { state, setSearchQuery, setSelectedCategory, setPage } =
  await useResourcesSearch(resources);

const debouncedSetQuery = debounce((value: string) => {
  setSearchQuery(value);
}, 150);

const onChangeQuery = (value: string) => {
  debouncedSetQuery(value);
};
</script>
