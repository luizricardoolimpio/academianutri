import { DEFAULT_SUPPLEMENTS } from '../data/supplements';
import { nextMonday } from '../domain/dates';
import type { DateRange } from '../domain/days';
import { getSetting, setSetting } from '../storage/db';

export interface AppSettings {
  startDate: string;
  enabledSupplements: string[];
  timeOverrides: Record<string, string>;
  weightGoalKg?: number;
  vacations: DateRange[];
  pauses: DateRange[];
}

/** Carrega os ajustes; na primeira abertura grava o início na segunda-feira seguinte. */
export async function loadSettings(today: string): Promise<AppSettings> {
  let startDate = await getSetting<string | null>('startDate', null);
  if (!startDate) {
    startDate = nextMonday(today);
    await setSetting('startDate', startDate);
  }
  return {
    startDate,
    enabledSupplements: await getSetting('enabledSupplements', DEFAULT_SUPPLEMENTS),
    timeOverrides: await getSetting('timeOverrides', {} as Record<string, string>),
    weightGoalKg: await getSetting<number | undefined>('weightGoalKg', undefined),
    vacations: await getSetting<DateRange[]>('vacations', []),
    pauses: await getSetting<DateRange[]>('pauses', []),
  };
}

export const saturdayCourtKey = (date: string) => `saturdayCourt:${date}`;
export const dayModeKey = (date: string) => `dayMode:${date}`;
export const volleyKey = (date: string) => `volley:${date}`;
export const dayTimesKey = (date: string) => `dayTimes:${date}`;
export const extrasKey = (date: string) => `extras:${date}`;
