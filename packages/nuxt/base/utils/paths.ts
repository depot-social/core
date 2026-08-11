// Global pages paths
// @todo connect with useLocalePath (https://i18n.nuxtjs.org/docs/composables/use-locale-path)
export const getFaqsPath = (anchor?: string): string =>
  `/faqs${anchor ? `#${anchor}` : ''}`;

export const getResourcePath = (slug: string): string => `/resources/${slug}`;

export const getResourcesPath = (): string => `/resources`;

export const getResourcesAddPath = (): string => `/resources/add`;

export const getLoginPath = (redirectPath?: string): string =>
  redirectPath
    ? `/user/login?redirect=${encodeURIComponent(redirectPath)}`
    : `/user/login`;

export const getRegisterPath = (): string => `/user/register`;

export const getRequestResetPasswordPath = (): string =>
  `/user/request-reset-password`;

export const getUserProfilePath = (): string => `/user`;

export const getUserChatPath = (): string => `/user/chat`;

export const getUserSettingsPath = (): string => `/user/settings`;

export const getBookingPath = (documentId: string) => `/bookings/${documentId}`;

export const getBookingsAddPath = (): string => `/bookings/add`;

export const getBlogPath = (): string => `/blog`;

export const getAboutPath = (): string => `/ueber-depot`;

export const getImpressPath = (): string => `/impressum`;

export const getPrivacyPath = (): string => `/datenschutz`;
