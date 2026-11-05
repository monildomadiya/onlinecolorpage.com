/**
 * Local persistence for the coloring studio.
 *
 * Artwork goes to IndexedDB (blobs, no 5 MB string cap). Badges, the sticker
 * book and small preferences go to localStorage. Nothing leaves the device.
 * Every call is wrapped in try/catch because private windows and blocked site
 * data make these APIs throw rather than return empty.
 */

import { Compass, Crown, Palette, Rainbow, Star, Trophy, type LucideIcon } from 'lucide-react';

const DB_NAME = 'onlinecolorpage';
const DB_VERSION = 1;
const STORE = 'artwork';

const PREFS_KEY = 'ocp:prefs';
const REWARDS_KEY = 'ocp:rewards';

export interface SavedArtwork {
  slug: string;
  blob: Blob;
  width: number;
  height: number;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'slug' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function saveArtwork(entry: SavedArtwork): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Out of quota or blocked - the drawing simply is not restored next time.
  } finally {
    db.close();
  }
}

export async function loadArtwork(slug: string): Promise<SavedArtwork | null> {
  const db = await openDb();
  if (!db) return null;

  try {
    return await new Promise<SavedArtwork | null>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(slug);
      request.onsuccess = () => resolve((request.result as SavedArtwork) ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

export async function deleteArtwork(slug: string): Promise<void> {
  const db = await openDb();
  if (!db) return;

  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(slug);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  } finally {
    db.close();
  }
}

export async function listArtwork(): Promise<SavedArtwork[]> {
  const db = await openDb();
  if (!db) return [];

  try {
    return await new Promise<SavedArtwork[]>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () =>
        resolve(((request.result as SavedArtwork[]) ?? []).sort((a, b) => b.savedAt - a.savedAt));
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  } finally {
    db.close();
  }
}

/* ------------------------------------------------------------------ */
/*  preferences                                                        */
/* ------------------------------------------------------------------ */

export interface Prefs {
  sound: boolean;
  lastColor: string;
  lastTool: string;
  lastBrush: string;
  brushSize: number;
}

export const DEFAULT_PREFS: Prefs = {
  sound: true,
  lastColor: '#FF3B30',
  lastTool: 'fill',
  lastBrush: 'marker',
  brushSize: 22,
};

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(prefs: Partial<Prefs>): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...prefs }));
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  rewards / sticker book                                             */
/* ------------------------------------------------------------------ */

export interface Rewards {
  /** Slugs the child has finished, newest last. */
  finished: string[];
  stars: number;
  streakDays: number;
  lastDay: string;
}

const EMPTY_REWARDS: Rewards = { finished: [], stars: 0, streakDays: 0, lastDay: '' };

export interface Badge {
  id: string;
  label: string;
  icon: LucideIcon;
  need: number;
}

export const BADGES: Badge[] = [
  { id: 'first', label: 'First Masterpiece', icon: Palette, need: 1 },
  { id: 'five', label: 'Colour Explorer', icon: Compass, need: 5 },
  { id: 'ten', label: 'Rainbow Maker', icon: Rainbow, need: 10 },
  { id: 'twentyfive', label: 'Art Star', icon: Star, need: 25 },
  { id: 'fifty', label: 'Crayon Champion', icon: Trophy, need: 50 },
  { id: 'hundred', label: 'Legend of Colour', icon: Crown, need: 100 },
];

export function readRewards(): Rewards {
  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    if (!raw) return EMPTY_REWARDS;
    return { ...EMPTY_REWARDS, ...(JSON.parse(raw) as Partial<Rewards>) };
  } catch {
    return EMPTY_REWARDS;
  }
}

/**
 * Marks a page finished and returns the updated totals plus any badge that was
 * unlocked by this one, so the UI can celebrate it.
 */
export function awardFinish(slug: string): { rewards: Rewards; newBadge: Badge | null } {
  const current = readRewards();
  const today = new Date().toISOString().slice(0, 10);

  const alreadyDone = current.finished.includes(slug);
  const finished = alreadyDone ? current.finished : [...current.finished, slug].slice(-500);

  let streakDays = current.streakDays;
  if (current.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    streakDays = current.lastDay === yesterday ? current.streakDays + 1 : 1;
  }

  const next: Rewards = {
    finished,
    stars: current.stars + (alreadyDone ? 1 : 3),
    streakDays,
    lastDay: today,
  };

  try {
    localStorage.setItem(REWARDS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }

  const before = current.finished.length;
  const after = finished.length;
  const newBadge = BADGES.find((b) => before < b.need && after >= b.need) ?? null;

  return { rewards: next, newBadge };
}

export function earnedBadges(rewards: Rewards): Badge[] {
  return BADGES.filter((badge) => rewards.finished.length >= badge.need);
}

export function nextBadge(rewards: Rewards): Badge | null {
  return BADGES.find((badge) => rewards.finished.length < badge.need) ?? null;
}
