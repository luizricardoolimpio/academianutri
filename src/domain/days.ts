export type DayMode = 'normal' | 'folga' | 'ferias';
export interface DateRange { from: string; to?: string }

export const DAY_MODE_LABEL: Record<DayMode, string> = { normal: 'Normal', folga: 'Folga/Feriado', ferias: 'Férias' };

export type ExtraKind = 'volei-quadra' | 'volei-areia' | 'jogo' | 'academia' | 'cardio' | 'pilates' | 'natacao' | 'corrida' | 'beach-tenis' | 'outra';
/** `name` = nome digitado quando o tipo é "outra". */
export interface Extra { id: string; kind: ExtraKind; time: string; durationMin?: number; note?: string; name?: string }

export const EXTRA_LABEL: Record<ExtraKind, string> = {
  'volei-quadra': 'Vôlei de quadra (extra)',
  'volei-areia': 'Vôlei de areia (extra)',
  jogo: 'Jogo / campeonato',
  academia: 'Academia (extra)',
  cardio: 'Cardio',
  pilates: 'Pilates',
  natacao: 'Natação',
  corrida: 'Corrida',
  'beach-tenis': 'Beach tênis',
  outra: 'Outra (digitar)',
};

export function extraTitle(x: Extra): string {
  return x.kind === 'outra' ? x.name?.trim() || 'Outra atividade' : EXTRA_LABEL[x.kind];
}

export const isVolleyExtra = (k: ExtraKind) => k === 'volei-quadra' || k === 'volei-areia' || k === 'jogo';

const inRange = (d: string, r: DateRange) => d >= r.from && (!r.to || d <= r.to);

/** Escolha feita no próprio dia > período de férias > normal. */
export function dayModeFor(date: string, explicit: DayMode | undefined, vacations: DateRange[]): DayMode {
  if (explicit) return explicit;
  return vacations.some((r) => inRange(date, r)) ? 'ferias' : 'normal';
}

export function hasGame(extras: Extra[] | undefined): boolean {
  return !!extras?.some((e) => e.kind === 'jogo');
}

export function isPaused(date: string, pauses: DateRange[]): boolean {
  return pauses.some((r) => inRange(date, r));
}
