import { freshDb } from '../helpers';
import { toggleCheck, isChecked, saveSet, lastLoad, setSetting, getSetting, addWater } from '../../src/storage/db';
import { exportBackup, importBackup, readText, exportCsv, needsBackupReminder, markBackupDone } from '../../src/storage/backup';

beforeEach(freshDb);

const STORE_NAMES = ['checks', 'sets', 'sessions', 'wellness', 'water', 'body', 'jumps', 'settings'];
function full(over: Record<string, unknown[]>) {
  const data = Object.fromEntries(STORE_NAMES.map((n) => [n, over[n] ?? []]));
  return JSON.stringify({ app: 'treino-volei', version: 1, data });
}

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
  ['{"app":"treino-volei","version":1,"data":{"checks":"x"}}'], [''],
  ['{"app":"treino-volei","version":1,"data":{}}'], ['{"app":"treino-volei","version":1,"data":[]}'],
  [full({ checks: [{ foo: 1 }] })], [full({ water: [{ ml: 5 }] })], [full({ sets: [{ date: '2026-11-30' }] })]])(
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

test('backup inválido mantém também água e ajustes', async () => {
  await addWater('2026-11-30', 1000);
  await setSetting('startDate', '2026-11-30');
  const r = await importBackup(new File([full({ checks: [{ foo: 1 }] })], 'b.json'));
  expect(r.ok).toBe(false);
  expect(await getSetting('startDate', '')).toBe('2026-11-30');
  const { getWater } = await import('../../src/storage/db');
  expect(await getWater('2026-11-30')).toBe(1000);
});

test('compartilhamento recusado (NotAllowedError) cai para download e registra o backup', async () => {
  const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' }));
  const create = vi.fn(() => 'blob:x');
  Object.assign(navigator, { share, canShare: () => true });
  Object.assign(URL, { createObjectURL: create, revokeObjectURL: () => {} });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const { saveBackupNow } = await import('../../src/storage/backup');
  await toggleCheck('2026-11-30', 'cafe');
  await saveBackupNow(new Date(2026, 10, 30, 12));
  expect(create).toHaveBeenCalled();
  expect(click).toHaveBeenCalled();
  click.mockRestore();
  expect(await getSetting('lastBackupAt', null)).toBe('2026-11-30');
  Object.assign(navigator, { share: undefined, canShare: undefined });
});

test('compartilhamento cancelado pelo usuário (AbortError) não registra backup', async () => {
  const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }));
  Object.assign(navigator, { share, canShare: () => true });
  const { saveBackupNow } = await import('../../src/storage/backup');
  await expect(saveBackupNow(new Date(2026, 10, 30, 12))).rejects.toThrow();
  expect(await getSetting('lastBackupAt', null)).toBeNull();
  Object.assign(navigator, { share: undefined, canShare: undefined });
});
