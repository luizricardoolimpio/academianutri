import { EXERCISES, searchVideoUrl } from '../../src/data/exercises';
import { PROGRAM, ROUTINES, allPrescriptions } from '../../src/data/program';
import { sessionPlan, plyoContacts } from '../../src/domain/program';
import type { Phase } from '../../src/domain/types';

test('todo exercício referenciado existe e tem vídeo ou busca', () => {
  for (const s of allPrescriptions()) {
    const e = EXERCISES[s.exerciseId];
    expect(e, s.exerciseId).toBeDefined();
    expect(e.videoUrl ?? searchVideoUrl(e)).toMatch(/^https:\/\/(youtu\.be|www\.youtube\.com)\//);
    expect(e.how.length, s.exerciseId).toBeGreaterThan(0);
  }
});

test('busca de vídeo usa o nome + "execução"', () => {
  expect(searchVideoUrl(EXERCISES['face-pull'])).toBe(
    'https://www.youtube.com/results?search_query=' + encodeURIComponent('Face pull execução'));
});

test.each([['base', 40], ['forca', 50], ['potencia', 60], ['descarga', 20]] as [Phase, number][])(
  'contatos de salto por sessão em %s ≤ %i', (phase, cap) => {
    for (const id of ['inferiorA', 'inferiorB'] as const) {
      expect(plyoContacts(PROGRAM[id][phase])).toBeLessThanOrEqual(cap);
      expect(plyoContacts(PROGRAM[id][phase])).toBeGreaterThan(0);
    }
    for (const id of ['superiorA', 'superiorB'] as const) expect(plyoContacts(PROGRAM[id][phase])).toBe(0);
  });

test('nenhuma prescrição até a falha', () => {
  for (const s of allPrescriptions()) expect(s.rir ?? '2-3').not.toMatch(/^0/);
});

test('sessões com no máximo 11 itens (≈50 min)', () => {
  for (const id of ['inferiorA', 'superiorA', 'inferiorB', 'superiorB'] as const)
    for (const ph of ['base', 'forca', 'potencia', 'descarga'] as Phase[])
      expect(PROGRAM[id][ph].length).toBeLessThanOrEqual(11);
});

test('descarga = metade das séries da potência, arredondado para cima, mín. 1, sem depth jump', () => {
  for (const id of ['inferiorA', 'superiorA', 'inferiorB', 'superiorB'] as const) {
    const pot = PROGRAM[id].potencia;
    for (const d of PROGRAM[id].descarga) {
      const p = pot.find((x) => x.exerciseId === d.exerciseId)!;
      expect(d.sets).toBe(Math.max(1, Math.ceil(p.sets / 2)));
    }
    expect(PROGRAM[id].descarga.some((d) => d.exerciseId === 'depth-jump')).toBe(false);
  }
});

test('versão reduzida remove saltos e tira 1 série (mín. 1)', () => {
  const full = PROGRAM.inferiorA.forca;
  const r = sessionPlan('inferiorA', 'forca', true);
  expect(plyoContacts(r)).toBe(0);
  for (const p of r) {
    const orig = full.find((x) => x.exerciseId === p.exerciseId)!;
    expect(p.sets).toBe(Math.max(1, orig.sets - 1));
  }
});

test('sessionPlan normal devolve a fase pedida; mobilidade e cardio vêm das rotinas', () => {
  expect(sessionPlan('superiorB', 'base', false)).toEqual(PROGRAM.superiorB.base);
  expect(sessionPlan('mobilidade', 'forca', false)).toEqual(ROUTINES.mobilidade);
  expect(sessionPlan('cardio', 'base', false)).toEqual(ROUTINES.cardio);
});

test('prevenção de ombro em toda sessão de superior e nórdico/spanish em toda de inferior', () => {
  for (const ph of ['base', 'forca', 'potencia'] as Phase[]) {
    for (const id of ['superiorA', 'superiorB'] as const)
      expect(PROGRAM[id][ph].some((p) => ['face-pull', 'rotacao-externa', 'y-t-w'].includes(p.exerciseId))).toBe(true);
    for (const id of ['inferiorA', 'inferiorB'] as const)
      expect(PROGRAM[id][ph].some((p) => ['nordic-curl', 'spanish-squat', 'mob-tornozelo'].includes(p.exerciseId))).toBe(true);
  }
});
