import { CARB_GRAMS, dietDayType } from '../data/diet';
import { dosesFor, ROUTINE } from '../data/routine';
import { SUPPLEMENTS } from '../data/supplements';
import { sessionForDate } from './program';
import { SESSION_LABEL, type SessionId } from './types';

export interface ScheduleItem {
  id: string;
  time: string;
  kind: 'meal' | 'supplement' | 'training' | 'volley' | 'water' | 'wellness';
  title: string;
  detail?: string;
  mealId?: string;
  sessionId?: SessionId;
}

export interface DaySettings {
  enabledSupplements: string[];
  saturdayCourt: boolean;
  timeOverrides?: Record<string, string>;
}

function shift(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const t = Math.max(0, h * 60 + m + minutes);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export function buildDay(dateKey: string, settings: DaySettings): ScheduleItem[] {
  const type = dietDayType(dateKey);
  const carbs = CARB_GRAMS[type];
  const overrides = settings.timeOverrides ?? {};
  const items: ScheduleItem[] = [];
  const timeOf: Record<string, string> = {};

  for (const e of ROUTINE[type]) {
    if (e.saturdayCourtOnly && !settings.saturdayCourt) continue;
    const time = overrides[e.id] ?? e.time;
    timeOf[e.id] = time;
    if (e.kind === 'training') {
      const sessionId = sessionForDate(dateKey);
      if (!sessionId) continue;
      items.push({ id: e.id, time, kind: 'training', title: SESSION_LABEL[sessionId], sessionId });
      continue;
    }
    const grams = e.carb ? carbs[e.carb] : undefined;
    items.push({
      id: e.id, time, kind: e.kind, title: e.title, mealId: e.mealId,
      detail: typeof grams === 'number' ? `${grams} g de carbo` : undefined,
    });
  }

  for (const d of dosesFor(type)) {
    if (!settings.enabledSupplements.includes(d.supplement)) continue;
    const anchorTime = timeOf[d.anchor];
    if (!anchorTime) continue;
    const time = shift(anchorTime, d.offsetMin ?? 0);
    const limit = SUPPLEMENTS.find((s) => s.id === d.supplement)?.notAfter;
    if (limit && time >= limit) continue;
    items.push({ id: d.id, time, kind: 'supplement', title: d.label });
  }

  const order = { training: 0, volley: 1, meal: 2, supplement: 3, water: 4, wellness: 5 } as const;
  return items.sort((a, b) => a.time.localeCompare(b.time) || order[a.kind] - order[b.kind]);
}
