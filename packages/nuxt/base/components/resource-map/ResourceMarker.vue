<template>
  <div class="flex flex-col gap-2">
    <span class="text-lg font-bold">{{ resource.title }}</span>
    <p v-if="resource.address" class="text-gray-800">
      <span v-if="resource.address.street"
        >{{ resource.address.street }}<br
      /></span>
      {{ resource.address.zip }} {{ resource.address.place }}
    </p>
    <NuxtLinkLocale
      v-if="withLink"
      :to="{ name: 'resources-slug', params: { slug: resource.slug } }"
      class="btn btn-primary"
      >{{ $t('viewResource') }}</NuxtLinkLocale
    >
  </div>
</template>

<script lang="ts" setup>
import type { Resource } from '@depot/shared';

type Props = {
  resource: Resource;
  withLink?: boolean;
};

withDefaults(defineProps<Props>(), {
  withLink: true,
});
</script>
