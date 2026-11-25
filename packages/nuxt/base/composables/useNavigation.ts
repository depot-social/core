import type { NavigationMenuItem } from '@nuxt/ui';

/** Navigation item as rendered by strapi-plugin-navigation (`type=TREE`) */
type StrapiNavigationItem = {
  title: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'WRAPPER';
  path?: string | null;
  externalPath?: string | null;
  items?: StrapiNavigationItem[];
  additionalFields?: { icon?: string | null; comingSoon?: boolean };
};

/**
 * Loads a navigation from strapi-plugin-navigation and maps it to Nuxt UI menu items.
 * Icons are Phosphor names (e.g. `key`), relative paths are app routes,
 * absolute URLs open in a new tab.
 * @example const { data: items } = await useNavigation('main');
 */
export const useNavigation = (slug: string) => {
  const client = useStrapiClient();
  const { t } = useI18n();

  const toMenuItem = (item: StrapiNavigationItem): NavigationMenuItem => {
    const comingSoon = item.additionalFields?.comingSoon === true;
    const to =
      item.type === 'WRAPPER' ? undefined : item.externalPath ?? item.path;

    return {
      label: item.title,
      icon: item.additionalFields?.icon
        ? `i-ph-${item.additionalFields.icon}`
        : undefined,
      to: comingSoon ? undefined : to ?? undefined,
      target: to?.startsWith('http') ? '_blank' : undefined,
      disabled: comingSoon,
      badge: comingSoon ? t('navigation_comingSoon') : undefined,
      children: item.items?.length ? item.items.map(toMenuItem) : undefined,
    };
  };

  return useAsyncData(
    `navigation-${slug}`,
    () =>
      client<StrapiNavigationItem[]>(`/navigation/render/${slug}`, {
        params: { type: 'TREE' },
      }),
    { transform: (items) => items.map(toMenuItem), default: () => [] }
  );
};
