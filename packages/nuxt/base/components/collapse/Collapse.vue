<template>
  <div>
    <div
      v-for="(item, i) in items"
      :key="i"
      :class="['collapse collapse-arrow', isStacked && 'collapse-stacked']"
    >
      <input
        type="radio"
        :name="`${name}-accordion`"
        :checked="i === checkedI"
        @change="onCheckItem(i)"
      />
      <div class="collapse-title">{{ item.title }}</div>
      <div class="collapse-content">
        <div v-html="markdownContent"></div>
        <NuxtLink
          v-if="item.linkPath && item.linkText"
          :to="item.linkPath"
          :class="['btn drop-shadow-lg btn-primary', item.linkClassnames]"
          tabindex="0"
        >
          {{ item.linkText }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { marked } from 'marked';

export interface CollapseItem {
  title: string;
  content: string;
  linkPath?: string | null;
  linkText?: string | null;
  linkClassnames?: string;
  illustration?: string | null;
}

interface Props {
  name: string;
  items: CollapseItem[];
  defaultActiveItem?: number;
  isStacked?: boolean;
  onChange?: (i: number) => void;
}

const props = withDefaults(defineProps<Props>(), {
  defaultActiveItem: 0,
  isStacked: false,
  onChange: () => {},
});

const markdownContent = computed(() => {
  return marked(props.items[props.defaultActiveItem]?.content ?? '');
});

const checkedI = ref<number>(props.defaultActiveItem);

const onCheckItem = (i: number) => {
  checkedI.value = i;
  props.onChange(i);
};
</script>
