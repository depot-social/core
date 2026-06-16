import type { Price } from '@depot/shared';

interface FetchResourcePriceParams {
  resourceId: string;
  start: string;
  end: string;
  units: number;
}

export const fetchResourcePrice = async ({
  resourceId,
  start,
  end,
  units,
}: FetchResourcePriceParams): Promise<Price> =>
  await $fetch<Price>(`/api/resources/${resourceId}/price`, {
    query: {
      start,
      end,
      units: units.toString(),
    },
  });
