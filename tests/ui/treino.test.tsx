import { render, screen, waitFor, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { freshDb } from '../helpers';
import { Treino } from '../../src/ui/screens/Treino';
import { setSetting, saveSet, lastLoad, saveWellness, getSession, isChecked } from '../../src/storage/db';

beforeEach(async () => {
  freshDb();
  await setSetting('startDate', '2026-11-30');
});

test('mostra um exercício por vez com séries, descanso e vídeo', async () => {
  render(<Treino date="2026-11-30" />);
  expect(await screen.findByText(/^1\/\d+$/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Esteira reversa');
  expect(screen.getByRole('link', { name: /vídeo/i })).toHaveAttribute('href', expect.stringMatching(/youtu/));
  await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
  expect(screen.getByText(/^2\/\d+$/)).toBeInTheDocument();
});

async function openSupino() {
  render(<Treino date="2026-12-02" />);
  await userEvent.click(await screen.findByRole('button', { name: 'Ir para Supino reto com barra' }));
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Supino reto com barra');
}

test('carga vazia sem histórico', async () => {
  await openSupino();
  expect(screen.getByLabelText('Carga série 1 (kg)')).toHaveValue('');
});

test('carga vem da última vez', async () => {
  await saveSet({ date: '2026-11-25', sessionId: 'superiorA', exerciseId: 'supino-reto-barra', setIndex: 0, loadKg: 42.5 });
  await openSupino();
  await waitFor(() => expect(screen.getByLabelText('Carga série 1 (kg)')).toHaveValue('42,5'));
  expect(screen.getByText(/Última vez: 42,5 kg/)).toBeInTheDocument();
});

test('digitar "22,5" e marcar a série salva 22.5 e inicia o descanso', async () => {
  await openSupino();
  const input = screen.getByLabelText('Carga série 1 (kg)');
  await userEvent.type(input, '22,5');
  await userEvent.click(screen.getByRole('button', { name: 'Marcar série 1 feita' }));
  await waitFor(async () => expect(await lastLoad('supino-reto-barra')).toMatchObject({ loadKg: 22.5, date: '2026-12-02' }));
  expect(screen.getByRole('timer')).toHaveTextContent('02:00');
});

test('botão +2,5 kg soma na carga', async () => {
  await openSupino();
  await userEvent.click(screen.getByRole('button', { name: 'Mais 2,5 kg na série 1' }));
  expect(screen.getByLabelText('Carga série 1 (kg)')).toHaveValue('2,5');
});

test('versão reduzida (joelho 4) não tem saltos', async () => {
  await saveWellness({ date: '2026-11-30', sono: 4, joelho: 4, ombro: 1, disposicao: 3 });
  render(<Treino date="2026-11-30" />);
  expect(await screen.findByRole('checkbox', { name: /Versão reduzida/ })).toBeChecked();
  const nav = screen.getByRole('navigation', { name: 'Exercícios do treino' });
  expect(within(nav).queryByText(/Shock pause/)).toBeNull();
  await userEvent.click(screen.getByRole('checkbox', { name: /Versão reduzida/ }));
  expect(await within(nav).findByText(/Shock pause/)).toBeInTheDocument();
});

test('concluir pede RPE e marca o treino feito no dia', async () => {
  render(<Treino date="2026-12-06" />); // domingo: cardio (3 itens)
  await screen.findByText(/^1\/3$/);
  await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
  await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
  await userEvent.click(screen.getByRole('button', { name: 'Concluir treino' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Esforço: 6' }));
  await userEvent.click(screen.getByRole('button', { name: 'Salvar treino' }));
  await waitFor(async () => expect(await getSession('2026-12-06')).toMatchObject({ sessionId: 'cardio', rpe: 6, reduced: false }));
  expect(await isChecked('2026-12-06', 'treino')).toBe(true);
});

test('dia sem treino mostra "Hoje é dia de descanso da academia"', async () => {
  render(<Treino date="2026-12-05" />);
  expect(await screen.findByText('Hoje é dia de descanso da academia.')).toBeInTheDocument();
});
