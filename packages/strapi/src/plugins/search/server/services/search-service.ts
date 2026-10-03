import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

type ContentTypeUID = Parameters<Core.Strapi['documents']>[0];

/**
 * Collections exposed via the search endpoint, mapped from the public URL name
 * (`GET /api/search/<name>`) to its content-type UID. Add an entry here to make
 * another collection searchable.
 */
const SEARCHABLE_COLLECTIONS: Record<string, ContentTypeUID> = {
  resources: 'api::resource.resource',
};

const SEARCHABLE_TYPES = new Set(['string', 'text', 'richtext', 'email']);
const DEFAULT_MAX_RESULTS = 2000;
const DEFAULT_PAGE_SIZE = 16;

interface Attribute {
  type: string;
}

interface Schema {
  attributes?: Record<string, Attribute>;
}

export interface FacetConfig {
  /** Dot path to the related objects to count, e.g. 'purposes' or 'attributes.attribute'. */
  field: string;
  /** Field on the related object used as human-readable label, e.g. 'title' or 'value'. */
  labelField: string;
}

export interface ContentTypeSearchConfig {
  /** Explicit, performance-bounded list of searchable field paths (dot notation). */
  searchFields?: string[];
  /** Facets to compute counts for. */
  facets?: FacetConfig[];
  /** Strapi populate object — must cover the relations used by searchFields, facets and display. */
  populate?: Record<string, unknown>;
  /** Upper bound of rows scanned per request. Overrides the plugin-level default. */
  maxResults?: number;
  /** Which publication state to search. Defaults to 'published'. */
  status?: 'published' | 'draft';
}

export interface SearchParams {
  q?: string;
  filters?: Record<string, unknown>;
  sort?: unknown;
  pagination?: { page?: number | string; pageSize?: number | string };
  locale?: string;
}

export interface FacetBucket {
  key: string;
  label: string;
  count: number;
}

export interface SearchResult {
  results: unknown[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  facets: Record<string, FacetBucket[]>;
}

export interface SearchService {
  search(uidOrName: string, params: SearchParams): Promise<SearchResult>;
  resolveUid(uidOrName: string): ContentTypeUID;
}

export default ({ strapi }: { strapi: Core.Strapi }): SearchService => {
  const getContentTypeSchema = (uid: ContentTypeUID): Schema =>
    strapi.contentType(uid) as unknown as Schema;

  /** Resolves a public collection name to its content-type UID via the allowlist. */
  const resolveUid = (name: string): ContentTypeUID => {
    const uid = SEARCHABLE_COLLECTIONS[name];
    if (!uid) {
      throw new errors.NotFoundError(`Collection "${name}" is not searchable`);
    }
    return uid;
  };

  /** Fallback when no searchFields are configured: top-level text fields only. */
  const topLevelTextFields = (schema: Schema): string[] =>
    Object.entries(schema.attributes ?? {})
      .filter(([, attr]) => SEARCHABLE_TYPES.has(attr.type))
      .map(([name]) => name);

  /** Follows a dot path through an object, flattening arrays (repeatable components, dynamic zones, relations). */
  const collectAtPath = (obj: unknown, path: string): unknown[] => {
    let current: unknown[] = [obj];

    for (const segment of path.split('.')) {
      const next: unknown[] = [];
      for (const item of current) {
        if (item == null || typeof item !== 'object') continue;
        const value = (item as Record<string, unknown>)[segment];
        if (Array.isArray(value)) next.push(...value);
        else if (value != null) next.push(value);
      }
      current = next;
    }

    return current;
  };

  const matchesQuery = (
    item: unknown,
    fields: string[],
    query: string
  ): boolean => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;

    return fields.some((path) =>
      collectAtPath(item, path).some(
        (value) =>
          (typeof value === 'string' || typeof value === 'number') &&
          String(value).toLowerCase().includes(needle)
      )
    );
  };

  const computeFacets = (
    items: unknown[],
    facets: FacetConfig[]
  ): Record<string, FacetBucket[]> => {
    const result: Record<string, FacetBucket[]> = {};

    for (const facet of facets) {
      const buckets = new Map<string, FacetBucket>();

      for (const item of items) {
        const objects = collectAtPath(item, facet.field).filter(
          (o): o is Record<string, unknown> =>
            o != null && typeof o === 'object'
        );

        for (const obj of objects) {
          const key = String(
            obj.slug ?? obj.documentId ?? obj.id ?? obj[facet.labelField] ?? ''
          );
          if (!key) continue;

          const existing = buckets.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            buckets.set(key, {
              key,
              label: String(obj[facet.labelField] ?? key),
              count: 1,
            });
          }
        }
      }

      result[facet.field] = [...buckets.values()].sort(
        (a, b) => b.count - a.count
      );
    }

    return result;
  };

  return {
    resolveUid,
    async search(uidOrName, params) {
      const uid = resolveUid(uidOrName);
      const schema = getContentTypeSchema(uid);

      const contentTypes = (strapi.plugin('search').config('contentTypes') ??
        {}) as Record<string, ContentTypeSearchConfig>;
      const config = contentTypes[uid] ?? {};

      const maxResults =
        config.maxResults ??
        (strapi.plugin('search').config('maxResults') as number | undefined) ??
        DEFAULT_MAX_RESULTS;

      const searchFields =
        config.searchFields && config.searchFields.length > 0
          ? config.searchFields
          : topLevelTextFields(schema);

      const facets = config.facets ?? [];

      const page = Math.max(1, Number(params.pagination?.page ?? 1));
      const pageSize = Math.max(
        1,
        Number(params.pagination?.pageSize ?? DEFAULT_PAGE_SIZE)
      );

      // Facet selections arrive as standard Strapi filters and are applied at the
      // DB level. Free-text matching runs in-memory so it can also reach dynamic
      // zone fields, which Strapi cannot filter directly.
      const candidates = await strapi.documents(uid).findMany({
        filters: params.filters ?? {},
        populate: config.populate,
        sort: params.sort as never,
        locale: params.locale,
        status: config.status ?? 'published',
        start: 0,
        limit: maxResults,
      });

      const matched = params.q
        ? candidates.filter((item) =>
            matchesQuery(item, searchFields, params.q as string)
          )
        : candidates;

      const total = matched.length;
      const start = (page - 1) * pageSize;

      return {
        results: matched.slice(start, start + pageSize),
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize) || 1,
          total,
        },
        facets: computeFacets(matched, facets),
      };
    },
  };
};
