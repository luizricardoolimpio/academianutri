import { useEffect, useState } from 'preact/hooks';
import { EXERCISES } from '../../data/exercises';
import { addDays, formatShort, mondayOf, todayKey } from '../../domain/dates';
import { parseLoad } from '../../domain/progress';
import { dayCompliance } from '../compliance';
import { getSetting, listAll, listBody, listJumps, saveBody, saveJump, setSetting, type BodyRec, type JumpRec, type SetRec } from '../../storage/db';
import { LineChart } from '../components/LineChart';
import { loadSettings } from '../settings';

export const MEASURES: Array<{ key: string; label: string }> = [
  { key: 'gordura', label: '% Gordura' }, { key: 'massaMagra', label: 'Massa magra (kg)' },
  { key: 'pescoco', label: 'Pescoço (cm)' }, { key: 'ombros', label: 'Ombros (cm)' }, { key: 'peitoral', label: 'Peitoral (cm)' },
  { key: 'bracoD', label: 'Braço D (cm)' }, { key: 'bracoE', label: 'Braço E (cm)' },
  { key: 'antebracoD', label: 'Antebraço D (cm)' }, { key: 'antebracoE', label: 'Antebraço E (cm)' },
  { key: 'cintura', label: 'Cintura (cm)' }, { key: 'abdomen', label: 'Abdômen (cm)' }, { key: 'quadril', label: 'Quadril (cm)' },
  { key: 'coxaD', label: 'Coxa D (cm)' }, { key: 'coxaE', label: 'Coxa E (cm)' },
  { key: 'panturrilhaD', label: 'Panturrilha D (cm)' }, { key: 'panturrilhaE', label: 'Panturrilha E (cm)' },
];

interface Data {
  body: BodyRec[];
  jumps: JumpRec[];
  sets: SetRec[];
  goal?: number;
  weeks: Array<{ monday: string; pct: number }>;
}

async function weeklyCompliance(date: string): Promise<Data['weeks']> {
  const settings = await loadSettings(date);
  const out: Data['weeks'] = [];
  for (let w = 7; w >= 0; w--) {
    const monday = addDays(mondayOf(date), -7 * w);
    const pcts: number[] = [];
    for (let k = 0; k < 7; k++) {
      const d = addDays(monday, k);
      if (d > date) break;
      pcts.push((await dayCompliance(d, settings)).pct);
    }
    out.push({ monday, pct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0 });
  }
  return out;
}

export function Evolucao({ date: dateProp }: { date?: string } = {}) {
  const date = dateProp ?? todayKey();
  const [d, setD] = useState<Data | null>(null);
  const [weight, setWeight] = useState('');
  const [goalIn, setGoalIn] = useState('');
  const [meas, setMeas] = useState<Record<string, string>>({});
  const [jump, setJump] = useState({ reach: '', jump: '' });
  const [exId, setExId] = useState('');

  const reload = async () => setD({
    body: (await listBody()).sort((a, b) => a.date.localeCompare(b.date)),
    jumps: (await listJumps()).sort((a, b) => a.date.localeCompare(b.date)),
    sets: await listAll<SetRec>('sets'),
    goal: await getSetting<number | undefined>('weightGoalKg', undefined),
    weeks: await weeklyCompliance(date),
  });
  useEffect(() => { void reload(); }, [date]);
  if (!d) return <section class="screen"><h1>Evolução</h1><p class="muted">Carregando…</p></section>;

  const weights = d.body.filter((b) => b.weightKg !== undefined).map((b) => ({ x: b.date, y: b.weightKg! }));
  const exIds = [...new Set(d.sets.filter((s) => s.loadKg !== undefined).map((s) => s.exerciseId))].sort((a, b) => EXERCISES[a]?.name.localeCompare(EXERCISES[b]?.name ?? '') ?? 0);
  const loadPoints = (() => {
    const byDate = new Map<string, number>();
    for (const s of d.sets) if (s.exerciseId === exId && s.loadKg !== undefined) byDate.set(s.date, Math.max(byDate.get(s.date) ?? 0, s.loadKg));
    return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([x, y]) => ({ x, y }));
  })();
  const measured = d.body.filter((b) => b.measures && Object.keys(b.measures).length);

  const saveWeight = async () => {
    const kg = parseLoad(weight);
    if (kg === undefined) return;
    await saveBody({ date, weightKg: kg });
    setWeight('');
    await reload();
  };
  const saveGoal = async () => {
    const kg = parseLoad(goalIn);
    await setSetting('weightGoalKg', kg);
    setGoalIn('');
    await reload();
  };
  const saveMeasures = async () => {
    const measures: Record<string, number> = {};
    for (const [k, v] of Object.entries(meas)) { const n = parseLoad(v); if (n !== undefined) measures[k] = n; }
    if (!Object.keys(measures).length) return;
    await saveBody({ date, measures });
    setMeas({});
    await reload();
  };
  const saveJumpTest = async () => {
    const reachCm = parseLoad(jump.reach), jumpCm = parseLoad(jump.jump);
    if (reachCm === undefined && jumpCm === undefined) return;
    await saveJump({ date, reachCm, jumpCm });
    setJump({ reach: '', jump: '' });
    await reload();
  };

  return (
    <section class="screen">
      <h1>Evolução</h1>

      <h2>Peso</h2>
      {weights.length ? <LineChart title="Peso" points={weights} unit="kg" goal={d.goal} /> : <p class="muted">Registre seu peso toda segunda de manhã, em jejum, depois do banheiro.</p>}
      <div class="grid2">
        <label>Peso (kg)<input type="text" inputMode="decimal" value={weight} onInput={(e) => setWeight((e.target as HTMLInputElement).value)} /></label>
        <button class="btn" style="align-self:end" onClick={saveWeight}>Registrar peso</button>
        <label>Meta de peso (kg)<input type="text" inputMode="decimal" value={goalIn} placeholder={d.goal ? String(d.goal).replace('.', ',') : ''} onInput={(e) => setGoalIn((e.target as HTMLInputElement).value)} /></label>
        <button class="btn secondary" style="align-self:end" onClick={saveGoal}>Salvar meta</button>
      </div>

      <h2>Cumprimento semanal</h2>
      <ul aria-label="Cumprimento semanal" class="card" style="list-style:none;padding:10px 14px;margin:0">
        {d.weeks.map((w) => (
          <li key={w.monday} class="row" style="margin:4px 0">
            <span class="small" style="width:78px">{`${formatShort(w.monday)} · ${w.pct}%`}</span>
            <span class="progress" style="flex:1"><span style={{ width: `${w.pct}%` }} /></span>
          </li>
        ))}
      </ul>

      <h2>Carga por exercício</h2>
      {exIds.length ? (
        <>
          <label>Exercício
            <select value={exId} onChange={(e) => setExId((e.target as HTMLSelectElement).value)}>
              <option value="">Escolha…</option>
              {exIds.map((id) => <option key={id} value={id}>{EXERCISES[id]?.name ?? id}</option>)}
            </select>
          </label>
          {exId && <LineChart title="Carga máxima" points={loadPoints} unit="kg" />}
        </>
      ) : <p class="muted">As cargas aparecem aqui depois do primeiro treino registrado.</p>}

      <h2>Teste de salto (mensal)</h2>
      {d.jumps.some((j) => j.jumpCm !== undefined) && <LineChart title="Salto vertical" points={d.jumps.filter((j) => j.jumpCm !== undefined).map((j) => ({ x: j.date, y: j.jumpCm! }))} unit="cm" />}
      <p class="small muted">Na quadra, depois de aquecer: 3 saltos com passada de ataque, anote o melhor alcance. Salto = alcance − alcance parado com o braço estendido.</p>
      <div class="grid2">
        <label>Alcance no ataque (cm)<input type="text" inputMode="decimal" value={jump.reach} onInput={(e) => setJump({ ...jump, reach: (e.target as HTMLInputElement).value })} /></label>
        <label>Salto vertical (cm)<input type="text" inputMode="decimal" value={jump.jump} onInput={(e) => setJump({ ...jump, jump: (e.target as HTMLInputElement).value })} /></label>
      </div>
      <button class="btn secondary" style="margin-top:8px" onClick={saveJumpTest}>Salvar teste de salto</button>

      <h2>Medidas (mensal)</h2>
      {measured.length > 0 && (
        <div class="card"><table>
          <thead><tr><th>Medida</th><th>{formatShort(measured[0].date)}</th><th>{formatShort(measured.at(-1)!.date)}</th></tr></thead>
          <tbody>{MEASURES.filter((m) => measured.some((b) => b.measures![m.key] !== undefined)).map((m) => (
            <tr key={m.key}><td>{m.label}</td><td>{measured[0].measures![m.key] ?? '—'}</td><td>{measured.at(-1)!.measures![m.key] ?? '—'}</td></tr>
          ))}</tbody>
        </table></div>
      )}
      <details class="card" open={!measured.length}>
        <summary>Registrar medidas de hoje</summary>
        <div class="grid2" style="margin-top:8px">
          {MEASURES.map((m) => (
            <label key={m.key} class="small">{m.label}
              <input type="text" inputMode="decimal" value={meas[m.key] ?? ''} onInput={(e) => setMeas({ ...meas, [m.key]: (e.target as HTMLInputElement).value })} />
            </label>
          ))}
        </div>
        <button class="btn secondary" style="margin-top:8px" onClick={saveMeasures}>Salvar medidas</button>
      </details>
    </section>
  );
}
