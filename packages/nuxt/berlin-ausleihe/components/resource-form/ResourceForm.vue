<template>
  <UForm
    ref="formRef"
    :schema="schema"
    :state="state"
    class="flex flex-col gap-10 lg:gap-16 w-full items-start mb-12"
    @submit="onSubmit"
  >
    <section id="general" class="flex flex-col gap-4 w-full">
      <div>
        <h2>
          {{ $t('berlin_resource_form_generalTitle') }}
        </h2>
        <p class="font-light text-lg text-black">
          {{ $t('berlin_resource_form_generalDescription') }}
        </p>
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

        <UFormField
          :label="$t('berlin_resource_form_categories')"
          name="categories"
          required
        >
          <USelectMenu
            v-model="state.categories"
            :ui="{
              base: 'w-full bg-white py-4 px-4 ring ring-black text-base md:text-lg',
              trailingIcon: 'text-black',
              placeholder: 'text-black',
            }"
            :items="categoriesOptions"
            :search-input="false"
            :placeholder="$t('berlin_resource_form_categoriesPlaceholder')"
            value-key="value"
            multiple
            size="xl"
          />
        </UFormField>

        <UFormField :label="$t('berlin_resource_form_images')" name="images">
          <BerlinResourceFormImagesUpload v-model="state.images" />
        </UFormField>
      </div>
    </section>

    <section id="address" class="flex flex-col gap-4 w-full">
      <div>
        <h2>
          {{ $t('address_title') }}
        </h2>
        <p class="font-light text-lg text-black">
          {{ $t('address_description') }}
        </p>
      </div>
      <div class="flex flex-col gap-6 lg:flex-row w-full">
        <div class="flex flex-col gap-4 w-full">
          <UFormField
            :label="$t('berlin_resource_address')"
            name="address.street"
            required
          >
            <UInput
              v-model="state.address.street"
              :placeholder="$t('address_streetPlaceholder')"
              required
            />
          </UFormField>

          <div class="flex flex-col gap-4 md:flex-row">
            <UFormField
              class="basis-1/3"
              :label="$t('berlin_resource_zip')"
              name="address.zip"
              required
            >
              <UInput
                v-model="state.address.zip"
                maxlength="5"
                inputmode="numeric"
                required
              />
            </UFormField>

            <UFormField
              class="basis-2/3"
              :label="$t('address_city')"
              name="address.place"
            >
              <UInput v-model="state.address.place" readonly />
            </UFormField>
          </div>

          <UFormField
            :label="$t('berlin_resource_district')"
            name="district"
            required
          >
            <USelectMenu
              v-model="state.district"
              :ui="{
                base: 'w-full bg-white py-4 px-4 ring-black text-base md:text-lg',
                trailingIcon: 'text-black',
                placeholder: 'text-black',
              }"
              :items="districtsOptions"
              :search-input="false"
              :placeholder="$t('berlin_resource_form_districtPlaceholder')"
              size="xl"
              class="w-full"
              value-key="value"
            />
          </UFormField>
        </div>

        <div class="flex flex-col gap-2 lg:w-1/2">
          <div class="font-light text-base text-black mb-0">
            {{ $t('resourceForm_mapPreview') }}
          </div>

          <div
            class="h-full flex items-center justify-center w-full bg-white/30 rounded-md -mt-1"
          >
            <div v-if="geocodePending" class="flex flex-col items-center gap-2">
              <span class="loading loading-spinner loading-md" />

              <p class="font-light text-black">
                {{ $t('resourceForm_locationLoading') }}
              </p>
            </div>

            <div v-else-if="markers.length" class="w-full h-max">
              <BaseLeafletMap
                :markers="markers"
                class-names="w-full h-[200px]! rounded-md overflow-hidden"
              />
            </div>

            <div
              v-else
              class="text-center *:font-light *:text-base *:leading-tight text-black p-4"
            >
              <p>{{ $t('resourceForm_mapPlaceholder') }}</p>
              <p v-if="geocodeError" class="text-error mt-2">
                {{ geocodeError }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-5 w-full">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold text-black">
            {{ $t('resourceForm_priceTitle') }}
          </h2>
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

    <section class="flex flex-col gap-4 w-full">
      <UFormField v-if="!isEditForm" name="agreement">
        <template #label>
          <div class="flex items-start gap-2">
            <UCheckbox
              v-model="state.agreement"
              size="xl"
              :ui="{
                container: 'h-max',
                base: 'w-8! h-8! md:w-10! md:h-10! border-black ring-black rounded-full',
                indicator: 'p-1',
              }"
              required
            />

            <!-- <span
              class="text-sm"
              v-html="$t('berlin_resource_form_termsLabel')"
            /> -->

            <p
              class="ml-2 text-lg lg:text-2lg leading-snug font-light tracking-[-1%]"
            >
              Ich habe den
              <NuxtLink
                class="underline underline-offset-3 decoration-[1px] font-light! text-black!"
                to="https://api.berlin.depot.social/uploads/engagierters_berlin_Code_of_Conduct_abe65337f4.pdf"
                target="_blank"
              >
                <!-- temporarer js string, sonst komische leerzeichen  -->
                {{ 'Code of Conduct' }}
              </NuxtLink>
              von engagiertes.berlin gelesen und stimme den Leitlinien für eine
              faire Raumnutzung zu.
            </p>
          </div>
        </template>
      </UFormField>

      <slot name="additional-agreements" />
    </section>

    <div class="flex flex-col gap-4 w-full">
      <p v-if="!isEditForm" class="font-light text-lg text-black">
        {{ $t('berlin_resource_form_reviewInfo') }}
      </p>

      <div class="flex justify-between gap-4 flex-wrap">
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
import type { Category, District, GeoData, Resource } from '@depot/shared';
import { PriceTariffType, getPriceByPriceTariff } from '@depot/shared';
import * as v from 'valibot';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { ResourceFormSubmitPayload } from './types';

interface Props {
  form?: Resource;
  categories?: Category[];
  district?: District[];
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

const district = computed(() => props.district);
const categories = computed(() => props.categories);
const isEditForm = computed(() => props.isEditForm);
const isLoading = computed(() => props.loading);
const durationTypeItems = [
  { label: $t('resourceForm_priceDurationTypeDaily'), value: 'daily' },
  { label: $t('resourceForm_priceDurationTypeHourly'), value: 'hourly' },
];

const districtsOptions = computed(
  () =>
    district.value?.map((district: District) => ({
      label: district.name,
      value: district.id,
    })) || []
);

const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty($t('validation_required')),
    v.minLength(5, $t('resourceForm_titleMinLength'))
  ),
  description: v.string(),
  images: v.array(v.any()),
  district: v.pipe(
    v.nullable(v.number()),
    v.check((val) => val != null, $t('validation_required'))
  ),
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
      getPriceByPriceTariff(resource?.prices ?? [], PriceTariffType.REGULAR)
        ?.durationType ??
      'daily',
    vatValue:
      getPriceByPriceTariff(
        resource?.prices ?? [],
        PriceTariffType.NOT_FOR_PROFIT
      )?.vatValue ??
      getPriceByPriceTariff(resource?.prices ?? [], PriceTariffType.REGULAR)
        ?.vatValue ??
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
  district: resource?.district?.id ?? null,
  categories: resource?.categories?.map((category) => category.id) ?? [],
  address: {
    street: resource?.address?.street ?? '',
    zip: resource?.address?.zip ?? '',
    place: 'Berlin',
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

const categoriesOptions = computed(
  () =>
    categories.value?.map((category: Category) => ({
      label: category.title,
      value: category.id,
    })) || []
);

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
  isEditForm.value ? $t('resourceForm_completeEdit') : $t('resourceForm_submit')
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
      districtId: state.district as number,
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
      images: state.images
        .filter((u: { id?: number | null }) => u.id != null)
        .map((u: { id: number }) => u.id) as number[],
      geoData: geocodeData.value,
    };

    emit('submit', payload);
  } finally {
    submitting.value = false;
  }
};
</script>
