<template>
  <div class="relative h-full">
    <input
      ref="inputRef"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="listboxId"
      role="combobox"
      type="text"
      :placeholder="$t('berlin_discoverResources')"
      class="resources-search-input"
      :value="query"
      @input="onInput"
      @focus="$emit('focus')"
      @keydown.esc.prevent.stop="$emit('escape')"
      @blur="$emit('blur', $event)"
    />

    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      class="absolute top-1/2 translate-y-[-50%] left-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M27.0354 25.6213L19.4833 18.0692C21.298 15.8906 22.2029 13.0962 22.0098 10.2673C21.8167 7.43847 20.5404 4.79297 18.4465 2.88116C16.3525 0.969357 13.6021 -0.0615693 10.7674 0.00284666C7.9327 0.0672626 5.23196 1.22206 3.22701 3.22701C1.22206 5.23196 0.0672626 7.9327 0.00284666 10.7674C-0.0615693 13.6021 0.969357 16.3525 2.88116 18.4465C4.79297 20.5404 7.43847 21.8167 10.2673 22.0098C13.0962 22.2029 15.8906 21.298 18.0692 19.4833L25.6213 27.0354L27.0354 25.6213ZM2.03539 11.0354C2.03539 9.25536 2.56323 7.5153 3.55217 6.03526C4.5411 4.55522 5.94671 3.40167 7.59124 2.72048C9.23578 2.03929 11.0454 1.86106 12.7912 2.20833C14.537 2.55559 16.1407 3.41276 17.3994 4.67143C18.658 5.9301 19.5152 7.53375 19.8625 9.27958C20.2097 11.0254 20.0315 12.835 19.3503 14.4795C18.6691 16.1241 17.5156 17.5297 16.0355 18.5186C14.5555 19.5076 12.8154 20.0354 11.0354 20.0354C8.64926 20.0327 6.36161 19.0837 4.67436 17.3964C2.9871 15.7092 2.03804 13.4215 2.03539 11.0354Z"
        fill="black"
      />
    </svg>

    <button
      class="absolute top-1/2 translate-y-[-50%] right-4 text-xl text-gray-800"
      type="button"
      @click="onResetSearch()"
      v-if="query.length >= 1"
    >
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { random } from 'lodash-es';

interface Props {
  query: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'change-query', value: string): void;
  (e: 'focus'): void;
  (e: 'escape'): void;
  (e: 'blur', ev: FocusEvent): void;
}>();

const listboxId = `resources-search-${random(9999, 99999)}`;

const inputRef = ref<HTMLInputElement | null>(null);
const open = ref(false);

watch(
  () => props.query,
  () => {
    open.value = true;
  }
);

const onInput = (ev: Event) => {
  const value = (ev.target as HTMLInputElement).value;
  emit('change-query', value);
};

const onResetSearch = () => {
  open.value = false;
  emit('change-query', '');
};
</script>
