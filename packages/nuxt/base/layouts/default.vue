<template>
  <div>
    <BaseHeader />
    <BaseToasts />
    <main>
      <slot />
    </main>
    <BaseFooter />
  </div>
</template>

<script setup lang="ts">
// Default layout with Header, Toasts, and footer
import '@phosphor-icons/web/fill';
import '@phosphor-icons/web/regular';
</script>
