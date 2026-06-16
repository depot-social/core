import { getLoginPath } from '~/base/utils/paths';

const isSafeInternalRedirect = (value: unknown): value is string => {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
  );
};

export const getSafeRedirectPath = (value: unknown): string | null => {
  return isSafeInternalRedirect(value) ? value : null;
};

export const useAuthRedirect = () => {
  const route = useRoute();

  const redirectToLoginWithToast = async (redirectPath?: string) => {
    const targetPath = getSafeRedirectPath(redirectPath ?? route.fullPath);
    const loginPath = getLoginPath(targetPath ?? undefined);
    const separator = loginPath.includes('?') ? '&' : '?';
    return navigateTo(`${loginPath}${separator}auth_required=1`);
  };

  return {
    redirectToLoginWithToast,
  };
};
