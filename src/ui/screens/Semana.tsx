import { useEffect, useState } from 'preact/hooks';
import { addDays, formatShort, mondayOf, todayKey, weekdayOf } from '../../domain/dates';
import { programPosition, sessionForDate } from '../../domain/program';
import { dayCompliance } from '../compliance';
import { PHASE_LABEL, SESSION_SHORT, VOLLEY_SHORT, WEEKDAY_LABEL } from '../../domain/types';
import { getSession } from '../../storage/db';
import { loadSettings } from '../settings';

interface Row { date: string; pct: number; done: boolean }

export function Semana({ date: dateProp }: { date?: string } = {}) {
  const date = dateProp ?? todayKey();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [label, setLabel] = useState('');
  const monday = mondayOf(date);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings(date);
      const pos = programPosition(date, settings.startDate);
      setLabel(`Semana ${pos.week} · ${PHASE_LABEL[pos.phase]}${pos.started ? '' : ` (começa em ${formatShort(pos.startsOn)})`}`);
      const out: Row[] = [];
      for (let k = 0; k < 7; k++) {
        const d = addDays(monday, k);
        const { pct } = await dayCompliance(d, settings);
        out.push({ date: d, pct, done: !!(await getSession(d))?.completedAt });
      }
      setRows(out);
    })();
  }, [date]);

  return (
    <section class="screen">
      <h1>Semana</h1>
      <p class="muted small">{label} · {formatShort(monday)} a {formatShort(addDays(monday, 6))}</p>
      {!rows ? <p class="muted">Carregando…</p> : (
        <div class="card">
          <table>
            <thead><tr><th>Dia</th><th>Academia</th><th>Vôlei</th><th>Feito</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const wd = weekdayOf(r.date);
                const sid = sessionForDate(r.date);
                return (
                  <tr key={r.date} style={{ fontWeight: r.date === date ? 700 : 400 }}>
                    <th scope="row"><a href={r.date === todayKey() ? '#/hoje' : `#/treino/${r.date}`}>{WEEKDAY_LABEL[wd]}</a> <span class="muted small">{formatShort(r.date)}</span></th>
                    <td>{sid ? `${r.done ? '✅ ' : ''}${SESSION_SHORT[sid]}` : '—'}</td>
                    <td>{VOLLEY_SHORT[wd] ?? '—'}</td>
                    <td>{`${r.pct}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p class="small muted">Pernas e saltos só na segunda e quinta, longe do vôlei pesado de terça à noite e do sábado.</p>
    </section>
  );
}
