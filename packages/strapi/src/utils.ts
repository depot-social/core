import type { Context } from 'koa';

type StrapiRequestContext = {
  state?: {
    route?: {
      info?: {
        type?: string;
      };
    };
  };
  request?: {
    path?: string;
  };
};

type AnyContext = Context | StrapiRequestContext | (Context & StrapiRequestContext) | any;

export const isAdminOrBackofficeRequest = (ctx: AnyContext): boolean => {
  const routeType = ctx?.state?.route?.info?.type;
  const requestPath = ctx?.request?.path ?? '';
  const isContentApiRequest = routeType === 'content-api';

  return (
    !isContentApiRequest ||
    requestPath.startsWith('/content-manager/') ||
    requestPath.startsWith('/admin')
  );
};

export const readBooleanEnv = (
  value: string | undefined,
  defaultValue = false,
): boolean => {
  if (value === null || typeof value === 'undefined') return defaultValue;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true'].includes(normalized)) return true;
  if (['0', 'false'].includes(normalized)) return false;

  return defaultValue;
};

