<template>
  <section id="resources" class="bg-white mt-20 rounded-3xl py-20">
    <div class="container flex flex-col lg:flex-row">
      <div class="flex flex-col gap-3 basis-6/12">
        <span class="text-base font-medium text-primary">
          {{ homepage?.resourcesSectionIntroLine ?? '' }}
        </span>
        <h2 class="text-2xl">{{ homepage?.resourcesSectionHeadline ?? '' }}</h2>
        <p>{{ homepage?.resourcesSectionDescription ?? '' }}</p>
      </div>
    </div>
    <div class="container mt-10 flex flex-col gap-2">
      <BaseResourcesSearchCategoryList
        :categories="categories"
        :selected-category="searchState.selectedCategory"
        @category-select="onCategorySelect"
      />
      <div
        class="absolute right-0 h-[140px] w-[150px] bg-gradient-to-r from-transparent to-white cursor-e-resize pointer-events-none"
        aria-title="Liste der Kategorien horizontal scrollen"
      ></div>
    </div>

    <div
      :class="[
        'transition-all mt-5 container grid grid-flow-row gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        searchState.loading && 'opacity-40',
      ]"
    >
      <div v-if="searchState.error" class="col-span-4 text-center">
        <p>{{ $t('errorLoading') }}</p>
      </div>
      <BaseResourcesListEmpty
        v-if="!searchState.resources || searchState.resources.length === 0"
      />
      <BaseResourceCard
        v-for="resource in searchState.resources"
        v-else
        :key="resource.id"
        :resource="resource"
      />
    </div>

    <div class="w-full text-center mt-5 md:mt-8">
      <NuxtLinkLocale
        :to="{ name: 'resources' }"
        class="btn btn-primary btn-lg shadow-xl"
      >
        {{ $t('exploreAllResources') }}
      </NuxtLinkLocale>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Category, Resource, SingleTypeHomepage } from '@depot/shared';
import { useResourcesSearch } from '~/base/composables/useResourcesSearch';

const props = defineProps<{
  homepage?: SingleTypeHomepage;
}>();

const { find } = useStrapi();

const pageSize = 8;

const resourcesResponse = await useAsyncData('initialResources', () =>
  find<Resource>('resources', {
    populate: [
      'categories',
      'images',
      'address',
      'prices',
      'user',
      'user.organization',
    ],
    pagination: {
      pageSize,
      page: 1,
    },
  })
);

const categoriesResponse = await useAsyncData('categories', () =>
  find<Category>('categories')
);
const categories = categoriesResponse.data.value?.data;

const { state: searchState, setSelectedCategory } = await useResourcesSearch(
  resourcesResponse.data.value?.data as unknown as Resource[],
  pageSize
);

const onCategorySelect = (category: Category | null) => {
  setSelectedCategory(category);
};
</script>

<style scoped>
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
