/**
 * Search Index Helper
 * Manages search index synchronization in the resource description field
 */
import type {
  Address,
  BerlinResourceType,
  Resource,
  ResourceType,
  ResourceTypeComponent,
} from '@depot/shared';
import type { Core } from '@strapi/strapi';

const SEARCH_INDEX_START = '<!-- SEARCH_INDEX_START -->';
const SEARCH_INDEX_END = '<!-- SEARCH_INDEX_END -->';

/** Partial resource type with optional id for fetching */
type PartialResourceType = Partial<ResourceType> & {
  __component: ResourceTypeComponent;
  id?: number;
};

/** Data structure for search index building */
interface SearchIndexData {
  description?: string | null;
  resourceTypes?: PartialResourceType[];
  address?: Partial<Address>;
}

/** Where clause for update operations */
interface UpdateWhereClause {
  id?: number;
}

/** Type for existing resource with populated relations */
type PopulatedResource = Pick<
  Resource,
  'description' | 'resourceTypes' | 'address'
>;

/**
 * Fetches full component data for Berlin resource types
 */
async function fetchFullResourceTypes(
  resourceTypes: PartialResourceType[],
  strapi: Core.Strapi,
): Promise<PartialResourceType[]> {
  if (!resourceTypes || !Array.isArray(resourceTypes)) {
    return [];
  }

  return Promise.all(
    resourceTypes.map(async (rt) => {
      if (rt.__component === 'resource-types.berlin-resource-type' && rt.id) {
        const componentData = (await strapi.db
          .query('resource-types.berlin-resource-type')
          .findOne({ where: { id: rt.id } })) as BerlinResourceType | null;
        return { ...rt, ...componentData };
      }
      return rt;
    }),
  );
}

/**
 * Extracts relevant fields from resource data and builds a markdown search index
 */
export function buildSearchIndex(data: SearchIndexData): string {
  const indexParts: string[] = [];

  // Extract Berlin Resource Type data
  const berlinResourceType = data.resourceTypes?.find(
    (rt): rt is PartialResourceType & Partial<BerlinResourceType> =>
      rt.__component === 'resource-types.berlin-resource-type',
  );

  if (berlinResourceType) {
    if (berlinResourceType.roomName) {
      indexParts.push(`**Alt Title:** ${berlinResourceType.roomName}`);
    }

    if (berlinResourceType.provider) {
      indexParts.push(`**Provider:** ${berlinResourceType.provider}`);
    }

    if (berlinResourceType.facilities) {
      indexParts.push(`**Facilities:** ${berlinResourceType.facilities}`);
    }

    if (berlinResourceType.facilitiesAdditionalInfo) {
      indexParts.push(
        `**Additional Facilities:** ${berlinResourceType.facilitiesAdditionalInfo}`,
      );
    }

    if (berlinResourceType.accessibilityInfo) {
      indexParts.push(
        `**Accessibility Info:** ${berlinResourceType.accessibilityInfo}`,
      );
    }
  }

  // Extract address data
  if (data.address?.street) {
    indexParts.push(`**Street:** ${data.address.street}`);
  }

  // Only create search index if there's content
  if (indexParts.length === 0) {
    return '';
  }

  return `\n\n${SEARCH_INDEX_START}\n### Search Index\n${indexParts.join(
    '  \n',
  )}\n${SEARCH_INDEX_END}`;
}

/**
 * Removes existing search index from description
 */
export function removeExistingSearchIndex(
  description: string | null | undefined,
): string {
  if (!description) {
    return '';
  }

  const startIndex = description.indexOf(SEARCH_INDEX_START);
  if (startIndex === -1) {
    return description;
  }

  const endIndex = description.indexOf(SEARCH_INDEX_END, startIndex);
  if (endIndex === -1) {
    return description;
  }

  // Remove the search index section (including the end marker)
  return (
    description.substring(0, startIndex) +
    description.substring(endIndex + SEARCH_INDEX_END.length)
  );
}

/**
 * Updates the description field with search index data
 */
export function updateDescriptionWithSearchIndex(data: SearchIndexData): void {
  // Get current description and remove any existing search index
  const cleanDescription = removeExistingSearchIndex(data.description).trim();

  // Build new search index
  const searchIndex = buildSearchIndex(data);

  // Combine description with search index
  data.description = cleanDescription + searchIndex;
}

/**
 * Handles search index update for resource creation
 * Fetches necessary data and updates the description field
 */
export async function handleSearchIndexOnCreate(
  data: SearchIndexData,
  strapi: Core.Strapi,
): Promise<void> {
  // Fetch full resourceTypes component data
  if (data.resourceTypes) {
    data.resourceTypes = await fetchFullResourceTypes(
      data.resourceTypes,
      strapi,
    );
  }

  // Fetch address if it exists but isn't populated
  if (data.address?.id && !data.address.street) {
    const address = (await strapi.db
      .query('custom.address')
      .findOne({ where: { id: data.address.id } })) as Address | null;
    if (address) {
      data.address = address;
    }
  }

  // Update search index
  updateDescriptionWithSearchIndex(data);
}

/**
 * Handles search index update for resource updates
 * Fetches existing resource data, merges with updates, and updates description
 */
export async function handleSearchIndexOnUpdate(
  data: SearchIndexData,
  where: UpdateWhereClause,
  strapi: Core.Strapi,
): Promise<void> {
  if (!where?.id) {
    // Fallback if no where clause
    updateDescriptionWithSearchIndex(data);
    return;
  }

  // Fetch the existing resource with relations
  // Note: Cast through unknown because Strapi's typed return doesn't include populated relations
  const existingResource = (await strapi.entityService.findOne(
    'api::resource.resource',
    where.id,
    {
      populate: ['resourceTypes', 'address'],
    },
  )) as unknown as PopulatedResource | null;

  if (!existingResource) {
    return;
  }

  let resourceTypesToUse: PartialResourceType[] | undefined =
    existingResource.resourceTypes as PartialResourceType[] | undefined;

  // If resourceTypes are being updated, fetch their full data
  if (data.resourceTypes && Array.isArray(data.resourceTypes)) {
    resourceTypesToUse = await fetchFullResourceTypes(
      data.resourceTypes,
      strapi,
    );
  } else if (resourceTypesToUse) {
    // Otherwise, fetch full data for existing resourceTypes
    resourceTypesToUse = await fetchFullResourceTypes(
      resourceTypesToUse,
      strapi,
    );
  }

  // Fetch address if being updated
  const addressToUse: Partial<Address> | undefined = data.address?.id
    ? (((await strapi.db
        .query('custom.address')
        .findOne({ where: { id: data.address.id } })) as Address | null) ??
      undefined)
    : existingResource.address;

  // Build merged data for search index
  const mergedDataForIndex = {
    ...existingResource,
    ...data,
    address: addressToUse,
    resourceTypes: resourceTypesToUse,
  };

  // Update search index with merged data
  updateDescriptionWithSearchIndex(mergedDataForIndex);

  // Apply the updated description back to data (ensuring it gets saved)
  data.description = mergedDataForIndex.description;
}
