# Resource Search Index

## Overview

This MVP search index solution makes fields from resource components and dynamic zones searchable by merging them into the `description` field, which is already indexed by the search functionality.

## Fields Indexed

- **Provider** (from `resource-types.berlin-resource-type`)
- **Facilities** (from `resource-types.berlin-resource-type`)
- **Additional Facilities** (from `resource-types.berlin-resource-type`)
- **Street** (from `custom.address`)

## How It Works

### Automatic Sync
The search index is automatically maintained through Strapi lifecycle hooks:
- **On Create**: Search index is generated and appended to description
- **On Update**: Existing search index is replaced with updated data

### Format
The search index is appended to the description field as markdown with clear markers:

```markdown
<!-- SEARCH_INDEX_START -->
### Search Index
**Provider:** [provider name]
**Facilities:** [facilities list]
**Additional Facilities:** [additional info]
**Street:** [street address]
<!-- SEARCH_INDEX_END -->
```

This format:
- ✅ Is searchable (Strapi $contains filter works on it)
- ✅ Uses markdown formatting
- ✅ Is clearly separated with HTML comments
- ✅ Can be hidden in frontend rendering if needed
- ✅ Automatically updates when source fields change

## Files

- **Lifecycle hooks**: `packages/strapi/src/api/resource/index.ts`
- **Helper functions**: `packages/strapi/src/api/resource/search-index-helper.ts`

## Usage

### For New Resources
Nothing needed - search index is automatically created/updated on save.

### For Existing Resources
To update existing resources, manually edit and save them in the Strapi admin, or update them programmatically through the API - the lifecycle hooks will automatically rebuild the search index.

## Set Database Index

For performance reasons you should add a fulltext index on the searchable columns:
```sql
ALTER TABLE `resources` ADD FULLTEXT `RESOURCE_SEARCH_INDEX` (`title`, `description`);
```

## Frontend Integration

The search already works! The `useResourcesSearch` composable searches the `description` field:

```typescript
filters: {
  $or: state.value.searchQuery
    ? [
        {
          title: {
            $contains: state.value.searchQuery,
          },
        },
        {
          description: {
            $contains: state.value.searchQuery,
          },
        },
      ]
    : undefined,
  // ...
}
```

Now searching for provider names, facilities, or street addresses will return matching resources.

## Future Enhancements

- Add more fields to the search index as needed
- Implement full-text search plugin for better performance at scale
- Add search index versioning
- Create admin UI to preview search index
