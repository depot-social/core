<template>
  <div class="flex flex-col gap-8 mb-12">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h3 class="text-xl">
        {{
          isLayer('berlin-raum')
            ? $t('berlin_resources_myRooms')
            : $t('berlin_resources_myResources')
        }}
      </h3>

      <div class="join">
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          :class="[
            'btn join-item',
            view === option.value ? 'btn-primary' : 'btn-info',
          ]"
          :aria-pressed="view === option.value"
          @click="view = option.value"
        >
          <i :class="['ph', option.icon]" aria-hidden="true" />
          {{ $t(option.label) }}
        </button>
      </div>
    </div>

    <div v-if="view === 'table'" class="flex flex-col gap-4">
      <UButton
        color="primary"
        variant="outline"
        icon="i-lucide-plus"
        class="self-start"
        :to="localePath('resources-add')"
      >
        {{ $t('berlin_resources_addNewRoom') }}
      </UButton>

      <UTable
        ref="table"
        v-model:pagination="pagination"
        :data="publishedResources"
        :columns="columns"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
      >
        <template #resource-cell="{ row }">
          <NuxtLinkLocale
            :to="{
              name: 'resources-slug',
              params: { slug: row.original.slug },
            }"
            class="flex items-center gap-3"
          >
            <NuxtImg
              v-if="row.original.images?.[0]?.url"
              :src="row.original.images[0].url"
              :alt="row.original.images[0].alternativeText ?? ''"
              width="48"
              height="48"
              class="size-12 rounded-lg object-cover"
            />
            <img
              v-else
              src="/placeholder.jpg"
              alt=""
              class="size-12 rounded-lg object-cover"
            />
            <span class="font-medium text-black">
              {{ row.original.title }}
            </span>
          </NuxtLinkLocale>
        </template>

        <template #updatedAt-cell="{ row }">
          {{ formatDate(row.original.updatedAt, 'dd.MM.yyyy HH:mm') }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end">
            <UButton
              icon="i-lucide-pencil"
              size="md"
              color="primary"
              variant="solid"
              class="p-2.5 h-max"
              :aria-label="$t('resourceEdit_title')"
              :to="getEditPath(row.original)"
            />
          </div>
        </template>
      </UTable>

      <div
        v-if="publishedResources.length > pagination.pageSize"
        class="flex justify-center border-t border-default pt-4"
      >
        <UPagination
          color="neutral"
          variant="ghost"
          active-color="neutral"
          active-variant="ghost"
          :page="pagination.pageIndex + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>

    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-6"
    >
      <UButton
        color="primary"
        variant="outline"
        class="w-auto aspect-square items-center flex rounded-[30px] leading-tight"
        :to="localePath('resources-add')"
      >
        {{ $t('berlin_resources_addNewRoom') }}
      </UButton>

      <div
        v-for="resource in publishedResources"
        :key="resource.id"
        class="relative"
      >
        <BerlinResourceCardSmall :resource="resource" />
        <UButton
          icon="i-lucide-pencil"
          size="lg"
          color="primary"
          variant="solid"
          class="absolute bottom-12 right-4 z-10 p-2.5 h-max"
          :aria-label="$t('resourceEdit_title')"
          :to="getEditPath(resource)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import type { TableColumn } from '@nuxt/ui';
import { getPaginationRowModel } from '@tanstack/vue-table';
import { defineProps } from 'vue';

const localePath = useLocalePath();
const { isLayer } = useActiveLayer();
const { formatDate } = useDateFormat();

type ResourceListView = 'grid' | 'table';

const viewOptions: { value: ResourceListView; icon: string; label: string }[] =
  [
    {
      value: 'grid',
      icon: 'ph-squares-four',
      label: 'berlin_resources_gridView',
    },
    { value: 'table', icon: 'ph-table', label: 'berlin_resources_tableView' },
  ];

const view = ref<ResourceListView>('grid');

const table = useTemplateRef('table');
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

type ResourceWithPublication = Resource & {
  documentId?: string | null;
  publishedAt?: string | null;
};

const getEditPath = (resource: ResourceWithPublication) => {
  return localePath({
    name: 'resources-slug-edit',
    params: {
      slug: resource.slug,
    },
  });
};

const props = defineProps<{
  resources: ResourceWithPublication[];
}>();

const publishedResources = computed(() => {
  const published = new Map<string, ResourceWithPublication>();

  for (const resource of props.resources) {
    if (!resource.publishedAt) continue;

    const key = resource.documentId || String(resource.id);

    // Keep the first published version of each document.
    if (!published.has(key)) {
      published.set(key, resource);
    }
  }

  return [...published.values()];
});

const columns: TableColumn<ResourceWithPublication>[] = [
  { id: 'resource', header: $t('resource') },
  { id: 'updatedAt', header: $t('berlin_resources_lastUpdated') },
  { id: 'actions', header: '' },
];
</script>
