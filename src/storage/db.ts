import { openDB, type IDBPDatabase } from 'idb';
import type { SessionId } from '../domain/types';

export const STORES = ['checks', 'sets', 'sessions', 'wellness', 'water', 'body', 'jumps', 'settings'] as const;
export type StoreName = (typeof STORES)[number];

export interface CheckRec { key: string; date: string; itemId: string; done: boolean; at: number }
export interface SetRec { id: string; date: string; sessionId: SessionId; exerciseId: string; setIndex: number; reps?: string; loadKg?: number; at: number }
export interface SessionRec { date: string; sessionId: SessionId; rpe?: number; reduced: boolean; completedAt?: number }
export interface WellnessRec { date: string; sono: number; joelho: number; ombro: number; disposicao: number }
export interface WaterRec { date: string; ml: number }
export interface BodyRec { date: string; weightKg?: number; measures?: Record<string, number> }
export interface JumpRec { date: string; reachCm?: number; jumpCm?: number }

let dbPromise: Promise<IDBPDatabase> | null = null;

export function openDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB('treino-volei', 1, {
    upgrade(db) {
      db.createObjectStore('checks', { keyPath: 'key' }).createIndex('date', 'date');
      db.createObjectStore('sets', { keyPath: 'id' }).createIndex('exerciseId', 'exerciseId');
      db.createObjectStore('sessions', { keyPath: 'date' });
      db.createObjectStore('wellness', { keyPath: 'date' });
      db.createObjectStore('water', { keyPath: 'date' });
      db.createObjectStore('body', { keyPath: 'date' });
      db.createObjectStore('jumps', { keyPath: 'date' });
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });
  return dbPromise;
}

/** Fecha a conexão (usado nos testes e antes de restaurar). */
export function closeDb(): void {
  if (dbPromise) void dbPromise.then((d) => d.close()).catch(() => {});
  dbPromise = null;
}

// ── Checks ────────────────────────────────────────────────────────────
export async function toggleCheck(date: string, itemId: string): Promise<boolean> {
  const db = await openDb();
  const key = `${date}|${itemId}`;
  const cur = (await db.get('checks', key)) as CheckRec | undefined;
  const done = !cur?.done;
  await db.put('checks', { key, date, itemId, done, at: Date.now() } satisfies CheckRec);
  return done;
}

export async function setCheck(date: string, itemId: string, done: boolean): Promise<void> {
  const db = await openDb();
  await db.put('checks', { key: `${date}|${itemId}`, date, itemId, done, at: Date.now() } satisfies CheckRec);
}

export async function isChecked(date: string, itemId: string): Promise<boolean> {
  const rec = (await (await openDb()).get('checks', `${date}|${itemId}`)) as CheckRec | undefined;
  return !!rec?.done;
}

export async function getDoneIds(date: string): Promise<Set<string>> {
  const recs = (await (await openDb()).getAllFromIndex('checks', 'date', date)) as CheckRec[];
  return new Set(recs.filter((r) => r.done).map((r) => r.itemId));
}

// ── Água ──────────────────────────────────────────────────────────────
export async function getWater(date: string): Promise<number> {
  return ((await (await openDb()).get('water', date)) as WaterRec | undefined)?.ml ?? 0;
}

export async function addWater(date: string, ml: number): Promise<number> {
  const db = await openDb();
  const total = Math.max(0, (await getWater(date)) + ml);
  await db.put('water', { date, ml: total } satisfies WaterRec);
  return total;
}

// ── Séries e sessões ──────────────────────────────────────────────────
export async function saveSet(s: Omit<SetRec, 'id' | 'at'>): Promise<void> {
  const id = `${s.date}|${s.exerciseId}|${s.setIndex}`;
  await (await openDb()).put('sets', { ...s, id, at: Date.now() } satisfies SetRec);
}

export async function deleteSet(date: string, exerciseId: string, setIndex: number): Promise<void> {
  await (await openDb()).delete('sets', `${date}|${exerciseId}|${setIndex}`);
}

export async function getSetsFor(exerciseId: string): Promise<SetRec[]> {
  const recs = (await (await openDb()).getAllFromIndex('sets', 'exerciseId', exerciseId)) as SetRec[];
  return recs.sort((a, b) => a.date.localeCompare(b.date) || a.setIndex - b.setIndex);
}

export async function getSetsOnDate(date: string): Promise<SetRec[]> {
  const all = (await (await openDb()).getAll('sets')) as SetRec[];
  return all.filter((s) => s.date === date);
}

export async function lastLoad(exerciseId: string): Promise<{ loadKg?: number; reps?: string; date: string } | undefined> {
  const withLoad = (await getSetsFor(exerciseId)).filter((s) => s.loadKg !== undefined);
  const last = withLoad.at(-1);
  return last ? { loadKg: last.loadKg, reps: last.reps, date: last.date } : undefined;
}

export async function saveSession(s: SessionRec): Promise<void> {
  await (await openDb()).put('sessions', s);
}

export async function getSession(date: string): Promise<SessionRec | undefined> {
  return (await (await openDb()).get('sessions', date)) as SessionRec | undefined;
}

// ── Bem-estar, corpo, salto ───────────────────────────────────────────
export async function saveWellness(w: WellnessRec): Promise<void> { await (await openDb()).put('wellness', w); }
export async function getWellness(date: string): Promise<WellnessRec | undefined> {
  return (await (await openDb()).get('wellness', date)) as WellnessRec | undefined;
}
export async function saveBody(b: BodyRec): Promise<void> {
  const db = await openDb();
  const cur = ((await db.get('body', b.date)) as BodyRec | undefined) ?? { date: b.date };
  await db.put('body', { ...cur, ...b, measures: { ...cur.measures, ...b.measures } } satisfies BodyRec);
}
export async function listBody(): Promise<BodyRec[]> { return (await (await openDb()).getAll('body')) as BodyRec[]; }
export async function saveJump(j: JumpRec): Promise<void> { await (await openDb()).put('jumps', j); }
export async function listJumps(): Promise<JumpRec[]> { return (await (await openDb()).getAll('jumps')) as JumpRec[]; }
export async function listAll<T>(store: StoreName): Promise<T[]> { return (await (await openDb()).getAll(store)) as T[]; }

// ── Ajustes ───────────────────────────────────────────────────────────
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rec = (await (await openDb()).get('settings', key)) as { key: string; value: T } | undefined;
  return rec ? rec.value : fallback;
}
export async function setSetting<T>(key: string, value: T): Promise<void> {
  await (await openDb()).put('settings', { key, value });
}

export async function hasAnyData(): Promise<boolean> {
  const db = await openDb();
  for (const s of STORES) if (s !== 'settings' && (await db.count(s)) > 0) return true;
  return false;
}
