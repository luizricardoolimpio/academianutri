import { toLocalDateKey, fromDateKey, weekdayOf, addDays, nextMonday } from '../../src/domain/dates';

test('chave local não pula de dia às 23h30 em UTC-3', () => {
  expect(toLocalDateKey(new Date(2026, 10, 24, 23, 30))).toBe('2026-11-24');
});
test('chave local às 00h05 é o próprio dia', () => {
  expect(toLocalDateKey(new Date(2026, 10, 25, 0, 5))).toBe('2026-11-25');
});
test('fromDateKey volta para a mesma chave', () => {
  expect(toLocalDateKey(fromDateKey('2026-02-28'))).toBe('2026-02-28');
});
test('weekdayOf: 24/11/2026 é terça (2)', () => expect(weekdayOf('2026-11-24')).toBe(2));
test('addDays atravessa mês e ano', () => {
  expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-12-01', -1)).toBe('2026-11-30');
});
test('próxima segunda a partir de terça 24/11/2026', () => expect(nextMonday('2026-11-24')).toBe('2026-11-30'));
test('próxima segunda a partir de uma segunda é a semana seguinte', () => expect(nextMonday('2026-11-30')).toBe('2026-12-07'));
