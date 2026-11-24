import { programPosition, sessionForDate, WEEK_GRID } from '../../src/domain/program';

test.each([
  ['2026-11-30', 1, 1, 'base'], ['2026-12-27', 1, 4, 'base'], ['2026-12-28', 1, 5, 'forca'],
  ['2027-01-25', 1, 9, 'potencia'], ['2027-02-15', 1, 12, 'descarga'], ['2027-02-22', 2, 1, 'base'],
] as const)('posição em %s', (d, cycle, week, phase) =>
  expect(programPosition(d, '2026-11-30')).toMatchObject({ started: true, cycle, week, phase }));

test('antes do início: não começou, mostra prévia da semana 1', () =>
  expect(programPosition('2026-11-25', '2026-11-30'))
    .toEqual({ started: false, startsOn: '2026-11-30', cycle: 1, week: 1, phase: 'base', paused: false }));

test('grade semanal', () => {
  expect(sessionForDate('2026-11-30')).toBe('inferiorA');
  expect(sessionForDate('2026-12-01')).toBe('mobilidade');
  expect(sessionForDate('2026-12-02')).toBe('superiorA');
  expect(sessionForDate('2026-12-03')).toBe('inferiorB');
  expect(sessionForDate('2026-12-04')).toBe('superiorB');
  expect(sessionForDate('2026-12-05')).toBeNull();
  expect(sessionForDate('2026-12-06')).toBe('cardio');
  expect(WEEK_GRID[6]).toBeNull();
});
