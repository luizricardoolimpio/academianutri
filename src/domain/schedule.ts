import { CARB_GRAMS, dietDayType } from '../data/diet';
import { extraTitle, isVolleyExtra, type DayMode, type Extra } from './days';
import { weekdayOf } from './dates';
import { dosesFor, ROUTINE, ROUTINE_LIVRE, type RoutineEntry } from '../data/routine';
import { SUPPLEMENTS } from '../data/supplements';
import { sessionForDate } from './program';
import { SESSION_LABEL, type SessionId } from './types';

export interface ScheduleItem {
  id: string;
  time: string;
  kind: 'meal' | 'supplement' | 'training' | 'volley' | 'extra' | 'water' | 'wellness';
  title: string;
  detail?: string;
  mealId?: string;
  sessionId?: SessionId;
}

export interface DaySettings {
  enabledSupplements: string[];
  saturdayCourt: boolean;
  timeOverrides?: Record<string, string>;
  dayMode?: DayMode;
  /** Vôlei desligado neste dia ("Teve vôlei hoje?" = não). */
  volleyOn?: Record<string, boolean>;
  /** Horários alterados só nesta data. */
  dayTimes?: Record<string, string>;
  extras?: Extra[];
  paused?: boolean;
}

function shift(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const t = Math.max(0, h * 60 + m + minutes);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

const FALLBACK_ANCHORS = ['jantar', 'refeicao-livre', 'almoco'];

function routineFor(dateKey: string, livre: boolean): RoutineEntry[] {
  const type = dietDayType(dateKey);
  if (!livre) return ROUTINE[type];
  const wd = weekdayOf(dateKey);
  const fromWeekday = ROUTINE[type].filter((e) => e.kind === 'volley' || e.id === 'pre-volei' || e.id === 'pos-volei');
  const base = ROUTINE_LIVRE.map((e) =>
    (wd === 0 || wd === 6) && e.id === 'jantar' ? { ...e, id: 'refeicao-livre', title: 'Refeição livre', mealId: 'refeicaoLivre', carb: undefined } : e);
  return [...base, ...fromWeekday];
}

export function buildDay(dateKey: string, settings: DaySettings): ScheduleItem[] {
  const type = dietDayType(dateKey);
  const livre = settings.dayMode === 'folga' || settings.dayMode === 'ferias';
  const overrides = settings.timeOverrides ?? {};
  const dayTimes = settings.dayTimes ?? {};
  const volleyOn = settings.volleyOn ?? {};
  const extras = settings.extras ?? [];
  const items: ScheduleItem[] = [];
  const timeOf: Record<string, string> = {};
  const overrideKey = livre ? 'livre' : type;

  const entries = routineFor(dateKey, livre).filter((e) => {
    if (e.saturdayCourtOnly && !settings.saturdayCourt) return false;
    if (e.kind === 'volley' && volleyOn[e.id] === false) return false;
    return true;
  });
  const volleyActive = entries.some((e) => e.kind === 'volley');
  const hasVolleyExtra = extras.some((x) => isVolleyExtra(x.kind));

  // Carboidrato: porções da nutricionista; gasto alto com vôlei ou jogo. Fim de semana à noite = livre.
  const weekend = type === 'sabado' || type === 'domingo';
  let carbs: { almoco: number; jantar: number | 'livre' } = livre ? { almoco: 70, jantar: 50 } : { ...CARB_GRAMS[type] };
  if ((livre && volleyActive) || hasVolleyExtra) carbs = { almoco: Math.max(carbs.almoco, 100), jantar: typeof carbs.jantar === 'number' ? Math.max(carbs.jantar, 70) : carbs.jantar };
  if (weekend) carbs.jantar = 'livre';

  for (const e of entries) {
    if ((e.id === 'pre-volei' || e.id === 'pos-volei') && !volleyActive) continue;
    const time = dayTimes[e.id] ?? overrides[`${overrideKey}:${e.id}`] ?? overrides[e.id] ?? e.time;
    if (e.kind === 'training') {
      const sessionId = sessionForDate(dateKey);
      if (!sessionId || settings.paused) continue;
      timeOf[e.id] = time;
      items.push({ id: e.id, time, kind: 'training', title: SESSION_LABEL[sessionId], sessionId });
      continue;
    }
    timeOf[e.id] = time;
    const grams = e.carb ? carbs[e.carb] : undefined;
    items.push({
      id: e.id, time, kind: e.kind, title: e.title, mealId: e.mealId,
      detail: typeof grams === 'number' ? `${grams} g de carbo` : undefined,
    });
  }

  for (const x of extras) {
    const id = `extra-${x.id}`;
    const detail = [x.durationMin ? `${x.durationMin} min` : '', x.note ?? ''].filter(Boolean).join(' · ') || undefined;
    items.push({ id, time: dayTimes[id] ?? x.time, kind: isVolleyExtra(x.kind) ? 'volley' : 'extra', title: extraTitle(x), detail });
  }

  for (const d of dosesFor(type)) {
    if (!settings.enabledSupplements.includes(d.supplement)) continue;
    let anchorTime = timeOf[d.anchor];
    if (!anchorTime && d.supplement !== 'whey') anchorTime = FALLBACK_ANCHORS.map((a) => timeOf[a]).find(Boolean)!;
    if (!anchorTime) continue;
    const time = shift(anchorTime, d.offsetMin ?? 0);
    const limit = SUPPLEMENTS.find((sp) => sp.id === d.supplement)?.notAfter;
    if (limit && time >= limit) continue;
    items.push({ id: d.id, time, kind: 'supplement', title: d.label });
  }

  const order = { training: 0, volley: 1, extra: 2, meal: 3, supplement: 4, water: 5, wellness: 6 } as const;
  return items.sort((a, b) => a.time.localeCompare(b.time) || order[a.kind] - order[b.kind]);
}
