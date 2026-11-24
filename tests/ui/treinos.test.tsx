import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { freshDb } from '../helpers';
import { Treinos } from '../../src/ui/screens/Treinos';
import { Exercicio } from '../../src/ui/screens/Exercicio';
import { setSetting } from '../../src/storage/db';

beforeEach(async () => { freshDb(); await setSetting('startDate', '2026-11-30'); });

test('Treinos: busca "supino" filtra a biblioteca', async () => {
  render(<Treinos date="2026-11-30" />);
  await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar exercício' }), 'supino');
  const lib = screen.getByRole('list', { name: 'Biblioteca de exercícios' });
  const names = within(lib).getAllByRole('link').map((a) => a.textContent);
  expect(names.length).toBeGreaterThanOrEqual(2);
  expect(names.every((n) => /supino/i.test(n ?? ''))).toBe(true);
});

test('Treinos: abas de fase mostram as 4 sessões da fase', async () => {
  render(<Treinos date="2026-11-30" />);
  expect(await screen.findByRole('tab', { name: 'Base', selected: true })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Potência' }));
  for (const s of ['Inferior A', 'Superior A', 'Inferior B', 'Superior B'])
    expect(screen.getByRole('heading', { level: 2, name: new RegExp(s) })).toBeInTheDocument();
  expect(screen.getAllByText('Depth jump').length).toBeGreaterThan(0);
});

test('Exercício mostra como fazer, erros comuns, vídeo e imagem', () => {
  render(<Exercicio id="face-pull" />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Face pull');
  expect(screen.getByText(/Como fazer/)).toBeInTheDocument();
  expect(screen.getByText(/Erros comuns/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /vídeo/i })).toHaveAttribute('href', 'https://youtu.be/hJxV0kz-w0Y');
  expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('Face_Pull'));
});

test('Exercício inexistente mostra aviso', () => {
  render(<Exercicio id="nao-existe" />);
  expect(screen.getByText(/Exercício não encontrado/)).toBeInTheDocument();
});
