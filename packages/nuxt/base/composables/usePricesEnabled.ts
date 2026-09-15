import { computed } from 'vue';

export const usePricesEnabled = () => {
  const config = useRuntimeConfig();

  return computed(() => config.public.pricesEnabled === true);
};
