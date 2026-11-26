<template>
  <!--
    Nuxt UI's UButton has no `rounded` prop, so this thin wrapper adds one.
    All other props, attributes and slots are passed through to UButton.
  -->
  <UButton :class="rounded && 'rounded-full'">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </UButton>
</template>

<script setup lang="ts">
defineProps<{
  /** Fully rounded (pill shaped) button */
  rounded?: boolean;
}>();
</script>
