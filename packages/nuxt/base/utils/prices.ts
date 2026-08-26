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
}: FetchResourcePriceParams): Promise<Price> => {
  const strapiClient = useStrapiClient();

  return await strapiClient<Price>(`/resources/${resourceId}/price`, {
    params: {
      start,
      end,
      units: units.toString(),
    },
  });
};
