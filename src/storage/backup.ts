import { daysBetween, toLocalDateKey } from '../domain/dates';
import { getSetting, hasAnyData, listAll, openDb, setSetting, STORES, type CheckRec, type SessionRec, type WaterRec, type BodyRec } from './db';

const APP = 'treino-volei';

/** Lê o conteúdo de um Blob/File (FileReader como reserva para ambientes sem Blob.text). */
export function readText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error);
    r.readAsText(blob);
  });
}
const VERSION = 1;

export async function exportBackup(): Promise<Blob> {
  const data: Record<string, unknown[]> = {};
  for (const s of STORES) data[s] = await listAll(s);
  const payload = { app: APP, version: VERSION, exportedAt: new Date().toISOString(), data };
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

type ImportResult = { ok: true } | { ok: false; error: string };

export async function importBackup(file: File): Promise<ImportResult> {
  let parsed: unknown;
  let text: string;
  try {
    text = await readText(file);
  } catch {
    return { ok: false, error: 'Não foi possível ler o arquivo.' };
  }
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O arquivo não é um backup válido (JSON ilegível).' };
  }
  const p = parsed as { app?: unknown; version?: unknown; data?: Record<string, unknown> };
  if (!p || p.app !== APP) return { ok: false, error: 'Este arquivo não é um backup deste app.' };
  if (p.version !== VERSION) return { ok: false, error: `Versão de backup não suportada (${String(p.version)}).` };
  if (!p.data || typeof p.data !== 'object') return { ok: false, error: 'Backup sem dados.' };
  for (const s of STORES) {
    const v = p.data[s];
    if (v !== undefined && (!Array.isArray(v) || v.some((r) => !r || typeof r !== 'object')))
      return { ok: false, error: `Backup corrompido (${s}).` };
  }
  const db = await openDb();
  const tx = db.transaction([...STORES], 'readwrite');
  for (const s of STORES) {
    await tx.objectStore(s).clear();
    for (const rec of (p.data[s] as object[] | undefined) ?? []) await tx.objectStore(s).put(rec);
  }
  await tx.done;
  return { ok: true };
}

export async function exportCsv(): Promise<string> {
  const checks = await listAll<CheckRec>('checks');
  const water = await listAll<WaterRec>('water');
  const sessions = await listAll<SessionRec>('sessions');
  const body = await listAll<BodyRec>('body');
  const dates = new Set<string>([...checks.map((c) => c.date), ...water.map((w) => w.date), ...sessions.map((s) => s.date), ...body.map((b) => b.date)]);
  const rows = ['data;itens_feitos;agua_ml;treino_rpe;peso_kg'];
  for (const d of [...dates].sort()) {
    const done = checks.filter((c) => c.date === d && c.done).length;
    const ml = water.find((w) => w.date === d)?.ml ?? 0;
    const rpe = sessions.find((s) => s.date === d)?.rpe ?? '';
    const kg = body.find((b) => b.date === d)?.weightKg;
    rows.push([d, done, ml, rpe, kg === undefined ? '' : String(kg).replace('.', ',')].join(';'));
  }
  return rows.join('\n') + '\n';
}

/** Compartilha (Android/iPhone: escolha "Salvar no Drive") ou baixa o arquivo. */
export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: filename });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function markBackupDone(at: Date = new Date()): Promise<void> {
  await setSetting('lastBackupAt', toLocalDateKey(at));
}

/** Gera o backup, entrega ao usuário e só então registra a data. */
export async function saveBackupNow(now: Date = new Date()): Promise<void> {
  await shareOrDownload(await exportBackup(), `treino-volei-${toLocalDateKey(now)}.json`);
  await markBackupDone(now);
}

export async function needsBackupReminder(now: Date = new Date()): Promise<boolean> {
  if (!(await hasAnyData())) return false;
  const last = await getSetting<string | null>('lastBackupAt', null);
  if (!last) return true;
  return daysBetween(last, toLocalDateKey(now)) >= 7;
}

export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
