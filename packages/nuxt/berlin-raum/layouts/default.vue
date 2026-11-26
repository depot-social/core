<template>
  <div>
    <BerlinHeader />
    <BaseToasts />
    <main>
      <slot />
    </main>
    <BerlinFaq v-if="route.meta.layoutFaq !== false" />
    <BerlinFooter />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>
