<template>
  <div>
    <section
      class="relative z-10 flex px-6 py-6 md:py-8 bg-[#FFB76B] min-h-[500px] sm:min-h-[360px] md:min-h-[460px]"
    >
      <div class="flex flex-col w-full">
        <!-- TITLE H1 -->
        <h1
          class="font-bold! leading-none! tracking-tight text-[42px]! md:text-[96px]!"
        >
          Erstmal hier <br />
          schauen!
        </h1>

        <!-- Filter Dropdowns and Search -->
        <div
          class="sm:relative sm:z-10 mt-auto text-xl grid sm:grid-cols-[repeat(2,minmax(260px,1fr))] max-w-[540px] gap-4"
        >
          <BerlinResourcesSearchInput
            class="order-last sm:order-none box-content sm:col-span-2"
            :query="state.searchQuery"
            @change-query="onChangeQuery"
          />
          <BerlinResourcesSearchFilterDropdown
            v-model="categoryValue"
            :items="categoryOptions"
            :multiple="false"
            class="bg-[#ffffff]"
            bg-color="#ffffff"
            placeholder="Kategorie"
          />
          <BerlinResourcesSearchFilterDropdown
            v-model="districtsValue"
            :items="districtsOptions"
            :multiple="true"
            class="bg-[#ffffff]"
            bg-color="#ffffff"
            placeholder="Bezirk"
          />
        </div>
      </div>

      <!-- Illustration -->
      <figure
        class="absolute right-6 md:right-12 xl:right-16 top-6 lg:top-auto lg:bottom-8"
      >
        <svg
          class="h-[150px] md:h-[298px] lg:h-[340px] xl:h-[380px] aspect-[664/466]"
          aria-hidden="true"
        >
          <use href="/illustrations/thumbs-up--team-up.svg#fragment" />
        </svg>
      </figure>
    </section>

    <section id="resources" class="flex flex-col gap-4">
      <div
        class="bg-white py-6 md:py-8 transition-all"
        :class="state.loading && 'opacity-40'"
      >
        <div
          class="flex justify-between items-center gap-3.5 flex-wrap px-4 sm:px-6 mb-5"
        >
          <p class="text-2lg! flex items-center flex-wrap gap-2">
            <span class="font-semibold text-black">
              {{
                state.pagination.total === 0
                  ? $t('berlin_none')
                  : state.pagination.total
              }}
              {{
                state.pagination.total === 1
                  ? $t('berlin_resources_result')
                  : categoryValue.length > 0 ||
                    districtsValue.length > 0 ||
                    state.searchQuery
                  ? $t('berlin_resources_results')
                  : $t('berlin_resources_initialResults')
              }}
            </span>

            <template v-if="state.searchQuery">
              {{ $t('berlin_with') }}

              <span
                class="ml-1.5 font-semibold text-black inline-flex items-center mx-2 bg-very-bright-gray px-1.5 py-0.5 rounded"
              >
                „{{ state.searchQuery }}“
              </span>
            </template>

            <template
              v-if="categoryValue.length > 0 || districtsValue.length > 0"
            >
              <template v-if="state.searchQuery">
                <span>&</span>
              </template>

              <template v-if="categoryValue.length > 0">
                <template v-if="!state.searchQuery">
                  {{ $t('berlin_for') }}
                </template>

                <span
                  class="font-semibold text-black inline-flex items-center bg-very-bright-gray px-1.5 py-0.5 rounded"
                >
                  {{ categoryValue.join(', ') }}
                </span>
              </template>

              <template v-if="districtsValue.length > 0">
                {{ $t('berlin_in') }}
                <span
                  class="font-semibold text-black inline-flex items-center bg-very-bright-gray px-1.5 py-0.5 rounded"
                >
                  {{ districtsValue.join(', ') }}
                </span>
              </template>
            </template>
          </p>

          <template
            v-if="
              categoryValue.length > 0 ||
              districtsValue.length > 0 ||
              state.searchQuery
            "
          >
            <UButton
              class="w-max"
              variant="outline"
              @click="
                categoryValue = [];
                districtsValue = [];
                setSearchQuery('');
                $router.push({ query: {} });
              "
            >
              {{ $t('berlin_resources_resetToInitialState') }}
            </UButton>
          </template>
        </div>

        <BerlinResourcesSearchPagination :state="state" :set-page="setPage" />

        <div class="resources-wrap">
          <BaseLeafletMap
            v-if="resourceMarkers.length > 0"
            v-slot="{ index }"
            :key="mapRefreshKey"
            :markers="resourceMarkers"
            :fit-bounds="true"
            :circle-radius="
              redactResourceLocation
                ? Number(config.public.randomLocationRadius)
                : 0
            "
            class-names="resources-map"
          >
            <div v-if="resourcesWithAddress[index]">
              <BaseResourceMapResourceMarker
                :resource="resourcesWithAddress[index]"
              />
            </div>
          </BaseLeafletMap>

          <aside v-else class="no-resources-map">
            <div class="flex flex-col items-center gap-3 px-6 text-center">
              <span class="text-lg text-neutral-500">
                {{ $t('berlin_map_noResultsForFilter') }}
              </span>
            </div>
          </aside>

          <div
            v-if="state.resources.length === 0"
            class="basis-full md:basis-2/3 xl:basis-2/3 grid grid-flow-row gap-x-5 gap-y-8 text-neutral-600 content-start grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          >
            <BerlinResourcesListEmpty />
          </div>

          <div v-else class="resources-card-grid">
            <BerlinResourceCard
              v-for="resource in state.resources"
              :key="resource.id"
              :resource="resource"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Category, District, Resource } from '@depot/shared';
import { debounce } from 'lodash-es';
import type { Marker } from '~/base/models/map';

const { find } = useStrapi();

const config = useRuntimeConfig();
const route = useRoute();

// Parse initial page from URL query parameter
const initialPage = computed(() => {
  const pageParam = route.query.page;
  if (typeof pageParam === 'string') {
    const parsed = parseInt(pageParam, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }
  return 1;
});

const categoriesResponse = await find<Category>('categories', {
  sort: ['title:asc'],
});

const categoryOptions = ref(
  categoriesResponse.data?.map((category: Category) => category.title) || []
);

const categoryValue = ref<string[]>([]);

const districtsResponse = await find<District>('districts', {
  sort: ['name:asc'],
});

const districtsOptions = ref(
  districtsResponse.data?.map((district: District) => district.name) || []
);

const districtsValue = ref<string[]>([]);

// Parse initial filter values from URL (using names/titles)
const initialCategoryTitles = route.query.categories
  ? String(route.query.categories).split(',')
  : [];
const initialDistrictNames = route.query.districts
  ? String(route.query.districts).split(',')
  : [];

// Find initial filter objects by name/title
const initialCategories =
  categoriesResponse.data?.filter((p) =>
    initialCategoryTitles.includes(p.title)
  ) || [];
const initialDistricts =
  districtsResponse.data?.filter((d) =>
    initialDistrictNames.includes(d.name)
  ) || [];

// Set UI filter values from URL
if (initialCategories.length > 0) {
  categoryValue.value = initialCategories.map((p) => p.title);
}
if (initialDistricts.length > 0) {
  districtsValue.value = initialDistricts.map((d) => d.name);
}

const redactResourceLocation = computed(() => {
  if (resources.length === 0) return false;
  const resource = resources[0] as Resource;

  return (
    resource.address != null &&
    typeof resource.address.longitude === 'undefined' &&
    typeof resource.address.obfuscatedLongitude !== 'undefined'
  );
});

const resourcesResponse = await find<Resource>('resources', {
  populate: [
    'categories',
    'district',
    'prices',
    'images',
    'resourceTypes',
    'address',
    'user',
    'user.organization',
    // @ts-expect-errors – nested populate
    'attributes.attribute',
  ],
  filters: {
    categories:
      initialCategories.length > 0
        ? { id: { $in: initialCategories.map((p) => p.id) } }
        : undefined,
    district:
      initialDistricts.length > 0
        ? { id: { $in: initialDistricts.map((d) => d.id) } }
        : undefined,
  } as Record<string, unknown>,
  pagination: {
    page: initialPage.value,
    pageSize: 12,
    withCount: true,
  },
  sort: ['isPinned:desc', 'title:asc'],
});

const resources = resourcesResponse.data;
const paginationMeta = resourcesResponse.meta?.pagination;

const {
  state,
  mapResources,
  setPage,
  setSearchQuery,
  setSelectedCategories,
  setSelectedDistricts,
} = await useResourcesSearch(
  resources,
  12,
  paginationMeta,
  ['isPinned:desc', 'title:asc'],
  (paginationMeta && 'page' in paginationMeta ? paginationMeta.page : null) ??
    initialPage.value,
  true, // Enable URL syncing
  {
    categories: initialCategories.length > 0 ? initialCategories : null,
    districts: initialDistricts.length > 0 ? initialDistricts : null,
  }
);

const debouncedSetQuery = debounce((value: string) => {
  setSearchQuery(value);
}, 150);

const onChangeQuery = (value: string) => {
  debouncedSetQuery(value);
};

// Watch for filter changes and update the search
watch(
  [categoryValue, districtsValue],
  async () => {
    // Convert category names back to category objects
    const selectedCategoryObjects =
      categoriesResponse.data?.filter((category) =>
        categoryValue.value.includes(category.title)
      ) || [];

    // Convert district names back to district objects
    const selectedDistrictObjects =
      districtsResponse.data?.filter((district) =>
        districtsValue.value.includes(district.name)
      ) || [];

    // Update all filters without URL update first (to batch state changes)
    await setSelectedCategories(
      selectedCategoryObjects.length > 0 ? selectedCategoryObjects : null,
      false
    );

    // Last one triggers URL update with all filters combined
    await setSelectedDistricts(
      selectedDistrictObjects.length > 0 ? selectedDistrictObjects : null,
      true // This will update URL with all current filter state
    );
  },
  { deep: true }
);

// Watch for URL query changes (browser back/forward navigation)
watch(
  () => route.query.page,
  (newPage) => {
    const page = newPage ? parseInt(newPage as string) : 1;
    if (!isNaN(page) && page >= 1 && page !== state.value.pagination.page) {
      setPage(page, false); // Don't update URL again to avoid loop
    }
  }
);

// Watch for URL filter changes (browser back/forward navigation)
watch(
  () => [route.query.categories, route.query.districts],

  async (newFilters, oldFilters) => {
    // Only update if filters actually changed (not just page change)
    if (
      newFilters[0] === oldFilters?.[0] &&
      newFilters[1] === oldFilters?.[1]
    ) {
      return;
    }

    // Parse filter names/titles from URL
    const categoryTitles = route.query.categories
      ? String(route.query.categories).split(',')
      : [];

    const districtNames = route.query.districts
      ? String(route.query.districts).split(',')
      : [];

    // Find filter objects by name/title
    const categories =
      categoriesResponse.data?.filter((p) =>
        categoryTitles.includes(p.title)
      ) || [];

    const districts =
      districtsResponse.data?.filter((d) => districtNames.includes(d.name)) ||
      [];

    // Update UI filter values
    categoryValue.value = categories.map((p) => p.title);
    districtsValue.value = districts.map((d) => d.name);

    // Update state without triggering URL update
    await setSelectedCategories(
      categories.length > 0 ? categories : null,
      false
    );
    await setSelectedDistricts(districts.length > 0 ? districts : null, false);
  },
  { deep: true }
);

const mapRefreshKey = computed(() => {
  // Create a string unique to the current set of map resources.
  return mapResources.value.map((r) => r.id).join('-');
});

const resourceHasCoordinates = (resource: Resource): boolean => {
  if (!resource.address) return false;
  return redactResourceLocation.value
    ? !!(
        resource.address.obfuscatedLatitude &&
        resource.address.obfuscatedLongitude
      )
    : !!(resource.address.latitude && resource.address.longitude);
};

// The map is independent of the pagination: it shows every resource matching
// the current filters.
const resourcesWithAddress = computed(() =>
  (mapResources.value as readonly Resource[]).filter(resourceHasCoordinates)
);

const resourceMarkers = computed(() =>
  resourcesWithAddress.value.map(
    (resource) =>
      ({
        title: resource.title,
        point: [
          redactResourceLocation.value
            ? resource.address!.obfuscatedLatitude!
            : resource.address!.latitude!,
          redactResourceLocation.value
            ? resource.address!.obfuscatedLongitude!
            : resource.address!.longitude!,
        ],
      } satisfies Marker)
  )
);

useHead({
  title: () => $t('berlin_resources_index_title'),
});
</script>
