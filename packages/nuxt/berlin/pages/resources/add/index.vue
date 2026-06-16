<template>
  <div class="bg-secondary">
    <div
      class="px-6 xl:px-0 grid grid-cols-12 gap-5 max-w-[1620px] mx-auto pt-6 lg:pt-16"
    >
      <div
        class="col-span-12 xl:col-span-10 xl:col-start-2 grid grid-cols-12 gap-5"
      >
        <div
          class="col-span-12 md:col-span-4 md:sticky md:top-[20px] self-start mb-8"
        >
          <BerlinResourceFormSidebar />
        </div>

        <div class="col-span-12 md:col-span-7 md:col-start-6">
          <div
            v-if="errorMessage"
            class="col-span-12 md:col-span-7 md:col-start-6 flex flex-col items-center text-center"
          >
            <div class="alert alert-error mt-2 font-semibold" role="alert">
              {{ errorMessage }}
            </div>
          </div>

          <BerlinResourceForm
            :form="resourceFormData"
            :district="district"
            :purposes="purposes"
            :loading="submitting"
            @update:form="(val: Partial<Resource>) => Object.assign(resourceFormData, val)"
            @submit="onSubmit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { District, Purpose, Resource, User } from '@depot/shared';
import { EmptyResource } from '@depot/shared';
import { reactive, ref } from 'vue';
import type { ResourceFormSubmitPayload } from '~/berlin/components/resource-form/types';

useHead({
  title: $t('resourceAdd_pageTitle'),
});

definePageMeta({
  middleware: 'auth',
});

const { find, create } = useStrapi();
const user = useStrapiUser() as Ref<User | null>;

const districtsResponse = await find<District>('districts', {
  sort: ['name:asc'],
});

const purposesResponse = await find<Purpose>('purposes', {
  sort: ['title:asc'],
});

const district = districtsResponse.data || null;
const purposes = purposesResponse.data || [];

const resourceFormData = reactive<Resource>(EmptyResource());

const toast = useToast();
const submitting = ref(false);
const errorMessage = ref('');

const onSubmit = async (payload: ResourceFormSubmitPayload) => {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  errorMessage.value = '';

  try {
    const requestBody: Record<string, unknown> = {
      title: payload.title,
      images: payload.images,
      categories: [1], // Hardcoded category ID "räume" for raum submissions
      purposes: payload.purposesIds.map((id) => ({ id })),
      district: { id: payload.districtId },
      address: {
        street: payload.address.street,
        zip: payload.address.zip,
        place: payload.address.place,
        latitude: payload.geoData?.latitude ?? null,
        longitude: payload.geoData?.longitude ?? null,
      },
      resourceTypes: [
        {
          __component: 'resource-types.berlin-resource-type',
          provider: payload.provider,
          roomName: payload.roomName,
          maxCapacity: payload.maxCapacity,
          roomSizeSqm: payload.roomSizeSqm,
          facilities: payload.facilities,
          facilitiesAdditionalInfo: payload.facilitiesAdditionalInfo,
          accessibilityState: payload.accessibilityState,
          accessibilityInfo: payload.accessibilityInfo,
          usageHours: payload.usageHours,
          usageFeeDetails: payload.usageFeeDetails,
          contactPerson: payload.contactPerson,
          contactEmail: payload.contactEmail,
          contactPhone: payload.contactPhone,
        },
      ],
      user: user.value?.id,
    };

    const _response = await create<Resource>('resources', requestBody);

    toast.add({
      title: $t('berlin_resource_form_successTitle'),
      description: $t('berlin_resource_form_successDescription'),
    });

    // const slug = response?.data?.slug; // resources will be in draft for now
    await navigateTo('user');
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
</script>
