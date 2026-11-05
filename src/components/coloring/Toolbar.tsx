'use client';

import {
  Maximize,
  Minus,
  Plus,
  RotateCcw,
  Redo2,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';
import { BRUSHES, BRUSH_SIZES, TOOLS, type BrushId, type ToolId } from './constants';
import { cn } from '@/lib/utils';

function ToolButton({
  active,
  label,
  icon: Icon,
  onClick,
  hint,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={hint ?? label}
      className={cn(
        'flex min-w-16 flex-col items-center gap-1 rounded-2xl border px-2.5 py-2.5 font-display text-[11px] font-extrabold transition-all duration-200',
        active
          ? 'border-ink/10 bg-coral text-white'
          : 'border-ink/10 bg-white text-ink-soft hover:-translate-y-0.5 hover:bg-cream-deep hover:text-ink',
      )}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </button>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
  tone = 'plain',
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
  tone?: 'plain' | 'danger' | 'active';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'tap-big grid place-items-center rounded-2xl border transition disabled:opacity-35',
        tone === 'danger' && 'border-coral/35 bg-coral/15 text-coral-dark hover:bg-coral/25',
        tone === 'active' && 'border-ink/10 bg-coral text-white',
        tone === 'plain' &&
          'border-ink/10 bg-white text-ink-soft hover:-translate-y-0.5 hover:bg-cream-deep hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({
  tool,
  onTool,
  brush,
  onBrush,
  brushSize,
  onBrushSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  sound,
  onSound,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  className,
}: {
  tool: ToolId;
  onTool: (tool: ToolId) => void;
  brush: BrushId;
  onBrush: (brush: BrushId) => void;
  brushSize: number;
  onBrushSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  sound: boolean;
  onSound: (on: boolean) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}) {
  const showBrushes = tool === 'brush';

  return (
    <div className={cn('space-y-3', className)}>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TOOLS.map(({ id, label, icon, key }) => (
          <ToolButton
            key={id}
            active={tool === id}
            label={label}
            icon={icon}
            hint={`${label} (${key.toUpperCase()})`}
            onClick={() => onTool(id)}
          />
        ))}
      </div>

      {showBrushes && (
        <div className="animate-pop space-y-2 rounded-2xl border border-ink/10 bg-white p-3">
          <p className="font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            Brush style
          </p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {BRUSHES.map((item) => (
              <ToolButton
                key={item.id}
                active={brush === item.id}
                label={item.label}
                icon={item.icon}
                hint={item.hint}
                onClick={() => onBrush(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {(tool === 'brush' || tool === 'eraser') && (
        <div className="space-y-2">
          <p className="font-display text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
            {tool === 'eraser' ? 'Eraser size' : 'Brush size'}
          </p>
          <div className="flex items-center gap-2">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onBrushSize(size)}
                aria-pressed={brushSize === size}
                aria-label={`Size ${size}`}
                className={cn(
                  'tap-big grid place-items-center rounded-2xl border transition',
                  brushSize === size
                    ? 'border-grape-400/60 bg-grape-100/70'
                    : 'border-ink/10 bg-white hover:bg-cream-deep',
                )}
              >
                <span
                  aria-hidden
                  className="block rounded-full bg-ink"
                  style={{
                    width: Math.max(6, size / 2.6),
                    height: Math.max(6, size / 2.6),
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3.5">
        <IconButton onClick={onUndo} disabled={!canUndo} label="Undo (Ctrl+Z)">
          <Undo2 className="size-5" aria-hidden />
        </IconButton>
        <IconButton onClick={onRedo} disabled={!canRedo} label="Redo (Ctrl+Shift+Z)">
          <Redo2 className="size-5" aria-hidden />
        </IconButton>

        <span className="mx-1 h-8 w-px bg-ink/10" aria-hidden />

        <IconButton onClick={onZoomOut} disabled={zoom <= 1} label="Zoom out">
          <Minus className="size-5" aria-hidden />
        </IconButton>
        <span className="min-w-12 text-center font-display text-xs font-extrabold text-ink-soft">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton onClick={onZoomIn} label="Zoom in">
          <Plus className="size-5" aria-hidden />
        </IconButton>
        <IconButton onClick={onResetView} disabled={zoom === 1} label="Fit to screen">
          <Maximize className="size-5" aria-hidden />
        </IconButton>

        <span className="mx-1 h-8 w-px bg-ink/10" aria-hidden />

        <IconButton
          onClick={() => onSound(!sound)}
          label={sound ? 'Mute sounds' : 'Turn sounds on'}
        >
          {sound ? (
            <Volume2 className="size-5" aria-hidden />
          ) : (
            <VolumeX className="size-5" aria-hidden />
          )}
        </IconButton>

        <IconButton onClick={onReset} label="Start over" tone="danger">
          <Trash2 className="size-5" aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}

/** Thumb-reach dock shown on phones, pinned above the viewport bottom. */
export function MobileDock({
  tool,
  onTool,
  canUndo,
  onUndo,
  className,
}: {
  tool: ToolId;
  onTool: (tool: ToolId) => void;
  canUndo: boolean;
  onUndo: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-[1.75rem] border border-ink/10 bg-white p-2',
        className,
      )}
    >
      {TOOLS.filter((t) => t.id !== 'pan').map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTool(id)}
          aria-pressed={tool === id}
          aria-label={label}
          className={cn(
            'tap-big grid flex-1 place-items-center rounded-2xl border transition',
            tool === id ? 'border-ink/10 bg-coral text-white' : 'border-ink/10 bg-white text-ink',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </button>
      ))}

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        className="tap-big grid place-items-center rounded-2xl border border-ink/10 bg-white text-ink transition hover:bg-cream-deep disabled:opacity-35"
      >
        <RotateCcw className="size-5" aria-hidden />
      </button>
    </div>
  );
}
