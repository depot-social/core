import type { PublicRuntimeConfig } from 'nuxt/schema';

/**
 * Feature flags from `runtimeConfig.public.features`.
 * Defaults are set in berlin-raum/nuxt.config.ts, deployments override them via env,
 * e.g. NUXT_PUBLIC_FEATURES_RESOURCE_EDITING=true
 */
export type FeatureName = keyof PublicRuntimeConfig['features'];

export const useFeature = () => {
  const config = useRuntimeConfig();

  const isEnabled = (name: FeatureName) =>
    config.public.features[name] === true;

  return {
    isEnabled,
  };
};
