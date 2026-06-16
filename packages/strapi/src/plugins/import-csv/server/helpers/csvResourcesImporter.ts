import moment from 'moment';
import csvtojson from 'csvtojson';
import path from 'path';
import { uploadMedia } from './uploader';
import {
  Category,
  ContingentResourceType,
  Resource,
  ResourceTypeComponent,
} from '@depot/shared';

const resolveImages = async (csv_resource) => {
  const media: any = [];

  if (csv_resource.media_1) {
    const newMedia = await uploadMedia(
      csv_resource.media_1,
      csv_resource.title
    );

    if (newMedia) {
      media.push(newMedia);
    }
  }
  if (csv_resource.media_2) {
    const newMedia = await uploadMedia(
      csv_resource.media_2,
      csv_resource.title
    );

    if (newMedia) {
      media.push(newMedia);
    }
  }
  if (csv_resource.media_3) {
    const newMedia = await uploadMedia(
      csv_resource.media_3,
      csv_resource.title
    );

    if (newMedia) {
      media.push(newMedia);
    }
  }

  return media;
};

const resolveUploads = async (csv_resource) => {
  const uploads: any[] = [];

  if (csv_resource.upload_1 && csv_resource.upload_1.trim() !== '') {
    const newMedia = await uploadMedia(
      csv_resource.upload_1,
      csv_resource.upload_1_title
    );

    if (newMedia) {
      uploads.push(newMedia);
    }
  }
  if (csv_resource.media_2 && csv_resource.upload_2.trim() !== '') {
    const newMedia = await uploadMedia(
      csv_resource.upload_2,
      csv_resource.upload_2_title
    );

    if (newMedia) {
      uploads.push(newMedia);
    }
  }

  return uploads;
};

const resolveCategories = async (csv_resource) => {
  const categories: string = csv_resource.categories;

  if (!categories) {
    return null;
  }

  const splittedCategories = categories.trim().split(', ');

  const resolvedCategories = await Promise.all(
    splittedCategories.map(async (categoryName) => {
      categoryName = categoryName.trim();

      let categories = await strapi
        .documents('api::category.category')
        .findMany({
          filters: {
            title: categoryName,
          },
        });

      if (categories.length >= 1) {
        return categories[0];
      }

      try {
        return await strapi.documents('api::category.category').create({
          data: {
            title: categoryName,
          },
        });
      } catch (err) {
        console.log('Failed adding new category', categoryName, err);
      }
    })
  );

  return resolvedCategories;
};

const resolveLinks = (csv_resource) => {
  const links: any[] = [];

  if (csv_resource.link_1) {
    links.push({
      url: csv_resource.link_1.trim(),
    });
  }

  if (csv_resource.link_2) {
    links.push({
      url: csv_resource.link_2.trim(),
    });
  }

  if (csv_resource.link_3) {
    links.push({
      url: csv_resource.link_3.trim(),
    });
  }

  return links;
};

const resolvePrices = (csv_resource) => {
  const prices: any[] = [];

  const price_duration_type =
    csv_resource.abrechnungstakt === 'Pro Tag' ? 'daily' : 'hourly';
  const price_regular = csv_resource.price_regular;
  const price_discount = csv_resource.price_discount;
  const deposit = csv_resource.kaution;
  const vat = csv_resource.mwst;

  // Get float number from string
  const price_regular_float = price_regular
    ? parseFloat(price_regular.trim().replace(' €', '').replace(',', '.'))
    : undefined;
  const price_discount_float = price_discount
    ? parseFloat(price_discount.trim().replace(' €', '').replace(',', '.'))
    : undefined;
  const deposit_float = deposit
    ? parseFloat(deposit.trim().replace(' €', '').replace(',', '.'))
    : undefined;
  const vat_float = vat
    ? parseFloat(vat.trim().replace(' €', '').replace(',', '.'))
    : undefined;

  let hasPrice = false;

  if (price_regular_float && !Number.isNaN(price_regular_float)) {
    hasPrice = true;
    prices.push({
      title: `${price_regular} ${csv_resource.abrechnungstakt} (regulär)`,
      value: price_regular_float,
      depositValue: deposit_float,
      vatValue: vat_float,
      currency: 'euro',
      durationType: price_duration_type,
      tariffType: 'regular',
    });
  }

  if (price_discount_float && !Number.isNaN(price_discount_float)) {
    hasPrice = true;
    prices.push({
      title: `${price_discount} ${csv_resource.abrechnungstakt} (ermäßigt)`,
      value: price_discount_float,
      depositValue: deposit_float,
      vatValue: vat_float,
      currency: 'euro',
      durationType: price_duration_type,
      tariffType: 'notForProfit',
    });
  }

  if (!hasPrice) {
    prices.push({
      title: `Kostenfrei`,
      value: 0,
      depositValue: deposit_float,
      vatValue: vat_float,
      currency: 'euro',
      durationType: price_duration_type,
      tariffType: 'regular',
    });
  }

  return prices;
};

/**
 * For creating and editing dynamic zone components
 * @see https://docs.strapi.io/dev-docs/api/entity-service/components-dynamic-zones
 */
const resolveResourceTypes = (csv_resource): ContingentResourceType[] => [
  {
    __component: ResourceTypeComponent.CONTINGENT_RESOURCE_TYPE,
    availableUnits: Number(csv_resource.available_units_count) || 0,
    minBookableUnits: Number(csv_resource.minimum_units_count) || 0,
    onlyNotForProfit: csv_resource.only_gemeinwohl === 'Ja',
    generateRentContract: csv_resource.generate_contract === 'Ja',
    extraTextRentContract: csv_resource.zusatztext_verleihvertrag,
    extraTextBookingConfirmation: csv_resource.zusatztext_buchungsbestaetigung,
    openingTimes: csv_resource.opening_times ?? undefined,
  },
];

const resolveUser = async (csv_resource) => {
  const user_id = Number(csv_resource.user_id);

  if (!user_id) {
    return null;
  }

  const resolvedUser = await strapi
    .documents('plugin::users-permissions.user')
    .findMany({
      filters: {
        legacyId: user_id,
      },
    });

  if (resolvedUser.length === 0) {
    return null;
  }

  return resolvedUser[0];
};

const resolveAddress = (csv_resource) => ({
  street: csv_resource.address_street_hnr,
  zip: csv_resource.address_zip,
  place: csv_resource.address_place,
  latitude: csv_resource.address_latitude
    ? Number(csv_resource.address_latitude)
    : undefined,
  longitude: csv_resource.address_longitude
    ? Number(csv_resource.address_longitude)
    : undefined,
});

export const mapCSVToResource = async (
  csv_resource
): Promise<any /*ApiResourceResource["attributes"]*/> => {
  const user = await resolveUser(csv_resource);

  if (!user) {
    console.log('Unknown user for resource', csv_resource.title);
    return null;
  }

  return {
    createdAt: csv_resource.createdAt
      ? moment.unix(Number(csv_resource.createdAt)).format()
      : undefined,
    updatedAt: csv_resource.updatedAt
      ? moment.unix(Number(csv_resource.updatedAt)).format()
      : undefined,
    publishedAt:
      csv_resource.active === 'Genehmigt' ? moment().format() : undefined,
    title: csv_resource.title,
    description: csv_resource.description,
    slug: csv_resource.slug,
    address: resolveAddress(csv_resource),
    images: await resolveImages(csv_resource),
    categories: await resolveCategories(csv_resource),
    prices: resolvePrices(csv_resource),
    links: resolveLinks(csv_resource),
    uploads: await resolveUploads(csv_resource),
    resourceTypes: resolveResourceTypes(csv_resource),
    user: user.id, // @todo skip resource creation if not found
    legacyId: csv_resource.id,
    // locale: "de-DE"
    // @todo default locale: "de"
  } /* satisfies Resource */;
};

const importResourcesFromCSV = async () => {
  // Path is relative to packages/strapi
  const csvFilePath = path.resolve(
    './src/plugins/import-csv/data/resources_data.csv'
  );
  const data = await csvtojson().fromFile(csvFilePath);

  const resources = await Promise.all(
    data.map(async (csv_resource) => {
      const resource = await mapCSVToResource(csv_resource);
      return resource;
    })
  );

  for (const resource of resources) {
    // console.log(resource);
    if (!resource) {
      continue;
    }

    /**
     * @see https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#create
     */
    try {
      await strapi.documents('api::resource.resource').create({
        data: resource,
      });
    } catch (err) {
      console.log('Error creating resource', resource, err.details);
    }
  }
};

export default importResourcesFromCSV;
