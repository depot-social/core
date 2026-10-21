import type { Core } from '@strapi/strapi';

type ContentTypeUID = Parameters<Core.Strapi['documents']>[0];

/** Hidden attribute each configured content-type declares (type `text`, `visible: false`). */
export const SEARCH_INDEX_FIELD = 'searchIndex';

const REINDEX_BATCH_SIZE = 100;

export interface ContentTypeSearchConfig {
  /** Field paths (dot notation) concatenated into the search index. */
  searchFields: string[];
  /** Strapi populate object — must cover the relations used by searchFields. */
  populate?: Record<string, unknown>;
}

type IndexedEntry = { id: number; [SEARCH_INDEX_FIELD]?: string | null };

export interface SearchService {
  getContentTypes(): ContentTypeUID[];
  reindex(uid: ContentTypeUID, id: number): Promise<void>;
  reindexAll(uid: ContentTypeUID): Promise<void>;
}

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

export const buildSearchIndex = (entry: unknown, fields: string[]): string =>
  fields
    .flatMap((path) => collectAtPath(entry, path))
    .filter(
      (value): value is string | number =>
        typeof value === 'string' || typeof value === 'number'
    )
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join('\n');

export default ({ strapi }: { strapi: Core.Strapi }): SearchService => {
  const getConfigs = () =>
    (strapi.plugin('search').config('contentTypes') ?? {}) as Record<
      string,
      ContentTypeSearchConfig
    >;

  const writeIndex = async (
    uid: ContentTypeUID,
    entry: IndexedEntry
  ): Promise<void> => {
    const value = buildSearchIndex(entry, getConfigs()[uid].searchFields);
    if (entry[SEARCH_INDEX_FIELD] === value) return;

    const { tableName, attributes } = strapi.db.metadata.get(uid);
    const { columnName } = attributes[SEARCH_INDEX_FIELD] as {
      columnName: string;
    };

    // Raw update: does not trigger the lifecycles again. `db.transaction` joins
    // the transaction of the save that triggered the lifecycle (row lock).
    await strapi.db.transaction(({ trx }) =>
      trx(tableName)
        .where({ id: entry.id })
        .update({ [columnName]: value })
    );
  };

  return {
    getContentTypes() {
      return Object.keys(getConfigs()) as ContentTypeUID[];
    },

    async reindex(uid, id) {
      const entry = await strapi.db.query(uid).findOne({
        where: { id },
        populate: getConfigs()[uid].populate,
      });

      if (entry) await writeIndex(uid, entry);
    },

    async reindexAll(uid) {
      for (let offset = 0; ; offset += REINDEX_BATCH_SIZE) {
        const entries = await strapi.db.query(uid).findMany({
          populate: getConfigs()[uid].populate,
          orderBy: { id: 'asc' },
          offset,
          limit: REINDEX_BATCH_SIZE,
        });

        for (const entry of entries) await writeIndex(uid, entry);

        if (entries.length < REINDEX_BATCH_SIZE) return;
      }
    },
  };
};
