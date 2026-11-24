import { render, screen, waitFor, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { freshDb } from '../helpers';
import { Evolucao, MEASURES } from '../../src/ui/screens/Evolucao';
import { listBody, listJumps, saveSet, setSetting, toggleCheck } from '../../src/storage/db';

beforeEach(async () => { freshDb(); await setSetting('startDate', '2026-11-30'); });

test('sem dados mostra estado vazio com instrução', async () => {
  render(<Evolucao date="2026-12-07" />);
  expect(await screen.findByText(/Registre seu peso toda segunda/)).toBeInTheDocument();
});

test('registrar peso 95 e ver no gráfico', async () => {
  render(<Evolucao date="2026-12-07" />);
  await userEvent.type(await screen.findByLabelText('Peso (kg)'), '95,4');
  await userEvent.click(screen.getByRole('button', { name: 'Registrar peso' }));
  await waitFor(async () => expect(await listBody()).toEqual([{ date: '2026-12-07', weightKg: 95.4, measures: {} }]));
  expect(await screen.findByRole('img', { name: /Peso: 1 registro/ })).toBeInTheDocument();
  expect(screen.getByText('95,4 kg')).toBeInTheDocument();
});

test('meta de peso desenha linha de meta', async () => {
  render(<Evolucao date="2026-12-07" />);
  await userEvent.type(await screen.findByLabelText('Meta de peso (kg)'), '88');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar meta' }));
  await userEvent.type(screen.getByLabelText('Peso (kg)'), '95');
  await userEvent.click(screen.getByRole('button', { name: 'Registrar peso' }));
  expect(await screen.findByText('Meta: 88 kg')).toBeInTheDocument();
});

test('medidas usam os campos da planilha', async () => {
  expect(MEASURES.map((m) => m.label)).toEqual([
    '% Gordura', 'Massa magra (kg)', 'Pescoço (cm)', 'Ombros (cm)', 'Peitoral (cm)', 'Braço D (cm)', 'Braço E (cm)',
    'Antebraço D (cm)', 'Antebraço E (cm)', 'Cintura (cm)', 'Abdômen (cm)', 'Quadril (cm)', 'Coxa D (cm)', 'Coxa E (cm)',
    'Panturrilha D (cm)', 'Panturrilha E (cm)',
  ]);
  render(<Evolucao date="2026-12-07" />);
  await userEvent.type(await screen.findByLabelText('Cintura (cm)'), '101');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar medidas' }));
  await waitFor(async () => expect((await listBody())[0].measures).toEqual({ cintura: 101 }));
});

test('carga por exercício mostra a evolução do supino', async () => {
  const s = { sessionId: 'superiorA' as const, exerciseId: 'supino-reto-barra', reps: '8' };
  await saveSet({ ...s, date: '2026-11-30', setIndex: 0, loadKg: 40 });
  await saveSet({ ...s, date: '2026-11-30', setIndex: 1, loadKg: 42.5 });
  await saveSet({ ...s, date: '2026-12-02', setIndex: 0, loadKg: 45 });
  render(<Evolucao date="2026-12-07" />);
  const sel = await screen.findByLabelText('Exercício');
  await waitFor(() => expect(within(sel).getByRole('option', { name: 'Supino reto com barra' })).toBeInTheDocument());
  await userEvent.selectOptions(sel, 'supino-reto-barra');
  expect(await screen.findByRole('img', { name: /Carga máxima: 2 registros/ })).toBeInTheDocument();
  expect(screen.getByText('45 kg')).toBeInTheDocument();
});

test('cumprimento semanal em % das últimas 8 semanas', async () => {
  await toggleCheck('2026-12-07', 'cafe');
  render(<Evolucao date="2026-12-07" />);
  const list = await screen.findByRole('list', { name: 'Cumprimento semanal' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(8);
  expect(within(list).getAllByRole('listitem')[7]).toHaveTextContent(/07\/12 · \d+%/);
});

test('teste de salto mensal grava alcance e salto em cm', async () => {
  render(<Evolucao date="2026-12-07" />);
  await userEvent.type(await screen.findByLabelText('Alcance no ataque (cm)'), '318');
  await userEvent.type(screen.getByLabelText('Salto vertical (cm)'), '62');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar teste de salto' }));
  await waitFor(async () => expect(await listJumps()).toEqual([{ date: '2026-12-07', reachCm: 318, jumpCm: 62 }]));
});
