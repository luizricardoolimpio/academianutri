import { daysBetween, weekdayOf } from './dates';
import type { Phase, SessionId, Weekday } from './types';

export const CYCLE_WEEKS = 12;

export function phaseOfWeek(week: number): Phase {
  if (week <= 4) return 'base';
  if (week <= 8) return 'forca';
  if (week <= 11) return 'potencia';
  return 'descarga';
}

export function programPosition(dateKey: string, startKey: string) {
  const days = daysBetween(startKey, dateKey);
  if (days < 0) return { started: false, startsOn: startKey, cycle: 1, week: 1, phase: 'base' as Phase };
  const totalWeeks = Math.floor(days / 7);
  const week = (totalWeeks % CYCLE_WEEKS) + 1;
  return { started: true, startsOn: startKey, cycle: Math.floor(totalWeeks / CYCLE_WEEKS) + 1, week, phase: phaseOfWeek(week) };
}

export const WEEK_GRID: Record<Weekday, SessionId | null> = {
  0: 'cardio', 1: 'inferiorA', 2: 'mobilidade', 3: 'superiorA', 4: 'inferiorB', 5: 'superiorB', 6: null,
};

export function sessionForDate(dateKey: string): SessionId | null {
  return WEEK_GRID[weekdayOf(dateKey)];
}

import { PROGRAM, ROUTINES } from '../data/program';
import type { Prescription } from './types';

export function plyoContacts(list: Prescription[]): number {
  return list.reduce((sum, x) => sum + (x.plyoContactsPerSet ?? 0) * x.sets, 0);
}

/** Plano da sessão. Versão reduzida (dor/sono ruim): sem saltos e 1 série a menos (mín. 1). */
export function sessionPlan(sessionId: SessionId, phase: Phase, reduced: boolean): Prescription[] {
  if (sessionId === 'mobilidade' || sessionId === 'cardio') return ROUTINES[sessionId];
  const list = PROGRAM[sessionId][phase];
  if (!reduced) return list;
  return list.filter((x) => !x.plyoContactsPerSet).map((x) => ({ ...x, sets: Math.max(1, x.sets - 1) }));
}
