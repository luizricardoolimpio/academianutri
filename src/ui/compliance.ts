import { compliance } from '../domain/progress';
import { buildDay, type ScheduleItem } from '../domain/schedule';
import { getDoneIds, getSession, getSetting, getWater, getWellness } from '../storage/db';
import { saturdayCourtKey, type AppSettings } from './settings';

export const WATER_GOAL = 3500;

/** Itens do dia + água e bem-estar, e quais estão feitos — a mesma conta em todas as telas. */
export function withTracking(items: ScheduleItem[], doneIds: Set<string>, opts: { water: number; wellness: boolean; sessionDone: boolean }) {
  const done = new Set(doneIds);
  if (opts.sessionDone) done.add('treino');
  if (opts.water >= WATER_GOAL) done.add('agua');
  if (opts.wellness) done.add('bem-estar');
  const trackable: ScheduleItem[] = [
    ...items,
    { id: 'agua', time: '23:59', kind: 'water', title: 'Água' },
    { id: 'bem-estar', time: '00:00', kind: 'wellness', title: 'Bem-estar' },
  ];
  return { trackable, done, pct: compliance(trackable, done) };
}

export async function dayCompliance(date: string, settings: AppSettings) {
  const items = buildDay(date, { ...settings, saturdayCourt: await getSetting(saturdayCourtKey(date), true) });
  return withTracking(items, await getDoneIds(date), {
    water: await getWater(date),
    wellness: !!(await getWellness(date)),
    sessionDone: !!(await getSession(date))?.completedAt,
  });
}
