<template>
  <UForm
    :schema="schema"
    :state="state"
    class="flex flex-col gap-4"
    @submit="onSubmit"
  >
    <UFormField :label="$t('profile_email')" name="email" required>
      <UInput
        v-model="state.email"
        type="email"
        variant="soft"
        :disabled="isEditForm"
        :required="!isEditForm"
      />
    </UFormField>

    <template v-if="!isEditForm">
      <UFormField :label="$t('profile_password')" name="password" required>
        <UInput
          v-model="state.password"
          variant="soft"
          type="password"
          required
        />
      </UFormField>

      <UFormField
        :label="$t('profile_confirmPassword')"
        name="confirmPassword"
        required
      >
        <UInput
          v-model="state.confirmPassword"
          variant="soft"
          type="password"
          required
        />
      </UFormField>
    </template>

    <div class="flex flex-col gap-2.5 md:flex-row">
      <UFormField
        :label="$t('profile_salutation')"
        class="basis-2/12"
        name="salutation"
      >
        <USelect
          v-model="state.salutation"
          :items="salutationItems"
          :ui="{
            content: 'px-0',
          }"
          variant="soft"
          value-key="value"
          placeholder="Wähle Anrede"
        />
      </UFormField>

      <UFormField
        :label="$t('profile_firstName')"
        class="basis-5/12"
        name="firstName"
        required
      >
        <UInput v-model="state.firstName" variant="soft" required />
      </UFormField>

      <UFormField
        :label="$t('profile_lastName')"
        class="basis-5/12"
        name="lastName"
        required
      >
        <UInput v-model="state.lastName" variant="soft" required />
      </UFormField>
    </div>

    <UFormField
      :label="$t('berlin_profile_organizationName')"
      name="organizationName"
    >
      <UInput v-model="state.organizationName" variant="soft" />
    </UFormField>

    <div class="flex flex-col gap-2.5 md:flex-row *:flex-1">
      <UFormField :label="$t('berlin_profile_linkUrl')" name="link.url">
        <UInput
          v-model="state.link.url"
          type="url"
          inputmode="url"
          variant="soft"
          placeholder="https://"
          autocomplete="url"
        />

        <template #help>
          {{ $t('berlin_profile_linkUrlHelp') }}
        </template>
      </UFormField>

      <UFormField :label="$t('berlin_profile_linkTitle')" name="link.title">
        <UInput v-model="state.link.title" variant="soft" />

        <template #help>
          {{ $t('berlin_profile_linkTitleHelp') }}
        </template>
      </UFormField>
    </div>

    <UFormField :label="$t('profile_phone')" name="phone">
      <UInput
        v-model="state.phone"
        type="tel"
        variant="soft"
        placeholder="z.B. +491612345678"
        autocomplete="tel"
      />
    </UFormField>

    <UFormField :label="$t('address_street')" name="address.street">
      <UInput
        v-model="state.address.street"
        variant="soft"
        :placeholder="$t('address_streetPlaceholder')"
        autocomplete="street-address"
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
          variant="soft"
          inputmode="numeric"
          autocomplete="postal-code"
        />
      </UFormField>

      <UFormField
        class="basis-2/3"
        :label="$t('address_city')"
        name="address.place"
      >
        <UInput
          v-model="state.address.place"
          variant="soft"
          autocomplete="address-level2"
        />
      </UFormField>
    </div>

    <UFormField
      v-if="!isEditForm"
      :label="$t('register_termsAndPrivacy')"
      name="acceptTermsAndPrivacy"
    >
      <UCheckbox
        v-model="state.acceptTermsAndPrivacy"
        required
        :label="$t('register_acceptTermsAndPrivacy')"
      />
    </UFormField>

    <UButton
      type="submit"
      variant="outline"
      class="mt-4"
      :loading="loading"
      :disabled="loading"
    >
      {{ submitLabel }}
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import * as v from 'valibot';
import { defineEmits, defineProps, withDefaults } from 'vue';
import type {
  UserProfileFormInitialData,
  UserProfileFormSubmitPayload,
  UserSalutation,
} from './types';

interface Props {
  isEditForm?: boolean;
  loading?: boolean;
  initialData?: UserProfileFormInitialData;
}

const props = withDefaults(defineProps<Props>(), {
  isEditForm: false,
  loading: false,
});

const emit = defineEmits<{
  submit: [payload: UserProfileFormSubmitPayload];
}>();

const isEditForm = computed(() => props.isEditForm);
const loading = computed(() => props.loading);
const salutationItems = [
  { label: $t('profile_salutationMrs'), value: 'mrs' },
  { label: $t('profile_salutationMr'), value: 'mr' },
  { label: $t('profile_salutationNa'), value: 'na' },
];
const phonePattern = /^\+\d[\d\s()/-]{5,}$/;

const schema = computed(() =>
  v.pipe(
    v.object({
      email: v.pipe(
        v.string(),
        v.nonEmpty($t('validation_required')),
        v.email($t('validation_invalidEmail'))
      ),
      password: isEditForm.value
        ? v.optional(v.string())
        : v.pipe(
            v.string(),
            v.nonEmpty($t('validation_required')),
            v.minLength(6, $t('validation_minLength')),
            v.maxLength(30, $t('validation_maxLength')),
            v.regex(/[a-z]/, $t('validation_passwordLowercase')),
            v.regex(/[A-Z]/, $t('validation_passwordUppercase'))
          ),
      confirmPassword: isEditForm.value ? v.optional(v.string()) : v.string(),
      firstName: v.pipe(
        v.string(),
        v.nonEmpty($t('validation_required')),
        v.minLength(2, $t('validation_minLength2')),
        v.maxLength(36, $t('validation_maxLength36'))
      ),
      lastName: v.pipe(
        v.string(),
        v.nonEmpty($t('validation_required')),
        v.minLength(2, $t('validation_minLength2')),
        v.maxLength(36, $t('validation_maxLength36'))
      ),
      organizationName: v.pipe(v.string()),
      link: v.object({
        url: v.union([
          v.literal(''),
          v.pipe(v.string(), v.trim(), v.url($t('validation_invalidUrl'))),
        ]),
        title: v.pipe(v.string(), v.trim()),
      }),
      salutation: v.optional(v.picklist(['mrs', 'mr', 'na'])),
      phone: v.pipe(
        v.optional(v.string()),
        v.check(
          (input) =>
            input == null ||
            input.trim() === '' ||
            phonePattern.test(input.trim()),
          $t('validation_invalidPhone')
        )
      ),
      address: v.object({
        street: v.optional(v.string()),
        zip: v.pipe(
          v.optional(v.string()),
          v.check(
            (input) =>
              input == null || input.trim() === '' || /^\d{5}$/.test(input),
            $t('address_zipLength')
          )
        ),
        place: v.optional(v.string()),
      }),
      acceptTermsAndPrivacy: isEditForm.value
        ? v.optional(v.boolean())
        : v.boolean($t('validation_consentRequired')),
    }),
    v.forward(
      v.partialCheck(
        [['password'], ['confirmPassword']],
        (input) =>
          isEditForm.value ||
          input.password === undefined ||
          input.password === input.confirmPassword,
        $t('validation_passwordsMustMatch')
      ),
      ['confirmPassword']
    )
  )
);

type UserProfileFormState = v.InferInput<(typeof schema)['value']>;

const buildInitialState = (
  initialData?: UserProfileFormInitialData
): UserProfileFormState => ({
  email: initialData?.email ?? '',
  password: '',
  confirmPassword: '',
  firstName: initialData?.firstName ?? '',
  lastName: initialData?.lastName ?? '',
  salutation: initialData?.salutation as UserSalutation | undefined,
  organizationName: initialData?.organizationName ?? '',
  link: {
    url: initialData?.link?.url ?? '',
    title: initialData?.link?.title ?? '',
  },
  phone: initialData?.phone ?? '',
  address: {
    street: initialData?.address?.street ?? '',
    zip: initialData?.address?.zip ?? '',
    place: initialData?.address?.place ?? '',
  },
  acceptTermsAndPrivacy: false,
});

const state = reactive<UserProfileFormState>(
  buildInitialState(props.initialData)
);

watch(
  () => props.initialData,
  (newData) => {
    Object.assign(state, buildInitialState(newData));
  },
  { deep: true }
);

const submitLabel = computed(() =>
  isEditForm.value ? $t('userProfileForm_saveChanges') : $t('register_signUp')
);

const onSubmit = (event: Event) => {
  event.preventDefault();

  const payload: UserProfileFormSubmitPayload = {
    email: state.email.trim(),
    firstName: state.firstName.trim(),
    lastName: state.lastName.trim(),
    address: {
      street: state.address.street?.trim() || undefined,
      zip: state.address.zip?.trim() || undefined,
      place: state.address.place?.trim() || undefined,
    },
  };

  const salutation = state.salutation;
  if (salutation) {
    payload.salutation = salutation;
  }

  const phone = state.phone?.trim();
  if (phone) {
    payload.phone = phone;
  }

  const organizationName = state.organizationName?.trim();
  if (organizationName) {
    payload.organizationName = organizationName;
  }

  const linkUrl = state.link.url.trim();
  if (linkUrl) {
    payload.link = {
      url: linkUrl,
      title: state.link.title.trim() || undefined,
    };
  }

  const password = state.password?.trim();
  if (!isEditForm.value && password) {
    payload.password = password;
  }

  emit('submit', payload);
};
</script>
