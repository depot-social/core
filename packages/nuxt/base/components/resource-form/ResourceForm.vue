<template>
  <UForm
    :schema="schema"
    :state="state"
    class="flex flex-col gap-6 md:gap-8 w-full items-start"
    @submit="onSubmit"
  >
    <section class="flex flex-col gap-5 w-full rounded-2xl border-2 border-black bg-white p-5 md:p-7">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <span class="badge badge-primary badge-sm">01</span>
          <h2 class="text-xl font-semibold text-black">
            {{ $t('resourceForm_generalTitle') }}
          </h2>
        </div>
        <p class="text-gray-700">{{ $t('resourceForm_generalDescription') }}</p>
      </div>
      <div class="flex flex-col gap-4 w-full">
        <UFormField :label="$t('resourceForm_name')" name="title">
          <UInput
            v-model="state.title"
            :placeholder="$t('resourceForm_namePlaceholder')"
            required
          />
        </UFormField>

        <UFormField :label="$t('resourceForm_description')" name="description">
          <UTextarea
            v-model="state.description"
            class="w-full"
            :rows="5"
            :placeholder="$t('resourceForm_descriptionPlaceholder')"
            :ui="{
              base: 'w-full border-2 border-black rounded-2xl',
            }"
          >
            <template #help>
              {{ $t('resourceForm_descriptionHelp') }}
            </template>
          </UTextarea>
        </UFormField>

        <UFormField :label="$t('resourceForm_images')" name="images">
          <div class="flex flex-col gap-2">
            <input
              id="resource-images"
              class="file-input file-input-bordered bg-white border-black border-2 w-full max-w-lg"
              type="file"
              multiple
              accept="image/*"
              :aria-describedby="'resource-images-help'"
              @change="onFilesChange"
            />
            <p id="resource-images-help" class="text-sm text-gray-700" aria-live="polite">
              {{ filesLabel }}
            </p>
          </div>
        </UFormField>

        <UFormField
          :label="$t('resourceForm_categories')"
          name="categories"
          v-slot="{ error }"
        >
          <div>
            <div class="flex items-center gap-3 text-sm text-gray-700">
              <span v-if="categoriesSelectedCount > 0">
                {{
                  $t('resourceForm_categoriesSelected', {
                    count: categoriesSelectedCount,
                  })
                }}
              </span>
              <span v-else :id="categoriesHintId">
                {{ $t('resourceForm_categoriesHelper') }}
              </span>
            </div>
            <fieldset
              class="relative flex gap-2 flex-wrap mt-3 min-h-[110px] items-center justify-start rounded-xl border-2 border-dashed border-black bg-orange-100 p-4 text-center hover:border-orange-800 focus-within:border-orange-800"
              :aria-describedby="error ? categoriesErrorId : categoriesHintId"
            >
              <legend class="sr-only">{{ $t('resourceForm_categories') }}</legend>
              <button
                v-for="category in categories"
                :key="category.id"
                type="button"
                class="badge px-4 py-3 font-medium transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-primary"
                :class="
                  state.categories.includes(category.id)
                    ? 'badge-primary text-white hover:bg-orange-700'
                    : 'badge-ghost bg-white text-black border-black hover:bg-gray-100 hover:text-black'
                "
                :aria-pressed="state.categories.includes(category.id)"
                :aria-label="category.title"
                @click="toggleCategory(category.id)"
              >
                {{ category.title }}
              </button>
              <p v-if="categories.length === 0" class="text-sm text-gray-700">
                {{ $t('resourceForm_noCategories') }}
              </p>
            </fieldset>
            <p
              v-if="error"
              :id="categoriesErrorId"
              class="text-sm text-error mt-2"
              aria-live="polite"
            >
              {{ error }}
            </p>
          </div>
        </UFormField>
      </div>
    </section>

    <section class="flex flex-col gap-5 w-full rounded-2xl border-2 border-black bg-white p-5 md:p-7">
      <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
          <span class="badge badge-primary badge-sm">02</span>
          <h2 class="text-xl font-semibold text-black">{{ $t('resourceForm_priceTitle') }}</h2>
        </div>
        <p class="text-gray-700">
          {{ $t('resourceForm_priceDescription') }}
        </p>
      </div>
      <div class="grid grid-cols-1 gap-4 w-full lg:grid-cols-5">
        <input
          type="hidden"
          name="price.currency"
          :value="state.price.currency"
        />

        <UFormField
          :label="$t('resourceForm_priceDurationType')"
          name="price.durationType"
          required
        >
          <USelect
            v-model="state.price.durationType"
            :items="durationTypeItems"
            value-key="value"
          />
        </UFormField>

        <UFormField
          :label="$t('resourceForm_priceDiscountedValue')"
          name="price.discountedValue"
          required
        >
          <BaseMoneyType v-model="state.price.discountedValue" />
        </UFormField>

        <UFormField
          :label="$t('resourceForm_priceRegularValue')"
          name="price.regularValue"
        >
          <BaseMoneyType v-model="state.price.regularValue" />
        </UFormField>

        <UFormField
          :label="$t('resourceForm_priceDepositValue')"
          name="price.depositValue"
        >
          <BaseMoneyType v-model="state.price.depositValue" />
        </UFormField>

        <UFormField
          :label="$t('resourceForm_priceVatValue')"
          name="price.vatValue"
        >
          <UInput
            v-model.number="state.price.vatValue"
            type="number"
            min="0"
            step="1"
            inputmode="numeric"
          />
        </UFormField>
      </div>
    </section>

    <section class="flex flex-col gap-5 w-full rounded-2xl border-2 border-black bg-white p-5 md:p-7">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <span class="badge badge-primary badge-sm">03</span>
          <h2 class="text-xl font-semibold text-black">
            {{ $t('address_title') }}
          </h2>
        </div>
        <p class="text-gray-700">
          {{ $t('address_description') }}
        </p>
      </div>
      <div class="flex flex-col gap-6 lg:flex-row w-full">
        <div class="flex flex-col gap-4 lg:w-1/2">
          <UFormField :label="$t('address_street')" name="address.street">
            <UInput
              v-model="state.address.street"
              :placeholder="$t('address_streetPlaceholder')"
              autocomplete="street-address"
              required
            />
          </UFormField>
          <div class="flex flex-col gap-4 md:flex-row">
            <UFormField
              class="basis-1/3"
              :label="$t('address_zip')"
              name="address.zip"
            >
              <UInput
                v-model="state.address.zip"
                maxlength="5"
                inputmode="numeric"
                autocomplete="postal-code"
                required
              />
            </UFormField>
            <UFormField
              class="basis-2/3"
              :label="$t('address_city')"
              name="address.place"
            >
              <UInput v-model="state.address.place" autocomplete="address-level2" required />
            </UFormField>
          </div>
        </div>

        <div class="flex flex-col gap-2 lg:w-1/2">
          <div class="text-sm text-gray-700">
            {{ $t('resourceForm_mapPreview') }}
          </div>
          <div
            class="rounded-xl border-2 border-black min-h-[220px] h-[220px] flex items-center justify-center w-full bg-orange-100 overflow-hidden"
            :aria-busy="geocodePending"
          >
            <div v-if="geocodePending" class="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
              <span class="loading loading-spinner loading-md" />
              <p class="text-sm text-gray-700" aria-live="polite">
                {{ $t('resourceForm_locationLoading') }}
              </p>
            </div>
            <div v-else-if="markers.length" class="w-full h-full">
              <BaseLeafletMap
                :markers="markers"
                class-names="w-full h-full rounded-xl overflow-hidden"
              />
            </div>
            <div
              v-else
              class="flex h-full w-full flex-col items-center justify-center text-center text-gray-700 text-sm p-4"
            >
              <p>{{ $t('resourceForm_mapPlaceholder') }}</p>
              <p v-if="geocodeError" class="text-error mt-2" aria-live="assertive">
                {{ geocodeError }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="!isEditForm"
      class="flex flex-col gap-5 w-full rounded-2xl border-2 border-black bg-white p-5 md:p-7"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <span class="badge badge-primary badge-sm">04</span>
          <h2 class="text-xl font-semibold text-black">{{ $t('resourceForm_miscTitle') }}</h2>
        </div>
        <p class="text-gray-700">
          {{ $t('resourceForm_miscDescription') }}
        </p>
      </div>

      <UFormField
        name="agreement"
        :label="$t('resourceForm_termsLabel')"
      >
        <template #label>
          <div class="flex items-start gap-2">
            <UCheckbox v-model="state.agreement" required />
            <span class="text-sm text-black" v-html="$t('resourceForm_termsLabel')" />
          </div>
        </template>
      </UFormField>

      <p class="text-sm text-gray-700">
        {{ $t('resourceForm_reviewInfo') }}
      </p>
    </section>

    <div class="flex flex-col gap-4 w-full rounded-2xl bg-orange-100 p-4 md:p-5">
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
        <UButton
          type="submit"
          class="btn btn-primary w-full sm:w-auto min-h-11 justify-center"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          {{ submitLabel }}
        </UButton>
        <UButton
          type="button"
          variant="outline"
          class="btn btn-outline w-full sm:w-auto min-h-11 justify-center"
          :aria-label="$t('resourceForm_cancel')"
          @click="$router.back()"
        >
          {{ $t('cancel') }}
        </UButton>
      </div>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import {
  PriceTariffType,
  getPriceByPriceTariff,
} from '@depot/shared';
import type { Category, Resource } from '@depot/shared';
import type { GeoData } from '@depot/shared';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import * as v from 'valibot';
import type { ResourceFormSubmitPayload } from './types';

interface Props {
  form?: Resource;
  categories?: Category[];
  isEditForm?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  isEditForm: false,
  loading: false,
});

const emit = defineEmits<{
  submit: [payload: ResourceFormSubmitPayload];
}>();

const categories = computed(() => props.categories);
const isEditForm = computed(() => props.isEditForm);
const isLoading = computed(() => props.loading);
const categoriesHintId = 'resource-form-categories-hint';
const categoriesErrorId = 'resource-form-categories-error';
const durationTypeItems = [
  { label: $t('resourceForm_priceDurationTypeDaily'), value: 'daily' },
  { label: $t('resourceForm_priceDurationTypeHourly'), value: 'hourly' },
];

const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty($t('validation_required')),
    v.minLength(5, $t('resourceForm_titleMinLength'))
  ),
  description: v.string(),
  images: v.array(v.any()),
  categories: v.pipe(
    v.array(v.number()),
    v.minLength(1, $t('resourceForm_categoriesRequired'))
  ),
  price: v.object({
    currency: v.literal('euro'),
    durationType: v.picklist(['daily', 'hourly'], $t('validation_required')),
    vatValue: v.pipe(
      v.number(),
      v.minValue(0, $t('resourceForm_priceMustBePositive'))
    ),
    depositValue: v.pipe(
      v.nullable(v.number()),
      v.check(
        (value) => value === null || value >= 0,
        $t('resourceForm_priceMustBePositive')
      )
    ),
    discountedValue: v.pipe(
      v.nullable(v.number()),
      v.check((value) => value !== null, $t('validation_required')),
      v.check(
        (value) => value !== null && value >= 0,
        $t('resourceForm_priceMustBePositive')
      )
    ),
    regularValue: v.pipe(
      v.nullable(v.number()),
      v.check(
        (value) => value === null || value >= 0,
        $t('resourceForm_priceMustBePositive')
      )
    ),
  }),
  address: v.object({
    street: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(6, $t('validation_minLength'))
    ),
    zip: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.regex(/^\d{5}$/, $t('address_zipLength'))
    ),
    place: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(2, $t('validation_minLength2'))
    ),
  }),
  agreement: isEditForm.value
    ? v.boolean()
    : v.literal(true, $t('validation_consentRequired')),
});

type ResourceFormState = v.InferInput<typeof schema>;

const buildInitialState = (resource?: Resource): ResourceFormState => ({
  // The form edits first visible values and maps them to 1..2 Strapi prices.
  // We prefill from existing prices if present.
  price: {
    currency: 'euro',
    durationType:
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.NOT_FOR_PROFIT
      )?.durationType ??
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.REGULAR
      )?.durationType ??
      'daily',
    vatValue:
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.NOT_FOR_PROFIT
      )?.vatValue ??
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.REGULAR
      )?.vatValue ??
      0,
    depositValue:
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.NOT_FOR_PROFIT
      )?.depositValue ??
      getPriceByPriceTariff(resource?.prices ?? [], PriceTariffType.REGULAR)
        ?.depositValue ??
      null,
    discountedValue:
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.NOT_FOR_PROFIT
      )?.value ?? null,
    regularValue:
      getPriceByPriceTariff(resource?.prices ?? [], PriceTariffType.REGULAR)
        ?.value ?? null,
  },
  title: resource?.title ?? '',
  description: resource?.description ?? '',
  images: [],
  categories: resource?.categories?.map((category) => category.id) ?? [],
  address: {
    street: resource?.address?.street ?? '',
    zip: resource?.address?.zip ?? '',
    place: resource?.address?.place ?? '',
  },
  agreement: isEditForm.value ? true : false,
});

const state = reactive<ResourceFormState>(buildInitialState(props.form));

watch(
  () => props.form,
  (newForm) => {
    if (!newForm) return;
    Object.assign(state, buildInitialState(newForm));
  },
  { deep: true }
);

const categoriesSelectedCount = computed(() => state.categories.length);

const filesLabel = computed(() =>
  state.images.length === 0
    ? $t('resourceForm_uploadPlaceholder')
    : $t('resourceForm_filesSelected', { count: state.images.length })
);

const toggleCategory = (categoryId: number) => {
  if (state.categories.includes(categoryId)) {
    state.categories = state.categories.filter((id) => id !== categoryId);
  } else {
    state.categories = [...state.categories, categoryId];
  }
};

const onFilesChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  state.images = files;
};

const geocodePending = ref(false);
const geocodeError = ref('');
const geocodeData = ref<GeoData | null>(null);
let geocodeTimeout: ReturnType<typeof setTimeout> | null = null;

const shouldGeocode = () => {
  return (
    state.address.street.length >= 3 &&
    state.address.zip.length === 5 &&
    state.address.place.length >= 2
  );
};

const geocodeAddress = async () => {
  if (!import.meta.client || !shouldGeocode()) {
    geocodeData.value = null;
    geocodeError.value = '';
    return;
  }

  geocodePending.value = true;
  geocodeError.value = '';

  try {
    const result = await $fetch<GeoData | null>('/api/geocode', {
      method: 'POST',
      body: {
        street: state.address.street,
        zip: state.address.zip,
        place: state.address.place,
      },
    });

    geocodeData.value = result ?? null;
  } catch (error) {
    if (import.meta.dev) {
      console.error('Failed to geocode address', error);
    }
    geocodeData.value = null;
    geocodeError.value = $t('resourceForm_locationError');
  } finally {
    geocodePending.value = false;
  }
};

watch(
  () => [state.address.street, state.address.zip, state.address.place],
  () => {
    if (!import.meta.client) {
      return;
    }

    if (geocodeTimeout) {
      clearTimeout(geocodeTimeout);
    }

    if (!shouldGeocode()) {
      geocodeData.value = null;
      return;
    }

    geocodeTimeout = setTimeout(() => {
      geocodeAddress();
    }, 600);
  }
);

const markers = computed(() =>
  geocodeData.value
    ? [
        {
          point: [geocodeData.value.latitude, geocodeData.value.longitude],
        },
      ]
    : []
);

onBeforeUnmount(() => {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout);
  }
});

const submitting = ref(false);
const isSubmitting = computed(() => submitting.value || isLoading.value);

const submitLabel = computed(() =>
  isEditForm.value
    ? $t('resourceForm_completeEdit')
    : $t('resourceForm_submit')
);

const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (isSubmitting.value) {
    return;
  }

  submitting.value = true;

  try {
    const payload: ResourceFormSubmitPayload = {
      title: state.title,
      description: state.description,
      price: {
        currency: state.price.currency,
        durationType: state.price.durationType,
        vatValue: state.price.vatValue,
        depositValue: state.price.depositValue,
        discountedValue: state.price.discountedValue as number,
        regularValue: state.price.regularValue,
      },
      categoryIds: state.categories,
      address: {
        street: state.address.street,
        zip: state.address.zip,
        place: state.address.place,
      },
      agreement: state.agreement,
      images: state.images,
      geoData: geocodeData.value,
    };

    emit('submit', payload);
  } finally {
    submitting.value = false;
  }
};
</script>

