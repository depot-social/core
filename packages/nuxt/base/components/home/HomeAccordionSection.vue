<template>
  <section class="container mt-10 flex flex-col lg:flex-row">
    <div class="basis-6/12 text-center px-12 lg:order-2">
      <BaseIllustration
        v-if="activeCollapseItemIllustration"
        :key="activeCollapseItem"
        :illustration="activeCollapseItemIllustration"
      />
    </div>
    <div class="flex flex-col gap-3 basis-6/12">
      <span class="text-base font-medium text-primary">
        {{ homepage?.accordionSectionIntroLine ?? '' }}
      </span>
      <h2 class="text-2xl">{{ homepage?.accordionSectionHeadline ?? '' }}</h2>
      <p
        v-if="homepage?.accordionSectionDescription"
        v-html="homepage?.accordionSectionDescription"
      />
      <div class="mt-8">
        <BaseCollapse
          name="resource-faq"
          :items="collapseItems"
          :default-active-item="activeCollapseItem"
          @change="onChangeActiveCollapseItem"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SingleTypeHomepage } from '@depot/shared';
import { marked } from 'marked';
import { computed, ref } from 'vue';

interface StrapiMedia {
  id: number;
  url: string;
  width: number;
  height: number;
  alternativeText?: string | null;
  caption?: string | null;
  name: string;
  mime: string;
  size: number;
  ext: string;
  hash: string;
  src: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface CollapseItem {
  title: string;
  content: string;
  linkPath?: string | null;
  linkText?: string | null;
  illustration?: StrapiMedia | null;
}

interface Props {
  homepage?: SingleTypeHomepage;
}

const props = defineProps<Props>();

const activeCollapseItem = ref<number>(0);

const onChangeActiveCollapseItem = (i: number) => {
  activeCollapseItem.value = i;
};

const collapseItems = computed<CollapseItem[]>(() => {
  if (!props.homepage) return [];

  return props.homepage.accordionAccordion.accordionItems.map(
    (accordionItem) => ({
      title: accordionItem.title,
      content: accordionItem.description
        ? marked(accordionItem.description)
        : '',
      linkPath: accordionItem.linkPath,
      linkText: accordionItem.linkText,
      illustration: accordionItem.illustration, // Now properly typed as StrapiMedia
    })
  );
});

// Computed property to get the active collapse item's illustration
const activeCollapseItemIllustration = computed(() => {
  if (!collapseItems.value || !collapseItems.value[activeCollapseItem.value]) {
    return null;
  }

  const item = collapseItems.value[activeCollapseItem.value];
  return item.illustration || null;
});
</script>
