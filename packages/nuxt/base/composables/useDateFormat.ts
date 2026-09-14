import { computed } from 'vue';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const dateFnsLocales = { de };

/**
 * Formats dates with the locale selected by Nuxt i18n.
 *
 * Date-fns ships its locales separately from `@nuxtjs/i18n`, so this bridges
 * Nuxt's locale code to the corresponding date-fns locale. German is the
 * application's fallback locale until additional locales are configured.
 */
export const useDateFormat = () => {
  const { locale } = useI18n();
  const dateFnsLocale = computed(
    () => dateFnsLocales[locale.value as keyof typeof dateFnsLocales] ?? de
  );

  const formatDate = (
    date: Parameters<typeof format>[0],
    formatString: string
  ) => format(date, formatString, { locale: dateFnsLocale.value });

  return { formatDate };
};
