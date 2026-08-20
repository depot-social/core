<template>
  <main class="bg-secondary">
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
            class="container pt-4 flex flex-col items-center text-center"
          >
            <div
              class="alert alert-error mt-2 max-w-2xl"
              role="alert"
              aria-live="assertive"
            >
              {{ errorMessage }}
            </div>
          </div>

          <BerlinResourceForm
            :form="resourceFormData"
            :district="districts"
            :categories="categories"
            :loading="submitting"
            @submit="onSubmit"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Category, District, Resource, User } from '@depot/shared';
import { EmptyResource, PriceTariffType } from '@depot/shared';
import { reactive, ref } from 'vue';
import type { ResourceFormSubmitPayload } from '~/berlin-ausleihe/components/resource-form/types';

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

const categoriesResponse = await find<Category>('categories', {
  sort: ['title:asc'],
});

const districts = districtsResponse.data || null;
const categories = categoriesResponse.data || [];

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
    const sharedPriceFields = {
      currency: payload.price.currency,
      durationType: payload.price.durationType,
      vatValue: payload.price.vatValue,
      depositValue: payload.price.depositValue ?? undefined,
    };

    const prices = [
      {
        ...sharedPriceFields,
        tariffType: PriceTariffType.NOT_FOR_PROFIT,
        value: payload.price.discountedValue,
      },
      ...(payload.price.regularValue != null
        ? [
            {
              ...sharedPriceFields,
              tariffType: PriceTariffType.REGULAR,
              value: payload.price.regularValue,
            },
          ]
        : []),
    ];

    const requestBody: Record<string, unknown> = {
      title: payload.title,
      description: payload.description,
      categories: payload.categoryIds.map((id) => ({ id })),
      district: { id: payload.districtId },
      prices,
      address: {
        street: payload.address.street,
        zip: payload.address.zip,
        place: payload.address.place,
        latitude: payload.geoData?.latitude ?? null,
        longitude: payload.geoData?.longitude ?? null,
      },
      user: user.value?.id,
    };

    const _response = await create<Resource>('resources', requestBody);

    toast.add({
      title: $t('berlin_resource_form_successTitle'),
      description: $t('berlin_resource_form_successDescription'),
    });

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
