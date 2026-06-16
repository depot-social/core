<template>
  <article
    class="group aspect-square rounded-[30px] shadow-lg duration-300"
    :class="{ 'pointer-events-none opacity-50 cursor-not-allowed': disabled }"
  >
    <NuxtLinkLocale
      :to="{ name: 'resources-slug', params: { slug: resource.slug } }"
      class="flex h-full flex-col gap-6"
    >
      <div
        class="relative w-full rounded-[30px] shrink-0 overflow-hidden aspect-square bg-[#D9D9D9]"
      >
        <NuxtImg
          v-if="resourceImages && resourceImages[0]?.url"
          :src="resourceImages[0].url"
          :width="imageSize"
          :height="imageSize"
          :alt="resourceImages[0].alternativeText ?? ''"
          class="object-cover aspect-square object-center w-full h-full"
        />

        <figure class="relative grid place-content-center h-full" v-else>
          <span
            class="relative z-[1] px-2 tracking-[-2%] font-semibold text-lg bg-white border-2 border-black rounded-md"
            >{{ $t('berlin_resource_exampleImage') }}</span
          >
          <img
            src="/placeholder.jpg"
            class="absolute inset-0 object-cover aspect-square object-center w-full h-full"
            :alt="$t('berlin_resource_exampleImage')"
          />
        </figure>
      </div>
    </NuxtLinkLocale>
  </article>

  <div
    v-if="berlinResourceType?.roomName"
    class="mt-2.5 font-medium text-base leading-tight"
  >
    {{ berlinResourceType.roomName }}
  </div>
</template>

<script setup lang="ts">
import type { BerlinResourceType, Resource } from '@depot/shared';
import { getResourceType, ResourceTypeComponent } from '@depot/shared';
import { computed } from 'vue';

interface Props {
  resource: Resource;
  imageSize?: number;
  disabled: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  imageSize: 365,
});

const resourceImages = computed(() => props.resource.images ?? []);

const berlinResourceType = computed(() => {
  return getResourceType(
    props.resource.resourceTypes ?? [],
    ResourceTypeComponent.BERLIN_RESOURCE_TYPE
  ) as BerlinResourceType | undefined;
});
</script>
