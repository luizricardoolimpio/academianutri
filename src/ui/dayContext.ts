import { addDays } from '../domain/dates';
import { dayModeFor, hasGame, isPaused, type DayMode, type Extra } from '../domain/days';
import type { DaySettings } from '../domain/schedule';
import { getSetting } from '../storage/db';
import { dayModeKey, dayTimesKey, extrasKey, saturdayCourtKey, volleyKey, type AppSettings } from './settings';

export interface DayContext extends DaySettings {
  dayMode: DayMode;
  explicitMode?: DayMode;
  extras: Extra[];
  /** Jogo/campeonato hoje ou ontem (sugere versão reduzida em treino com saltos). */
  gameNear: boolean;
}

export async function loadDayContext(date: string, s: AppSettings): Promise<DayContext> {
  const explicitMode = await getSetting<DayMode | undefined>(dayModeKey(date), undefined);
  const extras = await getSetting<Extra[]>(extrasKey(date), []);
  const yesterday = await getSetting<Extra[]>(extrasKey(addDays(date, -1)), []);
  return {
    enabledSupplements: s.enabledSupplements,
    timeOverrides: s.timeOverrides,
    saturdayCourt: await getSetting(saturdayCourtKey(date), true),
    explicitMode,
    dayMode: dayModeFor(date, explicitMode, s.vacations),
    volleyOn: await getSetting<Record<string, boolean>>(volleyKey(date), {}),
    dayTimes: await getSetting<Record<string, string>>(dayTimesKey(date), {}),
    extras,
    paused: isPaused(date, s.pauses),
    gameNear: hasGame(extras) || hasGame(yesterday),
  };
}
