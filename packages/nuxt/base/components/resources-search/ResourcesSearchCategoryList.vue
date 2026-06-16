<template>
  <ul
    class="pt-4 pb-2 flex flex-wrap gap-2 w-full items-center justify-center overflow-x-scroll"
  >
    <li
      v-if="displayReset && selectedCategory"
      class="bg-transparent sticky rounded-r-sm left-1 mr-[8px] pr-[8px] flex z-10"
    >
      <button
        class="btn btn-info flex drop-shadow"
        :title="$t('clearFilter')"
        @click="onCategorySelect(null)"
      >
        x
      </button>
    </li>
    <li class="font-text font-medium pr-4">
      {{ $t('categories') }}
    </li>
    <li
      v-for="category in categories"
      :key="category.id"
      :class="[
        'btn transition-all shadow-xs hover:shadow-md font-normal hover:btn-primary',
        category.id === selectedCategory?.id ? 'btn-primary' : 'btn-info',
      ]"
      :title="`Ressourcen mit Kategorie ${category.title} filtern`"
      @click="
        onCategorySelect(
          selectedCategory && category.id === selectedCategory.id
            ? null
            : category
        )
      "
    >
      {{ category.title }}
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Category } from '@depot/shared';

interface Props {
  categories: Category[];
  selectedCategory: Category | null;
  displayReset?: boolean;
}

interface Emits {
  (e: 'categorySelect', category: Category | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  displayReset: false,
});

const emit = defineEmits<Emits>();

const onCategorySelect = (category: Category | null) => {
  emit('categorySelect', category);
};
</script>
