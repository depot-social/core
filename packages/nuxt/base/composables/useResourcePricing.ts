import { computed } from 'vue';
import type { Resource } from '@depot/shared';
import {
  PriceTariffType,
  getPriceByPriceTariff,
  priceToString,
} from '@depot/shared';

export const useResourcePricing = (resource: Resource) => {
  const regularPrice = computed(() => {
    return getPriceByPriceTariff(
      resource.prices || [],
      PriceTariffType.REGULAR
    );
  });

  const notForProfitPrice = computed(() => {
    return getPriceByPriceTariff(
      resource.prices || [],
      PriceTariffType.NOT_FOR_PROFIT
    );
  });

  const deposit = computed(() => {
    return regularPrice.value
      ? regularPrice.value.depositValue
      : notForProfitPrice.value
      ? notForProfitPrice.value.depositValue
      : null;
  });

  const isNotForProfitOnly = computed(() => {
    return notForProfitPrice.value && !regularPrice.value;
  });

  const formatPrice = (price: any): string => {
    return priceToString(price.value);
  };

  const getDurationText = (price: any): string => {
    return price.durationType === 'daily' ? 'pro Tag' : 'pro Stunde';
  };

  return {
    regularPrice,
    notForProfitPrice,
    deposit,
    isNotForProfitOnly,
    formatPrice,
    getDurationText,
  };
};
