<template>
  <div class="bg-[#D4AFFF]">
    <div
      class="px-6 xl:px-0 md:py-6 grid grid-cols-12 gap-5 max-w-[1620px] mx-auto"
    >
      <div
        class="col-span-12 xl:col-span-10 xl:col-start-2 grid grid-cols-12 gap-5"
      >
        <div
          class="col-span-12 md:col-span-5 md:sticky md:top-[20px] self-start mb-8"
        >
          <BerlinRaffleEntryFormSidebar />
        </div>

        <div class="col-span-12 md:col-span-7 md:col-start-6 lg:col-start-7">
          <div
            v-if="errorMessage"
            class="col-span-12 md:col-span-7 md:col-start-6 lg:col-start-7 flex flex-col items-center text-center"
          >
            <div class="alert alert-error mt-2 font-semibold" role="alert">
              {{ errorMessage }}
            </div>
          </div>

          <BerlinRaffleEntryForm ref="raffleEntryFormRef" class="mb-10" />

          <BerlinResourceForm
            ref="resourceFormRef"
            :district="district"
            :purposes="purposes"
            :loading="submitting"
            :hide-submit="true"
          >
            <template #additional-agreements>
              <UFormField
                name="acceptTerms"
                :ui="{
                  label: 'font-light text-base h-max',
                  labelWrapper: '',
                }"
                class="mt-2"
              >
                <template #label>
                  <div class="flex items-start gap-2">
                    <UCheckbox
                      v-model="acceptTerms"
                      size="xl"
                      :ui="{
                        container: 'h-max',
                        base: 'w-8! h-8! md:w-10! md:h-10! border-black ring-black rounded-full',
                        indicator: 'p-1',
                      }"
                      required
                    />
                    <p
                      class="ml-2 text-lg lg:text-2lg leading-snug font-light tracking-[-1%]"
                    >
                      Ich akzeptiere die
                      <NuxtLinkLocale
                        to="/teilnahme-und-vergabebedingungen"
                        class="underline underline-offset-3 decoration-[1px] font-light! text-black!"
                        target="_blank"
                      >
                        {{
                          'Teilnahme- und Vergabebedingungen'
                        }} </NuxtLinkLocale
                      >.
                    </p>
                  </div>
                </template>

                <template #error>
                  <p
                    v-if="termsError"
                    class="mt-2 text-error font-text font-bold text-sm"
                  >
                    {{ $t('berlin_raffle_form_acceptTermsRequired') }}
                  </p>
                </template>
              </UFormField>

              <UFormField name="acceptPrivacy" class="mt-2">
                <template #label>
                  <div class="flex items-start gap-2">
                    <UCheckbox
                      v-model="acceptPrivacy"
                      size="xl"
                      :ui="{
                        container: 'h-max',
                        base: 'w-8! h-8! md:w-10! md:h-10! border-black ring-black rounded-full',
                        indicator: 'p-1',
                      }"
                      required
                    />
                    <p
                      class="ml-2 text-lg lg:text-2lg leading-snug font-light tracking-[-1%]"
                    >
                      Ich habe die
                      <NuxtLink
                        class="underline underline-offset-3 decoration-[1px] font-light! text-black!"
                        to="https://engagiertes.berlin/de/datenschutz/"
                        target="_blank"
                        external
                      >
                        {{ 'Datenschutzhinweise' }}
                      </NuxtLink>
                      zur Kenntnis genommen.
                    </p>
                  </div>
                </template>
                <template #error>
                  <p
                    v-if="privacyError"
                    class="mt-2 text-error font-text font-bold text-sm"
                  >
                    {{ $t('berlin_raffle_form_acceptPrivacyRequired') }}
                  </p>
                </template>
              </UFormField>
            </template>
          </BerlinResourceForm>

          <div class="flex flex-col gap-4 w-full mb-12">
            <UButton
              :loading="submitting"
              :disabled="submitting"
              @click="onSubmit"
            >
              {{ $t('berlin_raffle_form_submitLabel') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { District, Purpose } from '@depot/shared';
import { ref, watch } from 'vue';
import type { ResourceFormSubmitPayload } from '~/berlin/components/resource-form/types';

definePageMeta({
  middleware: 'auth',
});

useHead({
  title: $t('resourceAdd_pageTitle'),
});

const { find, create } = useStrapi();
const { createPublicResource } = usePublicResourceSubmit();

const districtsResponse = await find<District>('districts', {
  sort: ['name:asc'],
});

const purposesResponse = await find<Purpose>('purposes', {
  sort: ['title:asc'],
});

const district = districtsResponse.data || null;
const purposes = purposesResponse.data || [];

const toast = useToast();
const submitting = ref(false);
const errorMessage = ref('');
const acceptTerms = ref(false);
const acceptPrivacy = ref(false);
const termsError = ref(false);
const privacyError = ref(false);

const raffleEntryFormRef = ref<{
  validate: () => Promise<boolean>;
  getData: () => {
    provider: string;
    legalEntityType: string;
    contactPerson: string;
    address: { street: string; zip: string; city: string };
    raffleEmail: string;
    contactPhone: string;
  };
}>();

const resourceFormRef = ref<{
  validate: () => Promise<boolean>;
  getData: () => ResourceFormSubmitPayload;
}>();

// Inline validation for checkboxes
watch(acceptTerms, (val) => {
  if (val) termsError.value = false;
});
watch(acceptPrivacy, (val) => {
  if (val) privacyError.value = false;
});

const onSubmit = async () => {
  if (submitting.value) {
    return;
  }

  // Validate all forms in parallel so all errors show at once
  const [raffleValid, resourceValid] = await Promise.all([
    raffleEntryFormRef.value?.validate() ?? Promise.resolve(false),
    resourceFormRef.value?.validate() ?? Promise.resolve(false),
  ]);

  // Check agreement checkboxes
  termsError.value = !acceptTerms.value;
  privacyError.value = !acceptPrivacy.value;

  const allValid =
    raffleValid && resourceValid && !termsError.value && !privacyError.value;

  if (!allValid) {
    return;
  }

  const raffleData = raffleEntryFormRef.value!.getData();
  const resourceData = resourceFormRef.value!.getData();

  submitting.value = true;
  errorMessage.value = '';

  try {
    // Step 1: Create the resource
    const requestBody: Record<string, unknown> = {
      title: resourceData.title,
      images: resourceData.images,
      categories: [1], // Hardcoded category ID "räume" for raum submissions
      purposes: resourceData.purposesIds.map((id) => ({ id })),
      district: { id: resourceData.districtId },
      address: {
        street: resourceData.address.street,
        zip: resourceData.address.zip,
        place: resourceData.address.place,
        latitude: resourceData.geoData?.latitude ?? null,
        longitude: resourceData.geoData?.longitude ?? null,
      },
      resourceTypes: [
        {
          __component: 'resource-types.berlin-resource-type',
          provider: resourceData.provider,
          roomName: resourceData.roomName,
          maxCapacity: resourceData.maxCapacity,
          roomSizeSqm: resourceData.roomSizeSqm,
          facilities: resourceData.facilities,
          facilitiesAdditionalInfo: resourceData.facilitiesAdditionalInfo,
          accessibilityState: resourceData.accessibilityState,
          accessibilityInfo: resourceData.accessibilityInfo,
          usageHours: resourceData.usageHours,
          usageFeeDetails: resourceData.usageFeeDetails,
          contactPerson: resourceData.contactPerson,
          contactEmail: resourceData.contactEmail,
          contactPhone: resourceData.contactPhone,
        },
      ],
      user: 1, // hardcoded user ID "engagiertes.berlin" for raum submissions
    };

    const resourceResponse = await createPublicResource(requestBody);
    const createdResourceId = resourceResponse?.data?.documentId;

    // Step 2: Send raffle entry email with resource reference
    try {
      await create<unknown>('emails/raffle-entry', {
        ...raffleData,
        acceptTerms: acceptTerms.value,
        acceptPrivacy: acceptPrivacy.value,
        resource: {
          id: createdResourceId,
        },
      });
    } catch (emailError: unknown) {
      console.error('Raffle entry email failed:', emailError);
      toast.add({
        title: $t('berlin_raffle_form_emailError'),
        color: 'warning',
      });
      // Don't fail the whole submission — the resource was already created
    }

    toast.add({
      title: $t('berlin_resource_form_successTitle'),
      description: $t('berlin_resource_form_successDescription'),
    });

    // const slug = response?.data?.slug;
    // TODO: Thank you for entry page
    await navigateTo('/schluessel-tresor-vergabe/danke');
  } catch (error) {
    console.error('Resource creation failed:', error);
    errorMessage.value = $t('resourceForm_submissionError');
    toast.add({
      title: $t('resourceForm_submissionError'),
      color: 'error',
    });
  } finally {
    submitting.value = false;
  }
};

useHead({
  bodyAttrs: {
    class: 'raffle-entry-form',
  },
});
</script>
