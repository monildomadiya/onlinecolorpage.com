import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** A4 in PostScript points. */
const A4_PORTRAIT = { width: 595.28, height: 841.89 } as const;
const MARGIN = 36; // 0.5 inch
const FOOTER_SPACE = 34;
const TITLE_SPACE = 30;

export interface PdfOptions {
  /** PNG bytes of the line art (what `processArtwork` returns as `master`). */
  png: Buffer;
  title?: string;
  /** Printed small in the footer. */
  siteName?: string;
  siteUrl?: string;
  /** Rotate the page when the artwork is clearly landscape. */
  autoOrient?: boolean;
}

/**
 * Builds a one-page, print-ready A4 PDF around a line-art PNG.
 *
 * The artwork is centred and scaled to fit inside the margins, with room left
 * for an optional title and a small footer credit. Kids print these at home,
 * so nothing bleeds to the paper edge.
 */
export async function buildColoringPdf({
  png,
  title,
  siteName = 'Online Color Page',
  siteUrl = 'onlinecolorpage.com',
  autoOrient = true,
}: PdfOptions): Promise<Buffer> {
  const pdf = await PDFDocument.create();

  pdf.setTitle(title ? `${title} - free coloring page` : 'Free coloring page');
  pdf.setCreator(siteName);
  pdf.setProducer(siteName);
  pdf.setSubject('Printable coloring page for kids');
  if (title) pdf.setKeywords([title, 'coloring page', 'printable', 'kids']);

  const image = await pdf.embedPng(png);
  const landscape = autoOrient && image.width > image.height * 1.15;

  const pageWidth = landscape ? A4_PORTRAIT.height : A4_PORTRAIT.width;
  const pageHeight = landscape ? A4_PORTRAIT.width : A4_PORTRAIT.height;
  const page = pdf.addPage([pageWidth, pageHeight]);

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const footerFont = await pdf.embedFont(StandardFonts.Helvetica);

  const topReserved = title ? TITLE_SPACE : 0;
  const boxWidth = pageWidth - MARGIN * 2;
  const boxHeight = pageHeight - MARGIN * 2 - topReserved - FOOTER_SPACE;

  const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  page.drawImage(image, {
    x: (pageWidth - drawWidth) / 2,
    y: MARGIN + FOOTER_SPACE + (boxHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });

  if (title) {
    const size = 16;
    const text = title.length > 64 ? `${title.slice(0, 61)}...` : title;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - textWidth) / 2,
      y: pageHeight - MARGIN - size,
      size,
      font,
      color: rgb(0.17, 0.17, 0.2),
    });
  }

  const footer = `${siteName} - ${siteUrl}`;
  const footerSize = 9;
  const footerWidth = footerFont.widthOfTextAtSize(footer, footerSize);
  page.drawText(footer, {
    x: (pageWidth - footerWidth) / 2,
    y: MARGIN,
    size: footerSize,
    font: footerFont,
    color: rgb(0.55, 0.55, 0.6),
  });

  return Buffer.from(await pdf.save());
}

/** Merges several line-art PNGs into one multi-page "coloring book" PDF. */
export async function buildColoringBook(
  items: { png: Buffer; title?: string }[],
  meta: { siteName?: string; siteUrl?: string; bookTitle?: string } = {},
): Promise<Buffer> {
  const out = await PDFDocument.create();
  out.setTitle(meta.bookTitle ?? 'Coloring book');
  out.setCreator(meta.siteName ?? 'Online Color Page');

  for (const item of items) {
    const single = await PDFDocument.load(
      await buildColoringPdf({ ...item, siteName: meta.siteName, siteUrl: meta.siteUrl }),
    );
    const [page] = await out.copyPages(single, [0]);
    out.addPage(page);
  }

  return Buffer.from(await out.save());
}
