<template>
  <header>
    <figure v-if="header.image">
      <NuxtImg
        :src="header.image.url"
        :alt="header.image.alternativeText || header.imageDescription || ''"
        width="1920"
        class="w-full h-[280px] md:h-[420px] xl:h-[560px] object-cover"
      />
      <figcaption
        v-if="header.imageDescription"
        class="subpage-caption px-6 md:px-12 mt-3"
      >
        {{ header.imageDescription }}
      </figcaption>
    </figure>

    <BerlinSubpageContainer
      v-if="header.label || header.headline || header.subline"
      class="pt-12 md:pt-20"
    >
      <BerlinSubpageLabel v-if="header.label">
        {{ header.label }}
      </BerlinSubpageLabel>

      <h1 v-if="header.headline" class="subpage-title whitespace-pre-line">
        {{ header.headline }}
      </h1>

      <p v-if="header.subline" class="subpage-lead whitespace-pre-line">
        {{ header.subline }}
      </p>
    </BerlinSubpageContainer>
  </header>
</template>

<script setup lang="ts">
import type { SubpageHeader } from '@depot/shared';

defineProps<{
  header: SubpageHeader;
}>();
</script>
