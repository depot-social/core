<template>
  <main class="bg-orange-100 min-h-screen">
    <div
      v-if="errorMessage"
      class="container pt-4 flex flex-col items-center text-center"
    >
      <div class="alert alert-error mt-2 max-w-2xl" role="alert" aria-live="assertive">
        {{ errorMessage }}
      </div>
    </div>

    <div class="container py-8 md:py-10 lg:py-12">
      <div
        class="w-full flex flex-col items-start gap-6 md:gap-8 rounded-3xl bg-base-100 p-6 md:p-10 lg:p-12"
      >
        <button
          type="button"
          class="link no-underline text-orange-800 hover:text-orange-700"
          @click="$router.back()"
        >
          <i class="ph ph-arrow-left" aria-hidden="true" /> {{ $t('backToPreviousPage') }}
        </button>

        <div
          class="w-full rounded-2xl bg-orange-100 px-5 py-4 md:px-6 md:py-5"
        >
          <h1 class="text-2xl md:text-3xl font-semibold text-black mt-2">
            {{ $t('resourceAdd_title') }}
          </h1>
          <p class="text-base text-gray-800 max-w-3xl mt-2">
            {{ $t('resourceAdd_description') }}
          </p>
        </div>

        <BaseResourceForm
          class="w-full"
          :form="resourceFormData"
          :categories="categories"
          :loading="submitting"
          @submit="onSubmit"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Category, Resource, User } from '@depot/shared';
import { EmptyResource, PriceTariffType } from '@depot/shared';
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import { getResourcePath, getResourcesPath } from '~/base/utils/paths';
import type { ResourceFormSubmitPayload } from '~/base/components/resource-form/types';

useHead({
  title: $t('resourceAdd_pageTitle'),
});

definePageMeta({
  middleware: 'auth',
});

const { find, create } = useStrapi();
const user = useStrapiUser() as Ref<User | null>;

const categoriesResponse = await find<Category>('categories', {
  sort: ['title:asc'],
});

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

    const response = await create<Resource>('resources', requestBody);

    toast.add({
      title: $t('resourceForm_successTitle'),
      description: $t('resourceForm_successDescription'),
    });

    const slug = response?.data?.slug;
    await navigateTo(slug ? getResourcePath(slug) : getResourcesPath());
  } catch (error) {
    if (import.meta.dev) {
      console.error('Resource creation failed:', error);
    }
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

