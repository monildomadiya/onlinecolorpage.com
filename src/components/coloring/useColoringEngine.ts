'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTOSAVE_DELAY,
  BRUSH_SIZES,
  MAX_UNDO,
  STICKER_SIZES,
  ZOOM_MAX,
  ZOOM_MIN,
  type BrushId,
  type ToolId,
} from './constants';
import {
  coverage as measureCoverage,
  createPaintCanvas,
  drawDot,
  drawSegment,
  drawSticker,
  flatten,
  floodFill,
  pickColor,
  prepareLineArt,
  type LineArt,
  type Point,
} from './engine';
import { play, setSoundEnabled } from './sounds';
import {
  DEFAULT_PREFS,
  deleteArtwork,
  loadArtwork,
  readPrefs,
  saveArtwork,
  writePrefs,
} from './storage';

export type Status = 'loading' | 'ready' | 'error';

export interface View {
  x: number;
  y: number;
  z: number;
}

export interface ColoringEngineOptions {
  slug: string;
  /** Same-origin URL for the line art (must be, so the canvas stays readable). */
  imageUrl: string;
  /** Optional pre-coloured guide shown faintly underneath. */
  referenceUrl?: string | null;
  watermark?: string | null;
  soundDefault?: boolean;
  onFirstStroke?: () => void;
}

const EMPTY_VIEW: View = { x: 0, y: 0, z: 1 };

export function useColoringEngine({
  slug,
  imageUrl,
  referenceUrl,
  watermark,
  soundDefault = true,
  onFirstStroke,
}: ColoringEngineOptions) {
  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const lineRef = useRef<HTMLCanvasElement | null>(null);

  const artRef = useRef<LineArt | null>(null);
  const beforeRef = useRef<HTMLCanvasElement | null>(null);

  const undoRef = useRef<Blob[]>([]);
  const redoRef = useRef<Blob[]>([]);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  // Live stroke bookkeeping - refs so pointermove never triggers a re-render.
  const strokeRef = useRef<{ last: Point; travel: number } | null>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<{ distance: number; mid: Point; view: View } | null>(null);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const [tool, setToolState] = useState<ToolId>('fill');
  const [brush, setBrush] = useState<BrushId>('marker');
  const [color, setColorState] = useState('#FF3B30');
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[2]);
  const [sticker, setSticker] = useState('⭐');
  const [stickerSize, setStickerSize] = useState(STICKER_SIZES[1]);

  const [view, setView] = useState<View>(EMPTY_VIEW);
  const [sound, setSound] = useState(soundDefault);
  const [guide, setGuide] = useState(0);
  const [eyedropper, setEyedropper] = useState(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [restored, setRestored] = useState(false);
  const [coverage, setCoverage] = useState(0);

  /* ---------------------------------------------------------------- */
  /*  preferences                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const prefs = readPrefs();
    setSound(soundDefault && prefs.sound);
    setColorState(prefs.lastColor || DEFAULT_PREFS.lastColor);
    setBrush((prefs.lastBrush as BrushId) || 'marker');
    setBrushSize(prefs.brushSize || BRUSH_SIZES[2]);
    if (prefs.lastTool === 'brush' || prefs.lastTool === 'fill') {
      setToolState(prefs.lastTool as ToolId);
    }
  }, [soundDefault]);

  useEffect(() => setSoundEnabled(sound), [sound]);

  const setColor = useCallback((next: string) => {
    setColorState(next);
    setEyedropper(false);
    writePrefs({ lastColor: next });
    play('tick');
  }, []);

  const setTool = useCallback((next: ToolId) => {
    setToolState(next);
    setEyedropper(false);
    writePrefs({ lastTool: next });
    play('tick');
  }, []);

  useEffect(() => writePrefs({ brushSize, lastBrush: brush, sound }), [brushSize, brush, sound]);

  /* ---------------------------------------------------------------- */
  /*  load the artwork                                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);

    const image = new Image();
    // Same-origin via /api/file, but be explicit so the canvas stays readable.
    image.crossOrigin = 'anonymous';
    image.decoding = 'sync';

    image.onload = async () => {
      if (cancelled) return;

      try {
        const art = prepareLineArt(image);
        artRef.current = art;

        const paint = paintRef.current;
        const lines = lineRef.current;
        if (!paint || !lines) return;

        paint.width = art.width;
        paint.height = art.height;
        lines.width = art.width;
        lines.height = art.height;

        const paintCtx = paint.getContext('2d', { willReadFrequently: true })!;
        paintCtx.fillStyle = '#FFFFFF';
        paintCtx.fillRect(0, 0, art.width, art.height);

        lines.getContext('2d')!.drawImage(art.lineCanvas, 0, 0);

        beforeRef.current = createPaintCanvas(art.width, art.height);

        // Bring back whatever this child was working on last time.
        const saved = await loadArtwork(slug);
        if (!cancelled && saved && saved.width === art.width && saved.height === art.height) {
          try {
            const bitmap = await createImageBitmap(saved.blob);
            paintCtx.drawImage(bitmap, 0, 0);
            bitmap.close();
            setRestored(true);
            setDirty(true);
          } catch {
            // Corrupt blob - just start clean.
          }
        }

        if (cancelled) return;
        setSize({ width: art.width, height: art.height });
        setStatus('ready');
      } catch (cause) {
        console.error('[coloring] could not prepare the artwork', cause);
        if (!cancelled) {
          setError('We could not open this picture. Please try another one.');
          setStatus('error');
        }
      }
    };

    image.onerror = () => {
      if (cancelled) return;
      setError('This picture would not load. Check your connection and try again.');
      setStatus('error');
    };

    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl, slug]);

  /* ---------------------------------------------------------------- */
  /*  history                                                         */
  /* ---------------------------------------------------------------- */

  const snapshotBefore = useCallback(() => {
    const paint = paintRef.current;
    const before = beforeRef.current;
    if (!paint || !before) return;
    const ctx = before.getContext('2d')!;
    ctx.clearRect(0, 0, before.width, before.height);
    ctx.drawImage(paint, 0, 0);
  }, []);

  const commitSnapshot = useCallback(() => {
    const before = beforeRef.current;
    if (!before) return;

    before.toBlob(
      (blob) => {
        if (!blob) return;
        undoRef.current.push(blob);
        if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
        redoRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
      },
      'image/webp',
      0.92,
    );
  }, []);

  const restoreBlob = useCallback(async (blob: Blob) => {
    const paint = paintRef.current;
    const art = artRef.current;
    if (!paint || !art) return;

    const ctx = paint.getContext('2d', { willReadFrequently: true })!;
    const bitmap = await createImageBitmap(blob);
    ctx.clearRect(0, 0, paint.width, paint.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paint.width, paint.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
  }, []);

  const currentBlob = useCallback((): Promise<Blob | null> => {
    const paint = paintRef.current;
    if (!paint) return Promise.resolve(null);
    return new Promise((resolve) => paint.toBlob((b) => resolve(b), 'image/webp', 0.92));
  }, []);

  const undo = useCallback(async () => {
    const previous = undoRef.current.pop();
    if (!previous) return;

    const now = await currentBlob();
    if (now) {
      redoRef.current.push(now);
      setCanRedo(true);
    }

    await restoreBlob(previous);
    setCanUndo(undoRef.current.length > 0);
    setDirty(true);
    play('swoosh');
  }, [currentBlob, restoreBlob]);

  const redo = useCallback(async () => {
    const next = redoRef.current.pop();
    if (!next) return;

    const now = await currentBlob();
    if (now) {
      undoRef.current.push(now);
      setCanUndo(true);
    }

    await restoreBlob(next);
    setCanRedo(redoRef.current.length > 0);
    setDirty(true);
    play('swoosh');
  }, [currentBlob, restoreBlob]);

  /* ---------------------------------------------------------------- */
  /*  autosave + coverage                                             */
  /* ---------------------------------------------------------------- */

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      const paint = paintRef.current;
      const art = artRef.current;
      if (!paint || !art) return;

      paint.toBlob(
        (blob) => {
          if (!blob) return;
          void saveArtwork({
            slug,
            blob,
            width: art.width,
            height: art.height,
            savedAt: Date.now(),
          });
        },
        'image/webp',
        0.8,
      );

      const ctx = paint.getContext('2d', { willReadFrequently: true });
      if (ctx) setCoverage(measureCoverage(ctx, art.mask, art.width, art.height));
    }, AUTOSAVE_DELAY);
  }, [slug]);

  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    },
    [],
  );

  const markChanged = useCallback(() => {
    setDirty(true);
    scheduleAutosave();

    if (!startedRef.current) {
      startedRef.current = true;
      onFirstStroke?.();
    }
  }, [onFirstStroke, scheduleAutosave]);

  /* ---------------------------------------------------------------- */
  /*  coordinates                                                     */
  /* ---------------------------------------------------------------- */

  /** Screen point -> canvas pixel. getBoundingClientRect already accounts for
   *  the CSS transform we use for zoom/pan, so no manual matrix maths. */
  const toCanvas = useCallback((clientX: number, clientY: number): Point | null => {
    const paint = paintRef.current;
    if (!paint) return null;

    const rect = paint.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * paint.width,
      y: ((clientY - rect.top) / rect.height) * paint.height,
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  view (zoom / pan)                                               */
  /* ---------------------------------------------------------------- */

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const z = clampZoom(v.z * factor);
      // Snapping back to centre at 1x stops the artwork drifting off screen.
      return z === 1 ? EMPTY_VIEW : { ...v, z };
    });
  }, []);

  const resetView = useCallback(() => setView(EMPTY_VIEW), []);

  /* ---------------------------------------------------------------- */
  /*  actions                                                         */
  /* ---------------------------------------------------------------- */

  const applyFill = useCallback(
    (point: Point) => {
      const paint = paintRef.current;
      const art = artRef.current;
      if (!paint || !art) return;

      const ctx = paint.getContext('2d', { willReadFrequently: true })!;
      snapshotBefore();

      const filled = floodFill(ctx, art, point.x, point.y, color);

      if (filled) {
        commitSnapshot();
        markChanged();
        play('splash');
      } else {
        play('nope');
      }
    },
    [color, commitSnapshot, markChanged, snapshotBefore],
  );

  const placeSticker = useCallback(
    (point: Point) => {
      const paint = paintRef.current;
      if (!paint) return;

      const ctx = paint.getContext('2d', { willReadFrequently: true })!;
      snapshotBefore();
      drawSticker(ctx, point, sticker, stickerSize, (Math.random() - 0.5) * 0.5);
      commitSnapshot();
      markChanged();
      play('pop');
    },
    [commitSnapshot, markChanged, snapshotBefore, sticker, stickerSize],
  );

  const reset = useCallback(async () => {
    const paint = paintRef.current;
    const art = artRef.current;
    if (!paint || !art) return;

    snapshotBefore();
    const ctx = paint.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, art.width, art.height);
    commitSnapshot();

    setCoverage(0);
    setDirty(false);
    setRestored(false);
    await deleteArtwork(slug);
    play('swoosh');
  }, [commitSnapshot, slug, snapshotBefore]);

  /* ---------------------------------------------------------------- */
  /*  pointer handling                                                */
  /* ---------------------------------------------------------------- */

  const endGesture = useCallback(() => {
    gestureRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (status !== 'ready') return;

      const pointers = pointersRef.current;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      event.currentTarget.setPointerCapture(event.pointerId);

      // Two fingers down = pinch/pan, never a stroke.
      if (pointers.size >= 2) {
        strokeRef.current = null;
        const [a, b] = Array.from(pointers.values());
        gestureRef.current = {
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          view,
        };
        return;
      }

      const point = toCanvas(event.clientX, event.clientY);
      if (!point) return;

      if (eyedropper) {
        const paint = paintRef.current;
        if (paint) {
          const ctx = paint.getContext('2d', { willReadFrequently: true })!;
          setColor(pickColor(ctx, point.x, point.y));
        }
        return;
      }

      if (tool === 'pan') {
        gestureRef.current = { distance: 0, mid: { x: event.clientX, y: event.clientY }, view };
        return;
      }

      if (tool === 'fill') {
        applyFill(point);
        return;
      }

      if (tool === 'sticker') {
        placeSticker(point);
        return;
      }

      // brush / eraser
      const paint = paintRef.current;
      if (!paint) return;

      snapshotBefore();
      const ctx = paint.getContext('2d', { willReadFrequently: true })!;
      const style = {
        brush: tool === 'eraser' ? ('marker' as BrushId) : brush,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: brushSize,
        travel: 0,
      };

      drawDot(ctx, point, style);
      strokeRef.current = { last: point, travel: 0 };
      markChanged();
    },
    [
      applyFill,
      brush,
      brushSize,
      color,
      eyedropper,
      markChanged,
      placeSticker,
      setColor,
      snapshotBefore,
      status,
      tool,
      toCanvas,
      view,
    ],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (status !== 'ready') return;

      const pointers = pointersRef.current;
      if (pointers.has(event.pointerId)) {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      const gesture = gestureRef.current;

      // Pinch zoom + two-finger pan
      if (gesture && pointers.size >= 2) {
        const [a, b] = Array.from(pointers.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

        const z = clampZoom(gesture.view.z * (distance / (gesture.distance || distance)));
        setView({
          z,
          x: gesture.view.x + (mid.x - gesture.mid.x),
          y: gesture.view.y + (mid.y - gesture.mid.y),
        });
        return;
      }

      // Hand tool pan
      if (gesture && tool === 'pan') {
        setView({
          z: gesture.view.z,
          x: gesture.view.x + (event.clientX - gesture.mid.x),
          y: gesture.view.y + (event.clientY - gesture.mid.y),
        });
        return;
      }

      const stroke = strokeRef.current;
      if (!stroke) return;

      const point = toCanvas(event.clientX, event.clientY);
      const paint = paintRef.current;
      if (!point || !paint) return;

      const ctx = paint.getContext('2d', { willReadFrequently: true })!;
      const travel = drawSegment(ctx, stroke.last, point, {
        brush: tool === 'eraser' ? 'marker' : brush,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: brushSize,
        travel: stroke.travel,
      });

      strokeRef.current = { last: point, travel };
    },
    [brush, brushSize, color, status, tool, toCanvas],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const pointers = pointersRef.current;
      pointers.delete(event.pointerId);

      if (pointers.size < 2) endGesture();

      if (strokeRef.current) {
        strokeRef.current = null;
        commitSnapshot();
        markChanged();
      }
    },
    [commitSnapshot, endGesture, markChanged],
  );

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setView((v) => {
      const z = clampZoom(v.z * (event.deltaY < 0 ? 1.12 : 0.89));
      return z === 1 ? EMPTY_VIEW : { ...v, z };
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /*  keyboard shortcuts                                              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        void (event.shiftKey ? redo() : undo());
        return;
      }
      if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        void redo();
        return;
      }
      if (meta) return;

      const map: Record<string, ToolId> = { f: 'fill', b: 'brush', e: 'eraser', s: 'sticker', h: 'pan' };
      const next = map[event.key.toLowerCase()];
      if (next) {
        event.preventDefault();
        setTool(next);
        return;
      }
      if (event.key === '+' || event.key === '=') zoomBy(1.2);
      if (event.key === '-') zoomBy(0.83);
      if (event.key === '0') resetView();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [redo, resetView, setTool, undo, zoomBy]);

  /* ---------------------------------------------------------------- */
  /*  export                                                          */
  /* ---------------------------------------------------------------- */

  const exportBlob = useCallback(
    async (scale = 1.5): Promise<Blob | null> => {
      const paint = paintRef.current;
      const lines = lineRef.current;
      if (!paint || !lines) return null;

      const out = flatten({ paint, lines, scale, watermark });
      return new Promise((resolve) => out.toBlob((b) => resolve(b), 'image/png'));
    },
    [watermark],
  );

  /** Finished-art data URL, used by the share/celebration card. */
  const exportDataUrl = useCallback(
    (scale = 0.5): string | null => {
      const paint = paintRef.current;
      const lines = lineRef.current;
      if (!paint || !lines) return null;
      return flatten({ paint, lines, scale, watermark: null }).toDataURL('image/webp', 0.85);
    },
    [],
  );

  const transform = useMemo(
    () => `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
    [view],
  );

  return {
    // refs to attach
    paintRef,
    lineRef,

    // state
    status,
    error,
    size,
    tool,
    brush,
    color,
    brushSize,
    sticker,
    stickerSize,
    view,
    transform,
    sound,
    guide,
    eyedropper,
    canUndo,
    canRedo,
    dirty,
    restored,
    coverage,
    hasReference: Boolean(referenceUrl),

    // setters
    setTool,
    setBrush,
    setColor,
    setBrushSize,
    setSticker,
    setStickerSize,
    setSound,
    setGuide,
    setEyedropper,

    // actions
    undo,
    redo,
    reset,
    zoomIn: () => zoomBy(1.25),
    zoomOut: () => zoomBy(0.8),
    resetView,
    exportBlob,
    exportDataUrl,

    // handlers
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}

export type ColoringEngine = ReturnType<typeof useColoringEngine>;
