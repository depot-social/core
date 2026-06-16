<template>
  <div ref="container" class="relative" @keydown.esc.prevent="onEscape">
    <BaseResourcesSearchInput
      :query="query"
      :listbox-id="listboxId"
      @focus="open = true"
      @change-query="onChangeQuery"
      @blur="onBlur"
    />
    <BaseResourcesSearchResults
      v-if="open && (query.length > 0 || state.loading)"
      :id="listboxId"
      :resources="resourcesForList"
      :loading="state.loading"
      :error="state.error"
    />
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import { debounce, random } from 'lodash-es';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const listboxId = `resources-search-${random(9999, 99999)}`;

const query = ref('');
const open = ref(false);
const containerRef = useTemplateRef('container');

const { state, setSearchQuery } = await useResourcesSearch([], 10);
const resourcesForList = computed(
  () => state.value.resources as unknown as readonly Resource[]
);

const debouncedSetQuery = debounce((value: string) => {
  setSearchQuery(value);
}, 150);

const onChangeQuery = (value: string) => {
  query.value = value;
  open.value = true;
  debouncedSetQuery(value);
};

const onEscape = () => {
  open.value = false;
};

const onBlur = (event: FocusEvent) => {
  const related = event.relatedTarget as Node | null;
  if (containerRef.value && related && containerRef.value.contains(related)) {
    return;
  }
  open.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (!containerRef.value) return;
  if (!containerRef.value.contains(event.target as Node)) {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
