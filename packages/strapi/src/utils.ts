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

type DocumentRelation = {
  documentId?: unknown;
  id?: unknown;
  connect?: unknown;
  set?: unknown;
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue || undefined;
};

/**
 * Reads a Strapi v5 document ID from a relation payload.
 *
 * The `id` fallback accepts requests sent by clients during the v4-to-v5
 * transition, where the document ID was already a string but was still placed
 * in the old property. Callers should normalize such payloads to `documentId`
 * before passing them to Strapi.
 */
export const getRelationDocumentId = (value: unknown): string | undefined => {
  const directDocumentId = asNonEmptyString(value);

  if (directDocumentId) {
    return directDocumentId;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const relation = value as DocumentRelation;
  const objectDocumentId = asNonEmptyString(relation.documentId);

  if (objectDocumentId) {
    return objectDocumentId;
  }

  const transitionalDocumentId = asNonEmptyString(relation.id);

  if (transitionalDocumentId) {
    return transitionalDocumentId;
  }

  const relationOperation = relation.set ?? relation.connect;
  const relationValues = Array.isArray(relationOperation)
    ? relationOperation
    : [relationOperation];

  for (let index = relationValues.length - 1; index >= 0; index -= 1) {
    const nestedDocumentId = getRelationDocumentId(relationValues[index]);

    if (nestedDocumentId) {
      return nestedDocumentId;
    }
  }

  return undefined;
};
