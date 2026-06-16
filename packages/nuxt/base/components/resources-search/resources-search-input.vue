<template>
  <div class="relative">
    <input
      ref="inputRef"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="listboxId"
      role="combobox"
      type="text"
      :placeholder="$t('discoverResources')"
      class="resources-search-input"
      :value="query"
      @input="onInput"
      @focus="$emit('focus')"
      @keydown.esc.prevent.stop="$emit('escape')"
      @blur="$emit('blur', $event)"
    />
    <i
      class="ph ph-magnifying-glass absolute top-1/2 translate-y-[-50%] left-4 text-xl text-gray-800"
    ></i>
    <button
      class="ph ph-x absolute top-1/2 translate-y-[-50%] right-[20px] text-xl text-gray-800 cursor-pointer"
      type="button"
      @click="onResetSearch()"
      v-if="query.length >= 1"
    ></button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  query: string;
  listboxId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'change-query', value: string): void;
  (e: 'focus'): void;
  (e: 'escape'): void;
  (e: 'blur', ev: FocusEvent): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const open = ref(false);

watch(
  () => props.query,
  () => {
    open.value = true;
  }
);

const onInput = (ev: Event) => {
  const value = (ev.target as HTMLInputElement).value;
  emit('change-query', value);
};

const onResetSearch = () => {
  open.value = false;
  emit('change-query', '');
};
</script>
