# Strapi plugin search

Generic, reusable search across any content-type. Provides full-text matching
(auto-discovered from the schema, including components and dynamic zones) plus
facet counts.

## Endpoint

```
GET /api/search/:uid?q=<term>&filters[...]&sort=...&pagination[page]=1&pagination[pageSize]=16&locale=de
```

- `:uid` accepts a full UID (`api::resource.resource`) or a singular/plural name (`resource` / `resources`).
- `q` free-text query, matched case-insensitively across all searchable fields.
- `filters` standard Strapi filters, used for facet selections (applied at DB level).
- Response: `{ results, pagination, facets }`.

## Configuration

Configured per content-type in `config/plugins.ts` under `search.config.contentTypes`.
Without config, top-level text fields are searched. For components, dynamic zones,
facets and result display, configure `searchFields` + `populate` explicitly (this
also bounds the fields for performance):

```ts
search: {
  enabled: env('STRAPI_PLUGIN_SEARCH', true),
  resolve: './src/plugins/search',
  config: {
    contentTypes: {
      'api::resource.resource': {
        searchFields: [
          'title',
          'description',
          'address.street',
          'resourceTypes.provider',
          'resourceTypes.facilities',
          'resourceTypes.facilitiesAdditionalInfo',
        ],
        facets: [
          { field: 'purposes', labelField: 'title' },
          { field: 'categories', labelField: 'title' },
          { field: 'attributes.attribute', labelField: 'value' },
        ],
        populate: {
          address: true,
          resourceTypes: true,
          images: true,
          purposes: true,
          categories: true,
          attributes: { populate: { attribute: true } },
        },
      },
    },
  },
},
```

- `searchFields` — dot-path fields matched by the free-text `q` (in-memory, reaches dynamic zones).
- `populate` — must cover every relation used by `searchFields`, `facets` and result display.

## Notes / limitations

- Free-text matching runs in-memory (over up to `maxResults` rows) so it can
  reach dynamic zone fields, which Strapi cannot filter at the DB level.
- Facet counts are computed over the current matched set.
- Suited for datasets up to a few thousand rows per content-type.
