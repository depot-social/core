<template>
  <BerlinSubpageContainer>
    <USeparator :ui="{ border: 'border-black' }" class="mb-6 md:mb-8" />

    <BerlinSubpageLabel v-if="section.label">
      {{ section.label }}
    </BerlinSubpageLabel>

    <h2 v-if="section.headline" class="subpage-headline whitespace-pre-line">
      {{ section.headline }}
    </h2>

    <div
      v-if="contentHtml"
      class="subpage-richtext mt-6 md:mt-10"
      v-html="contentHtml"
    />

    <div v-if="section.callToAction" class="mt-8 md:mt-10">
      <BaseButton
        rounded
        :to="section.callToAction.url"
        :target="isExternal ? '_blank' : undefined"
        :trailing-icon="isExternal ? 'i-lucide-arrow-up-right' : undefined"
      >
        {{ section.callToAction.text }}
      </BaseButton>

      <p v-if="section.callToAction.hint" class="subpage-caption mt-3">
        {{ section.callToAction.hint }}
      </p>
    </div>
  </BerlinSubpageContainer>
</template>

<script setup lang="ts">
import type { SubpageTextSection } from '@depot/shared';
import { marked } from 'marked';

const props = defineProps<{
  section: SubpageTextSection;
}>();

const contentHtml = computed(() =>
  props.section.content ? marked(props.section.content) : ''
);

const isExternal = computed(() =>
  /^https?:\/\//.test(props.section.callToAction?.url ?? '')
);
</script>
