import type { Core } from '@strapi/strapi';
import type { SearchService } from './services/search-service';

type LifecycleEvent = {
  model: { uid: string };
  result?: { id?: number };
};

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const searchService: SearchService = strapi
    .plugin('search')
    .service('searchService');

  const uids = searchService.getContentTypes();
  if (uids.length === 0) return;

  // Fill the search index on every save (draft and published are separate rows).
  const reindexSavedEntry = async ({ model, result }: LifecycleEvent) => {
    if (!result?.id) return;

    await searchService.reindex(model.uid as (typeof uids)[number], result.id);
  };

  strapi.db.lifecycles.subscribe({
    models: uids,
    afterCreate: reindexSavedEntry,
    afterUpdate: reindexSavedEntry,
  });

  // Backfill existing entries and pick up changed searchFields.
  for (const uid of uids) {
    await searchService.reindexAll(uid);
  }
};
