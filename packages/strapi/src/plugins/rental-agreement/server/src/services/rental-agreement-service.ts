import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Core } from '@strapi/strapi';
import { Booking, Resource, User, Price, priceToString, readBooleanEnv } from '@depot/shared';
import { format, parseISO, differenceInHours, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import sharp from 'sharp';
import rentalAgreementConfig from '../config';

export interface RentalAgreementService {
  generateRentalAgreementPdf(
    booking: Booking,
    resource: Resource,
    customer: User,
    resourceOwner: User
  ): Promise<Buffer>;
}

const addText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    fontStyle?: string;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  }
) => {
  if (options?.fontSize) doc.setFontSize(options.fontSize);
  if (options?.fontStyle) doc.setFont(undefined, options.fontStyle);
  doc.text(text, x, y, {
    align: options?.align || 'left',
    maxWidth: options?.maxWidth,
  });
  // Reset font style to normal if it was changed
  if (options?.fontStyle && options.fontStyle !== 'normal') {
    doc.setFont(undefined, 'normal');
  }
};

const logoMaxWidth = 150;
const logoMaxHeight = 30;

interface PdfLogo {
  data: Buffer;
  width: number;
  height: number;
}

const loadLogo = async (strapi: Core.Strapi, logoPath: string): Promise<PdfLogo | undefined> => {
  const filePath = resolve(strapi.dirs.app.root, logoPath);

  try {
    const image = sharp(await readFile(filePath), { density: 288 });
    const { format } = await image.metadata();
    if (format !== 'png' && format !== 'svg') {
      throw new Error(`Expected PNG or SVG, received ${format ?? 'unknown format'}`);
    }

    const { data, info } = await image
      .resize({
        width: logoMaxWidth * 4,
        height: logoMaxHeight * 4,
        fit: 'inside',
        withoutEnlargement: format === 'png',
      })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    strapi.log.warn(`Could not load rental agreement PDF logo at ${filePath}: ${reason}`);
    return undefined;
  }
};

const addHeader = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  logo: PdfLogo | undefined
): number => {
  if (logo) {
    const scale = Math.min(logoMaxWidth / logo.width, logoMaxHeight / logo.height);
    doc.addImage(logo.data, 'PNG', margin, yPos, logo.width * scale, logo.height * scale);
  }

  // Title
  yPos += logo ? 60 : 16;
  addText(doc, 'Verleihvertrag', pageWidth / 2, yPos, {
    fontSize: 16,
    fontStyle: 'bold',
    align: 'center',
  });
  yPos += 20;
  addText(doc, 'zwischen', pageWidth / 2, yPos, {
    fontSize: 10,
    align: 'center',
  });
  yPos += 30;

  return yPos;
};

const addParties = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  customer: User,
  resourceOwner: User,
  resource: Resource
): number => {
  const col1X = margin;
  const partyY = yPos;

  // Customer information
  const customerName =
    customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.username || 'Unbekannt';
  const customerAddress = customer.address
    ? `${customer.address.street}, ${customer.address.zip} ${customer.address.place}`
    : 'Adresse nicht verfügbar';

  addText(doc, `${customerName}, ${customerAddress} (Nutzerin)`, col1X, partyY, {
    fontSize: 10,
    fontStyle: 'bold',
    maxWidth: pageWidth,
  });
  addText(doc, 'und', col1X, partyY + 25, { fontSize: 10 });

  // Resource owner information
  const ownerName =
    resourceOwner.firstName && resourceOwner.lastName
      ? `${resourceOwner.firstName} ${resourceOwner.lastName}`
      : resourceOwner.username || 'Unbekannt';
  const ownerOrg = resourceOwner.organization?.title
    ? `, handelnd für ${resourceOwner.organization.title}`
    : '';
  const resourceAddress = resource.address
    ? `${resource.address.street}, ${resource.address.zip} ${resource.address.place}`
    : 'Adresse nicht verfügbar';

  addText(doc, `${ownerName}, ${resourceAddress}${ownerOrg} (Anbieter_in)`, col1X, partyY + 40, {
    fontSize: 10,
    fontStyle: 'bold',
    maxWidth: pageWidth,
  });

  return partyY + 65;
};

const addDetails = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  booking: Booking,
  resource: Resource,
  price: Price | null,
  includePricing: boolean
): number => {
  const detailStartY = yPos;
  const colWidth = (pageWidth - 2 * margin) / (includePricing ? 3 : 2);
  const col1X = margin;

  // Column 1: Resource & Abholort
  addText(doc, 'Ressource:', col1X, detailStartY, {
    fontStyle: 'bold',
    fontSize: 10,
  });
  addText(doc, resource.title, col1X, detailStartY + 15, {
    fontSize: 10,
    maxWidth: colWidth - margin,
  });

  addText(doc, 'Abholort:', col1X, detailStartY + 45, {
    fontStyle: 'bold',
    fontSize: 10,
  });
  const pickupAddress = resource.address
    ? `${resource.address.street}, ${resource.address.zip} ${resource.address.place}`
    : 'Adresse nicht verfügbar';
  addText(doc, pickupAddress, col1X, detailStartY + 60, { fontSize: 10 });

  // Column 2: Zeitraum & Anzahl Einheiten
  const col2StartX = col1X + colWidth;
  addText(doc, 'Zeitraum:', col2StartX, detailStartY, {
    fontStyle: 'bold',
    fontSize: 10,
  });

  const startDate = booking.start ? parseISO(booking.start) : null;
  const endDate = booking.end ? parseISO(booking.end) : null;

  let dateRange = 'Zeitraum nicht verfügbar';
  let duration = '';

  if (startDate && endDate) {
    const startFormatted = format(startDate, 'dd.MM., HH:mm');
    const endFormatted = format(endDate, 'dd.MM.yyyy, HH:mm');
    const hours = differenceInHours(endDate, startDate);
    const days = differenceInDays(endDate, startDate);

    if (days >= 1) {
      duration = `${days} Tag${days > 1 ? 'e' : ''}`;
    } else {
      duration = `${hours} Stunde${hours > 1 ? 'n' : ''}`;
    }

    dateRange = `${startFormatted} bis ${endFormatted} (${duration})`;
  }

  addText(doc, dateRange, col2StartX, detailStartY + 15, {
    fontSize: 10,
    maxWidth: colWidth - margin,
  });

  addText(doc, 'Anzahl gewählter Einheiten:', col2StartX, detailStartY + 45, {
    fontStyle: 'bold',
    fontSize: 10,
  });
  addText(doc, `${booking.bookedUnits || 1}`, col2StartX, detailStartY + 60, { fontSize: 10 });

  if (!includePricing) {
    return detailStartY + 80;
  }

  // Column 3: Preis
  const col3StartX = col2StartX + colWidth;
  addText(doc, 'Preis', col3StartX, detailStartY, {
    fontStyle: 'bold',
    fontSize: 10,
  });

  if (price) {
    const netto = price.resourceValue || 0;
    const kaution = price.depositValue || 0;
    const gesamt = price.value || 0;

    addText(doc, `Netto: ${priceToString(netto)}`, col3StartX, detailStartY + 15, { fontSize: 10 });
    addText(doc, `Kaution: ${priceToString(kaution)}`, col3StartX, detailStartY + 30, {
      fontSize: 10,
    });
    doc.setDrawColor(150); // Light gray line
    doc.line(col3StartX, detailStartY + 40, col3StartX + colWidth - margin / 2, detailStartY + 40); // Separator line
    addText(doc, `Gesamt: ${priceToString(gesamt)}`, col3StartX, detailStartY + 55, {
      fontSize: 10,
      fontStyle: 'bold',
    });
  } else {
    addText(doc, 'Preis nicht verfügbar', col3StartX, detailStartY + 15, {
      fontSize: 10,
    });
  }

  return detailStartY + 80;
};

const addNotes = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  includePricing: boolean
): number => {
  addText(doc, 'Anmerkung Anbieter:', margin, yPos, {
    fontSize: 10,
    fontStyle: 'bold',
  });
  yPos += 15;
  const anmerkungText = includePricing
    ? 'Leihpreis plus Kaution sind bei Übergabe der Ressource in der genannten Höhe mitzubringen – am besten so gestückelt, dass die Anbieter_in die Kaution bei Rückgabe ohne zu wechseln zurückgeben kann. Den Verleihvertrag inkl. vorbereitetem Übergabeprotokoll druckt die Anbieter_in 2-fach aus, sodass der Vertrag bei Übergabe der Ressource gemeinsam von Anbieter_in und Nutzer_in unterschrieben werden kann. Bitte Nutzungsbedingungen (s. Links) beachten, insb. Abschnitt "Verschmutzung, Schäden, Unpünktlichkeit und sonstiger Mehraufwand".'
    : 'Den Verleihvertrag inklusive vorbereitetem Übergabeprotokoll druckt die Anbieter_in 2-fach aus, sodass der Vertrag bei Übergabe der Ressource gemeinsam von Anbieter_in und Nutzer_in unterschrieben werden kann. Bitte Nutzungsbedingungen (s. Links) beachten, insbesondere den Abschnitt "Verschmutzung, Schäden, Unpünktlichkeit und sonstiger Mehraufwand".';
  addText(doc, anmerkungText, margin, yPos, {
    fontSize: 10,
    maxWidth: pageWidth - 2 * margin,
  });
  yPos += (includePricing ? 5 : 3) * 12 + 10; // Estimate lines + spacing

  // Ergänzungen
  addText(doc, 'Ergänzungen (Platz für handschriftliche Ergänzungen):', margin, yPos, {
    fontSize: 10,
  });
  yPos += 15;
  doc.setDrawColor(0); // Black line
  doc.line(margin, yPos, pageWidth - margin, yPos); // Line for handwriting
  yPos += 30;

  return yPos;
};

const addSignatures = (doc: jsPDF, yPos: number, pageWidth: number, margin: number): number => {
  const sigY = yPos;
  doc.line(margin, sigY + 15, margin + 200, sigY + 15); // Line for Nutzerin
  addText(doc, '(Unterschrift Nutzer_in)', margin, sigY + 30, {
    fontSize: 10,
  });

  const sig2X = pageWidth / 2 + margin / 2;
  doc.line(sig2X, sigY + 15, sig2X + 200, sigY + 15); // Line for Anbieterin
  addText(doc, '(Unterschrift Anbieter_in)', sig2X, sigY + 30, {
    fontSize: 10,
  });

  return sigY + 50;
};

const addHandoverProtocol = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  includePricing: boolean
): number => {
  addText(doc, 'Die Übergabe erfolgte am ______ . ______ . ________ , ______ Uhr.', margin, yPos, {
    fontSize: 10,
  });
  yPos += 25;

  const tableCellHeight = 30;
  const tableWidth = pageWidth - 2 * margin;
  const tableCol1Width = tableWidth * 0.4;
  const tableCol2Width = tableWidth * 0.3;
  const tableCol3Width = tableWidth * 0.3;

  if (!includePricing) {
    const tableCol1Width = tableWidth * 0.5;
    const tableCol2Width = tableWidth * 0.5;

    doc.rect(margin, yPos, tableWidth, tableCellHeight * 2);
    doc.rect(margin, yPos, tableCol1Width, tableCellHeight);
    doc.rect(margin + tableCol1Width, yPos, tableCol2Width, tableCellHeight);
    doc.line(margin + tableCol1Width, yPos, margin + tableCol1Width, yPos + tableCellHeight * 2);
    doc.line(margin, yPos + tableCellHeight, margin + tableWidth, yPos + tableCellHeight);

    addText(doc, 'Die Ressourcen wiesen folgende Mängel auf:', margin + 5, yPos + 18, {
      fontSize: 9,
    });
    addText(
      doc,
      'Empfangsbestätigung Ressource, Nutzer_in',
      margin + tableCol1Width + 5,
      yPos + 18,
      { fontSize: 9 }
    );
    addText(doc, '', margin + 5, yPos + tableCellHeight + 18, { fontSize: 9 });
    addText(doc, 'Unterschrift/Datum', margin + tableCol1Width + 5, yPos + tableCellHeight + 18, {
      fontSize: 9,
    });

    return yPos + tableCellHeight * 2 + 25;
  }

  doc.rect(margin, yPos, tableWidth, tableCellHeight * 2); // Outer box
  doc.rect(margin, yPos, tableCol1Width, tableCellHeight); // Col 1 Header
  doc.rect(margin + tableCol1Width, yPos, tableCol2Width, tableCellHeight); // Col 2 Header
  doc.rect(margin + tableCol1Width + tableCol2Width, yPos, tableCol3Width, tableCellHeight); // Col 3 Header
  doc.line(margin + tableCol1Width, yPos, margin + tableCol1Width, yPos + tableCellHeight * 2); // Vertical line 1
  doc.line(
    margin + tableCol1Width + tableCol2Width,
    yPos,
    margin + tableCol1Width + tableCol2Width,
    yPos + tableCellHeight * 2
  ); // Vertical line 2
  doc.line(margin, yPos + tableCellHeight, margin + tableWidth, yPos + tableCellHeight); // Horizontal line

  addText(doc, 'Die Ressourcen wiesen folgende Mängel auf:', margin + 5, yPos + 18, {
    fontSize: 9,
  });
  addText(doc, 'Empfangsbestätigung Ressource, Nutzer_in', margin + tableCol1Width + 5, yPos + 18, {
    fontSize: 9,
  });
  addText(
    doc,
    'Empfangsbestätigung Leihpreis u. Kaution, Anbieter_in',
    margin + tableCol1Width + tableCol2Width + 5,
    yPos + 18,
    { fontSize: 9 }
  );
  addText(doc, '', margin + 5, yPos + tableCellHeight + 18, {
    fontSize: 9,
  });
  addText(doc, 'Unterschrift/Datum', margin + tableCol1Width + 5, yPos + tableCellHeight + 18, {
    fontSize: 9,
  });
  addText(
    doc,
    'Unterschrift/Datum',
    margin + tableCol1Width + tableCol2Width + 5,
    yPos + tableCellHeight + 18,
    { fontSize: 9 }
  );

  return yPos + tableCellHeight * 2 + 25;
};

const addReturnProtocol = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  includePricing: boolean
): number => {
  addText(doc, 'Die Rückgabe erfolgte am ______ . ______ . ________ , ______ Uhr.', margin, yPos, {
    fontSize: 10,
  });
  yPos += 25;

  const tableCellHeight = 30;
  const tableWidth = pageWidth - 2 * margin;
  const tableCol1Width = tableWidth * 0.4;
  const tableCol2Width = tableWidth * 0.3;
  const tableCol3Width = tableWidth * 0.3;

  if (!includePricing) {
    const tableCol1Width = tableWidth * 0.5;
    const tableCol2Width = tableWidth * 0.5;

    doc.rect(margin, yPos, tableWidth, tableCellHeight * 2);
    doc.rect(margin, yPos, tableCol1Width, tableCellHeight);
    doc.rect(margin + tableCol1Width, yPos, tableCol2Width, tableCellHeight);
    doc.line(margin + tableCol1Width, yPos, margin + tableCol1Width, yPos + tableCellHeight * 2);
    doc.line(margin, yPos + tableCellHeight, margin + tableWidth, yPos + tableCellHeight);

    addText(doc, 'Die Ressourcen wiesen folgende Mängel auf:', margin + 5, yPos + 18, {
      fontSize: 9,
    });
    addText(
      doc,
      'Empfangsbestätigung Ressource, Anbieter_in',
      margin + tableCol1Width + 5,
      yPos + 18,
      { fontSize: 9 }
    );
    addText(doc, '', margin + 5, yPos + tableCellHeight + 18, { fontSize: 9 });
    addText(doc, 'Unterschrift/Datum', margin + tableCol1Width + 5, yPos + tableCellHeight + 18, {
      fontSize: 9,
    });

    return pageHeight - margin;
  }

  doc.rect(margin, yPos, tableWidth, tableCellHeight * 2); // Outer box
  doc.rect(margin, yPos, tableCol1Width, tableCellHeight); // Col 1 Header
  doc.rect(margin + tableCol1Width, yPos, tableCol2Width, tableCellHeight); // Col 2 Header
  doc.rect(margin + tableCol1Width + tableCol2Width, yPos, tableCol3Width, tableCellHeight); // Col 3 Header
  doc.line(margin + tableCol1Width, yPos, margin + tableCol1Width, yPos + tableCellHeight * 2); // Vertical line 1
  doc.line(
    margin + tableCol1Width + tableCol2Width,
    yPos,
    margin + tableCol1Width + tableCol2Width,
    yPos + tableCellHeight * 2
  ); // Vertical line 2
  doc.line(margin, yPos + tableCellHeight, margin + tableWidth, yPos + tableCellHeight); // Horizontal line

  addText(doc, 'Die Ressourcen wiesen folgende Mängel auf:', margin + 5, yPos + 18, {
    fontSize: 9,
  });
  addText(
    doc,
    'Empfangsbestätigung Ressource, Anbieter_in',
    margin + tableCol1Width + 5,
    yPos + 18,
    { fontSize: 9 }
  );
  addText(
    doc,
    'Empfangsbestätigung Kaution, Nutzer_in',
    margin + tableCol1Width + tableCol2Width + 5,
    yPos + 18,
    { fontSize: 9 }
  );
  addText(doc, '', margin + 5, yPos + tableCellHeight + 18, {
    fontSize: 9,
  });
  addText(doc, 'Unterschrift/Datum', margin + tableCol1Width + 5, yPos + tableCellHeight + 18, {
    fontSize: 9,
  });
  addText(
    doc,
    'Unterschrift/Datum',
    margin + tableCol1Width + tableCol2Width + 5,
    yPos + tableCellHeight + 18,
    { fontSize: 9 }
  );

  yPos = pageHeight - margin; // Move to bottom for footer
  return yPos;
};

const addFooter = (doc: jsPDF, yPos: number, margin: number, appName: string): void => {
  const generationDate = format(new Date(), 'dd.MM.yyyy');
  addText(doc, `Generiert am ${generationDate} via ${appName}`, margin, yPos, { fontSize: 8 });
};

export default ({ strapi }: { strapi: Core.Strapi }): RentalAgreementService => ({
  async generateRentalAgreementPdf(booking, resource, customer, resourceOwner) {
    const plugin = strapi.plugin('rental-agreement');
    const appName =
      plugin.config<string | undefined>('pdfAppName')?.trim() ||
      rentalAgreementConfig.default.pdfAppName;
    const logoPath = plugin.config<string | undefined>('pdfLogoPath')?.trim();
    const logo = logoPath ? await loadLogo(strapi, logoPath) : undefined;
    const pricesEnabled = readBooleanEnv(process.env.STRAPI_PLUGIN_PRICES, true);
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let yPos = margin;

    // Generate PDF sections
    yPos = addHeader(doc, yPos, pageWidth, margin, logo);
    yPos = addParties(doc, yPos, pageWidth, margin, customer, resourceOwner, resource);

    // Introduction
    addText(
      doc,
      `Die Nutzer_in leiht von der Anbieter_in zu den unter ${appName} für die u.g. Ressource bereitgestellten Nutzungsbedingungen (AGB) im Footer.`,
      margin,
      yPos,
      { fontSize: 10, maxWidth: pageWidth - 2 * margin }
    );
    yPos += 40;

    // Details
    yPos = addDetails(
      doc,
      yPos,
      pageWidth,
      margin,
      booking,
      resource,
      booking.price || null,
      pricesEnabled
    );

    // Notes
    yPos = addNotes(doc, yPos, pageWidth, margin, pricesEnabled);

    // Signatures
    yPos = addSignatures(doc, yPos, pageWidth, margin);

    // Handover protocol
    yPos = addHandoverProtocol(doc, yPos, pageWidth, margin, pricesEnabled);

    // Return protocol
    yPos = addReturnProtocol(doc, yPos, pageWidth, margin, pageHeight, pricesEnabled);

    // Footer
    addFooter(doc, yPos, margin, appName);

    // Generate PDF buffer
    const pdfData = doc.output('arraybuffer');
    return Buffer.from(pdfData);
  },
});
