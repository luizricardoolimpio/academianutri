import { dayModeFor, hasGame, type Extra } from '../../src/domain/days';
import { programPosition } from '../../src/domain/program';
import { buildDay } from '../../src/domain/schedule';

const base = { enabledSupplements: ['stimerex', 'creatina', 'omega3', 'polivitaminico', 'whey'], saturdayCourt: true };
const vac = [{ from: '2026-12-21', to: '2027-01-10' }];

test('tipo do dia: escolha explícita > período de férias > normal', () => {
  expect(dayModeFor('2026-12-01', undefined, vac)).toBe('normal');
  expect(dayModeFor('2026-12-22', undefined, vac)).toBe('ferias');
  expect(dayModeFor('2027-01-10', undefined, vac)).toBe('ferias');
  expect(dayModeFor('2026-12-22', 'normal', vac)).toBe('normal');
  expect(dayModeFor('2026-12-08', 'folga', vac)).toBe('folga');
});

test('pausa não conta semanas e retoma da mesma semana', () => {
  const pauses = [{ from: '2026-12-21', to: '2027-01-03' }]; // 2 semanas pausadas (seg a dom)
  expect(programPosition('2026-12-20', '2026-11-30', pauses)).toMatchObject({ week: 3, paused: false });
  expect(programPosition('2026-12-23', '2026-11-30', pauses)).toMatchObject({ week: 4, paused: true });
  expect(programPosition('2027-01-04', '2026-11-30', pauses)).toMatchObject({ week: 4, paused: false });
  expect(programPosition('2027-01-11', '2026-11-30', pauses)).toMatchObject({ week: 5, phase: 'forca' });
});

test('pausa aberta (sem fim) vale até hoje', () => {
  const p = [{ from: '2026-12-21' }];
  expect(programPosition('2027-02-01', '2026-11-30', p)).toMatchObject({ week: 4, paused: true });
});

test('terça de folga: rotina livre, mobilidade às 09:30 e vôlei de quadra com interruptor', () => {
  const d = buildDay('2026-12-01', { ...base, dayMode: 'folga' });
  const meals = d.filter((i) => i.kind === 'meal').map((i) => `${i.time} ${i.id}`);
  expect(meals).toEqual(expect.arrayContaining(['08:00 cafe', '10:30 lanche-manha', '12:30 almoco', '16:00 lanche-tarde', '19:30 jantar']));
  expect(d.some((i) => /intervalo|aulas/i.test(i.title))).toBe(false);
  expect(d.find((i) => i.kind === 'training')).toMatchObject({ time: '09:30', sessionId: 'mobilidade' });
  expect(d.find((i) => i.id === 'volei-quadra')).toMatchObject({ time: '20:00' });
  expect(d.find((i) => i.id === 'almoco')!.detail).toMatch(/100 g/);
  const sem = buildDay('2026-12-01', { ...base, dayMode: 'folga', volleyOn: { 'volei-quadra': false } });
  expect(sem.some((i) => i.kind === 'volley')).toBe(false);
  expect(sem.find((i) => i.id === 'almoco')!.detail).toMatch(/70 g/);
});

test('segunda de férias: treino Inferior A às 09:30, carbo 70/50, sem refeição livre', () => {
  const d = buildDay('2026-12-21', { ...base, dayMode: 'ferias' });
  expect(d.find((i) => i.kind === 'training')).toMatchObject({ time: '09:30', sessionId: 'inferiorA' });
  expect(d.find((i) => i.id === 'jantar')!.detail).toMatch(/50 g/);
  expect(d.some((i) => /livre/i.test(i.title))).toBe(false);
});

test('domingo de folga mantém a refeição livre à noite', () => {
  const d = buildDay('2026-12-27', { ...base, dayMode: 'folga' });
  expect(d.some((i) => /Refeição livre/.test(i.title) && i.time >= '18:00')).toBe(true);
});

test('atividade extra entra na linha do tempo; jogo eleva o carbo', () => {
  const extras: Extra[] = [{ id: 'a1', kind: 'jogo', time: '15:00', durationMin: 120, note: 'Copa Master' }];
  const d = buildDay('2026-11-30', { ...base, extras });
  expect(d.find((i) => i.id === 'extra-a1')).toMatchObject({ time: '15:00', kind: 'volley', title: expect.stringMatching(/Jogo/) });
  expect(d.find((i) => i.id === 'almoco')!.detail).toMatch(/100 g/);
  expect(d.find((i) => i.id === 'jantar')!.detail).toMatch(/70 g/);
  const gym = buildDay('2026-11-30', { ...base, extras: [{ id: 'b', kind: 'academia', time: '18:00' }] });
  expect(gym.find((i) => i.id === 'extra-b')).toMatchObject({ kind: 'extra' });
  expect(gym.find((i) => i.id === 'almoco')!.detail).toMatch(/70 g/);
});

test('horário só deste dia', () => {
  const d = buildDay('2026-11-30', { ...base, dayTimes: { treino: '18:00' } });
  expect(d.find((i) => i.kind === 'training')!.time).toBe('18:00');
});

test('programa pausado tira o treino da academia do dia', () => {
  expect(buildDay('2026-11-30', { ...base, paused: true }).some((i) => i.kind === 'training')).toBe(false);
});

test('hasGame', () => {
  expect(hasGame([{ id: 'x', kind: 'jogo', time: '10:00' }])).toBe(true);
  expect(hasGame([{ id: 'x', kind: 'volei-areia', time: '10:00' }])).toBe(false);
  expect(hasGame(undefined)).toBe(false);
});
