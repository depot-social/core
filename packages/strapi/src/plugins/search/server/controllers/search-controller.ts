import type { Core } from '@strapi/strapi';
import { StrapiContext } from '@depot/shared';
import type { SearchParams, SearchService } from '../services/search-service';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async search(ctx: StrapiContext) {
    const { uid } = ctx.params;

    if (!uid) {
      ctx.throw(400, 'Missing content-type identifier');
    }

    const { q, filters, sort, pagination, locale } = ctx.query;

    const searchService: SearchService = strapi
      .plugin('search')
      .service('searchService');

    try {
      ctx.body = await searchService.search(uid, {
        q: typeof q === 'string' ? q : undefined,
        filters: filters as SearchParams['filters'],
        sort,
        pagination: pagination as SearchParams['pagination'],
        locale: typeof locale === 'string' ? locale : undefined,
      });
    } catch (error) {
      const err = error as { name?: string; message?: string };

      if (err.name === 'NotFoundError') {
        ctx.throw(404, err.message ?? 'Not found');
      }

      strapi.log.error(`[search] ${err.message ?? String(error)}`);
      ctx.throw(500, 'Search failed');
    }
  },
});
