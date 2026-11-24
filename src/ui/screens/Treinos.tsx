import { useEffect, useState } from 'preact/hooks';
import { EXERCISES } from '../../data/exercises';
import { PROGRAM, ROUTINES } from '../../data/program';
import { todayKey } from '../../domain/dates';
import { programPosition } from '../../domain/program';
import { PHASE_LABEL, SESSION_LABEL, type GymSessionId, type Phase, type Prescription } from '../../domain/types';
import { loadSettings } from '../settings';

const PHASES: Phase[] = ['base', 'forca', 'potencia', 'descarga'];
const GYM: GymSessionId[] = ['inferiorA', 'superiorA', 'inferiorB', 'superiorB'];
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function PlanList({ list }: { list: Prescription[] }) {
  return (
    <ol class="small" style="padding-left:20px;margin:4px 0">
      {list.map((p) => (
        <li key={p.exerciseId}>
          <a href={`#/treinos/${p.exerciseId}`}>{EXERCISES[p.exerciseId].name}</a>
          <span class="muted">{` — ${p.sets} × ${p.reps}`}{p.load ? ` · ${p.load}` : ''}</span>
        </li>
      ))}
    </ol>
  );
}

export function Treinos({ date: dateProp }: { date?: string } = {}) {
  const date = dateProp ?? todayKey();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { loadSettings(date).then((s) => setPhase(programPosition(date, s.startDate).phase)); }, [date]);
  if (!phase) return <section class="screen"><h1>Treinos</h1><p class="muted">Carregando…</p></section>;

  const lib = Object.values(EXERCISES).filter((e) => norm(e.name).includes(norm(q))).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return (
    <section class="screen">
      <h1>Treinos</h1>
      <div role="tablist" aria-label="Fases" class="row" style="flex-wrap:wrap;gap:6px">
        {PHASES.map((ph) => (
          <button key={ph} role="tab" aria-selected={ph === phase} class={ph === phase ? 'btn small' : 'btn secondary small'} onClick={() => setPhase(ph)}>{PHASE_LABEL[ph]}</button>
        ))}
      </div>
      <p class="small muted">Ciclo de 12 semanas: Base (1–4) · Força (5–8) · Potência (9–11) · Descarga (12).</p>
      {GYM.map((id) => (
        <div class="card" key={id}>
          <h2 style="margin-top:0">{SESSION_LABEL[id]}</h2>
          <PlanList list={PROGRAM[id][phase]} />
        </div>
      ))}
      <div class="card"><h2 style="margin-top:0">{SESSION_LABEL.mobilidade}</h2><PlanList list={ROUTINES.mobilidade} /></div>
      <div class="card"><h2 style="margin-top:0">{SESSION_LABEL.cardio}</h2><PlanList list={ROUTINES.cardio} /></div>

      <h2>Biblioteca de exercícios</h2>
      <input type="search" aria-label="Buscar exercício" placeholder="Buscar exercício…" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
      <ul aria-label="Biblioteca de exercícios" class="list" style="list-style:none;padding:0;margin-top:8px">
        {lib.map((e) => (
          <li key={e.id} class="check-item"><a href={`#/treinos/${e.id}`}>{e.name}</a></li>
        ))}
      </ul>
    </section>
  );
}
