'use client';

import {
  Maximize,
  Minus,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { BRUSHES, BRUSH_SIZES, TOOLS, type BrushId, type ToolId } from './constants';
import { cn } from '@/lib/utils';

/**
 * Studio controls.
 *
 * The bar is one row that never wraps and never grows the page: the tools
 * scroll horizontally inside their own track and everything else is a fixed
 * cluster beside them. Options that only matter for one tool (brush style,
 * brush size, sticker size) are not in the bar at all - they appear under the
 * canvas when that tool is picked, so the resting state stays almost empty.
 */

/** A square control: icon only, 44px touch target, no label. */
export function IconButton({
  onClick,
  disabled,
  label,
  children,
  tone = 'plain',
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
  tone?: 'plain' | 'danger' | 'active';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full border transition disabled:opacity-30',
        tone === 'danger' && 'border-coral/35 bg-coral/10 text-coral hover:bg-coral/20',
        tone === 'active' && 'border-transparent bg-coral text-white',
        tone === 'plain' && 'border-edge bg-white text-ink-soft hover:text-coral',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A tool chip: icon over a label on roomy screens, icon only on phones. */
function ToolChip({
  active,
  label,
  icon: Icon,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={hint ?? label}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition sm:px-3.5',
        active
          ? 'border-transparent bg-coral text-white shadow-[var(--shadow-pill)]'
          : 'border-edge bg-white text-ink-soft hover:text-coral',
      )}
    >
      <Icon className="size-4.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}

/** The row above the canvas: pick a tool, undo a mistake. Nothing else. */
export function ToolBar({
  tool,
  onTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
}: {
  tool: ToolId;
  onTool: (tool: ToolId) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1">
        {TOOLS.map(({ id, label, icon, key }) => (
          <ToolChip
            key={id}
            active={tool === id}
            label={label}
            icon={icon}
            hint={`${label} (${key.toUpperCase()})`}
            onClick={() => onTool(id)}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <IconButton onClick={onUndo} disabled={!canUndo} label="Undo (Ctrl+Z)">
          <Undo2 className="size-4.5" aria-hidden />
        </IconButton>
        <IconButton onClick={onRedo} disabled={!canRedo} label="Redo (Ctrl+Shift+Z)">
          <Redo2 className="size-4.5" aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}

/** The row under the canvas: zoom, sound, start over. */
export function ViewBar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  sound,
  onSound,
  onReset,
  className,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  sound: boolean;
  onSound: (on: boolean) => void;
  onReset: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
      <IconButton onClick={onZoomOut} disabled={zoom <= 1} label="Zoom out">
        <Minus className="size-4.5" aria-hidden />
      </IconButton>
      <span className="w-11 text-center text-xs font-semibold text-ink-soft tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <IconButton onClick={onZoomIn} label="Zoom in">
        <Plus className="size-4.5" aria-hidden />
      </IconButton>
      <IconButton onClick={onResetView} disabled={zoom === 1} label="Fit to screen">
        <Maximize className="size-4.5" aria-hidden />
      </IconButton>

      <span className="mx-0.5 h-6 w-px bg-edge" aria-hidden />

      <IconButton onClick={() => onSound(!sound)} label={sound ? 'Mute sounds' : 'Turn sounds on'}>
        {sound ? (
          <Volume2 className="size-4.5" aria-hidden />
        ) : (
          <VolumeX className="size-4.5" aria-hidden />
        )}
      </IconButton>
      <IconButton onClick={onReset} label="Start over" tone="danger">
        <Trash2 className="size-4.5" aria-hidden />
      </IconButton>
    </div>
  );
}

/**
 * Brush style and size, shown only while the brush or eraser is in hand.
 * The eraser has no style, so that half simply does not render.
 */
export function BrushOptions({
  tool,
  brush,
  onBrush,
  brushSize,
  onBrushSize,
  className,
}: {
  tool: ToolId;
  brush: BrushId;
  onBrush: (brush: BrushId) => void;
  brushSize: number;
  onBrushSize: (size: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3', className)}>
      {tool === 'brush' && (
        <div className="flex min-w-0 flex-1 basis-60 items-center gap-2">
          <span className="shrink-0 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">
            Style
          </span>
          <div className="no-scrollbar -my-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-1">
            {BRUSHES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onBrush(item.id)}
                aria-pressed={brush === item.id}
                title={item.hint}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  brush === item.id
                    ? 'border-transparent bg-coral text-white'
                    : 'border-edge bg-white text-ink-soft hover:text-coral',
                )}
              >
                <item.icon className="size-3.5" aria-hidden />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">
          Size
        </span>
        <div className="flex items-center gap-1.5">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onBrushSize(size)}
              aria-pressed={brushSize === size}
              aria-label={`Size ${size}`}
              className={cn(
                'grid size-9 place-items-center rounded-full border transition',
                brushSize === size
                  ? 'border-coral bg-coral/10'
                  : 'border-edge bg-white hover:border-coral/40',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'block rounded-full',
                  brushSize === size ? 'bg-coral' : 'bg-ink-soft',
                )}
                style={{ width: Math.max(5, size / 3.2), height: Math.max(5, size / 3.2) }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
