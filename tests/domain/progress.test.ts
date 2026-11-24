import { parseLoad, formatLoad, compliance, canMakeUp } from '../../src/domain/progress';
import type { ScheduleItem } from '../../src/domain/schedule';

test('parseLoad aceita vírgula e vazio', () => {
  expect(parseLoad('22,5')).toBe(22.5);
  expect(parseLoad(' 40 ')).toBe(40);
  expect(parseLoad('')).toBeUndefined();
  expect(parseLoad('abc')).toBeUndefined();
  expect(parseLoad('-5')).toBeUndefined();
});

test('formatLoad usa vírgula e vazio para undefined', () => {
  expect(formatLoad(22.5)).toBe('22,5');
  expect(formatLoad(40)).toBe('40');
  expect(formatLoad(undefined)).toBe('');
});

const items4 = ['a', 'b', 'c', 'd'].map((id) => ({ id, time: '08:00', kind: 'meal', title: id }) as ScheduleItem);
test('compliance', () => {
  expect(compliance(items4, new Set(['a', 'b', 'c']))).toBe(75);
  expect(compliance([], new Set())).toBe(0);
  expect(compliance(items4, new Set(['a', 'zzz']))).toBe(25);
});

test('canMakeUp: superior vai para ter/dom da mesma semana; inferior nunca', () => {
  expect(canMakeUp('superiorA', '2026-12-02', '2026-12-06')).toBe(true); // qua → dom
  expect(canMakeUp('superiorB', '2026-12-04', '2026-12-05')).toBe(false); // sáb
  expect(canMakeUp('inferiorA', '2026-11-30', '2026-12-01')).toBe(false);
  expect(canMakeUp('superiorA', '2026-12-02', '2026-12-08')).toBe(false); // outra semana
  expect(canMakeUp('superiorA', '2026-11-25', '2026-11-24')).toBe(false); // antes do treino perdido
});
