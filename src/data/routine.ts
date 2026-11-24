import type { SessionId } from '../domain/types';
import type { DietDayType } from './diet';
import type { SupplementId } from './supplements';

export interface RoutineEntry {
  id: string;
  time: string;
  kind: 'meal' | 'training' | 'volley';
  title: string;
  mealId?: string;
  carb?: 'almoco' | 'jantar';
  saturdayCourtOnly?: boolean;
}

/** Dose de suplemento presa a um item da rotina (acompanha o horário dele). */
export interface Dose { id: string; supplement: SupplementId; anchor: string; label: string; offsetMin?: number }

const m = (id: string, time: string, title: string, mealId: string, carb?: 'almoco' | 'jantar'): RoutineEntry =>
  ({ id, time, kind: 'meal', title, mealId, carb });

export const ROUTINE: Record<DietDayType, RoutineEntry[]> = {
  academiaAlmoco: [
    m('cafe', '06:30', 'Café da manhã', 'cafe'),
    m('lanche-manha', '09:30', 'Lanche da manhã (intervalo)', 'lancheManha'),
    { id: 'treino', time: '11:30', kind: 'training', title: 'Treino' },
    m('almoco', '12:25', 'Almoço rápido pós-treino', 'almocoRapido', 'almoco'),
    m('lanche-tarde', '14:40', 'Lanche da tarde (intervalo)', 'lancheTarde'),
    m('lanche-casa', '17:30', 'Lanche (aulas em casa)', 'lancheCasa'),
    m('jantar', '19:45', 'Jantar', 'jantar', 'jantar'),
  ],
  terca: [
    m('cafe', '07:00', 'Café da manhã', 'cafe'),
    { id: 'treino', time: '08:30', kind: 'training', title: 'Mobilidade em casa' },
    m('lanche-manha', '10:00', 'Lanche da manhã', 'lancheManha'),
    m('almoco', '12:00', 'Almoço', 'almoco', 'almoco'),
    m('lanche-tarde', '14:40', 'Lanche da tarde (intervalo)', 'lancheTarde'),
    m('lanche-casa', '17:30', 'Lanche (aulas em casa)', 'lancheCasa'),
    m('jantar', '19:15', 'Jantar pré-vôlei', 'jantar', 'jantar'),
    { id: 'volei-quadra', time: '20:00', kind: 'volley', title: 'Vôlei de Quadra (20h–22h30)' },
    m('pos-volei', '22:45', 'Pós-vôlei', 'posVolei'),
  ],
  quarta: [
    m('cafe', '06:30', 'Café da manhã', 'cafe'),
    m('lanche-manha', '09:30', 'Lanche da manhã (intervalo)', 'lancheManha'),
    { id: 'treino', time: '11:45', kind: 'training', title: 'Treino' },
    m('almoco', '12:50', 'Almoço pós-treino', 'almoco', 'almoco'),
    m('lanche-tarde', '16:00', 'Lanche da tarde', 'lancheTarde'),
    m('jantar', '18:30', 'Jantar (antes do vôlei)', 'jantar', 'jantar'),
    m('pre-volei', '20:15', 'Pré-vôlei leve', 'preVolei'),
    { id: 'volei-areia', time: '21:00', kind: 'volley', title: 'Vôlei de Areia (21h–22h)' },
    m('pos-volei', '22:15', 'Pós-vôlei', 'posVolei'),
  ],
  sabado: [
    m('cafe', '06:45', 'Café da manhã', 'cafe'),
    m('pre-volei', '10:15', 'Pré-vôlei', 'preVolei'),
    { id: 'volei-areia', time: '11:00', kind: 'volley', title: 'Vôlei de Areia (11h–13h)' },
    m('almoco', '13:15', 'Almoço', 'almoco', 'almoco'),
    { id: 'volei-quadra', time: '14:00', kind: 'volley', title: 'Vôlei de Quadra (14h ou 15h)', saturdayCourtOnly: true },
    m('lanche-tarde', '17:00', 'Lanche da tarde', 'posVolei'),
    m('refeicao-livre', '20:00', 'Refeição livre', 'refeicaoLivre'),
  ],
  domingo: [
    m('cafe', '08:00', 'Café da manhã', 'cafe'),
    { id: 'treino', time: '09:00', kind: 'training', title: 'Cardio leve + mobilidade' },
    m('lanche-manha', '10:30', 'Lanche da manhã', 'lancheManha'),
    m('almoco', '12:30', 'Almoço', 'almoco', 'almoco'),
    m('lanche-tarde', '15:00', 'Lanche da tarde', 'lancheTarde'),
    m('refeicao-livre', '19:00', 'Refeição livre', 'refeicaoLivre'),
  ],
};

/** Dia de folga/férias: sem escola. Vôlei, pré e pós-vôlei vêm da rotina do dia da semana. */
export const ROUTINE_LIVRE: RoutineEntry[] = [
  m('cafe', '08:00', 'Café da manhã', 'cafe'),
  { id: 'treino', time: '09:30', kind: 'training', title: 'Treino' },
  m('lanche-manha', '10:30', 'Lanche da manhã', 'lancheManha'),
  m('almoco', '12:30', 'Almoço', 'almoco', 'almoco'),
  m('lanche-tarde', '16:00', 'Lanche da tarde', 'lancheTarde'),
  m('jantar', '19:30', 'Jantar', 'jantar', 'jantar'),
];

const jantarAnchor = (t: DietDayType) => (t === 'sabado' || t === 'domingo' ? 'refeicao-livre' : 'jantar');
const creatina2Anchor: Record<DietDayType, string> = {
  academiaAlmoco: 'almoco', terca: 'pos-volei', quarta: 'almoco', sabado: 'almoco', domingo: 'almoco',
};

export function dosesFor(t: DietDayType): Dose[] {
  const doses: Dose[] = [
    { id: 'glutamina', supplement: 'glutamina', anchor: 'cafe', offsetMin: -15, label: 'Glutamina 15 g (jejum)' },
    { id: 'stimerex', supplement: 'stimerex', anchor: 'cafe', label: 'Stimerex' },
    { id: 'creatina-1', supplement: 'creatina', anchor: 'cafe', label: 'Creatina (dose 1)' },
    { id: 'creatina-2', supplement: 'creatina', anchor: creatina2Anchor[t], label: 'Creatina (dose 2)' },
    { id: 'omega3-almoco', supplement: 'omega3', anchor: 'almoco', label: 'Ômega 3 (2 cápsulas)' },
    { id: 'polivitaminico', supplement: 'polivitaminico', anchor: 'almoco', label: 'Polivitamínico' },
    { id: 'omega3-jantar', supplement: 'omega3', anchor: jantarAnchor(t), label: 'Ômega 3 (1 cápsula)' },
    { id: 'psyllium-1', supplement: 'psyllium', anchor: 'cafe', label: 'Psyllium' },
    { id: 'psyllium-2', supplement: 'psyllium', anchor: 'almoco', label: 'Psyllium' },
    { id: 'psyllium-3', supplement: 'psyllium', anchor: jantarAnchor(t), label: 'Psyllium' },
  ];
  if (t === 'academiaAlmoco' || t === 'quarta') doses.push({ id: 'whey-pos-treino', supplement: 'whey', anchor: 'almoco', label: 'Whey pós-treino' });
  if (t === 'terca' || t === 'quarta') doses.push({ id: 'whey-pos-volei', supplement: 'whey', anchor: 'pos-volei', label: 'Whey pós-vôlei' });
  if (t === 'sabado') doses.push({ id: 'whey-pos-volei', supplement: 'whey', anchor: 'lanche-tarde', label: 'Whey pós-vôlei' });
  return doses;
}
