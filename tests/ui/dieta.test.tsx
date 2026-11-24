import { render, screen } from '@testing-library/preact';
import { Dieta } from '../../src/ui/screens/Dieta';

test('Dieta mostra carbo do dia e opções do almoço rápido', () => {
  render(<Dieta date="2026-11-30" />);
  expect(screen.getByText(/Almoço: 70 g/)).toBeInTheDocument();
  expect(screen.getByText(/Jantar: 50 g/)).toBeInTheDocument();
  for (const t of [/Marmita/, /Shake/, /Wrap/]) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
});

test('Dieta no sábado mostra refeição livre à noite', () => {
  render(<Dieta date="2026-12-05" />);
  expect(screen.getByText(/Almoço: 100 g/)).toBeInTheDocument();
  expect(screen.getByText(/Jantar: refeição livre/)).toBeInTheDocument();
});

test('Dieta mostra os avisos fixos, suplementos e preparo de marmitas', () => {
  render(<Dieta date="2026-11-30" />);
  expect(screen.getByText(/mostrar à sua nutricionista/)).toBeInTheDocument();
  expect(screen.getByText(/combine o uso com seu médico/)).toBeInTheDocument();
  expect(screen.getByText(/Stimerex/, { selector: 'li *, li' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /marmitas/i })).toBeInTheDocument();
});
