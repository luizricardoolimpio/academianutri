import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { freshDb } from '../helpers';
import { Hoje } from '../../src/ui/screens/Hoje';
import { setSetting, toggleCheck, saveSession } from '../../src/storage/db';
import { markBackupDone } from '../../src/storage/backup';

function at(y: number, m: number, d: number, h = 10) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(y, m - 1, d, h, 0));
}
beforeEach(async () => {
  freshDb();
  await setSetting('startDate', '2026-11-30');
  await setSetting('noticesSeen', true);
});
afterEach(() => vi.useRealTimers());

test('lista os itens do dia em ordem e marca com um toque', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  const cafe = await screen.findByRole('checkbox', { name: /06:30.*Café/ });
  await userEvent.click(cafe);
  await waitFor(() => expect(cafe).toBeChecked());
  expect(await screen.findByText(/^1 de \d+ feitos$/)).toBeInTheDocument();
});

test('mostra Semana 1 · Base e o treino Inferior A', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  expect(await screen.findByText('Semana 1 · Base')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Inferior A/ })).toHaveAttribute('href', '#/treino/2026-11-30');
});

test('água soma 500 ml', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  await userEvent.click(await screen.findByRole('button', { name: /\+ 500 ml/ }));
  expect(await screen.findByText('0,5 / 3,5 L')).toBeInTheDocument();
});

test('antes do início mostra "Programa começa em 30/11"', async () => {
  at(2026, 11, 25);
  render(<Hoje />);
  expect(await screen.findByText(/Programa começa em 30\/11/)).toBeInTheDocument();
});

test('primeira abertura define o início na segunda seguinte', async () => {
  freshDb();
  at(2026, 11, 25);
  render(<Hoje />);
  expect(await screen.findByText(/Programa começa em 30\/11/)).toBeInTheDocument();
});

test('check de bem-estar com joelho 4 sugere treino reduzido', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  await userEvent.click(await screen.findByRole('button', { name: 'Dor no joelho: 4' }));
  await userEvent.click(screen.getByRole('button', { name: 'Salvar bem-estar' }));
  expect(await screen.findByText(/Sugestão: versão reduzida/)).toBeInTheDocument();
});

test('banner de backup aparece com dados e sem backup; some após backup recente', async () => {
  at(2026, 11, 30);
  await toggleCheck('2026-11-29', 'cafe');
  const { unmount } = render(<Hoje />);
  expect(await screen.findByText(/Faça um backup/)).toBeInTheDocument();
  unmount();
  await markBackupDone(new Date(2026, 10, 29));
  render(<Hoje />);
  await screen.findByText('Semana 1 · Base');
  expect(screen.queryByText(/Faça um backup/)).toBeNull();
});

test('sábado tem interruptor "Tem quadra hoje?" que remove a quadra', async () => {
  at(2026, 12, 5);
  render(<Hoje />);
  const sw = await screen.findByRole('checkbox', { name: /Tem quadra hoje\?/ });
  expect(screen.getByRole('checkbox', { name: /Vôlei de Quadra/ })).toBeInTheDocument();
  await userEvent.click(sw);
  await waitFor(() => expect(screen.queryByRole('checkbox', { name: /Vôlei de Quadra/ })).toBeNull());
});

test('domingo oferece repor o Superior A perdido na quarta', async () => {
  at(2026, 12, 6);
  await saveSession({ date: '2026-12-04', sessionId: 'superiorB', reduced: false, completedAt: 1 });
  render(<Hoje />);
  const link = await screen.findByRole('link', { name: /Repor hoje: Superior A/ });
  expect(link).toHaveAttribute('href', '#/treino/2026-12-02');
  expect(screen.queryByRole('link', { name: /Repor hoje: Superior B/ })).toBeNull();
});

test('avisos da dieta aparecem na primeira vez', async () => {
  at(2026, 11, 30);
  await setSetting('noticesSeen', false);
  render(<Hoje />);
  expect(await screen.findByText(/mostrar à sua nutricionista/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Entendi' }));
  await waitFor(() => expect(screen.queryByText(/mostrar à sua nutricionista/)).toBeNull());
});

test('segunda lembra de pesar; 1ª segunda do mês lembra medidas e salto', async () => {
  at(2026, 12, 7);
  const { unmount } = render(<Hoje />);
  expect(await screen.findByText(/Dia de pesar/)).toBeInTheDocument();
  expect(screen.getByText(/medidas e teste de salto/)).toBeInTheDocument();
  unmount();
  at(2026, 12, 14);
  render(<Hoje />);
  expect(await screen.findByText(/Dia de pesar/)).toBeInTheDocument();
  expect(screen.queryByText(/medidas e teste de salto/)).toBeNull();
});

test('ao voltar ao app depois da meia-noite, Hoje troca para o novo dia e grava nele', async () => {
  at(2026, 11, 30, 23);
  render(<Hoje />);
  await screen.findByText(/Segunda 30\/11/);
  vi.setSystemTime(new Date(2026, 11, 1, 7, 0));
  document.dispatchEvent(new Event('visibilitychange'));
  expect(await screen.findByText(/Terça 01\/12/)).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('checkbox', { name: /07:00.*Café/ }));
  const { isChecked } = await import('../../src/storage/db');
  await waitFor(async () => expect(await isChecked('2026-12-01', 'cafe')).toBe(true));
  expect(await isChecked('2026-11-30', 'cafe')).toBe(false);
});

test('antes do início do programa não aparece treino perdido', async () => {
  at(2026, 11, 29); // domingo antes do início em 30/11
  render(<Hoje />);
  await screen.findByText(/Programa começa em 30\/11/);
  expect(screen.queryByRole('link', { name: /Repor hoje/ })).toBeNull();
});

test('refeição mostra as opções do protocolo sem atrapalhar o check', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  await userEvent.click(await screen.findByRole('button', { name: 'Opções: Café da manhã' }));
  expect(screen.getByText(/40 g de whey/)).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /06:30.*Café/ })).not.toBeChecked();
});

test('mobilidade de terça se marca com um toque', async () => {
  at(2026, 12, 1);
  render(<Hoje />);
  const box = await screen.findByRole('checkbox', { name: /Marcar treino feito/ });
  await userEvent.click(box);
  await waitFor(() => expect(box).toBeChecked());
});
