<template>
  <div class="toast toast-top toast-center z-50">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['alert', `alert-${toast.type || 'info'}`]"
    >
      <strong v-if="toast.title">{{ toast.title }}</strong>
      <span v-if="toast.description">{{ toast.description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toasts } = useToast();
</script>
