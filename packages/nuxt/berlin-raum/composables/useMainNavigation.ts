import type { NavigationMenuItem } from '@nuxt/ui';

/**
 * Structure and icons (Phosphor names) of the engagiertes.berlin main navigation.
 * Labels and URLs per item live in i18n under `berlin_mainNav.<group>.items.<key>`.
 */
const GROUPS = {
  moreOffers: {
    funding: 'bank',
    lending: 'archive',
    competences: 'certificate',
    trainings: 'student',
    awards: 'trophy',
    events: 'calendar-dots',
    digitalHelpers: 'toolbox',
  },
  knowledge: {
    counseling: undefined,
    fundingPrograms: undefined,
    articles: undefined,
  },
  social: {
    newsletter: 'envelope-simple',
    instagram: 'instagram-logo',
  },
} satisfies Record<string, Record<string, string | undefined>>;

/**
 * engagiertes.berlin main navigation, shared by all Berlin instances (Raum, Ausleihe).
 * Hard coded on purpose: one source for all subdomains, unlike the instance menus in Strapi.
 */
export const useMainNavigation = () => {
  const { t } = useI18n();

  const link = (key: string, icon?: string): NavigationMenuItem => ({
    label: t(`berlin_mainNav.${key}.label`),
    to: t(`berlin_mainNav.${key}.url`),
    icon: icon ? `i-ph-${icon}` : undefined,
    target: '_blank',
  });

  const items = (group: keyof typeof GROUPS) =>
    Object.entries(GROUPS[group]).map(([key, icon]) =>
      link(`${group}.items.${key}`, icon)
    );

  const home = computed(() => link('home'));

  const groups = computed<NavigationMenuItem[][]>(() => [
    [
      { label: t('berlin_mainNav.moreOffers.title'), type: 'label' },
      ...items('moreOffers'),
    ],
    [
      { label: t('berlin_mainNav.knowledge.title'), type: 'label' },
      ...items('knowledge'),
    ],
  ]);

  const social = computed(() => items('social'));

  return { home, groups, social };
};
