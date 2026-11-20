import type { ResourcesQuery } from '@depot/shared';

const allowedKeys = new Set([
  'q',
  'categoryIds',
  'districtIds',
  'purposeIds',
  'excludeDocumentId',
  'page',
  'pageSize',
  'sort',
]);

/** Closed input contract: never forward arbitrary Strapi query parameters. */
export const parseResourcesQuery = (
  query: Record<string, unknown>
): ResourcesQuery => {
  const invalid = () => {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid resource query',
    });
  };
  if (Object.keys(query).some((key) => !allowedKeys.has(key))) invalid();
  const result: ResourcesQuery = {};
  for (const key of [
    'q',
    'categoryIds',
    'districtIds',
    'purposeIds',
    'excludeDocumentId',
    'sort',
  ] as const) {
    const value = query[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') invalid();
    const input = String(value);
    if (key === 'q') {
      if (input.length > 256) invalid();
      result.q = input;
    } else if (key === 'sort') {
      if (input !== 'default' && input !== 'pinned-title') invalid();
      result.sort = input as ResourcesQuery['sort'];
    } else if (key === 'excludeDocumentId') {
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(input)) invalid();
      result.excludeDocumentId = input;
    } else {
      if (
        !/^[1-9]\d*(,[1-9]\d*)*$/.test(input) ||
        input.split(',').length > 100
      )
        invalid();
      if (input.split(',').some((id) => !Number.isSafeInteger(Number(id))))
        invalid();
      result[key] = input;
    }
  }
  for (const key of ['page', 'pageSize'] as const) {
    const value = query[key];
    if (value === undefined) continue;
    if (
      (typeof value !== 'string' && typeof value !== 'number') ||
      !/^\d+$/.test(String(value))
    )
      invalid();
    const number = Number(value);
    if (
      !Number.isSafeInteger(number) ||
      number < 1 ||
      number > (key === 'pageSize' ? 1000 : 1000000)
    )
      invalid();
    result[key] = number;
  }
  return result;
};

export const buildResourceFilters = (query: ResourcesQuery, layer: string) => {
  const filters: Record<string, unknown> = {};
  for (const [key, relation] of [
    ['categoryIds', 'categories'],
    ['districtIds', 'district'],
    ['purposeIds', 'purposes'],
  ] as const) {
    if (query[key])
      filters[relation] = { id: { $in: query[key].split(',').map(Number) } };
  }
  if (query.excludeDocumentId)
    filters.documentId = { $ne: query.excludeDocumentId };
  const text = layer === 'base' ? query.q : query.q?.trim();
  if (text && (layer === 'base' || text.length >= 3)) {
    if (layer === 'base')
      filters.$or = [
        { title: { $contains: text } },
        { description: { $contains: text } },
      ];
    else filters.searchIndex = { $containsi: text };
  }
  return filters;
};
