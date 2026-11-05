<template>
  <div v-if="canConfirm || canCancel" class="flex flex-wrap gap-4 mt-6">
    <UButton
      v-if="canConfirm"
      :disabled="submitting"
      :loading="submitting"
      @click="$emit('confirm')"
    >
      {{ $t('confirmBooking') }}
    </UButton>
    <UButton
      v-if="canCancel"
      variant="outline"
      :disabled="submitting"
      @click="$emit('cancel')"
    >
      {{ $t('cancelBooking') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{ canConfirm: boolean; canCancel: boolean; submitting: boolean }>();
defineEmits<{ confirm: []; cancel: [] }>();
</script>
