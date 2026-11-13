import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';

/** A4 in PostScript points. */
const A4_PORTRAIT = { width: 595.28, height: 841.89 } as const;
const MARGIN = 36; // 0.5 inch
const FOOTER_SPACE = 34;
const TITLE_SPACE = 30;

/**
 * How many drawings one book PDF may hold.
 *
 * pdf-lib keeps every embedded image in memory until `save()`, so a book is
 * roughly `pages x master PNG` of RAM before a single byte is written. Sixty
 * 2000px masters is already ~25 MB; past that a download starts competing
 * with the rest of the server for air.
 */
export const MAX_BOOK_PAGES = 60;

/**
 * The standard PDF fonts only speak WinAnsi, and pdf-lib throws on anything
 * else - one emoji in one page title would otherwise lose a whole book.
 */
function winAnsi(text: string): string {
  return text
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Line art comes out of `processArtwork` as PNG; be forgiving anyway. */
async function embedArtwork(pdf: PDFDocument, bytes: Buffer) {
  try {
    return await pdf.embedPng(bytes);
  } catch {
    return pdf.embedJpg(bytes);
  }
}

interface Fonts {
  bold: PDFFont;
  regular: PDFFont;
}

interface ArtworkPage {
  /** PNG bytes of the line art (what `processArtwork` returns as `master`). */
  png: Buffer;
  title?: string;
  autoOrient?: boolean;
}

/**
 * Draws one line-art page into an open document.
 *
 * The artwork is centred and scaled to fit inside the margins, with room left
 * for an optional title and a small footer credit. Kids print these at home,
 * so nothing bleeds to the paper edge. Shared by the single-page printable and
 * every page of a book, which is what keeps the two looking identical.
 */
async function drawArtworkPage(
  pdf: PDFDocument,
  fonts: Fonts,
  { png, title, autoOrient = true }: ArtworkPage,
  footer: string,
): Promise<void> {
  const image = await embedArtwork(pdf, png);
  const landscape = autoOrient && image.width > image.height * 1.15;

  const pageWidth = landscape ? A4_PORTRAIT.height : A4_PORTRAIT.width;
  const pageHeight = landscape ? A4_PORTRAIT.width : A4_PORTRAIT.height;
  const page = pdf.addPage([pageWidth, pageHeight]);

  const heading = title ? winAnsi(title) : '';
  const topReserved = heading ? TITLE_SPACE : 0;
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

  if (heading) {
    const size = 16;
    const text = heading.length > 64 ? `${heading.slice(0, 61)}...` : heading;
    const textWidth = fonts.bold.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - textWidth) / 2,
      y: pageHeight - MARGIN - size,
      size,
      font: fonts.bold,
      color: rgb(0.17, 0.17, 0.2),
    });
  }

  const footerSize = 9;
  const footerWidth = fonts.regular.widthOfTextAtSize(footer, footerSize);
  page.drawText(footer, {
    x: (pageWidth - footerWidth) / 2,
    y: MARGIN,
    size: footerSize,
    font: fonts.regular,
    color: rgb(0.55, 0.55, 0.6),
  });
}

async function loadFonts(pdf: PDFDocument): Promise<Fonts> {
  const [bold, regular] = await Promise.all([
    pdf.embedFont(StandardFonts.HelveticaBold),
    pdf.embedFont(StandardFonts.Helvetica),
  ]);
  return { bold, regular };
}

export interface PdfOptions extends ArtworkPage {
  /** Printed small in the footer. */
  siteName?: string;
  siteUrl?: string;
}

/** Builds a one-page, print-ready A4 PDF around a line-art PNG. */
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

  const fonts = await loadFonts(pdf);
  await drawArtworkPage(pdf, fonts, { png, title, autoOrient }, `${siteName} - ${siteUrl}`);

  return Buffer.from(await pdf.save());
}

/* ------------------------------------------------------------------ */
/*  books                                                              */
/* ------------------------------------------------------------------ */

export interface BookPdfOptions {
  title: string;
  subtitle?: string | null;
  /** PNG or JPEG bytes. Drawn big on the cover page when present. */
  cover?: Buffer | null;
  includeCoverPage?: boolean;
  siteName?: string;
  siteUrl?: string;
}

/** Title page: the book's name, its subtitle, and the cover art under them. */
async function drawCoverPage(
  pdf: PDFDocument,
  fonts: Fonts,
  { title, subtitle, cover, siteName, siteUrl }: Required<Omit<BookPdfOptions, 'includeCoverPage' | 'cover' | 'subtitle'>> & {
    subtitle: string | null;
    cover: Buffer | null;
  },
  pageCount: number,
): Promise<void> {
  const { width, height } = A4_PORTRAIT;
  const page = pdf.addPage([width, height]);

  let cursor = height - MARGIN - 80;

  const heading = winAnsi(title) || 'Coloring book';
  // 28pt fits most titles on one line; anything longer shrinks rather than
  // running off the paper.
  let size = 28;
  while (size > 15 && fonts.bold.widthOfTextAtSize(heading, size) > width - MARGIN * 2) {
    size -= 1;
  }

  page.drawText(heading, {
    x: (width - fonts.bold.widthOfTextAtSize(heading, size)) / 2,
    y: cursor,
    size,
    font: fonts.bold,
    color: rgb(0.17, 0.17, 0.2),
  });
  cursor -= size + 14;

  const sub = subtitle ? winAnsi(subtitle) : '';
  if (sub) {
    const subSize = 13;
    const text =
      fonts.regular.widthOfTextAtSize(sub, subSize) > width - MARGIN * 2
        ? `${sub.slice(0, 80)}...`
        : sub;
    page.drawText(text, {
      x: (width - fonts.regular.widthOfTextAtSize(text, subSize)) / 2,
      y: cursor,
      size: subSize,
      font: fonts.regular,
      color: rgb(0.45, 0.42, 0.45),
    });
    cursor -= subSize + 16;
  }

  const count = `${pageCount} coloring page${pageCount === 1 ? '' : 's'}`;
  page.drawText(count, {
    x: (width - fonts.bold.widthOfTextAtSize(count, 11)) / 2,
    y: cursor,
    size: 11,
    font: fonts.bold,
    color: rgb(0.65, 0.4, 0.48),
  });
  cursor -= 28;

  if (cover) {
    try {
      const image = await embedArtwork(pdf, cover);
      const boxWidth = width - MARGIN * 4;
      const boxHeight = cursor - MARGIN - FOOTER_SPACE;
      const scale = Math.min(boxWidth / image.width, boxHeight / image.height);

      if (scale > 0) {
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        page.drawImage(image, {
          x: (width - drawWidth) / 2,
          y: MARGIN + FOOTER_SPACE + (boxHeight - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });
      }
    } catch (error) {
      // A cover that will not embed is not worth losing the book over.
      console.warn('[pdf] cover image skipped', error);
    }
  }

  const footer = `${siteName} - ${siteUrl}`;
  page.drawText(footer, {
    x: (width - fonts.regular.widthOfTextAtSize(footer, 9)) / 2,
    y: MARGIN,
    size: 9,
    font: fonts.regular,
    color: rgb(0.55, 0.55, 0.6),
  });
}

/**
 * Merges several line-art PNGs into one multi-page "coloring book" PDF.
 *
 * Everything is drawn into a single document with one set of embedded fonts,
 * rather than building a one-page PDF per drawing and copying the pages over:
 * same layout, a fraction of the objects, and no second copy of every page
 * held in memory while the book is assembled.
 */
export async function buildColoringBook(
  items: ArtworkPage[],
  {
    title = 'Coloring book',
    subtitle = null,
    cover = null,
    includeCoverPage = true,
    siteName = 'Online Color Page',
    siteUrl = 'onlinecolorpage.com',
  }: Partial<BookPdfOptions> = {},
): Promise<Buffer> {
  const drawings = items.slice(0, MAX_BOOK_PAGES);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`${title} - free printable coloring book`);
  pdf.setCreator(siteName);
  pdf.setProducer(siteName);
  pdf.setSubject('Printable coloring book for kids');
  pdf.setKeywords([title, 'coloring book', 'printable', 'kids']);

  const fonts = await loadFonts(pdf);
  const footer = `${siteName} - ${siteUrl}`;

  if (includeCoverPage) {
    await drawCoverPage(
      pdf,
      fonts,
      { title, subtitle, cover, siteName, siteUrl },
      drawings.length,
    );
  }

  for (const item of drawings) {
    await drawArtworkPage(pdf, fonts, item, footer);
  }

  return Buffer.from(await pdf.save());
}
