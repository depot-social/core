import type { Core } from '@strapi/strapi';
import { Booking, Resource, User, Price, priceToString } from '@depot/shared';
import { format, parseISO, differenceInHours, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';

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

const addHeader = (doc: jsPDF, yPos: number, pageWidth: number, margin: number): number => {
  // Logo
  const logo =
    'data:image/png;base64,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';
  doc.addImage(logo, 'PNG', margin, yPos, 150, 30);

  // addText(doc, 'powered by depot', margin, yPos);

  // Title
  yPos += 60;
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

  addText(doc, `${ownerName}, ${resourceAddress}${ownerOrg} (Anbieter*in)`, col1X, partyY + 40, {
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
  price: Price | null
): number => {
  const detailStartY = yPos;
  const colWidth = (pageWidth - 2 * margin) / 3;
  const col1X = margin;

  // Column 1: Resource & Abholort
  addText(doc, 'Ressource:', col1X, detailStartY, {
    fontStyle: 'bold',
    fontSize: 10,
  });
  addText(doc, resource.title, col1X, detailStartY + 15, {
    fontSize: 10,
    maxWidth: pageWidth / 3 - margin,
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
    maxWidth: pageWidth / 3 - margin,
  });

  addText(doc, 'Anzahl gewählter Einheiten:', col2StartX, detailStartY + 45, {
    fontStyle: 'bold',
    fontSize: 10,
  });
  addText(doc, `${booking.bookedUnits || 1}`, col2StartX, detailStartY + 60, { fontSize: 10 });

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

const addNotes = (doc: jsPDF, yPos: number, pageWidth: number, margin: number): number => {
  addText(doc, 'Anmerkung Anbieter:', margin, yPos, {
    fontSize: 10,
    fontStyle: 'bold',
  });
  yPos += 15;
  const anmerkungText =
    'Leihpreis plus Kaution sind bei Übergabe der Ressource in der genannten Höhe mitzubringen – am besten so gestückelt, dass die Anbieter*in die Kaution bei Rückgabe ohne zu wechseln zurückgeben kann. Den Verleihvertrag inkl. vorbereitetem Übergabeprotokoll druckt die Anbieter*in 2-fach aus, sodass der Vertrag bei Übergabe der Ressource gemeinsam von Anbieter*in und Nutzer*in unterschrieben werden kann. Bitte Nutzungsbedingungen (s. Links) beachten, insb. Abschnitt "Verschmutzung, Schäden, Unpünktlichkeit und sonstiger Mehraufwand".';
  addText(doc, anmerkungText, margin, yPos, {
    fontSize: 10,
    maxWidth: pageWidth - 2 * margin,
  });
  yPos += 5 * 12 + 10; // Estimate lines + spacing

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
  addText(doc, '(Unterschrift Nutzer*in)', margin, sigY + 30, {
    fontSize: 10,
  });

  const sig2X = pageWidth / 2 + margin / 2;
  doc.line(sig2X, sigY + 15, sig2X + 200, sigY + 15); // Line for Anbieterin
  addText(doc, '(Unterschrift Anbieter*in)', sig2X, sigY + 30, {
    fontSize: 10,
  });

  return sigY + 50;
};

const addHandoverProtocol = (
  doc: jsPDF,
  yPos: number,
  pageWidth: number,
  margin: number
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
  addText(doc, 'Empfangsbestätigung Ressource, Nutzer*in', margin + tableCol1Width + 5, yPos + 18, {
    fontSize: 9,
  });
  addText(
    doc,
    'Empfangsbestätigung Leihpreis u. Kaution, Anbieter*in',
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
  pageHeight: number
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
    'Empfangsbestätigung Ressource, Anbieter*in',
    margin + tableCol1Width + 5,
    yPos + 18,
    { fontSize: 9 }
  );
  addText(
    doc,
    'Empfangsbestätigung Kaution, Nutzer*in',
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

const addFooter = (doc: jsPDF, yPos: number, pageWidth: number, margin: number): void => {
  const generationDate = format(new Date(), 'dd.MM.yyyy');
  addText(doc, `Generiert am ${generationDate} via depot.social`, margin, yPos, { fontSize: 8 });
};

export default ({ strapi }: { strapi: Core.Strapi }): RentalAgreementService => ({
  async generateRentalAgreementPdf(booking, resource, customer, resourceOwner) {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let yPos = margin;

    // Generate PDF sections
    yPos = addHeader(doc, yPos, pageWidth, margin);
    yPos = addParties(doc, yPos, pageWidth, margin, customer, resourceOwner, resource);

    // Introduction
    addText(
      doc,
      'Die Nutzer*in leiht von der Anbieter*in zu den unter depot.social für die u.g. Ressource bereitgestellten Nutzungsbedingungen (sofern vorhanden, s. Ressourcenseite unter "Links"):',
      margin,
      yPos,
      { fontSize: 10, maxWidth: pageWidth - 2 * margin }
    );
    yPos += 40;

    // Details
    yPos = addDetails(doc, yPos, pageWidth, margin, booking, resource, booking.price || null);

    // Notes
    yPos = addNotes(doc, yPos, pageWidth, margin);

    // Signatures
    yPos = addSignatures(doc, yPos, pageWidth, margin);

    // Handover protocol
    yPos = addHandoverProtocol(doc, yPos, pageWidth, margin);

    // Return protocol
    yPos = addReturnProtocol(doc, yPos, pageWidth, margin, pageHeight);

    // Footer
    addFooter(doc, yPos, pageWidth, margin);

    // Generate PDF buffer
    const pdfData = doc.output('arraybuffer');
    return Buffer.from(pdfData);
  },
});
