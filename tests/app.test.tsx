import { render, screen } from '@testing-library/preact';
import { App } from '../src/app';

test('mostra as cinco abas e abre Hoje por padrão', () => {
  render(<App />);
  for (const t of ['Hoje', 'Semana', 'Treinos', 'Dieta', 'Evolução'])
    expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Hoje/);
});

test('hash #/dieta abre a tela Dieta', async () => {
  location.hash = '#/dieta';
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Dieta');
});
