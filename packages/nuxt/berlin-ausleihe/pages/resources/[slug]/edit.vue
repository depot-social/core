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
          <BerlinResourceFormSidebar
            :title="fetchedResource.title"
            :images="fetchedResource.images"
          />
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
            :is-edit-form="true"
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
import type { Ref } from 'vue';
import { reactive, ref } from 'vue';
import type { ResourceFormSubmitPayload } from '~/berlin-ausleihe/components/resource-form/types';
import { AUTHORIZATION_ERROR, PAGE_NOT_FOUND } from '~/base/utils/errors';

useHead({
  title: $t('resourceEdit_pageTitle'),
});

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const localePath = useLocalePath();
const slug = route.params.slug as string;

if (!slug) {
  throw createError({
    statusCode: 404,
    statusMessage: PAGE_NOT_FOUND,
  });
}

const { find, update } = useStrapi();
const pricesEnabled = usePricesEnabled();
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

const resourceResponse = await useAsyncData(`resource-edit-${slug}`, () =>
  find<Resource>('resources', {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: [
      'address',
      'availabilities',
      'categories',
      'district',
      'images',
      'user',
      ...(pricesEnabled.value ? ['prices'] : []),
    ],
  })
);

const fetchedResources = resourceResponse.data.value?.data ?? [];

if (!resourceResponse.data || fetchedResources.length === 0) {
  throw createError({
    statusCode: 404,
    statusMessage: PAGE_NOT_FOUND,
  });
}

const fetchedResource = fetchedResources[0] as unknown as Resource;

if (!user.value || fetchedResource.user?.id !== user.value.id) {
  throw createError({
    statusCode: 403,
    statusMessage: AUTHORIZATION_ERROR,
  });
}

Object.assign(resourceFormData, fetchedResource);

const toast = useToast();
const submitting = ref(false);
const errorMessage = ref('');

const onSubmit = async (payload: ResourceFormSubmitPayload) => {
  if (submitting.value) {
    return;
  }

  if (!resourceFormData.documentId) {
    throw new Error('Missing resource document id');
  }

  submitting.value = true;
  errorMessage.value = '';

  try {
    const requestBody: Record<string, unknown> = {
      title: payload.title,
      description: payload.description,
      availableUnits: payload.availableUnits,
      categories: payload.categoryIds.map((id) => ({ id })),
      district: { id: payload.districtId },
      address: {
        street: payload.address.street,
        zip: payload.address.zip,
        place: payload.address.place,
        latitude: payload.geoData?.latitude ?? null,
        longitude: payload.geoData?.longitude ?? null,
      },
    };

    // The form only holds newly uploaded images, so append them to the existing ones
    if (payload.images.length > 0) {
      const existingImageIds = (fetchedResource.images ?? []).map(
        (image) => image.id
      );

      requestBody.images = [
        ...new Set([...existingImageIds, ...payload.images]),
      ];
    }

    if (pricesEnabled.value && payload.price) {
      const sharedPriceFields = {
        currency: payload.price.currency,
        durationType: payload.price.durationType,
        vatValue: payload.price.vatValue,
        depositValue: payload.price.depositValue ?? undefined,
      };

      requestBody.prices = [
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
    }

    const response = await update<Resource>(
      'resources',
      resourceFormData.documentId,
      requestBody
    );

    toast.add({
      title: $t('resourceForm_successTitle'),
      description: $t('resourceForm_successDescription'),
    });

    const updatedSlug = response?.data?.slug ?? resourceFormData.slug;
    await navigateTo(
      localePath(
        updatedSlug
          ? { name: 'resources-slug', params: { slug: updatedSlug } }
          : { name: 'resources' }
      )
    );
  } catch (error) {
    if (import.meta.dev) {
      console.error('Resource update failed:', error);
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
