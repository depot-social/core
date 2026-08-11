import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import type { Resource, User, Price } from '@depot/shared';

export interface PricesService {
  getPrice(
    resourceDocumentId: string,
    start: Date,
    end: Date,
    units: number,
    loggedInUserDatabaseId?: number | null
  ): Promise<Price | undefined>;
}

export const calculatePriceDuration = (
  start: Date,
  end: Date,
  durationType: Price['durationType']
): number => {
  const durationInHours = Math.ceil(
    (end.getTime() - start.getTime()) / 1000 / 60 / 60
  );

  return durationType === 'daily'
    ? Math.ceil(durationInHours / 24)
    : durationInHours;
};

export const calculatePrice = (
  priceTemplate: Price,
  start: Date,
  end: Date,
  units: number,
  resource: Resource
): Price => {
  const { durationType, tariffType, depositValue, value, vatValue } =
    priceTemplate;
  const price = { ...priceTemplate };

  price.duration = calculatePriceDuration(start, end, durationType);

  price.title = `${tariffType} price for ${units}x ${resource.title} (${
    price.duration
  } ${durationType === 'daily' ? 'day/s' : 'hour/s'})`;

  // Calculate pure booking price
  const total = value * units * price.duration;
  price.resourceValue = total;

  // Calculate VAT based on pure booking price
  price.vatValue = vatValue ? (total * vatValue) / 100 : 0;

  // Calculate deposit based on pure booking price
  price.depositValue = depositValue ? depositValue * units : 0;

  // Save total price
  price.value = total + price.depositValue + price.vatValue;

  return price;
};

export default ({ strapi }: { strapi: Core.Strapi }): PricesService => ({
  /**
   * Calculates and returns the price for a resource.
   *
   * Applies the following logic:
   * - If the user is logged in and is a non-profit, use the non-profit price if it exists
   * - If the user is logged in and is not a non-profit, use the regular price if it exists
   * - If the user is not logged in, use the regular price if it exists
   * - If no price exists, throw an error
   *
   */
  async getPrice(
    resourceDocumentId,
    start,
    end,
    units,
    loggedInUserDatabaseId
  ) {
    const resource = (await strapi.documents('api::resource.resource').findOne({
      documentId: resourceDocumentId,
      fields: ['id', 'title'],
      populate: ['prices'],
    })) as Resource;

    const loggedInUser: User = loggedInUserDatabaseId
      ? ((await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: loggedInUserDatabaseId },
          populate: ['organization'],
        })) as unknown as User)
      : null;
    // console.log("Logged in user", loggedInUser)
    const loggedInUserIsNonProfit = loggedInUser
      ? loggedInUser.organization?.isApproved
      : false;
    const useNonProfitPrice = loggedInUserIsNonProfit
      ? resource.prices?.find(
          (price: Price) => price.tariffType === 'notForProfit'
        )
        ? true
        : false
      : false;

    // Find appropriate price and modify it to store the calculated total price
    const price = resource.prices?.find(
      (price: Price) =>
        (useNonProfitPrice && price.tariffType === 'notForProfit') ||
        (!useNonProfitPrice && price.tariffType === 'regular')
    );

    // @todo In future, prices could have a start and end date which requires an extra step before iterating through it

    if (!price) {
      throw new errors.ApplicationError('No price found');
    }

    delete price.id; // Only in case...

    return calculatePrice(price, start, end, units, resource);
  },
});
