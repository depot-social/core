<template>
  <div>
    <section
      class="relative z-10 flex px-6 py-6 md:py-8 bg-very-bright-gray min-h-[500px] sm:min-h-[360px] md:min-h-[510px] xl:min-h-[560px]"
    >
      <div class="flex flex-col w-full">
        <h1
          class="font-bold! leading-none tracking-tight text-[42px]! md:text-[96px]!"
        >
          Raum für <br />
          Engagement
        </h1>

        <div
          class="sm:relative sm:z-10 mt-auto text-xl grid sm:grid-cols-[repeat(2,minmax(260px,1fr))] max-w-[720px] gap-4"
        >
          <BerlinResourcesSearchFilterDropdown
            v-model="purposesValue"
            :items="purposesOptions"
            :multiple="false"
            :class="'bg-[#F7BBCB]'"
            :bg-color="'#F7BBCB'"
            placeholder="Was hast du vor?"
          />
          <BerlinResourcesSearchFilterDropdown
            v-model="districtsValue"
            :items="districtsOptions"
            :multiple="false"
            :class="'bg-[#BAB0D8]'"
            :bg-color="'#BAB0D8'"
            placeholder="Bezirk"
          />
          <BerlinResourcesSearchInput
            class="order-last sm:order-none box-content"
            :query="state.searchQuery"
            @change-query="onChangeQuery"
          />
          <BerlinResourcesSearchFilterDropdown
            v-model="accessibilityStateValue"
            :items="accessibilityStateOptions"
            :multiple="false"
            :class="'bg-[#95DAFC]'"
            :bg-color="'#95DAFC'"
            placeholder="Barriereangaben"
          />
        </div>
      </div>

      <figure
        class="absolute right-6 md:right-12 xl:right-16 top-6 lg:top-auto lg:bottom-8"
      >
        <svg
          class="h-[150px] md:h-[298px] lg:h-[340px] xl:h-[470px] aspect-[317/497]"
          aria-hidden="true"
        >
          <use href="/illustrations/thumbs-up.svg#fragment" />
        </svg>
      </figure>
    </section>

    <section id="resources" class="flex flex-col gap-4">
      <div
        class="bg-white py-6 md:py-8 transition-all"
        :class="state.loading && 'opacity-40'"
      >
        <div class="px-4 sm:px-6 mb-5">
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
                  : purposesValue.length > 0 ||
                    districtsValue.length > 0 ||
                    accessibilityStateValue.length > 0 ||
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
              v-if="
                purposesValue.length > 0 ||
                districtsValue.length > 0 ||
                accessibilityStateValue.length > 0
              "
            >
              <template v-if="state.searchQuery">
                <span>&</span>
              </template>

              <template v-if="purposesValue.length > 0">
                <template v-if="!state.searchQuery">
                  {{ $t('berlin_for') }}
                </template>

                <span
                  class="font-semibold text-black inline-flex items-center bg-very-bright-gray px-1.5 py-0.5 rounded"
                >
                  {{ purposesValue.join(', ') }}
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

              <template v-if="accessibilityStateValue.length > 0">
                <span>
                  {{
                    state.pagination.total === 1
                      ? $t('berlin_is')
                      : $t('berlin_are')
                  }}
                </span>
              </template>

              <template v-if="accessibilityStateValue.length > 0">
                <span
                  class="font-semibold text-black inline-flex items-center bg-very-bright-gray px-1.5 py-0.5 rounded"
                >
                  {{ accessibilityStateValue[0]?.label }}
                </span>
              </template>
            </template>

            <template
              v-if="
                purposesValue.length > 0 ||
                districtsValue.length > 0 ||
                accessibilityStateValue.length > 0 ||
                state.searchQuery
              "
            >
              <UButton
                class="w-max md:ml-1.5"
                @click="
                  purposesValue = [];
                  districtsValue = [];
                  accessibilityStateValue = [];
                  setSearchQuery('');
                  $router.push({ query: {} });
                "
              >
                {{ $t('berlin_resources_resetToInitialState') }}
              </UButton>
            </template>
          </p>
        </div>

        <BerlinResourcesSearchPagination :state="state" :set-page="setPage" />

        <div
          class="flex gap-8 md:gap-4 px-4 sm:px-6 flex-col lg:grid lg:grid-cols-[1fr_341px] 2xl:grid-cols-[1fr_440px]"
        >
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
            class-names="hidden md:block order-2 rounded-[30px] md:sticky top-[20px] h-[250px] md:h-[calc(100vh-40px)] w-full h-[560px]! lg:h-[calc(100vh-42px)]!"
          >
            <div v-if="resourcesWithAddress[index]">
              <BaseResourceMapResourceMarker
                :resource="resourcesWithAddress[index]"
              />
            </div>
          </BaseLeafletMap>

          <aside
            v-else
            class="hidden md:grid place-items-center order-2 rounded-[30px] md:sticky top-[20px] h-[560px] lg:h-[calc(100vh-42px)] w-full bg-neutral-50 border-2 border-dashed border-neutral-200"
          >
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

          <div
            v-else
            class="basis-full md:basis-2/3 2xl:basis-2/3 grid gap-x-5 gap-y-8 content-start grid-cols-[repeat(auto-fill,minmax(100%,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(295px,1fr))]"
          >
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
import type {
  AccessibilityState,
  BerlinResourceType,
  District,
  Purpose,
  Resource,
} from '@depot/shared';
import {
  getAccessibilityText,
  getResourceType,
  ResourceTypeComponent,
} from '@depot/shared';
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

const districtsResponse = await find<District>('districts', {
  sort: ['name:asc'],
});

const districtsOptions = ref(
  districtsResponse.data?.map((district: District) => district.name) || []
);

const districtsValue = ref<string[]>([]);

const purposesResponse = await find<Purpose>('purposes', {
  sort: ['title:asc'],
});

const purposesOptions = ref(
  purposesResponse.data?.map((purpose: Purpose) => purpose.title) || []
);

const purposesValue = ref<string[]>([]);

// Parse initial filter values from URL (using names/titles)
const initialPurposeTitles = route.query.purposes
  ? String(route.query.purposes).split(',')
  : [];
const initialDistrictNames = route.query.districts
  ? String(route.query.districts).split(',')
  : [];
const initialAccessibilityStates = route.query.accessibility
  ? (String(route.query.accessibility).split(',') as AccessibilityState[])
  : [];

// Find initial filter objects by name/title
const initialPurposes =
  purposesResponse.data?.filter((p) =>
    initialPurposeTitles.includes(p.title)
  ) || [];
const initialDistricts =
  districtsResponse.data?.filter((d) =>
    initialDistrictNames.includes(d.name)
  ) || [];

// Set UI filter values from URL
if (initialPurposes.length > 0) {
  purposesValue.value = initialPurposes.map((p) => p.title);
}
if (initialDistricts.length > 0) {
  districtsValue.value = initialDistricts.map((d) => d.name);
}

const accessibilityStateOptions = ref<
  Array<{ label: string; value: AccessibilityState }>
>([
  { label: getAccessibilityText('accessible') ?? '', value: 'accessible' },
  {
    label: getAccessibilityText('partly_accessible') ?? '',
    value: 'partly_accessible',
  },
  // {
  //   label: getAccessibilityText('not_accessible') ?? '',
  //   value: 'not_accessible',
  // },
]);

const accessibilityStateValue = ref<
  Array<{ label: string; value: AccessibilityState }>
>([]);

// Set UI accessibility filter value from URL
if (initialAccessibilityStates.length > 0) {
  accessibilityStateValue.value = accessibilityStateOptions.value.filter(
    (opt) => initialAccessibilityStates.includes(opt.value)
  );
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

// When accessibility filter is set, we need to fetch all resources and filter client-side
const needsClientSideAccessibilityFilter =
  initialAccessibilityStates.length > 0;

const resourcesResponse = await find<Resource>('resources', {
  populate: [
    'purposes',
    'district',
    'prices',
    'images',
    'resourceTypes',
    'address',
    // @ts-expect-errors – nested populate
    'attributes.attribute',
  ],
  filters: {
    purposes:
      initialPurposes.length > 0
        ? { id: { $in: initialPurposes.map((p) => p.id) } }
        : undefined,
    district:
      initialDistricts.length > 0
        ? { id: { $in: initialDistricts.map((d) => d.id) } }
        : undefined,
  } as Record<string, unknown>,
  pagination: needsClientSideAccessibilityFilter
    ? {
        page: 1,
        pageSize: 1000,
        withCount: true,
      }
    : {
        page: initialPage.value,
        pageSize: 12,
        withCount: true,
      },
  sort: ['isPinned:desc', 'title:asc'],
});

// Apply client-side accessibility filter if needed
let resources = resourcesResponse.data;
let paginationMeta = resourcesResponse.meta?.pagination;

if (needsClientSideAccessibilityFilter && resources) {
  // Filter by accessibility state
  const filteredResources = resources.filter((resource) => {
    const berlinResourceType = getResourceType(
      resource.resourceTypes ?? [],
      ResourceTypeComponent.BERLIN_RESOURCE_TYPE
    ) as BerlinResourceType | undefined;

    return (
      berlinResourceType &&
      initialAccessibilityStates.includes(berlinResourceType.accessibilityState)
    );
  });

  // Client-side pagination
  const total = filteredResources.length;
  const pageSize = 12;
  const pageCount = Math.ceil(total / pageSize) || 1;
  const page = Math.min(initialPage.value, pageCount);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  resources = filteredResources.slice(startIndex, endIndex);
  paginationMeta = {
    page,
    pageSize,
    pageCount,
    total,
  };
}

const {
  state,
  setPage,
  setSearchQuery,
  setSelectedPurposes,
  setSelectedDistricts,
  setSelectedAccessibilityStates,
} = await useResourcesSearch(
  resources,
  12,
  paginationMeta,
  ['isPinned:desc', 'title:asc'],
  (paginationMeta && 'page' in paginationMeta ? paginationMeta.page : null) ??
    initialPage.value,
  true, // Enable URL syncing
  {
    purposes: initialPurposes.length > 0 ? initialPurposes : null,
    districts: initialDistricts.length > 0 ? initialDistricts : null,
    accessibilityStates:
      initialAccessibilityStates.length > 0 ? initialAccessibilityStates : null,
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
  [purposesValue, districtsValue, accessibilityStateValue],
  async () => {
    // Convert purpose names back to purpose objects
    const selectedPurposeObjects =
      purposesResponse.data?.filter((purpose) =>
        purposesValue.value.includes(purpose.title)
      ) || [];

    // Convert district names back to district objects
    const selectedDistrictObjects =
      districtsResponse.data?.filter((district) =>
        districtsValue.value.includes(district.name)
      ) || [];

    // Update all filters without URL update first (to batch state changes)
    await setSelectedPurposes(
      selectedPurposeObjects.length > 0 ? selectedPurposeObjects : null,
      false
    );

    await setSelectedDistricts(
      selectedDistrictObjects.length > 0 ? selectedDistrictObjects : null,
      false
    );

    // Last one triggers URL update with all filters combined
    await setSelectedAccessibilityStates(
      accessibilityStateValue.value.length > 0
        ? accessibilityStateValue.value.map((item) => item.value)
        : null,
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
  () => [
    route.query.purposes,
    route.query.districts,
    route.query.accessibility,
  ],

  async (newFilters, oldFilters) => {
    // Only update if filters actually changed (not just page change)
    if (
      newFilters[0] === oldFilters?.[0] &&
      newFilters[1] === oldFilters?.[1] &&
      newFilters[2] === oldFilters?.[2]
    ) {
      return;
    }

    // Parse filter names/titles from URL
    const purposeTitles = route.query.purposes
      ? String(route.query.purposes).split(',')
      : [];

    const districtNames = route.query.districts
      ? String(route.query.districts).split(',')
      : [];

    const accessibilityStates = route.query.accessibility
      ? (String(route.query.accessibility).split(',') as AccessibilityState[])
      : [];

    // Find filter objects by name/title
    const purposes =
      purposesResponse.data?.filter((p) => purposeTitles.includes(p.title)) ||
      [];

    const districts =
      districtsResponse.data?.filter((d) => districtNames.includes(d.name)) ||
      [];

    // Update UI filter values
    purposesValue.value = purposes.map((p) => p.title);
    districtsValue.value = districts.map((d) => d.name);
    accessibilityStateValue.value = accessibilityStateOptions.value.filter(
      (opt) => accessibilityStates.includes(opt.value)
    );

    // Update state without triggering URL update
    await setSelectedPurposes(purposes.length > 0 ? purposes : null, false);
    await setSelectedDistricts(districts.length > 0 ? districts : null, false);
    await setSelectedAccessibilityStates(
      accessibilityStates.length > 0 ? accessibilityStates : null,
      false
    );
  },
  { deep: true }
);

const mapRefreshKey = computed(() => {
  // Create a string unique to the current set of paginated results
  // Includes page number to force refresh on pagination
  return `${state.value.pagination.page}-${state.value.resources
    .map((r) => r.id)
    .join('-')}`;
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

const resourcesWithAddress = computed(() =>
  (state.value.resources as readonly Resource[]).filter(resourceHasCoordinates)
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
