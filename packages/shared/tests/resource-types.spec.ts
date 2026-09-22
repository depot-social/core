/// <reference types="vitest" />
import { assert, describe, test } from 'vitest';
import { getResourceType } from '../functions.ts';
import { ResourceTypeComponent, type BerlinResourceType } from '../types';

describe('getResourceType', () => {
  test('returns undefined when resourceTypes was not populated', () => {
    assert.equal(
      getResourceType(undefined, ResourceTypeComponent.BERLIN_RESOURCE_TYPE),
      undefined
    );
  });

  test('finds a matching resource type', () => {
    const resourceType = {
      __component: ResourceTypeComponent.BERLIN_RESOURCE_TYPE,
      provider: 'Example provider',
      initialRoomName: 'Example room',
      roomName: 'Example room',
      accessibilityState: 'accessible',
      accessibilityInfo: '',
      usageHours: '',
      usageFeeDetails: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      offerPublishedAt: '',
      facilitiesAdditionalInfo: '',
      roomSizeSqm: 0,
    } as BerlinResourceType;

    assert.equal(
      getResourceType(
        [resourceType],
        ResourceTypeComponent.BERLIN_RESOURCE_TYPE
      ),
      resourceType
    );
  });
});
