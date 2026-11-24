import type { GymSessionId, Phase, Prescription } from '../domain/types';

// p(exerciseId, séries, reps, descanso em s, extras)
const p = (exerciseId: string, sets: number, reps: string, restSec: number, extra: Partial<Prescription> = {}): Prescription =>
  ({ exerciseId, sets, reps, restSec, ...extra });
const RIR = { rir: '2-3' };

// Aquecimentos
const aqInferior = [p('esteira-reversa', 1, '6 min', 0), p('mob-tornozelo', 1, '10 cada lado', 0)];
const aqSuperior = [p('alongamento-peitoral', 2, '20 s', 0), p('rotadores-internos', 2, '20 s', 0), p('mobilidade-ombro', 1, '14', 0)];

type FullPhases = Omit<Record<Phase, Prescription[]>, 'descarga'>;

const inferiorA: FullPhases = {
  base: [
    ...aqInferior,
    p('shock-pause-jumps', 3, '5', 90, { load: 'caixa 15 → 30 cm', plyoContactsPerSet: 5 }),
    p('saltos-maximos', 3, '3', 90, { plyoContactsPerSet: 3, notes: 'Descanso completo entre saltos.' }),
    p('elevated-speed-steps', 3, '5 s', 60),
    p('terra-hex', 4, '6', 120, { ...RIR, load: 'moderada' }),
    p('elevacao-pelvica', 3, '8', 90, RIR),
    p('afundo-isometrico', 2, '30 s cada', 60),
    p('nordic-curl', 3, '5', 90, { notes: 'Descida lenta; use elástico se precisar.' }),
    p('panturrilha-explosiva', 3, '12', 45),
  ],
  forca: [
    ...aqInferior,
    p('shock-pause-jumps', 4, '5', 90, { load: 'caixa 30 → 45 cm', plyoContactsPerSet: 5 }),
    p('salto-caixa-halter', 4, '3', 90, { load: 'halteres leves', plyoContactsPerSet: 3 }),
    p('terra-hex', 4, '5', 150, { ...RIR, load: 'pesada, técnica perfeita' }),
    p('bulgaro-excentrico', 3, '6 cada', 90, { ...RIR, notes: '3–5 s descendo; perna mais fraca primeiro.' }),
    p('nordic-curl', 3, '6', 90),
    p('spanish-squat', 2, '45 s', 60),
    p('panturrilha-explosiva', 3, '12', 45),
  ],
  potencia: [
    ...aqInferior,
    p('power-clean', 4, '3', 120, { rir: '3', load: 'moderada, máxima velocidade' }),
    p('depth-jump', 4, '3', 120, { load: 'caixa 30 cm', plyoContactsPerSet: 3 }),
    p('lateral-jumps', 2, '10', 60, { plyoContactsPerSet: 10 }),
    p('pogos', 2, '10', 60, { plyoContactsPerSet: 10 }),
    p('terra-hex', 3, '3', 150, { rir: '3', load: 'moderada, subida rápida' }),
    p('nordic-curl', 2, '6', 90),
    p('spanish-squat', 2, '45 s', 60),
  ],
};

const inferiorB: FullPhases = {
  base: [
    ...aqInferior,
    p('line-hops', 2, '10 s', 60, { plyoContactsPerSet: 10 }),
    p('box-jump', 3, '4', 90, { load: 'caixa média', plyoContactsPerSet: 4 }),
    p('box-squat', 4, '6', 120, { ...RIR, load: 'moderada' }),
    p('explosive-step-up', 3, '5 cada', 90),
    p('stiff-unilateral', 3, '8 cada', 75, RIR),
    p('kettlebell-swing', 3, '10', 60),
    p('spanish-squat', 2, '30 s', 60),
    p('dead-bug', 3, '10', 45),
  ],
  forca: [
    ...aqInferior,
    p('line-hops', 2, '10 s', 60, { plyoContactsPerSet: 10 }),
    p('sl-box-jump', 3, '3 cada', 90, { load: 'caixa baixa', plyoContactsPerSet: 6, notes: 'Perna mais fraca primeiro.' }),
    p('deep-squat-exc', 5, '3', 120, { rir: '3', load: '50–70% do máximo', notes: '5 s descendo, sobe rápido.' }),
    p('explosive-step-up', 3, '4 cada', 90),
    p('stiff-unilateral', 3, '8 cada', 75, RIR),
    p('kettlebell-swing', 3, '10', 60),
    p('spanish-squat', 2, '45 s', 60),
  ],
  potencia: [
    ...aqInferior,
    p('ski-jumps', 2, '5', 60, { plyoContactsPerSet: 5 }),
    p('box-jump', 4, '3', 90, { load: 'caixa média-alta', plyoContactsPerSet: 3 }),
    p('sl-lateral-bound-box', 2, '3 cada', 90, { plyoContactsPerSet: 6 }),
    p('isometric-squat', 4, '3', 120, { rir: '3', load: '55% do máximo', notes: '3 s parado no fundo, sobe explosivo.' }),
    p('lateral-step-up', 3, '8 cada', 75),
    p('stiff-unilateral', 3, '8 cada', 75, RIR),
    p('spanish-squat', 2, '45 s', 60),
  ],
};

const superiorA: FullPhases = {
  base: [
    ...aqSuperior,
    p('supino-reto-barra', 3, '8', 120, { ...RIR, notes: '1 série de aquecimento antes.' }),
    p('shoulder-press-barra', 3, '8', 120, RIR),
    p('remada-maquina', 3, '10', 75, RIR),
    p('face-pull', 3, '15', 45),
    p('rotacao-externa', 3, '15 cada', 30),
    p('paloff-press', 3, '8 cada', 45),
    p('prancha-remada', 2, '10', 60),
  ],
  forca: [
    ...aqSuperior,
    p('supino-reto-barra', 4, '6', 150, { ...RIR, notes: '1 série de aquecimento antes.' }),
    p('push-press', 3, '5', 150, { rir: '3' }),
    p('landmine-press', 3, '6 cada', 90, RIR),
    p('remada-curvada-supinada', 3, '8', 90, RIR),
    p('face-pull', 3, '12', 45),
    p('rotacao-externa', 2, '15 cada', 30),
    p('paloff-press', 3, '6 cada', 45),
  ],
  potencia: [
    ...aqSuperior,
    p('supino-explosivo', 3, '5', 120, { rir: '3', load: '40–50% do máximo, máxima velocidade' }),
    p('push-press', 3, '4', 150, { rir: '3', load: 'pesada com velocidade' }),
    p('flexao-pliometrica', 3, '4', 90),
    p('landmine-rotational-press', 3, '5 cada', 90, { rir: '3' }),
    p('face-pull', 3, '12', 45),
    p('rotacao-externa', 2, '15 cada', 30),
    p('paloff-press', 2, '6 cada', 45),
  ],
};

const superiorB: FullPhases = {
  base: [
    ...aqSuperior,
    p('pulley-anterior', 3, '10', 75, RIR),
    p('serrote', 3, '10 cada', 60, RIR),
    p('desenvolvimento-unilateral-kb', 3, '8 cada', 60, RIR),
    p('elevacao-lateral', 3, '12', 45),
    p('y-t-w', 2, '8 cada letra', 45),
    p('triceps-pulley', 3, '12', 45, { notes: 'Bi-set com a rosca alternada (Ficha D).' }),
    p('rosca-alternada', 3, '10 cada', 45),
    p('prancha-lateral-rot', 2, '10 cada', 45),
  ],
  forca: [
    ...aqSuperior,
    p('barra-fixa-pronada', 3, '6–8', 120, { ...RIR, notes: 'Use graviton/elástico se precisar.' }),
    p('landmine-row', 3, '6 cada', 90, RIR),
    p('desenvolvimento-unilateral-kb', 3, '6 cada', 90, RIR),
    p('elevacao-lateral', 3, '12', 45),
    p('y-t-w', 2, '8 cada letra', 45),
    p('triceps-testa-corda', 3, '8', 60, RIR),
    p('rosca-scott', 3, '10', 60, RIR),
    p('farmer-walk', 3, '30 m', 60),
  ],
  potencia: [
    ...aqSuperior,
    p('graviton-explosivo', 3, '5', 90),
    p('high-pull', 3, '5', 120, { rir: '3', load: 'pesada com velocidade' }),
    p('sa-db-clean-jerk', 3, '4 cada', 90, { rir: '3' }),
    p('rot-tronco-polia-alta', 3, '6 cada', 60),
    p('y-t-w', 2, '8 cada letra', 45),
    p('triceps-testa-barra-explosivo', 3, '6', 60, { rir: '3' }),
    p('rosca-punho', 2, '15', 30),
    p('farmer-walk', 2, '30 m', 60),
  ],
};

/** Semana de descarga: mesma sessão da potência, metade das séries, sem depth jump. */
function deload(potencia: Prescription[]): Prescription[] {
  return potencia
    .filter((x) => x.exerciseId !== 'depth-jump')
    .map((x) => ({ ...x, sets: Math.max(1, Math.ceil(x.sets / 2)), rir: x.rir ? '3-4' : x.rir }));
}

const withDeload = (f: FullPhases): Record<Phase, Prescription[]> => ({ ...f, descarga: deload(f.potencia) });

export const PROGRAM: Record<GymSessionId, Record<Phase, Prescription[]>> = {
  inferiorA: withDeload(inferiorA),
  superiorA: withDeload(superiorA),
  inferiorB: withDeload(inferiorB),
  superiorB: withDeload(superiorB),
};

export const ROUTINES: Record<'mobilidade' | 'cardio', Prescription[]> = {
  mobilidade: [
    p('quadril-90-90', 2, '60 s cada lado', 0),
    p('mob-tornozelo', 2, '10 cada lado', 0),
    p('mobilidade-toracica', 2, '6 cada lado', 0),
    p('gato-camelo', 2, '10', 0),
    p('rotadores-internos', 2, '20 s', 0),
  ],
  cardio: [
    p('high-knee-cardio', 1, '40 min', 0, { notes: 'Zona 2: dá para conversar.' }),
    p('quadril-90-90', 1, '60 s cada lado', 0),
    p('gato-camelo', 1, '10', 0),
  ],
};

export function allPrescriptions(): Prescription[] {
  return [
    ...Object.values(PROGRAM).flatMap((phases) => Object.values(phases).flat()),
    ...ROUTINES.mobilidade,
    ...ROUTINES.cardio,
  ];
}
