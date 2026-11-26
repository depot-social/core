<template>
  <div
    class="pb-16 md:pb-24"
    :style="backgroundColor ? { backgroundColor } : undefined"
  >
    <BerlinSubpageHeader v-if="subpage.header" :header="subpage.header" />

    <div class="flex flex-col gap-16 md:gap-28 mt-16 md:mt-28">
      <template v-for="section in subpage.sections ?? []" :key="sectionKey(section)">
        <BerlinSubpageTextSection
          v-if="section.__component === SubpageSectionComponent.TEXT_SECTION"
          :section="section"
        />
        <BerlinSubpageFaqs
          v-else-if="section.__component === SubpageSectionComponent.FAQS"
          :section="section"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  SubpageSectionComponent,
  type Subpage,
  type SubpageSection,
} from '@depot/shared';

const props = defineProps<{
  subpage: Subpage;
}>();

const backgroundColor = computed(
  () => props.subpage.header?.backgroundColor?.hex
);

const sectionKey = (section: SubpageSection) =>
  `${section.__component}-${section.id}`;
</script>
