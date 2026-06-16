<template>
  <UForm :schema="schema" :state="state" class="w-full" @submit="onSubmit">
    <!-- Form Section 1: General -->
    <section class="flex flex-col gap-6">
      <h2 class="font-semibold text-xl mt-6 mb-1.5">
        {{ $t('berlin_booking_form_generalTitle') }}
      </h2>

      <div class="flex flex-col gap-4 w-full">
        <UFormField
          :label="$t('berlin_booking_form_projectTitle')"
          name="projectTitle"
        >
          <UInput v-model="state.projectTitle" required />
        </UFormField>

        <UFormField
          :label="$t('berlin_booking_form_projectDescription')"
          name="projectDescription"
        >
          <UTextarea
            v-model="state.projectDescription"
            :rows="6"
            :maxlength="250"
            required
          />
          <template #help>
            <span class="text-sm text-gray-500">
              {{ state.projectDescription.length }}/250
              {{ $t('berlin_booking_form_characters') }}
            </span>
          </template>
        </UFormField>

        <UFormField
          :label="$t('berlin_booking_form_associationRegistrationNumber')"
          name="associationRegistrationNumber"
        >
          <UInput v-model="state.associationRegistrationNumber" />
        </UFormField>

        <UFormField
          :label="$t('berlin_booking_form_projectWebsite')"
          name="projectWebsite"
        >
          <UInput
            v-model="state.projectWebsite"
            type="url"
            :placeholder="$t('berlin_booking_form_projectWebsitePlaceholder')"
          />
        </UFormField>
      </div>
    </section>

    <!-- Form Section 2: Details -->
    <section class="flex flex-col gap-6 mt-24">
      <h2 class="font-semibold text-xl mt-6 mb-1.5">
        {{ $t('berlin_booking_form_detailsTitle') }}
      </h2>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField :label="$t('berlin_booking_form_intend')" name="intend">
            <USelect
              v-model="state.intend"
              :items="intendOptions"
              :ui="{
                content: 'px-0',
              }"
              size="xl"
              required
            />
          </UFormField>

          <UFormField
            :label="$t('berlin_booking_form_personCount')"
            name="personCount"
          >
            <USelect
              v-model="state.personCount"
              :items="personCountOptions"
              :ui="{
                content: 'px-0',
              }"
              size="xl"
              required
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField :label="$t('berlin_booking_form_start')" name="start">
            <UInput
              v-model="state.start"
              size="xl"
              :class="'w-full'"
              type="date"
              :min="today"
              :ui="{
                base: 'bg-white py-4 px-4 text-lg rounded-md ring-inset ring-transparent focus-visible:ring-0',
              }"
              required
            />
          </UFormField>

          <UFormField :label="$t('berlin_booking_form_end')" name="end">
            <UInput
              v-model="state.end"
              size="xl"
              :class="'w-full'"
              type="date"
              :min="today"
              :ui="{
                base: 'bg-white py-4 px-4 text-lg rounded-md ring-inset ring-transparent focus-visible:ring-0',
              }"
              required
            />
          </UFormField>
        </div>
      </div>
    </section>

    <!-- Form Section 3: Contact -->
    <section class="flex flex-col gap-6 mt-24">
      <h2 class="font-semibold text-xl mt-6 mb-1.5">
        {{ $t('berlin_booking_form_contactTitle') }}
      </h2>

      <div class="flex flex-col gap-4">
        <UFormField
          :label="$t('berlin_booking_form_contactName')"
          name="contactName"
        >
          <UInput v-model="state.contactName" required />
        </UFormField>

        <UFormField
          :label="$t('berlin_booking_form_contactEmail')"
          name="contactEmail"
        >
          <UInput v-model="state.contactEmail" type="email" required />
        </UFormField>

        <UFormField
          :label="$t('berlin_booking_form_contactPhone')"
          name="contactPhone"
        >
          <UInput v-model="state.contactPhone" type="tel" required />
        </UFormField>

        <UFormField name="acceptAGB" class="mt-12">
          <template #label>
            <div class="flex items-center gap-2">
              <UCheckbox
                v-model="state.acceptAGB"
                size="xl"
                :ui="{
                  base: 'w-8! h-8! md:w-10! md:h-10! border-black ring-black rounded-full',
                  indicator: 'p-1',
                }"
                required
              />
              <!-- eslint-disable vue/no-v-html -->
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
                von engagiertes.berlin gelesen und stimme den Leitlinien für
                eine faire Raumnutzung zu.
              </p>
              <!--eslint-enable-->
            </div>
          </template>
        </UFormField>
      </div>
    </section>

    <div class="flex mt-7 mb-8 md:mt-28">
      <UButton type="submit" :loading="submitting" :disabled="submitting">
        {{ $t('berlin_booking_form_requestBooking') }}
      </UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import type { BerlinBooking } from '@depot/shared';
import { BerlinBookingIntend, BerlinBookingPersonCount } from '@depot/shared';
import * as v from 'valibot';

interface Props {
  formData: Partial<BerlinBooking>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: Partial<BerlinBooking>];
}>();

// Form schema definition
const schema = v.pipe(
  v.object({
    // General section
    projectTitle: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(2, $t('validation_minLength2'))
    ),
    projectDescription: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.maxLength(250, $t('berlin_booking_form_maxLength250'))
    ),
    associationRegistrationNumber: v.string(),
    projectWebsite: v.pipe(v.string(), v.url($t('validation_invalidUrl'))),

    // Details section
    intend: v.pipe(v.string()),
    personCount: v.pipe(v.string()),
    start: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
    end: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),

    // Contact section
    contactName: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(2, $t('validation_minLength2'))
    ),
    contactEmail: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.email($t('validation_invalidEmail'))
    ),
    contactPhone: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(5, $t('validation_minLength5'))
    ),
    acceptAGB: v.pipe(
      v.boolean(),
      v.transform((val) => val === true)
    ),
  })
);

type BerlinBookingForm = v.InferInput<typeof schema>;

const state = reactive<BerlinBookingForm>({
  projectTitle: props.formData.projectTitle || '',
  projectDescription: props.formData.projectDescription || '',
  associationRegistrationNumber:
    props.formData.associationRegistrationNumber || '',
  projectWebsite: props.formData.projectWebsite || '',
  intend: props.formData.intend || BerlinBookingIntend.OPEN_EVENT,
  personCount:
    props.formData.personCount || BerlinBookingPersonCount.ONE_TO_TEN,
  start: props.formData.start || '',
  end: props.formData.end || '',
  contactName: props.formData.contactName || '',
  contactEmail: props.formData.contactEmail || '',
  contactPhone: props.formData.contactPhone || '',
  acceptAGB: props.formData.acceptAGB || false,
});

const submitting = ref(false);

// Select options
const intendOptions = [
  {
    label: BerlinBookingIntend.OPEN_EVENT,
    value: BerlinBookingIntend.OPEN_EVENT,
  },
  {
    label: BerlinBookingIntend.COMMUNITY_COOKING,
    value: BerlinBookingIntend.COMMUNITY_COOKING,
  },
  {
    label: BerlinBookingIntend.YOUTH_PROJECTS,
    value: BerlinBookingIntend.YOUTH_PROJECTS,
  },
  {
    label: BerlinBookingIntend.QUIET_MEETING,
    value: BerlinBookingIntend.QUIET_MEETING,
  },
  {
    label: BerlinBookingIntend.MOVE,
    value: BerlinBookingIntend.MOVE,
  },
  {
    label: BerlinBookingIntend.MUSIC_AND_SINGING,
    value: BerlinBookingIntend.MUSIC_AND_SINGING,
  },
  {
    label: BerlinBookingIntend.LEARNING_TOGETHER,
    value: BerlinBookingIntend.LEARNING_TOGETHER,
  },
];

const personCountOptions = [
  { label: '1-10', value: BerlinBookingPersonCount.ONE_TO_TEN },
  { label: '10-20', value: BerlinBookingPersonCount.TEN_TO_TWENTY },
  { label: '20-30', value: BerlinBookingPersonCount.TWENTY_TO_THIRTY },
  { label: '30-40', value: BerlinBookingPersonCount.THIRTY_TO_FOURTY },
  { label: '40-50', value: BerlinBookingPersonCount.FOURTY_TO_FIFTY },
  { label: '50+', value: BerlinBookingPersonCount.FIFTY_PLUS },
];

const today = computed(() => new Date().toISOString().split('T')[0]);

const onSubmit = async (event: Event) => {
  event.preventDefault();

  if (submitting.value) {
    return;
  }

  submitting.value = true;

  try {
    const bookingData: Partial<BerlinBooking> = {
      ...state,
      intend: state.intend as BerlinBookingIntend,
      personCount: state.personCount as BerlinBookingPersonCount,
    };

    emit('submit', bookingData);
  } finally {
    submitting.value = false;
  }
};
</script>
