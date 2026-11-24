export type Phase = 'base' | 'forca' | 'potencia' | 'descarga';
export type SessionId = 'inferiorA' | 'superiorA' | 'inferiorB' | 'superiorB' | 'mobilidade' | 'cardio';
export type GymSessionId = Exclude<SessionId, 'mobilidade' | 'cardio'>;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const PHASE_LABEL: Record<Phase, string> = {
  base: 'Base', forca: 'Força', potencia: 'Potência', descarga: 'Descarga',
};
export const SESSION_LABEL: Record<SessionId, string> = {
  inferiorA: 'Inferior A — força + salto',
  superiorA: 'Superior A — força de ataque',
  inferiorB: 'Inferior B — potência + salto',
  superiorB: 'Superior B — ombro, braço e core',
  mobilidade: 'Mobilidade (15 min em casa)',
  cardio: 'Cardio leve + mobilidade',
};
export const WEEKDAY_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export interface Prescription {
  exerciseId: string;
  sets: number;
  reps: string;
  restSec: number;
  load?: string;
  rir?: string;
  notes?: string;
  /** Contatos de salto por série (só pliometria de membros inferiores). */
  plyoContactsPerSet?: number;
}
