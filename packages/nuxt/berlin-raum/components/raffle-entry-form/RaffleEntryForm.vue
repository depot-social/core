<template>
  <UForm ref="formRef" :schema="schema" :state="state" class="w-full">
    <section class="flex flex-col mb-16">
      <h1 class="font-bold! text-2lg! md:text-3xl! -mt-2 mb-1.5">
        {{ $t('berlin_raffle_form_generalTitle') }}
      </h1>

      <details class="mt-2 mb-8" v-if="raffleDescriptionData" open>
        <summary
          class="cursor-pointer font-semibold text-base md:text-lg font-semibold underline decoration-2 underline-offset-3 decoration-black/50 leading-tight"
        >
          <span class="ml-1.5">
            {{ raffleDescriptionData.question }}
          </span>
        </summary>

        <div
          class="mt-3 pl-5 flex flex-col gap-2 *:font-light *:text-base md:*:text-lg *:text-black"
          v-html="marked(raffleDescriptionData.answer)"
        />
      </details>

      <div id="raffle-entry" class="flex flex-col gap-4 w-full">
        <div>
          <h2>
            {{ $t('berlin_raffle_form_sectionTitle') }}
          </h2>
          <p class="text-black font-light text-base md:text-lg">
            {{ $t('berlin_raffle_form_sectionDescription') }}
          </p>
        </div>

        <UFormField
          :label="$t('berlin_raffle_form_provider')"
          name="provider"
          required
        >
          <UInput
            v-model="state.provider"
            :placeholder="$t('berlin_raffle_form_providerPlaceholder')"
          />
        </UFormField>

        <UFormField
          :label="$t('berlin_raffle_form_legalEntityType')"
          name="legalEntityType"
          required
        >
          <UInput
            v-model="state.legalEntityType"
            :placeholder="$t('berlin_raffle_form_legalEntityTypePlaceholder')"
          />
        </UFormField>

        <UFormField
          :label="$t('berlin_raffle_form_contactPerson')"
          name="contactPerson"
          required
        >
          <UInput v-model="state.contactPerson" />
        </UFormField>

        <UFormField
          :label="$t('berlin_resource_address')"
          name="address.street"
          required
        >
          <UInput v-model="state.address.street" />
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
              :ui="{ base: 'rounded-md' }"
            />
          </UFormField>

          <UFormField
            class="basis-2/3"
            :label="$t('address_city')"
            name="address.city"
            required
          >
            <UInput v-model="state.address.city" />
          </UFormField>
        </div>

        <UFormField
          :label="$t('berlin_raffle_form_raffleEmail')"
          name="raffleEmail"
          required
        >
          <UInput v-model="state.raffleEmail" type="email" />
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
          />
        </UFormField>
      </div>
    </section>
  </UForm>
</template>

<script setup lang="ts">
import type { BerlinRaffleEntry } from '@depot/shared';
import { marked } from 'marked';
import * as v from 'valibot';
import { useScrollToFirstError } from '~/berlin-raum/composables/useScrollToFirstError';

const { find } = useStrapi();

interface Props {
  form?: BerlinRaffleEntry;
  isEditForm?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isEditForm: false,
  loading: false,
});

const schema = v.object({
  provider: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  legalEntityType: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
  contactPerson: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
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
    city: v.pipe(
      v.string(),
      v.nonEmpty($t('validation_required')),
      v.minLength(2, $t('validation_minLength2'))
    ),
  }),
  raffleEmail: v.pipe(
    v.string(),
    v.nonEmpty($t('validation_required')),
    v.email($t('validation_email'))
  ),
  contactPhone: v.pipe(v.string(), v.nonEmpty($t('validation_required'))),
});

type RaffleFormState = v.InferInput<typeof schema>;

const buildInitialState = (entry?: BerlinRaffleEntry): RaffleFormState => {
  return {
    provider: entry?.provider ?? '',
    legalEntityType: entry?.legalEntityType ?? '',
    contactPerson: entry?.contactPerson ?? '',
    address: {
      street: entry?.address?.street ?? '',
      zip: entry?.address?.zip ?? '',
      city: entry?.address?.city ?? '',
    },
    raffleEmail: entry?.raffleEmail ?? '',
    contactPhone: entry?.contactPhone ?? '',
  };
};

const state = reactive<RaffleFormState>(buildInitialState(props.form));

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

const getData = (): RaffleFormState => {
  return JSON.parse(JSON.stringify(state));
};

defineExpose({ validate, getData });

// Fetch single FAQ by slug
const { data: raffleDescriptionData } = await useAsyncData(
  'raffle-desc',
  async () => {
    const response = await find<{
      slug: string;
      question: string;
      answer: string;
    }>('faqs', {
      filters: {
        slug: {
          $eq: 'vergabe-schluessel-tresor', // slug also mandatory in production strapi
        },
      },
    });

    return response.data?.[0] ?? null;
  }
);
</script>
