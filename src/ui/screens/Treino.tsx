import { useEffect, useState } from 'preact/hooks';
import { EXERCISES, searchVideoUrl } from '../../data/exercises';
import { formatShort } from '../../domain/dates';
import { programPosition, sessionForDate, sessionPlan } from '../../domain/program';
import { formatLoad, parseLoad, suggestReduced } from '../../domain/progress';
import { PHASE_LABEL, SESSION_LABEL, type Phase, type SessionId } from '../../domain/types';
import { deleteSet, getSession, getSetsOnDate, getWellness, lastLoad, saveSession, saveSet, setCheck } from '../../storage/db';
import { navigate } from '../../router';
import { RestTimer } from '../components/RestTimer';
import { loadSettings } from '../settings';
import { loadDayContext } from '../dayContext';

interface Loaded {
  sessionId: SessionId | null;
  phase: Phase;
  week: number;
  reduced: boolean;
  doneSets: Record<string, Set<number>>;
  loads: Record<string, string[]>;
  last: Record<string, { loadKg?: number; date: string } | undefined>;
  completed: boolean;
}

export function Treino({ date }: { date: string }) {
  const [d, setD] = useState<Loaded | null>(null);
  const [idx, setIdx] = useState(0);
  const [rest, setRest] = useState<{ seconds: number; at: number } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number | undefined>();

  useEffect(() => {
    let lock: { release: () => Promise<void> } | undefined;
    (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<typeof lock> } }).wakeLock
      ?.request('screen').then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release().catch(() => {}); };
  }, []);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings(date);
      const pos = programPosition(date, settings.startDate, settings.pauses);
      const sessionId = sessionForDate(date);
      const session = await getSession(date);
      const ctx = await loadDayContext(date, settings);
      const jumpDay = sessionId === 'inferiorA' || sessionId === 'inferiorB';
      const reduced = session ? session.reduced : suggestReduced(await getWellness(date)) || (ctx.gameNear && jumpDay);
      const doneSets: Loaded['doneSets'] = {};
      const loads: Loaded['loads'] = {};
      for (const s of await getSetsOnDate(date)) {
        (doneSets[s.exerciseId] ??= new Set()).add(s.setIndex);
        (loads[s.exerciseId] ??= [])[s.setIndex] = formatLoad(s.loadKg);
      }
      const last: Loaded['last'] = {};
      const ids = new Set([...sessionPlan(sessionId ?? 'cardio', pos.phase, false), ...sessionPlan(sessionId ?? 'cardio', pos.phase, true)].map((p) => p.exerciseId));
      for (const id of ids) last[id] = await lastLoad(id);
      setD({ sessionId, phase: pos.phase, week: pos.week, reduced, doneSets, loads, last, completed: !!session?.completedAt });
    })();
  }, [date]);

  if (!d) return <section class="screen"><h1>Treino</h1><p class="muted">Carregando…</p></section>;
  if (!d.sessionId)
    return (
      <section class="screen">
        <h1>Treino</h1>
        <p>Hoje é dia de descanso da academia.</p>
        <p class="muted">Sábado é dia de vôlei. Aproveite para hidratar e recuperar.</p>
        <a class="btn secondary" href="#/hoje">Voltar para Hoje</a>
      </section>
    );

  const sessionId = d.sessionId;
  const plan = sessionPlan(sessionId, d.phase, d.reduced);
  const i = Math.min(idx, plan.length - 1);
  const pr = plan[i];
  const ex = EXERCISES[pr.exerciseId];
  const doneSet = d.doneSets[ex.id] ?? new Set<number>();
  const loadValue = (k: number) => d.loads[ex.id]?.[k] ?? formatLoad(d.last[ex.id]?.loadKg);
  const setLoad = (k: number, v: string) => {
    const arr = [...(d.loads[ex.id] ?? Array.from({ length: pr.sets }, (_, j) => loadValue(j)))];
    arr[k] = v;
    setD((prev) => (prev ? { ...prev, loads: { ...prev.loads, [ex.id]: arr } } : prev));
    // série já marcada: a correção da carga também é gravada
    if (doneSet.has(k)) void saveSet({ date, sessionId, exerciseId: ex.id, setIndex: k, reps: pr.reps, loadKg: parseLoad(v) });
  };
  const bump = (k: number, delta: number) => {
    const n = Math.max(0, (parseLoad(loadValue(k)) ?? 0) + delta);
    setLoad(k, formatLoad(Math.round(n * 10) / 10));
  };
  const markSet = async (k: number) => {
    const next = new Set(doneSet);
    if (next.has(k)) {
      next.delete(k);
      await deleteSet(date, ex.id, k);
    } else {
      next.add(k);
      await saveSet({ date, sessionId, exerciseId: ex.id, setIndex: k, reps: pr.reps, loadKg: parseLoad(loadValue(k)) });
      if (pr.restSec > 0) setRest({ seconds: pr.restSec, at: Date.now() });
    }
    setD((prev) => (prev ? { ...prev, doneSets: { ...prev.doneSets, [ex.id]: next } } : prev));
  };
  const finish = async () => {
    await saveSession({ date, sessionId, rpe, reduced: d.reduced, completedAt: Date.now() });
    await setCheck(date, 'treino', true);
    navigate('#/hoje');
  };
  const last = d.last[ex.id];
  const usesLoad = pr.restSec > 0 && !/\b(s|min|m)$/.test(pr.reps) && !pr.plyoContactsPerSet;

  return (
    <section class="screen">
      <h1>{SESSION_LABEL[sessionId]}</h1>
      <p class="small muted">{`Semana ${d.week} · ${PHASE_LABEL[d.phase]} · ${formatShort(date)}`}{d.completed && ' · ✅ concluído'}</p>

      <label class="card row spread">
        <span>Versão reduzida <span class="small muted">(sem saltos, −1 série)</span></span>
        <input type="checkbox" checked={d.reduced} onChange={() => { setD({ ...d, reduced: !d.reduced }); setIdx(0); }} />
      </label>

      <nav aria-label="Exercícios do treino" class="chip-row">
        {plan.map((p, j) => (
          <button key={p.exerciseId} class={j === i ? 'chip current' : 'chip'}
            aria-label={`Ir para ${EXERCISES[p.exerciseId].name}`} onClick={() => setIdx(j)}>
            {(d.doneSets[p.exerciseId]?.size ?? 0) >= p.sets ? '✅' : j + 1} {EXERCISES[p.exerciseId].name}
          </button>
        ))}
      </nav>

      <div class="card">
        <div class="row spread"><span class="chip">{`${i + 1}/${plan.length}`}</span>{pr.plyoContactsPerSet ? <span class="chip">salto</span> : null}</div>
        <h2>{ex.name}</h2>
        <p style="margin:4px 0">
          <strong>{`${pr.sets} × ${pr.reps}`}</strong>
          {pr.load && ` · ${pr.load}`}
          {pr.restSec > 0 && ` · descanso ${pr.restSec} s`}
          {pr.rir && ` · sobrar ${pr.rir} reps`}
        </p>
        {pr.notes && <p class="small muted" style="margin:4px 0">{pr.notes}</p>}
        <div class="row" style="flex-wrap:wrap;margin:8px 0">
          <a class="btn small" href={ex.videoUrl ?? searchVideoUrl(ex)} target="_blank" rel="noopener">▶ Vídeo</a>
        </div>
        {ex.imageUrl && <img src={ex.imageUrl} alt={`Posição do exercício ${ex.name}`} loading="lazy" style="width:100%;max-height:220px;object-fit:contain;border-radius:10px;background:#fff" />}
        <details>
          <summary>Como fazer</summary>
          <ul>{ex.how.map((h) => <li key={h}>{h}</li>)}</ul>
          <p class="small"><strong>Erros comuns:</strong> {ex.mistakes.join(' ')}</p>
        </details>
        {last?.loadKg !== undefined && <p class="small muted">{`Última vez: ${formatLoad(last.loadKg)} kg (${formatShort(last.date)})`}</p>}
      </div>

      <div class="list">
        {Array.from({ length: pr.sets }, (_, k) => (
          <div class={doneSet.has(k) ? 'check-item done' : 'check-item'} key={k}>
            <button class={doneSet.has(k) ? 'btn small' : 'btn secondary small'} aria-label={`Marcar série ${k + 1} feita`} aria-pressed={doneSet.has(k)} onClick={() => markSet(k)}>
              {doneSet.has(k) ? '✓' : k + 1}
            </button>
            <span class="title">{`Série ${k + 1} · ${pr.reps}`}</span>
            {usesLoad && <>
            <button class="btn secondary small" aria-label={`Menos 2,5 kg na série ${k + 1}`} onClick={() => bump(k, -2.5)}>−</button>
            <input type="text" inputMode="decimal" style="width:76px" aria-label={`Carga série ${k + 1} (kg)`} placeholder="kg"
              value={loadValue(k)} onInput={(e) => setLoad(k, (e.target as HTMLInputElement).value)} />
            <button class="btn secondary small" aria-label={`Mais 2,5 kg na série ${k + 1}`} onClick={() => bump(k, 2.5)}>+</button>
            </>}
          </div>
        ))}
      </div>

      {rest && <RestTimer seconds={rest.seconds} startedAt={rest.at} onClose={() => setRest(null)} />}

      <div class="row spread" style="margin-top:12px">
        <button class="btn secondary" disabled={i === 0} onClick={() => setIdx(i - 1)}>◀ Anterior</button>
        {i < plan.length - 1
          ? <button class="btn" onClick={() => setIdx(i + 1)}>Próximo ▶</button>
          : <button class="btn" onClick={() => setFinishing(true)}>Concluir treino</button>}
      </div>

      {finishing && (
        <div class="card">
          <h2 style="margin-top:0">Como foi o esforço? (1 = muito leve, 10 = máximo)</h2>
          <div class="scale" style="flex-wrap:wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button key={n} aria-label={`Esforço: ${n}`} aria-pressed={rpe === n} onClick={() => setRpe(n)}>{n}</button>
            ))}
          </div>
          <button class="btn" style="margin-top:10px" onClick={finish}>Salvar treino</button>
        </div>
      )}
    </section>
  );
}
