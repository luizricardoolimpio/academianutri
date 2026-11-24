import { render, screen, waitFor, fireEvent, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { freshDb } from '../helpers';
import { Hoje } from '../../src/ui/screens/Hoje';
import { Ajustes } from '../../src/ui/screens/Ajustes';
import { Semana } from '../../src/ui/screens/Semana';
import { Treino } from '../../src/ui/screens/Treino';
import { getSetting, setSetting } from '../../src/storage/db';

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

test('marcar o dia como Folga troca a rotina e mostra "Teve vôlei hoje?"', async () => {
  at(2026, 12, 1); // terça
  render(<Hoje />);
  expect(await screen.findByRole('checkbox', { name: /07:00.*Café/ })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('radio', { name: 'Folga/Feriado' }));
  expect(await screen.findByRole('checkbox', { name: /08:00.*Café/ })).toBeInTheDocument();
  const sw = screen.getByRole('checkbox', { name: /Teve vôlei hoje\? .*Quadra/ });
  expect(sw).toBeChecked();
  await userEvent.click(sw);
  await waitFor(() => expect(screen.queryByRole('checkbox', { name: /20:00.*Vôlei de Quadra/ })).toBeNull());
});

test('período de férias em Ajustes marca os dias automaticamente', async () => {
  at(2026, 12, 22);
  const { unmount } = render(<Ajustes />);
  fireEvent.input(await screen.findByLabelText('Férias de'), { target: { value: '2026-12-21' } });
  fireEvent.input(screen.getByLabelText('Férias até'), { target: { value: '2027-01-10' } });
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar férias' }));
  await waitFor(async () => expect(await getSetting('vacations', [])).toEqual([{ from: '2026-12-21', to: '2027-01-10' }]));
  expect(await screen.findByText(/21\/12 a 10\/01/)).toBeInTheDocument();
  unmount();
  render(<Hoje />);
  expect(await screen.findByRole('radio', { name: 'Férias' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /08:00.*Café/ })).toBeInTheDocument();
});

test('atividade extra entra na linha do tempo e pode ser removida', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  await userEvent.click(await screen.findByRole('button', { name: '+ Atividade extra' }));
  await userEvent.selectOptions(screen.getByLabelText('Tipo de atividade'), 'jogo');
  fireEvent.input(screen.getByLabelText('Horário da atividade'), { target: { value: '15:00' } });
  await userEvent.type(screen.getByLabelText('Duração (min)'), '120');
  await userEvent.type(screen.getByLabelText('Observação'), 'Copa Master');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar atividade' }));
  const box = await screen.findByRole('checkbox', { name: /15:00.*Jogo \/ campeonato/ });
  expect(box.closest('label')).toHaveTextContent('Copa Master');
  expect(screen.getByText(/Sugestão: versão reduzida/)).toBeInTheDocument(); // jogo + treino com saltos
  await userEvent.click(screen.getByRole('button', { name: 'Remover Jogo / campeonato 15:00' }));
  await waitFor(() => expect(screen.queryByRole('checkbox', { name: /Jogo \/ campeonato/ })).toBeNull());
});

test('horário só de hoje muda o treino', async () => {
  at(2026, 11, 30);
  render(<Hoje />);
  await userEvent.click(await screen.findByText('Horários de hoje'));
  fireEvent.input(screen.getByLabelText(/Horário hoje: Inferior A/), { target: { value: '18:00' } });
  await userEvent.click(screen.getByRole('button', { name: 'Salvar horários de hoje' }));
  await waitFor(() => expect(screen.getByRole('link', { name: /Inferior A/ }).closest('div')).toHaveTextContent('18:00'));
});

test('pausar e retomar o programa', async () => {
  at(2026, 12, 21);
  const { unmount } = render(<Ajustes />);
  await userEvent.click(await screen.findByRole('button', { name: 'Pausar programa' }));
  expect(await screen.findByRole('button', { name: 'Retomar programa' })).toBeInTheDocument();
  unmount();
  const h = render(<Hoje />);
  expect(await screen.findByText(/Programa pausado/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Inferior A/ })).toBeNull();
  h.unmount();
  vi.setSystemTime(new Date(2027, 0, 4, 10));
  const a = render(<Ajustes />);
  await userEvent.click(await screen.findByRole('button', { name: 'Retomar programa' }));
  await waitFor(async () => expect(await getSetting('pauses', [])).toEqual([{ from: '2026-12-21', to: '2027-01-03' }]));
  a.unmount();
  render(<Hoje />);
  expect(await screen.findByText('Semana 4 · Base')).toBeInTheDocument();
});

test('Semana mostra Férias e as atividades extras', async () => {
  await setSetting('vacations', [{ from: '2026-12-21', to: '2027-01-10' }]);
  await setSetting('extras:2026-12-23', [{ id: 'x', kind: 'jogo', time: '15:00' }]);
  render(<Semana date="2026-12-23" />);
  const qua = await screen.findByRole('row', { name: /Quarta/ });
  expect(qua).toHaveTextContent('Férias');
  expect(qua).toHaveTextContent('Jogo');
});

test('treino no dia seguinte a um jogo começa na versão reduzida', async () => {
  await setSetting('extras:2026-12-02', [{ id: 'x', kind: 'jogo', time: '20:00' }]);
  render(<Treino date="2026-12-03" />);
  expect(await screen.findByRole('checkbox', { name: /Versão reduzida/ })).toBeChecked();
  const nav = screen.getByRole('navigation', { name: 'Exercícios do treino' });
  expect(within(nav).queryByText(/Box jump/)).toBeNull();
});

test('atividade "Outra" pede o nome e mostra o que foi digitado', async () => {
  at(2026, 12, 6);
  render(<Hoje />);
  await userEvent.click(await screen.findByRole('button', { name: '+ Atividade extra' }));
  await userEvent.selectOptions(screen.getByLabelText('Tipo de atividade'), 'outra');
  await userEvent.type(screen.getByLabelText('Qual atividade?'), 'Stand up paddle');
  fireEvent.input(screen.getByLabelText('Horário da atividade'), { target: { value: '16:30' } });
  await userEvent.click(screen.getByRole('button', { name: 'Salvar atividade' }));
  expect(await screen.findByRole('checkbox', { name: /16:30.*Stand up paddle/ })).toBeInTheDocument();
});

test('tipos de atividade incluem pilates, natação, corrida e beach tênis', async () => {
  at(2026, 12, 6);
  render(<Hoje />);
  await userEvent.click(await screen.findByRole('button', { name: '+ Atividade extra' }));
  const opts = within(screen.getByLabelText('Tipo de atividade')).getAllByRole('option').map((o) => o.textContent);
  for (const t of ['Pilates', 'Natação', 'Corrida', 'Beach tênis', 'Jogo / campeonato', 'Outra (digitar)']) expect(opts).toContain(t);
});
