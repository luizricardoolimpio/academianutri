import { freshDb } from '../helpers';
import { toggleCheck, isChecked, getDoneIds, addWater, getWater, saveSet, lastLoad, getSetting, setSetting, hasAnyData } from '../../src/storage/db';

beforeEach(freshDb);
const set = { date: '2026-11-30', sessionId: 'superiorA' as const, exerciseId: 'supino-reto-barra', setIndex: 0, reps: '8' };

test('toggleCheck alterna e getDoneIds lista os feitos do dia', async () => {
  expect(await toggleCheck('2026-11-30', 'cafe')).toBe(true);
  expect(await isChecked('2026-11-30', 'cafe')).toBe(true);
  expect([...(await getDoneIds('2026-11-30'))]).toEqual(['cafe']);
  expect(await toggleCheck('2026-11-30', 'cafe')).toBe(false);
  expect(await isChecked('2026-11-30', 'cafe')).toBe(false);
  expect((await getDoneIds('2026-12-01')).size).toBe(0);
});

test('água soma por dia', async () => {
  expect(await getWater('2026-11-30')).toBe(0);
  await addWater('2026-11-30', 500);
  expect(await addWater('2026-11-30', 500)).toBe(1000);
  expect(await getWater('2026-12-01')).toBe(0);
});

test('lastLoad sem histórico é undefined; com histórico traz a mais recente', async () => {
  expect(await lastLoad('supino-reto-barra')).toBeUndefined();
  await saveSet({ ...set, date: '2026-11-30', loadKg: 40 });
  await saveSet({ ...set, date: '2026-12-02', loadKg: 42.5 });
  await saveSet({ ...set, date: '2026-11-25', loadKg: 50 });
  expect(await lastLoad('supino-reto-barra')).toMatchObject({ loadKg: 42.5, date: '2026-12-02' });
});

test('salvar a mesma série de novo substitui', async () => {
  await saveSet({ ...set, loadKg: 40 });
  await saveSet({ ...set, loadKg: 45 });
  expect(await lastLoad('supino-reto-barra')).toMatchObject({ loadKg: 45 });
});

test('settings com valor padrão', async () => {
  expect(await getSetting('startDate', 'x')).toBe('x');
  await setSetting('startDate', '2026-11-30');
  expect(await getSetting('startDate', 'x')).toBe('2026-11-30');
});

test('hasAnyData', async () => {
  expect(await hasAnyData()).toBe(false);
  await toggleCheck('2026-11-30', 'cafe');
  expect(await hasAnyData()).toBe(true);
});
