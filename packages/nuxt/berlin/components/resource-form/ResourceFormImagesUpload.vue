<template>
  <div class="flex flex-col gap-4 w-full">
    <UFileUpload
      multiple
      accept="image/*"
      color="neutral"
      label="Bilder zum Hochladen auswählen"
      variant="area"
      layout="list"
      class="raum-form-control w-full"
      @update:model-value="onFilesChange"
    >
      <template #description>
        <span v-if="!modelValue.length">
          {{ $t('resourceForm_uploadPlaceholder') }}
        </span>
        <span v-else>
          {{ $t('resourceForm_filesSelected', { count: modelValue.length }) }}
        </span>
      </template>
    </UFileUpload>
  </div>
</template>

<script setup lang="ts">
import { useFileUpload } from '~/berlin/composables/useFileUpload';
import type { UploadedFile } from './UploadedFile.js';

const props = defineProps<{
  modelValue: UploadedFile[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: UploadedFile[]];
}>();

const { onFilesChange } = useFileUpload({
  getList: () => props.modelValue,
  setList: (list: UploadedFile[]) => emit('update:modelValue', list),
});
</script>
