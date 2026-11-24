import { freshDb } from '../helpers';
import { dayCompliance } from '../../src/ui/compliance';
import { buildDay } from '../../src/domain/schedule';
import { addWater, saveWellness, setSetting, toggleCheck } from '../../src/storage/db';
import { loadSettings } from '../../src/ui/settings';

beforeEach(async () => { freshDb(); await setSetting('startDate', '2026-11-30'); });

test('% do dia inclui água e bem-estar (igual em todas as telas)', async () => {
  const settings = await loadSettings('2026-11-30');
  for (const i of buildDay('2026-11-30', { ...settings, saturdayCourt: true })) if (i.kind !== 'training') await toggleCheck('2026-11-30', i.id);
  await toggleCheck('2026-11-30', 'treino');
  await addWater('2026-11-30', 1000);
  const r = await dayCompliance('2026-11-30', settings);
  expect(r.pct).toBeLessThan(100);
  await addWater('2026-11-30', 2500);
  await saveWellness({ date: '2026-11-30', sono: 4, joelho: 1, ombro: 1, disposicao: 4 });
  expect((await dayCompliance('2026-11-30', settings)).pct).toBe(100);
});
