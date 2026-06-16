import moment from 'moment';
import csvtojson from 'csvtojson';
import path from 'path';
import { uploadMedia } from './uploader';

interface CSVUser {
  uid: number;
  username: string;
  aktiv: string;
  anrede: string; // "Herr" / "Frau"
  image: null;
  createdAt: string;
  email: string;
  hausnummer: string;
  lastLogin: string;
  lastAccess: string; // yyyy-mm-dd
  vorname: string;
  nachname: string;
  organisationsnachweis: string; // File path
  organisationsname: string;
  organisationstyp: string;
  organisationswebsite: string;
  ort: string;
  zip: string; // @todo is number
  roles: string; // e.g. "Administrator, Authentifizierte Organisation, Organisation, Regionalpartner"
  strasse: string;
  telefon: string;
}

const getOrganizationType = (type: string) => {
  switch (type) {
    case 'Stiftung':
      return 'foundation';
    case 'Verein':
      return 'association';
    case 'Firma':
      return 'company';
    default:
      return 'misc';
  }
};

const resolveOrganisationsnachweis = async (csv_user: CSVUser) => {
  const proofDocUri = csv_user.organisationsnachweis.trim();

  if (proofDocUri.length === 0) {
    return;
  }

  const newMedia = await uploadMedia(
    proofDocUri,
    `Organisationsnachweis ${csv_user.organisationsname.trim()}`
  );

  console.log('media', newMedia);

  return newMedia;
};

export const mapCSVToUser = async (csv_user: CSVUser) => {
  const username = csv_user.username.trim();
  const email = csv_user.email.trim();
  const roles = csv_user.roles.split(',').map((role) => role.trim());
  const hasOrganization = csv_user.organisationsname.trim().length > 0;

  return {
    legacyId: Number(csv_user.uid),
    username: username.length > 2 ? username : email,
    email,
    password: 'todo123', // @todo Transform password!?
    salutation: csv_user.anrede.trim() === 'Herr' ? 'mr' : 'mrs',
    createdAt: csv_user.createdAt
      ? moment(csv_user.createdAt).format()
      : undefined,
    confirmed: csv_user.aktiv == '1',
    role: 1, // === "Authenticated"; @todo
    firstName: csv_user.vorname.trim(),
    lastName: csv_user.nachname.trim(),
    phone: csv_user.telefon.trim(),
    address: {
      street: csv_user.strasse.trim() + ' ' + csv_user.hausnummer.trim(),
      zip: csv_user.zip.trim(),
      place: csv_user.ort.trim(),
      // @todo Geocode longitude & latitude
    },
    organization: hasOrganization
      ? {
          title: csv_user.organisationsname.trim(),
          type: getOrganizationType(csv_user.organisationstyp.trim()),
          website: csv_user.organisationswebsite.trim(),
          proofDocument: undefined, // await resolveOrganisationsnachweis(csv_user),
        }
      : undefined,
    provider: 'local', // i.e. "Regular mail / password authentication"
    // @todo default locale: "de"
  };
};

const importUsersFromCSV = async () => {
  // Path is relative to packages/strapi
  const csvFilePath = path.resolve(
    './src/plugins/import-csv/data/users_data.csv'
  );
  const data = await csvtojson().fromFile(csvFilePath);

  console.log(data);

  const users = await Promise.all(
    data.map(async (csv_user) => {
      const resource = await mapCSVToUser(csv_user);
      return resource;
    })
  );

  for (const user of users) {
    if (!user) {
      return;
    }

    /**
     * @see https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/entity-service/crud.html#create
     */
    try {
      await strapi.documents('plugin::users-permissions.user').create({
        data: user as any,
      });
    } catch (err) {
      console.log('Error creating user', user, err.details.errors);
    }
  }
};

export default importUsersFromCSV;
