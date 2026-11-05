# Strapi plugin search

Fills a hidden `searchIndex` field with the concatenated contents of the
configured fields (incl. components and dynamic zones) on every create/update.
Searching runs through the standard Strapi Content API, so auth, filters,
populate permissions, pagination and controller hooks keep working.

## Usage

```
GET /api/resources?filters[searchIndex][$containsi]=<term>&pagination[page]=1
```

## Setup

1. Hidden attribute in the content-type schema (not shown in the admin):

   ```json
   "searchIndex": { "type": "text", "visible": false, "configurable": false }
   ```

2. Fields in `config/plugins.ts` under `search.config.contentTypes`:

   ```ts
   'api::resource.resource': {
     searchFields: ['title', 'description', 'address.street', 'resourceTypes.provider'],
     populate: { address: true, resourceTypes: true },
   },
   ```

- `searchFields` — dot paths, arrays (repeatable components, dynamic zones) are flattened.
- `populate` — must cover every component/relation used by `searchFields`.

## Notes

- All entries are reindexed on Strapi start (backfill + changed `searchFields`).
- The resource controller strips `searchIndex` from responses, since it contains
  the street, which is redacted for anonymous users.
- `$containsi` becomes `LIKE '%term%'`; a regular index does not help with the
  leading wildcard. For large datasets use a `FULLTEXT` (MySQL) or trigram
  (Postgres `pg_trgm`) index on `resources.search_index`.
