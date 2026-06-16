<template>
  <UInput
    v-model="displayValue"
    inputmode="decimal"
    autocomplete="off"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: number | null | undefined;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const displayValue = ref('');

const normalizeNumber = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
};

const parseMoneyInput = (raw: string): number | null => {
  const sanitized = raw.replace(/[^\d,.-]/g, '').trim();
  if (!sanitized) {
    return null;
  }

  const hasComma = sanitized.includes(',');
  const hasDot = sanitized.includes('.');

  let normalized = sanitized;

  if (hasComma && hasDot) {
    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';

    normalized =
      decimalSeparator === ','
        ? sanitized.replace(/\./g, '').replace(',', '.')
        : sanitized.replace(/,/g, '');
  } else if (hasComma) {
    normalized = sanitized.replace(',', '.');
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return normalizeNumber(parsed);
};

const formatCurrency = (value: number): string => {
  return currencyFormatter.format(normalizeNumber(value)).replace(/\s*€/u, '€');
};

const formatDecimal = (value: number): string => {
  return decimalFormatter.format(normalizeNumber(value));
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue == null || Number.isNaN(newValue)) {
      displayValue.value = '';
      return;
    }

    displayValue.value = formatCurrency(newValue);
  },
  { immediate: true }
);

const onFocus = () => {
  if (props.modelValue == null || Number.isNaN(props.modelValue)) {
    displayValue.value = '';
    return;
  }

  displayValue.value = formatDecimal(props.modelValue);
};

const onBlur = () => {
  const parsedValue = parseMoneyInput(displayValue.value);
  emit('update:modelValue', parsedValue);
  displayValue.value = parsedValue == null ? '' : formatCurrency(parsedValue);
};
</script>
