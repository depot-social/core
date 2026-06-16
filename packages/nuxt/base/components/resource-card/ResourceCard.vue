<template>
  <div class="group rounded-xl duration-300 hover:scale-[1.05]">
    <NuxtLink :to="getResourcePath(resource.slug)">
      <div
        class="relative w-full rounded-xl overflow-hidden aspect-square bg-orange-100"
      >
        <NuxtImg
          v-if="resourceImages && resourceImages[0]?.url"
          :src="resourceImages[0].url"
          :width="imageSize"
          :height="imageSize"
          :alt="resourceImages[0].alternativeText ?? ''"
          class="object-cover aspect-square"
        />
        <figure v-else class="absolute inset-0 grid place-content-center">
          <img src="/placeholder.svg" :alt="$t('placeholder')" />
        </figure>
        <div v-if="isOrganization" class="absolute top-2 right-2">
          <span class="badge badge-sm badge-transparent">
            {{ $t('nonprofitActor') }}
          </span>
        </div>
        <div
          class="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute inset-0 bg-[rgba(0,0,0,0.35)] p-4 text-white backdrop-blur"
        >
          <div v-if="regularPrice" class="stat flex flex-col">
            <div class="stat-value text-2lg">
              {{ priceToString(regularPrice.value) }}
            </div>
            <div class="stat-title text-gray-100">
              {{
                regularPrice.durationType === 'daily'
                  ? $t('perDay')
                  : $t('perHour')
              }}
            </div>
          </div>
          <div v-if="notForProfitPrice" class="stat flex flex-col">
            <div class="stat-value text-2lg">
              {{ priceToString(notForProfitPrice.value) }}
            </div>
            <div class="stat-title text-gray-100">
              {{
                notForProfitPrice.durationType === 'daily'
                  ? $t('perDay')
                  : $t('perHour')
              }}
            </div>
            <div class="stat-desc flex items-center gap-1 text-gray-300">
              {{ $t('forNonprofits') }}
            </div>
          </div>
        </div>
      </div>
      <h2 class="text-md pt-3 text-black">{{ resource.title }}</h2>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Resource } from '@depot/shared';
import {
  PriceTariffType,
  getPriceByPriceTariff,
  priceToString,
} from '@depot/shared';
import { computed } from 'vue';
import { getResourcePath } from '~/base/utils/paths';

interface Props {
  resource: Resource;
  imageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  imageSize: 365,
});

const resourceImages = computed(() => props.resource.images ?? []);

const isOrganization = computed(() => {
  return (
    typeof props.resource.user !== 'undefined' &&
    typeof props.resource.user.organization !== 'undefined'
  );
});

const regularPrice = computed(() => {
  return getPriceByPriceTariff(
    props.resource.prices || [],
    PriceTariffType.REGULAR
  );
});

const notForProfitPrice = computed(() => {
  return getPriceByPriceTariff(
    props.resource.prices || [],
    PriceTariffType.NOT_FOR_PROFIT
  );
});
</script>
