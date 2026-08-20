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
        <UFormField
          :label="$t('berlin_resource_form_name')"
          name="roomName"
          required
        >
          <UInput
            v-model="state.roomName"
            :placeholder="$t('berlin_resource_form_namePlaceholder')"
            required
          />
        </UFormField>

        <UFormField
          :label="$t('berlin_resource_form_provider')"
          name="provider"
          required
        >
          <UInput
            v-model="state.provider"
            :placeholder="$t('berlin_resource_form_providerPlaceholder')"
            required
          />
        </UFormField>

        <UFormField
          :label="$t('berlin_resource_form_purposes')"
          name="purposes"
          required
        >
          <USelectMenu
            v-model="state.purposes"
            :ui="{
              base: 'w-full bg-white py-4 px-4 ring ring-black text-base md:text-lg',
              trailingIcon: 'text-black',
              placeholder: 'text-black',
            }"
            :items="purposesOptions"
            :search-input="false"
            value-key="value"
            multiple
            size="xl"
            :placeholder="$t('berlin_resource_form_purposesPlaceholder')"
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

    <section id="barrierefreiheit" class="flex flex-col gap-4 w-full">
      <div>
        <h2>
          {{ $t('berlin_resource_form_accessibilityTitle') }}
        </h2>
      </div>

      <div class="flex flex-col gap-4 w-full">
        <UFormField
          :label="$t('berlin_resource_form_accessibilityState')"
          name="accessibilityState"
          required
        >
          <USelect
            v-model="state.accessibilityState"
            :ui="{
              base: 'w-full bg-white py-4 px-4 ring-black text-base md:text-lg',
              trailingIcon: 'text-black',
            }"
            :items="[
              { label: 'Barrierefrei', value: 'accessible' },
              {
                label: 'Nicht barrierefrei',
                value: 'not_accessible',
              },
              {
                label: 'Teilweise barrierefrei',
                value: 'partly_accessible',
              },
            ]"
            value-key="value"
            size="xl"
          />
        </UFormField>

        <UFormField
          :label="$t('berlin_resource_form_accessibilityInfo')"
          name="accessibilityInfo"
        >
          <UTextarea
            v-model="state.accessibilityInfo"
            :rows="3"
            :placeholder="
              $t('berlin_resource_form_accessibilityInfoPlaceholder')
            "
          >
            <template #help>
              {{ $t('berlin_resource_form_accessibilityInfoHelp') }}
            </template>
          </UTextarea>
        </UFormField>
      </div>
    </section>

    <section id="facilities" class="flex flex-col gap-4 w-full">
      <div>
        <h2>
          {{ $t('berlin_resource_form_facilitiesTitle') }}
        </h2>
      </div>

      <UFormField
        :label="$t('berlin_resource_form_facilities')"
        name="facilities"
        required
      >
        <UTextarea
          v-model="state.facilities"
          :rows="3"
          :placeholder="$t('berlin_resource_form_facilitiesPlaceholder')"
          required
        />
      </UFormField>

      <UFormField
        :label="$t('berlin_resource_form_facilitiesAdditionalInfo')"
        name="facilitiesAdditionalInfo"
      >
        <UTextarea
          v-model="state.facilitiesAdditionalInfo"
          :rows="3"
          :placeholder="
            $t('berlin_resource_form_facilitiesAdditionalInfoPlaceholder')
          "
        />
      </UFormField>

      <UFormField
        :label="$t('berlin_resource_form_max')"
        name="maxCapacity"
        required
      >
        <UInput v-model="state.maxCapacity" required />
      </UFormField>

      <UFormField
        :label="$t('berlin_resource_form_roomSizeSqm')"
        name="roomSizeSqm"
        required
      >
        <UInput v-model="state.roomSizeSqm" type="number" required />
      </UFormField>
    </section>

    <section id="usage" class="flex flex-col gap-4 w-full">
      <div>
        <h2>
          {{ $t('berlin_resource_form_usageDetailsTitle') }}
        </h2>
        <p class="text-black font-light text-base md:text-lg">
          {{ $t('berlin_resource_form_usageDetailsDescription') }}
        </p>
      </div>

      <UFormField
        :label="$t('berlin_resource_form_usageHours')"
        name="usageHours"
        required
      >
        <UTextarea
          v-model="state.usageHours"
          :rows="3"
          :placeholder="$t('berlin_resource_form_usageHoursPlaceholder')"
          required
        />
      </UFormField>

      <UFormField
        :label="$t('berlin_resource_form_usageFeeDetails')"
        name="usageFeeDetails"
      >
        <UTextarea
          v-model="state.usageFeeDetails"
          :rows="3"
          :placeholder="$t('berlin_resource_form_usageFeeDetailsPlaceholder')"
        />
      </UFormField>
    </section>

    <section id="contact" class="flex flex-col gap-4 w-full">
      <div>
        <h2>
          {{ $t('berlin_resource_form_contactTitle') }}
        </h2>
        <p class="text-black font-light text-base md:text-lg">
          {{ $t('berlin_resource_form_contactDescription') }}
        </p>
      </div>

      <UFormField
        :label="$t('berlin_resource_form_contactPerson')"
        name="contactPerson"
        required
      >
        <UInput
          v-model="state.contactPerson"
          :placeholder="$t('berlin_resource_form_contactPersonPlaceholder')"
          required
        />
      </UFormField>

      <UFormField
        :label="$t('berlin_resource_form_contactEmail')"
        name="contactEmail"
        required
      >
        <UInput
          v-model="state.contactEmail"
          type="email"
          :placeholder="$t('berlin_resource_form_contactEmailPlaceholder')"
          required
        />
      </UFormField>

      <UFormField
        :label="$t('berlin_resource_form_contactPhone')"
        name="contactPhone"
        required
      >
        <UInput
          v-model="state.contactPhone"
          type="tel"
          :placeholder="$t('berlin_resource_form_contactPhonePlaceholder')"
          required
        />
      </UFormField>
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

      <div v-if="!hideSubmit" class="flex justify-between gap-4 flex-wrap">
        <UButton type="submit" :loading="isSubmitting" :disabled="isSubmitting">
          <slot name="submit-label">
            {{ submitLabel }}
          </slot>
        </UButton>
      </div>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import type {
  BerlinResourceType,
  District,
  GeoData,
  Purpose,
  Resource,
} from '@depot/shared';
import { getResourceType, ResourceTypeComponent } from '@depot/shared';
import * as v from 'valibot';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useScrollToFirstError } from '~/berlin-raum/composables/useScrollToFirstError';
import type { ResourceFormSubmitPayload } from './types';

interface Props {
  form?: Resource;
  district: District[];
  purposes?: Purpose[];
  isEditForm?: boolean;
  loading?: boolean;
  hideSubmit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  purposes: () => [],
  isEditForm: false,
  loading: false,
  hideSubmit: false,
});

const emit = defineEmits<{
  submit: [payload: ResourceFormSubmitPayload];
  'update:form': [form: Partial<Resource>];
  'update:markers': [markers: { point: [number, number] }[]];
}>();

const district = computed(() => props.district);
const purposes = computed(() => props.purposes);
const isEditForm = computed(() => props.isEditForm);
const isLoading = computed(() => props.loading);

const districtsOptions = computed(
  () =>
    district.value?.map((district: District) => ({
      label: district.name,
      value: district.id,
    })) || []
);

const purposesOptions = computed(
  () =>
    purposes.value?.map((purpose: Purpose) => ({
      label: purpose.title,
      value: purpose.id,
    })) || []
);

const schema = v.object({
  title: v.pipe(
    v.string(),
    v.nonEmpty($t('validation_required')),
    v.minLength(5, $t('resourceForm_titleMinLength'))
  ),
  purposes: v.pipe(
    v.array(v.number()),
    v.minLength(1, $t('berlin_resource_form_purposesRequired'))
  ),
  district: v.pipe(
    v.nullable(v.number()),
    v.check((val) => val != null, $t('validation_required'))
  ),
  images: v.array(v.any()),
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
  // Berlin-specific fields
  provider: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  roomName: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  maxCapacity: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  roomSizeSqm: v.pipe(
    v.number(),
    v.check((val) => val > 0, $t('validation_positiveNumber'))
  ),
  accessibilityInfo: v.string(),
  facilities: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  facilitiesAdditionalInfo: v.pipe(v.string()),
  usageHours: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  usageFeeDetails: v.pipe(v.string()),
  contactPerson: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  contactEmail: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  contactPhone: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  accessibilityState: v.picklist(
    ['accessible', 'not_accessible', 'partly_accessible'],
    $t('validation_required')
  ),
  agreement: isEditForm.value
    ? v.boolean()
    : v.literal(true, $t('validation_consentRequired')),
});

type ResourceFormState = v.InferInput<typeof schema>;

const buildInitialState = (resource?: Resource): ResourceFormState => {
  const berlinResourceType = resource
    ? (getResourceType(
        resource.resourceTypes,
        ResourceTypeComponent.BERLIN_RESOURCE_TYPE
      ) as BerlinResourceType | undefined)
    : undefined;

  return {
    title: resource?.title ?? '', // watcher will auto-generate from following fields [provider + street + room name]
    purposes: resource?.purposes?.map((purpose) => purpose.id) ?? [],
    district: resource?.district?.id ?? null,
    images: [],
    address: {
      street: resource?.address?.street ?? '',
      zip: resource?.address?.zip ?? '',
      place: 'Berlin', // Berlin must be prefilled / field is readonly
    },
    // Berlin-specific fields
    provider: berlinResourceType?.provider ?? '',
    roomName: berlinResourceType?.roomName ?? '',
    maxCapacity: berlinResourceType?.maxCapacity ?? '',
    roomSizeSqm: berlinResourceType?.roomSizeSqm ?? 0,
    accessibilityState:
      berlinResourceType?.accessibilityState ?? 'partly_accessible',
    accessibilityInfo: berlinResourceType?.accessibilityInfo ?? '',
    usageHours: berlinResourceType?.usageHours ?? '',
    usageFeeDetails: berlinResourceType?.usageFeeDetails ?? '',
    facilities: berlinResourceType?.facilities ?? '',
    facilitiesAdditionalInfo:
      berlinResourceType?.facilitiesAdditionalInfo ?? '',
    contactPerson: berlinResourceType?.contactPerson ?? '',
    contactEmail: berlinResourceType?.contactEmail ?? '',
    contactPhone: berlinResourceType?.contactPhone ?? '',
    agreement: false,
  };
};

const state = reactive<ResourceFormState>(buildInitialState(props.form));

const loadedResourceId = ref(props.form?.id);

watch(
  () => props.form,
  (newForm) => {
    // Only reset the form if a different resource is loaded
    if (newForm && newForm.id !== loadedResourceId.value) {
      Object.assign(state, buildInitialState(newForm));
      loadedResourceId.value = newForm.id;
    }
  },
  { deep: true }
);

// Auto generate title
watch(
  () => [state.provider, state.address.street, state.roomName],
  ([provider, street, roomName]) => {
    state.title = [provider, street, roomName].filter(Boolean).join(' ');
  },
  { immediate: true }
);

const uploadsInProgress = computed(() =>
  state.images.some(
    (item: { id?: number | null; error?: string | null }) =>
      item.id == null && !item.error
  )
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
    console.error('Failed to geocode address', error);
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
          point: [geocodeData.value.latitude, geocodeData.value.longitude] as [
            number,
            number
          ],
        },
      ]
    : []
);

watch(markers, (newMarkers) => {
  emit('update:markers', newMarkers);
});

onBeforeUnmount(() => {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout);
  }
});

const submitting = ref(false);
const isSubmitting = computed(
  () => submitting.value || isLoading.value || uploadsInProgress.value
);

const formRef = ref();

const scrollToFirstError = useScrollToFirstError();

const validate = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate();
    return true;
  } catch {
    scrollToFirstError(formRef.value);
    return false;
  }
};

const getData = (): ResourceFormSubmitPayload => {
  return {
    title: state.title,
    districtId: state.district as number,
    purposesIds: state.purposes,
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
    provider: state.provider,
    roomName: state.roomName,
    maxCapacity: state.maxCapacity,
    roomSizeSqm: state.roomSizeSqm,
    accessibilityState: state.accessibilityState,
    accessibilityInfo: state.accessibilityInfo,
    facilities: state.facilities,
    facilitiesAdditionalInfo: state.facilitiesAdditionalInfo,
    usageHours: state.usageHours,
    usageFeeDetails: state.usageFeeDetails,
    contactPerson: state.contactPerson,
    contactEmail: state.contactEmail,
    contactPhone: state.contactPhone,
  };
};

defineExpose({ validate, getData });

const submitLabel = computed(() =>
  isEditForm.value
    ? $t('berlin_resource_form_saveChanges')
    : $t('berlin_resource_form_submit')
);
const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (isSubmitting.value) {
    return;
  }

  submitting.value = true;

  try {
    emit('submit', getData());
  } finally {
    submitting.value = false;
  }
};
</script>
