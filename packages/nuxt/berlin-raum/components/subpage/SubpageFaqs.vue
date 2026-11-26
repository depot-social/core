<template>
  <!-- id="faq" is the target of the "FAQ" link in the header -->
  <BerlinSubpageContainer id="faq">
    <USeparator :ui="{ border: 'border-black' }" class="mb-6 md:mb-8" />

    <BerlinSubpageLabel v-if="section.label">
      {{ section.label }}
    </BerlinSubpageLabel>

    <h2 v-if="section.headline" class="subpage-headline whitespace-pre-line">
      {{ section.headline }}
    </h2>

    <UAccordion
      v-if="items.length > 0"
      :items="items"
      :ui="{
        root: 'border-t border-black mt-6 md:mt-10',
        item: 'border-b border-black last:border-b',
        trigger: 'py-4 md:py-5 text-base md:text-[20px] font-semibold leading-snug cursor-pointer',
        trailingIcon: 'size-6 text-black',
        body: 'pb-6',
      }"
    >
      <template #body="{ item }">
        <div class="subpage-richtext" v-html="item.content" />
      </template>
    </UAccordion>
  </BerlinSubpageContainer>
</template>

<script setup lang="ts">
import type { SubpageFaqsSection } from '@depot/shared';
import type { AccordionItem } from '@nuxt/ui';
import { marked } from 'marked';

const props = defineProps<{
  section: SubpageFaqsSection;
}>();

const items = computed<AccordionItem[]>(
  () =>
    props.section.faqs?.map((faq) => ({
      label: faq.question,
      value: faq.documentId,
      content: marked(faq.answer ?? '') as string,
    })) ?? []
);
</script>
