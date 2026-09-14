export const AUTHORIZATION_ERROR = 'Authorization required';
export const MISSING_PARAMETERS_ERROR = 'Missing URL parameters';
export const PAGE_NOT_FOUND = 'Page not found';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const getStrapiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (!isRecord(error) || !isRecord(error.error)) {
    return fallback;
  }

  const message = error.error.message;

  return typeof message === 'string' && message.trim() ? message : fallback;
};
