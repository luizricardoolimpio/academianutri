import { mondayOf, weekdayOf } from './dates';
import type { ScheduleItem } from './schedule';
import type { SessionId } from './types';

/** "22,5" → 22.5; vazio/inválido/negativo → undefined. */
export function parseLoad(input: string): number | undefined {
  const t = input.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function formatLoad(kg: number | undefined): string {
  return kg === undefined ? '' : String(kg).replace('.', ',');
}

export function compliance(items: ScheduleItem[], doneIds: Set<string>): number {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => doneIds.has(i.id)).length / items.length) * 100);
}

/**
 * Reposição de treino perdido: só treinos de superior, só na terça ou no domingo
 * da mesma semana e depois do dia perdido. Pernas nunca são repostas
 * (iriam para perto do vôlei de terça à noite ou do sábado).
 */
export function canMakeUp(missed: SessionId, missedDate: string, today: string): boolean {
  if (missed !== 'superiorA' && missed !== 'superiorB') return false;
  if (today <= missedDate || mondayOf(today) !== mondayOf(missedDate)) return false;
  const wd = weekdayOf(today);
  return wd === 2 || wd === 0;
}

export interface Wellness { sono: number; joelho: number; ombro: number; disposicao: number }

/** Dor ≥ 3 em joelho/ombro ou sono ≤ 2 → sugerir a versão reduzida do treino. */
export function suggestReduced(w: Wellness | undefined): boolean {
  if (!w) return false;
  return w.joelho >= 3 || w.ombro >= 3 || w.sono <= 2;
}
