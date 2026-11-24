import { render, screen } from '@testing-library/preact';
import { freshDb } from '../helpers';
import { Semana } from '../../src/ui/screens/Semana';
import { setSetting, toggleCheck } from '../../src/storage/db';

beforeEach(async () => { freshDb(); await setSetting('startDate', '2026-11-30'); });

test('Semana mostra 7 dias com sessão, vôlei e % feito', async () => {
  await toggleCheck('2026-11-30', 'cafe');
  render(<Semana date="2026-12-02" />);
  const seg = await screen.findByRole('row', { name: /Segunda/ });
  expect(seg).toHaveTextContent('Inferior A');
  expect(seg).toHaveTextContent(/\d+%/);
  expect(screen.getByRole('row', { name: /Terça/ })).toHaveTextContent('Quadra 20h');
  expect(screen.getByRole('row', { name: /Sábado/ })).toHaveTextContent('Areia 11h');
  expect(screen.getAllByRole('row').filter((r) => /Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo/.test(r.textContent ?? ''))).toHaveLength(7);
});
