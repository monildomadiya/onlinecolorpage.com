import { PROSE_TYPOGRAPHY } from './Prose';
import { cn } from '@/lib/utils';

/**
 * Renders the HTML the admin's rich text editor produced.
 *
 * The markup was sanitised by `sanitizeRichText` before it was ever stored, so
 * what arrives here is already limited to the editor's own tag set - this
 * component only has to dress it in the site's typography. Nothing user-facing
 * ever reaches this; only staff can write it.
 */
export function RichText({ html, className }: { html: string | null; className?: string }) {
  if (!html) return null;

  return (
    <div
      className={cn(
        PROSE_TYPOGRAPHY,
        'space-y-4',
        '[&_h4]:mt-4 [&_h4]:font-display [&_h4]:text-sm [&_h4]:font-extrabold [&_h4]:text-ink',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-coral/30 [&_blockquote]:pl-4 [&_blockquote]:italic',
        '[&_img]:mx-auto [&_img]:rounded-2xl [&_img]:border [&_img]:border-edge',
        '[&_hr]:border-edge',
        '[&_code]:rounded [&_code]:bg-cream-deep [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
        '[&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-ink [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-cream',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
