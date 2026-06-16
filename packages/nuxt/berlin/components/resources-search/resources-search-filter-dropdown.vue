<template>
  <div
    ref="dropdownRef"
    class="w-full relative inline-block rounded-lg border-2 border-black"
    :class="{
      active: isOpen,
      'rounded-b-none border-b-transparent': isOpen,
      'bg-transparent!': !isOpen,
    }"
  >
    <button
      class="dropdown-toggle whitespace-nowrap rounded-lg user-select-none w-full px-4 py-2.5 text-left text-lg md:text-2lg font-medium"
      type="button"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      @click="toggleDropdown"
      @keydown.escape="closeDropdown"
    >
      <span>{{ displayLabel }}</span>
    </button>

    <div
      v-if="isOpen"
      class="dropdown-options w-full box-content -left-0.5"
      role="group"
      :aria-label="`${placeholder} options`"
      :class="{
        'border-2 border-black border-t-0 rounded-b-lg': isOpen,
      }"
    >
      <label
        v-for="item in sortedItems"
        :key="String(getItemValue(item))"
        class="form-control"
      >
        <input
          :type="multiple ? 'checkbox' : 'radio'"
          :name="multiple ? undefined : radioGroupName"
          :value="getItemValue(item)"
          :checked="isSelected(getItemValue(item))"
          :aria-checked="isSelected(getItemValue(item))"
          @change="handleInputChange(getItemValue(item))"
        />
        <span>{{ getItemLabel(item) }}</span>
      </label>
      <button
        v-if="!multiple && hasSelection"
        class="text-2lg font-medium px-4 py-2 border-t-2 border-black w-full cursor-pointer"
        type="button"
        @click.stop="handleReset"
      >
        Zurücksetzen
      </button>
    </div>

    <!-- Screen reader announcements -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ announcement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type ItemType = string | Record<string, unknown>;

interface Props {
  items: ItemType[];
  modelValue: ItemType[];
  placeholder?: string;
  optionAttribute?: string;
  valueAttribute?: string;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select options',
  optionAttribute: 'label',
  valueAttribute: 'value',
  multiple: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: ItemType[]];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const announcement = ref('');

// Unique name for radio group (for single select mode)
const radioGroupName = computed(
  () => `radio-group-${Math.random().toString(36).substring(7)}`
);

// Check if there's any selection
const hasSelection = computed(() => props.modelValue.length > 0);

// Sort items alphabetically by label
const sortedItems = computed(() => {
  const items = [...props.items];
  return items.sort((a, b) => {
    const labelA = getItemLabel(a);
    const labelB = getItemLabel(b);
    return labelA.localeCompare(labelB, 'de', { sensitivity: 'base' });
  });
});

// Get value from item (handles both string arrays and object arrays)
const getItemValue = (item: ItemType): string | number | unknown => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    return item[props.valueAttribute];
  }
  return item;
};

// Get label from item (handles both string arrays and object arrays)
const getItemLabel = (item: ItemType): string => {
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item !== null) {
    return String(
      item[props.optionAttribute] || item[props.valueAttribute] || item
    );
  }
  return String(item);
};

// Check if item is selected
const isSelected = (value: string | number | unknown): boolean => {
  return props.modelValue.some((selected) => {
    if (typeof selected === 'object' && selected !== null) {
      return selected[props.valueAttribute] === value;
    }
    return selected === value;
  });
};

// Display label for the toggle button
const displayLabel = computed(() => {
  const selectedCount = props.modelValue.length;

  if (selectedCount === 0) {
    return props.placeholder;
  } else if (selectedCount === 1) {
    return `${props.placeholder} (1)`;
    // const firstSelected = props.modelValue[0];
    // if (firstSelected) {
    //   const selectedItem = sortedItems.value.find(
    //     (item) => getItemValue(item) === getItemValue(firstSelected)
    //   );
    //   return selectedItem ? getItemLabel(selectedItem) : props.placeholder;
    // }
  } else {
    return `${props.placeholder} (${selectedCount})`;
  }
});

// Toggle dropdown open/close
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;

  // Announce state change
  if (isOpen.value) {
    announcement.value = `${props.placeholder} dropdown geöffnet. ${sortedItems.value.length} Optionen verfügbar.`;
  } else {
    announcement.value = `${props.placeholder} dropdown geschlossen.`;
  }
};

// Close dropdown
const closeDropdown = () => {
  if (isOpen.value) {
    isOpen.value = false;
    announcement.value = `${props.placeholder} dropdown geschlossen.`;
  }
};

// Handle input change (works for both checkbox and radio)
const handleInputChange = (value: string | number | unknown) => {
  if (props.multiple) {
    // Checkbox mode: toggle selection
    handleMultipleSelect(value);
  } else {
    // Radio mode: single selection
    handleSingleSelect(value);
  }
};

// Handle multiple selection (checkbox mode)
const handleMultipleSelect = (value: string | number | unknown) => {
  let newValue: ItemType[];
  const item = sortedItems.value.find((i) => getItemValue(i) === value);
  const itemLabel = item ? getItemLabel(item) : String(value);

  if (isSelected(value)) {
    // Remove from selection
    newValue = props.modelValue.filter((selected) => {
      if (typeof selected === 'object' && selected !== null) {
        return selected[props.valueAttribute] !== value;
      }
      return selected !== value;
    });
    announcement.value = `${itemLabel} abgewählt. ${newValue.length} Elemente ausgewählt.`;
  } else {
    // Add to selection
    if (item) {
      newValue = [...props.modelValue, item];
    } else {
      newValue = [...props.modelValue, value as ItemType];
    }
    announcement.value = `${itemLabel} ausgewählt. ${newValue.length} Elemente ausgewählt.`;
  }

  emit('update:modelValue', newValue);
};

// Handle single selection (radio mode)
const handleSingleSelect = (value: string | number | unknown) => {
  const item = sortedItems.value.find((i) => getItemValue(i) === value);
  const itemLabel = item ? getItemLabel(item) : String(value);

  if (item) {
    emit('update:modelValue', [item]);
  } else {
    emit('update:modelValue', [value as ItemType]);
  }

  announcement.value = `${itemLabel} ausgewählt.`;
};

// Reset filter (radio mode only)
const handleReset = () => {
  emit('update:modelValue', []);
  isOpen.value = false;
  announcement.value = `${props.placeholder} Filter zurückgesetzt.`;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
@reference '../../assets/css/main.css';

.dropdown-options {
  position: absolute;
  top: 100%;
  z-index: 1000;
  min-width: 200px;
  background: inherit;
  margin-top: 0;
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-toggle {
  position: relative;
  background-color: inherit;
}

.dropdown-toggle::after {
  /* outline: 1px dotted; */
  content: '';
  position: absolute;
  z-index: 2;
  top: 17px;
  right: 0.75rem;
  width: 0;
  height: 0;
  background-color: inherit;
  pointer-events: none;
  transform: scale(0.65);
  transform-origin: 50% 50%;
  border-style: solid;
  border-width: 10px 0 10px 16px;
  border-color: transparent transparent transparent black;
  transition: transform 0.2s ease-in-out;
}

.active .dropdown-toggle::after {
  transform: rotate(90deg) scale(0.65);
}

.form-control {
  --form-control-color: black;
  @apply text-lg md:text-2lg gap-4 grid grid-cols-[1em_auto] py-2 pl-3 pr-4 font-medium;
}

.form-control:last-of-type {
  padding-bottom: 1.2rem;
}

input[type='checkbox'],
input[type='radio'] {
  -webkit-appearance: none;
  appearance: none;
  /* For iOS < 15 to remove gradient background */
  background-color: inherit;
  /* Not removed via appearance */
  margin: 0;
}

input[type='radio'] {
  font: inherit;
  color: currentColor;
  width: 0.875em;
  height: 0.875em;
  border: 0.12em solid currentColor;
  border-radius: 50%;
  transform: translateY(0.075em);
  display: grid;
  place-content: center;
}

input[type='radio']::before {
  content: '';
  width: 0.75em;
  height: 0.75em;
  border-radius: 50%;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em var(--form-control-color);
}

input[type='radio']:checked::before {
  transform: scale(1);
}

input[type='radio']:focus {
  outline: 2px dashed currentColor;
  outline-offset: 1px;
  outline: none;
}

input[type='radio']:focus-visible {
  outline: 2px dashed currentColor;
  outline-offset: 1px;
}
</style>
