import { buildDay } from '../../src/domain/schedule';
import { CARB_GRAMS, dietDayType, MEALS, DIET_NOTICES } from '../../src/data/diet';
import { SUPPLEMENTS } from '../../src/data/supplements';
import { weekdayOf } from '../../src/domain/dates';

const base = { enabledSupplements: ['stimerex', 'creatina', 'omega3', 'polivitaminico', 'whey'], saturdayCourt: true };
const WEEK = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06'];

test('segunda: horários do spec', () => {
  const d = buildDay('2026-11-30', base).filter((i) => i.kind !== 'supplement');
  expect(d.map((i) => i.time)).toEqual(['06:30', '09:30', '11:30', '12:25', '14:40', '17:30', '19:45']);
  expect(d.find((i) => i.kind === 'training')!.sessionId).toBe('inferiorA');
});

test('itens em ordem de horário', () => {
  for (const k of WEEK) {
    const times = buildDay(k, base).map((i) => i.time);
    expect(times).toEqual([...times].sort());
  }
});

test('terça: vôlei quadra 20h e pós-vôlei 22h45', () => {
  const d = buildDay('2026-12-01', base);
  expect(d.find((i) => i.kind === 'volley')).toMatchObject({ time: '20:00', title: expect.stringMatching(/Quadra/) });
  expect(d.some((i) => i.time === '22:45' && i.kind === 'meal')).toBe(true);
  expect(d.find((i) => i.kind === 'training')!.sessionId).toBe('mobilidade');
});

test('quarta: treino 11h45 e areia 21h', () => {
  const d = buildDay('2026-12-02', base);
  expect(d.find((i) => i.kind === 'training')).toMatchObject({ time: '11:45', sessionId: 'superiorA' });
  expect(d.find((i) => i.kind === 'volley')).toMatchObject({ time: '21:00', title: expect.stringMatching(/Areia/) });
});

test('domingo: cardio às 9h', () =>
  expect(buildDay('2026-12-06', base).find((i) => i.kind === 'training')).toMatchObject({ time: '09:00', sessionId: 'cardio' }));

test.each([['2026-12-01', 100, 70], ['2026-12-02', 100, 70], ['2026-12-05', 100, 'livre'], ['2026-11-30', 70, 50], ['2026-12-03', 70, 50], ['2026-12-06', 70, 'livre']] as const)(
  'carbo em %s', (d, a, j) => expect(CARB_GRAMS[dietDayType(d)]).toEqual({ almoco: a, jantar: j }));

test('almoço e jantar mostram a porção de carbo do dia', () => {
  const d = buildDay('2026-11-30', base);
  expect(d.find((i) => i.id === 'almoco')!.detail).toMatch(/70 g de carbo/);
  expect(d.find((i) => i.id === 'jantar')!.detail).toMatch(/50 g de carbo/);
});

test('refeição livre só sábado e domingo à noite', () => {
  const livres = WEEK.flatMap((k) => buildDay(k, base).filter((i) => /livre/i.test(i.title)).map((i) => [weekdayOf(k), i.time >= '18:00'] as const));
  expect(livres.map(([w]) => w).sort()).toEqual([0, 6]);
  expect(livres.every(([, noite]) => noite)).toBe(true);
});

test('Stimerex nunca depois das 14h e glutamina/psyllium desligados', () => {
  for (const k of WEEK) {
    const d = buildDay(k, base);
    for (const i of d.filter((x) => x.id.startsWith('stimerex'))) expect(i.time < '14:00').toBe(true);
    expect(d.some((i) => /glutamina|psyllium/i.test(i.title))).toBe(false);
  }
});

test('Stimerex some se o café for movido para depois das 14h', () => {
  const d = buildDay('2026-11-30', { ...base, timeOverrides: { cafe: '14:30' } });
  expect(d.some((i) => i.id.startsWith('stimerex'))).toBe(false);
});

test('ligar glutamina adiciona item 15 min antes do café', () => {
  const d = buildDay('2026-11-30', { ...base, enabledSupplements: [...base.enabledSupplements, 'glutamina'] });
  expect(d.find((i) => i.id.startsWith('glutamina'))!.time).toBe('06:15');
});

test('sábado sem quadra deixa só a areia', () => {
  expect(buildDay('2026-12-05', base).filter((i) => i.kind === 'volley')).toHaveLength(2);
  expect(buildDay('2026-12-05', { ...base, saturdayCourt: false }).filter((i) => i.kind === 'volley')).toHaveLength(1);
});

test('creatina: duas doses por dia', () => {
  for (const k of WEEK) expect(buildDay(k, base).filter((i) => i.id.startsWith('creatina'))).toHaveLength(2);
});

test('suplemento acompanha o horário alterado da refeição', () => {
  const d = buildDay('2026-11-30', { ...base, timeOverrides: { almoco: '12:40' } });
  expect(d.find((i) => i.id === 'almoco')!.time).toBe('12:40');
  expect(d.find((i) => i.id.startsWith('polivitaminico'))!.time).toBe('12:40');
});

test('ids únicos no dia', () => {
  for (const k of WEEK) {
    const ids = buildDay(k, base).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  }
});

test('conteúdo: almoço rápido tem marmita, shake e wrap; avisos fixos presentes; suplementos cadastrados', () => {
  expect(MEALS.almocoRapido.options.join(' ')).toMatch(/Marmita[\s\S]*Shake[\s\S]*Wrap/);
  expect(DIET_NOTICES.join(' ')).toMatch(/nutricionista/);
  expect(DIET_NOTICES.join(' ')).toMatch(/médico/);
  expect(SUPPLEMENTS.filter((s) => !s.enabledByDefault).map((s) => s.id).sort()).toEqual(['glutamina', 'psyllium']);
});

test('horário alterado por tipo de dia não afeta os outros dias', () => {
  const o = { ...base, timeOverrides: { 'academiaAlmoco:almoco': '13:00' } };
  expect(buildDay('2026-11-30', o).find((i) => i.id === 'almoco')!.time).toBe('13:00');
  expect(buildDay('2026-12-01', o).find((i) => i.id === 'almoco')!.time).toBe('12:00');
});
