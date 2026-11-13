import sanitizeHtml from 'sanitize-html';

/**
 * Rich text handling for the admin editor.
 *
 * Server-side only: `sanitize-html` parses with htmlparser2 and has no place
 * in a client bundle. Everything written by the editor goes through
 * `sanitizeRichText` in the server action *before* it reaches the database, so
 * what the public pages render is already safe. Sanitising only at render time
 * would leave the unsafe copy sitting in the row, one careless query away from
 * an API response or an export.
 */

/** Roughly what the editor's toolbar can produce, and nothing else. */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'img',
  'figure',
  'figcaption',
  'hr',
  'code',
  'pre',
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  // No `data:` anywhere: a pasted data URI would park a megabyte of base64 in
  // the row and ship it again with every render.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  // Anything outside the list goes, contents and all, rather than being
  // unwrapped into stray text.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe'],
  transformTags: {
    // Headings start at h2 - the page's own <h1> is the title.
    h1: 'h2',
    h5: 'h4',
    h6: 'h4',
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const external = /^https?:\/\//i.test(href);

      return {
        tagName,
        attribs: {
          ...attribs,
          ...(external
            ? { target: '_blank', rel: 'noopener noreferrer nofollow' }
            : // An internal link that still claims target=_blank keeps the
              // opener protection, but never the nofollow.
              attribs.target === '_blank'
              ? { rel: 'noopener noreferrer' }
              : {}),
        },
      };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', alt: attribs.alt ?? '' },
    }),
  },
};

/** Cleans editor HTML for storage. Returns null when nothing survives. */
export function sanitizeRichText(input: string | null | undefined): string | null {
  if (!input) return null;

  const clean = sanitizeHtml(input, OPTIONS).trim();
  return isEmptyHtml(clean) ? null : clean;
}

/** True for '', '<p></p>' and the other shapes an emptied editor hands back. */
export function isEmptyHtml(html: string | null | undefined): boolean {
  if (!html) return true;
  // An <img> or an <hr> is content even though it carries no text.
  if (/<(img|hr)\b/i.test(html)) return false;
  return htmlToText(html).length === 0;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

/**
 * Flattens rich text to a single line, for meta descriptions and card copy.
 * Block tags become spaces first, so two paragraphs do not run together.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';

  return html
    .replace(/<\/(p|div|li|h[1-6]|blockquote|figcaption|pre)>/gi, ' ')
    .replace(/<(br|hr)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** First `max` characters of the rich text, ending on a word. */
export function excerptFromHtml(html: string | null | undefined, max = 158): string {
  const text = htmlToText(html);
  if (text.length <= max) return text;

  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}
