import type { Weekday } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Chave do dia no fuso local (nunca usar toISOString: o Brasil é UTC−3). */
export function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Meio-dia local evita problemas com horário de verão. */
export function fromDateKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function weekdayOf(k: string): Weekday {
  return fromDateKey(k).getDay() as Weekday;
}

export function addDays(k: string, n: number): string {
  const d = fromDateKey(k);
  d.setDate(d.getDate() + n);
  return toLocalDateKey(d);
}

export function nextMonday(k: string): string {
  const wd = weekdayOf(k);
  return addDays(k, ((8 - wd) % 7) || 7);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

/** Segunda-feira da semana (seg a dom) que contém o dia. */
export function mondayOf(k: string): string {
  const wd = weekdayOf(k);
  return addDays(k, wd === 0 ? -6 : 1 - wd);
}

export function todayKey(): string {
  return toLocalDateKey(new Date());
}

export function formatShort(k: string): string {
  const [, m, d] = k.split('-');
  return `${d}/${m}`;
}
