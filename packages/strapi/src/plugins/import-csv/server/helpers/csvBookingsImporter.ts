import moment from 'moment';
import csvtojson from 'csvtojson';
import path from 'path';
import { Booking, Price, Resource, User } from '@depot/shared';
import phpUnserialize from 'php-unserialize';

interface CSVBooking {
  booking_id: number;
  createdAt: number;
  changedAt: number;
  ressource_id: number;
  ausleiher: number;
  verleiher: number;
  description: string; // "Depot Buchung"
  units_count: number;
  start: string; // "2018-03-17 12:00:00"
  end: string; // "2018-03-17 18:00:00"
  event: null;
  geplante_nutzung: string;
  length: string; // "1 Tag"
  nachricht_an_anbieter: string;
  name_ressource: string;
  name_abholer: string;
  nights: number;
  preis: string;
  preis_meta: string; // Serialized PHP Blob
  status: number;
  email_abholer: string;
  tel_abholerin: string;
}

interface PriceMeta {
  res_preis: string; // e.g. "30,00 €"
  res_kaution: string;
  res_takt: string;
  res_tax: string;
  preis_plain: string;
  preis_tax: string;
  preis_kaution: string;
  preis_total: string;
}

const priceAsNumber = (price: string): number => {
  if (!price) return 0;
  const priceFormatted = Number(
    price.replace('€', '').trim().replace(',', '.')
  );
  return Number.isNaN(priceFormatted) ? 0 : priceFormatted;
};

// @todo duplicate
const camelCaseToSnakeCase = (object: any) => {
  const newObject = {};
  for (const key in object) {
    const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObject[newKey] = object[key];
  }
  return newObject;
};

const resolvePrice = async (csv_booking: CSVBooking): Promise<Price | null> => {
  const priceMeta: PriceMeta = phpUnserialize.unserialize(
    csv_booking.preis_meta
  );

  if (!priceMeta) {
    return null;
  }

  const price = {
    // @todo Long term problem: No diff. between total and resources only price
    title: 'Booking import ' + csv_booking.start,
    value: priceAsNumber(priceMeta.preis_total),
    currency: 'euro',
    durationType: 'daily', // @todo unknown
    tariffType: 'regular', // @todo unknown
    depositValue: priceAsNumber(priceMeta.preis_kaution),
    vatValue: priceAsNumber(priceMeta.preis_tax),
  } as Price;

  return price;
};

const resolveResource = async (
  csv_booking: CSVBooking
): Promise<Resource | null> => {
  const resource_id = Number(csv_booking.ressource_id);

  if (!resource_id) {
    return null;
  }

  const resolvedResource = await strapi
    .documents('api::resource.resource')
    .findMany({
      filters: {
        legacyId: resource_id,
      },
    });

  if (resolvedResource.length === 0) {
    return null;
  }

  return resolvedResource[0] as unknown as Resource;
};

const resolveUser = async (user_id: number): Promise<User | null> => {
  if (!user_id) {
    return null;
  }

  const resolvedUser = (await strapi
    .documents('plugin::users-permissions.user')
    .findMany({
      filters: {
        legacyId: user_id,
      },
    })) as unknown as User[];

  if (resolvedUser.length === 0) {
    return null;
  }

  return resolvedUser[0];
};

export const mapCSVToBooking = async (csv_booking: CSVBooking) => {
  const resource = await resolveResource(csv_booking);
  const units = Number(csv_booking.units_count);

  if (!resource) {
    console.log(
      'Unknown resource ' +
        csv_booking.ressource_id +
        ' for booking ' +
        csv_booking.booking_id
    );

    return null;
    //throw new Error("Unknown resource " + csv_booking.ressource_id);
  }

  const customer = await resolveUser(Number(csv_booking.ausleiher));
  const resourceOwner = await resolveUser(Number(csv_booking.verleiher));

  if (!customer) {
    console.log(
      'Unknown ausleiher ' +
        csv_booking.ausleiher +
        ' for booking ' +
        csv_booking.booking_id
    );
    // @todo connect with "anonymous user"
    // return null;
  }

  if (!resourceOwner) {
    console.log(
      'Unknown verleiher ' +
        csv_booking.verleiher +
        ' for booking ' +
        csv_booking.booking_id
    );
    // @todo connect with "anonymous user"
    //  return null;
  }

  if (!units || Number.isNaN(units)) {
    console.log(
      'Invalid units count ' +
        csv_booking.units_count +
        ' for booking ' +
        csv_booking.booking_id +
        ' (auto-set units to 1)'
    );

    csv_booking.units_count = 1;
  }

  return {
    // id: csv_booking.booking_id,
    title: `Buchung ${resource.title}`,
    createdAt: csv_booking.createdAt
      ? moment.unix(Number(csv_booking.createdAt)).format()
      : undefined,
    updatedAt: csv_booking.changedAt
      ? moment.unix(Number(csv_booking.changedAt)).format()
      : undefined,
    resource: resource.id,
    bookedUnits: Number(csv_booking.units_count),
    start: csv_booking.start ? moment(csv_booking.start).format() : undefined,
    end: csv_booking.end ? moment(csv_booking.end).format() : undefined,
    bookingStatus: csv_booking.status == 1 ? 'confirmed' : 'requested',
    resourceOwner: resourceOwner?.id,
    customer: customer?.id,
    price: await resolvePrice(csv_booking),
    // @todo default locale: "de"
  } /* satisfies Booking*/;
};

const importBookingsFromCSV = async () => {
  // Path is relative to packages/strapi
  const csvFilePath = path.resolve(
    './src/plugins/import-csv/data/bookings_data.csv'
  );
  const data = await csvtojson().fromFile(csvFilePath);

  const bookings = await Promise.all(
    data.map(async (csv_booking) => {
      return await mapCSVToBooking(csv_booking);
    })
  );

  for (const booking of bookings) {
    if (!booking) {
      return;
    }

    /**
     * @see https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#create
     */
    try {
      await strapi.documents('api::booking.booking').create({
        data: booking as any,
      });
    } catch (err) {
      console.log('Error creating booking', booking, err /*.details*/);
    }
  }
};

export default importBookingsFromCSV;
