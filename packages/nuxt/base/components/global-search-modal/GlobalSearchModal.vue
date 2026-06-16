<template>
  <dialog id="global-search-modal" ref="modal" class="modal">
    <div
      class="modal-box bg-white w-[90vw] lg:w-full lg:max-w-[50vw] overflow-x-hidden"
    >
      <div class="relative w-full">
        <div class="flex justify-between pb-10">
          <span class="text-xl">{{ $t('search') }}</span>
          <form method="dialog">
            <button
              class="btn btn-circle btn-ghost"
              :aria-label="$t('closeWindow')"
              @click="onClickResults"
            >
              ✕
            </button>
          </form>
        </div>
        <div class="relative">
          <ResourcesSearchInput
            :query="query"
            :listbox-id="listboxId"
            @change-query="onChangeQuery"
          />
        </div>
        <ul
          tabindex="0"
          class="gap-1 z-[1] menu p-0 pt-4 lg:pt-6 rounded-box w-full"
          @click="onClickResults"
        >
          <ResourcesSearchResults
            :id="listboxId"
            :resources="state.resources"
            :loading="state.loading"
            :error="state.error"
            :query="query"
            :container-class="'gap-1 z-[1] menu pt-6 bg-white rounded-box w-full'"
          />
        </ul>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { debounce, random } from 'lodash-es';
import { ref } from 'vue';
import ResourcesSearchInput from '~/base/components/resources-search/resources-search-input.vue';
import ResourcesSearchResults from '~/base/components/resources-search/resources-search-results.vue';
import { useResourcesSearch } from '~/base/composables/useResourcesSearch';

const modal = useTemplateRef('modal');

const listboxId = `global-search-${random(9999, 99999)}`;

const { state, setSearchQuery } = await useResourcesSearch([], 10);
const query = ref('');

const debouncedSetQuery = debounce((value: string) => {
  setSearchQuery(value);
}, 150);

const onChangeQuery = (value: string) => {
  query.value = value;
  debouncedSetQuery(value);
};

const onClickResults = () => {
  if (!modal.value) return;
  modal.value.close();
};
</script>
