'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import {
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The long-form editor behind a book's description and a page's full write-up.
 *
 * Tiptap rather than a contenteditable of our own: it keeps a real document
 * model, so the HTML that comes out is the shape the sanitiser expects instead
 * of whatever the browser felt like producing. The value travels in a hidden
 * input, which is what lets the existing FormData server actions take it
 * without learning anything new - and the server sanitises it on the way in.
 */

/** Everything the toolbar can produce has a matching tag in lib/html.ts. */
const CONTENT_CLASS = [
  'min-h-64 w-full max-w-none px-4 py-3.5 text-sm leading-relaxed text-slate-800 focus:outline-none',
  '[&_p]:my-2.5',
  '[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900',
  '[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-extrabold [&_h3]:text-slate-900',
  '[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-extrabold [&_h4]:text-slate-900',
  '[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-1',
  '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-200 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_blockquote]:italic',
  '[&_a]:font-semibold [&_a]:text-violet-600 [&_a]:underline',
  '[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs',
  '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-slate-100',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100',
  '[&_hr]:my-5 [&_hr]:border-slate-200',
  '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200',
].join(' ');

function ToolButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid size-8 place-items-center rounded-lg text-sm font-extrabold transition',
        active
          ? 'bg-violet-600 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-6 w-px bg-slate-200" />;
}

function Toolbar({
  editor,
  onPickImage,
  uploading,
  sourceMode,
  onToggleSource,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
  sourceMode: boolean;
  onToggleSource: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');

  function openLink() {
    setHref(editor.getAttributes('link').href ?? 'https://');
    setLinkOpen(true);
  }

  function applyLink() {
    const url = href.trim();
    if (!url || url === 'https://') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50/80">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <select
          aria-label="Text style"
          disabled={sourceMode}
          value={
            editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : editor.isActive('heading', { level: 4 })
                  ? 'h4'
                  : 'p'
          }
          onChange={(event) => {
            const value = event.target.value;
            const chain = editor.chain().focus();
            if (value === 'p') chain.setParagraph().run();
            else chain.setHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }).run();
          }}
          className="mr-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-violet-500 focus:outline-none disabled:opacity-40"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <ToolButton
          label="Bold"
          disabled={sourceMode}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Italic"
          disabled={sourceMode}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Underline"
          disabled={sourceMode}
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Strikethrough"
          disabled={sourceMode}
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" aria-hidden />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Bulleted list"
          disabled={sourceMode}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          disabled={sourceMode}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Quote"
          disabled={sourceMode}
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Inline code"
          disabled={sourceMode}
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Divider line"
          disabled={sourceMode}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" aria-hidden />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Add link"
          disabled={sourceMode}
          active={editor.isActive('link')}
          onClick={openLink}
        >
          <Link2 className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Remove link"
          disabled={sourceMode || !editor.isActive('link')}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Insert image" disabled={sourceMode || uploading} onClick={onPickImage}>
          <ImageIcon className={cn('size-4', uploading && 'animate-pulse')} aria-hidden />
        </ToolButton>

        <Divider />

        <ToolButton
          label="Undo"
          disabled={sourceMode}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={sourceMode}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" aria-hidden />
        </ToolButton>

        <button
          type="button"
          onClick={onToggleSource}
          aria-pressed={sourceMode}
          className={cn(
            'ml-auto rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition',
            sourceMode
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
          )}
        >
          {sourceMode ? 'Visual' : 'Source'}
        </button>
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-2 py-2">
          <input
            autoFocus
            value={href}
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
              if (event.key === 'Escape') setLinkOpen(false);
            }}
            placeholder="https://example.com or /coloring-pages"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-violet-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-extrabold text-white"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  name,
  defaultValue = '',
  onChange,
}: {
  /** Name of the hidden input the surrounding <form> submits. */
  name: string;
  defaultValue?: string | null;
  onChange?: (html: string) => void;
}) {
  const [html, setHtml] = useState(defaultValue ?? '');
  const [sourceMode, setSourceMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Next renders this on the server first; Tiptap has to wait for the DOM.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // The page's own <h1> is the title, so the body starts at h2.
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
    ],
    content: defaultValue ?? '',
    editorProps: { attributes: { class: CONTENT_CLASS } },
    onUpdate: ({ editor: instance }) => {
      const next = instance.getHTML();
      setHtml(next);
      onChange?.(next);
    },
  });

  // Leaving the source view puts the hand-edited HTML back into the document;
  // anything the schema does not know is dropped there rather than on save.
  useEffect(() => {
    if (!editor || sourceMode) return;
    if (editor.getHTML() !== html) editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, sourceMode, html]);

  async function upload(file: File) {
    setUploading(true);
    setError(null);

    const form = new FormData();
    form.set('mode', 'inline');
    form.set('file', file);

    try {
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };

      if (!response.ok || !payload.ok || !payload.url) {
        throw new Error(payload.error ?? `Upload failed (${response.status})`);
      }

      editor?.chain().focus().setImage({ src: payload.url, alt: file.name }).run();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-[inset_0_1px_2px_rgb(15_23_42_/_0.04)]">
      {editor && (
        <Toolbar
          editor={editor}
          uploading={uploading}
          onPickImage={() => fileInput.current?.click()}
          sourceMode={sourceMode}
          onToggleSource={() => setSourceMode((v) => !v)}
        />
      )}

      {sourceMode ? (
        <textarea
          value={html}
          onChange={(event) => {
            setHtml(event.target.value);
            onChange?.(event.target.value);
          }}
          spellCheck={false}
          className="min-h-64 w-full resize-y px-4 py-3.5 font-mono text-xs leading-relaxed text-slate-700 focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      {error && (
        <p className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />

      {/* The form only ever sees this; the server sanitises it on arrival. */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
