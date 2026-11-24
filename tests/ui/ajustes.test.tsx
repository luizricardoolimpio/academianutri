import { render, screen, waitFor, fireEvent } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { freshDb } from '../helpers';
import { Ajustes } from '../../src/ui/screens/Ajustes';
import { Hoje } from '../../src/ui/screens/Hoje';
import { getSetting, isChecked, setSetting, toggleCheck } from '../../src/storage/db';

beforeEach(async () => {
  freshDb();
  await setSetting('startDate', '2026-11-30');
  await setSetting('noticesSeen', true);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 11, 14, 10));
});
afterEach(() => vi.useRealTimers());

test('mudar data de início altera a semana mostrada em Hoje', async () => {
  const { unmount } = render(<Ajustes />);
  const input = await screen.findByLabelText('Início do programa');
  fireEvent.input(input, { target: { value: '2026-12-07' } });
  await userEvent.click(screen.getByRole('button', { name: 'Salvar início' }));
  await waitFor(async () => expect(await getSetting('startDate', '')).toBe('2026-12-07'));
  unmount();
  render(<Hoje />);
  expect(await screen.findByText('Semana 2 · Base')).toBeInTheDocument();
});

test('ligar glutamina adiciona item às 06:15', async () => {
  const { unmount } = render(<Ajustes />);
  await userEvent.click(await screen.findByRole('checkbox', { name: /Glutamina/ }));
  await waitFor(async () => expect(await getSetting<string[]>('enabledSupplements', [])).toContain('glutamina'));
  unmount();
  render(<Hoje />);
  expect(await screen.findByRole('checkbox', { name: /06:15.*Glutamina/ })).toBeInTheDocument();
});

test('editar horário do almoço de segunda reordena só os dias de academia no almoço', async () => {
  const { unmount } = render(<Ajustes />);
  fireEvent.input(await screen.findByLabelText(/Horário: Almoço rápido pós-treino/), { target: { value: '15:00' } });
  await userEvent.click(screen.getByRole('button', { name: 'Salvar horários' }));
  await waitFor(async () => expect(await getSetting('timeOverrides', {})).toEqual({ 'academiaAlmoco:almoco': '15:00' }));
  unmount();
  render(<Hoje />); // 14/12 é segunda
  const boxes = (await screen.findAllByRole('checkbox')).map((b) => b.closest('label')?.textContent ?? '');
  const almoco = boxes.findIndex((t) => /Almoço rápido/.test(t));
  const lanche = boxes.findIndex((t) => /Lanche da tarde/.test(t));
  expect(almoco).toBeGreaterThan(lanche);
});

test('Salvar backup compartilha treino-volei-AAAA-MM-DD.json', async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { share, canShare: () => true });
  render(<Ajustes />);
  await userEvent.click(await screen.findByRole('button', { name: /Salvar backup/ }));
  await waitFor(() => expect(share).toHaveBeenCalled());
  expect(share.mock.calls[0][0].files[0].name).toBe('treino-volei-2026-12-14.json');
  await waitFor(async () => expect(await getSetting('lastBackupAt', null)).toBe('2026-12-14'));
  Object.assign(navigator, { share: undefined, canShare: undefined });
});

test('Restaurar com arquivo inválido mostra erro e mantém dados', async () => {
  await toggleCheck('2026-12-14', 'cafe');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Ajustes />);
  const input = await screen.findByLabelText('Restaurar backup');
  await userEvent.upload(input, new File(['lixo'], 'b.json', { type: 'application/json' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/não é um backup válido/);
  expect(await isChecked('2026-12-14', 'cafe')).toBe(true);
});
