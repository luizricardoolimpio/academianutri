import { freshDb } from '../helpers';
import { toggleCheck, isChecked, saveSet, lastLoad, setSetting, getSetting, addWater } from '../../src/storage/db';
import { exportBackup, importBackup, readText, exportCsv, needsBackupReminder, markBackupDone } from '../../src/storage/backup';

beforeEach(freshDb);

test('backup ida e volta preserva tudo', async () => {
  await toggleCheck('2026-11-30', 'cafe');
  await saveSet({ date: '2026-11-30', sessionId: 'inferiorA', exerciseId: 'terra-hex', setIndex: 0, loadKg: 80 });
  await setSetting('startDate', '2026-11-30');
  const blob = await exportBackup();
  const json = JSON.parse(await readText(blob));
  expect(json).toMatchObject({ app: 'treino-volei', version: 1 });
  freshDb();
  expect(await isChecked('2026-11-30', 'cafe')).toBe(false);
  expect(await importBackup(new File([JSON.stringify(json)], 'b.json'))).toEqual({ ok: true });
  expect(await isChecked('2026-11-30', 'cafe')).toBe(true);
  expect(await lastLoad('terra-hex')).toMatchObject({ loadKg: 80 });
  expect(await getSetting('startDate', '')).toBe('2026-11-30');
});

test.each([['{}'], ['not json'], ['{"app":"outro","version":1,"data":{}}'], ['{"app":"treino-volei","version":99,"data":{}}'],
  ['{"app":"treino-volei","version":1,"data":{"checks":"x"}}'], ['']])(
  'backup inválido %j não apaga dados', async (txt) => {
    await toggleCheck('2026-11-30', 'cafe');
    const r = await importBackup(new File([txt], 'b.json'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).not.toMatch(/ler o arquivo/);
    expect(await isChecked('2026-11-30', 'cafe')).toBe(true);
  });

test('lembrete de backup', async () => {
  const now = new Date(2026, 11, 10, 12);
  expect(await needsBackupReminder(now)).toBe(false); // sem dados
  await toggleCheck('2026-12-10', 'cafe');
  expect(await needsBackupReminder(now)).toBe(true); // dados e nunca salvo
  await markBackupDone(new Date(2026, 11, 7, 12));
  expect(await needsBackupReminder(now)).toBe(false); // 3 dias
  await markBackupDone(new Date(2026, 11, 2, 12));
  expect(await needsBackupReminder(now)).toBe(true); // 8 dias
});

test('CSV diário tem cabeçalho e uma linha por dia com registro', async () => {
  await toggleCheck('2026-11-30', 'cafe');
  await addWater('2026-11-30', 1500);
  const csv = await exportCsv();
  const lines = csv.trim().split('\n');
  expect(lines[0]).toBe('data;itens_feitos;agua_ml;treino_rpe;peso_kg');
  expect(lines[1]).toBe('2026-11-30;1;1500;;');
});
