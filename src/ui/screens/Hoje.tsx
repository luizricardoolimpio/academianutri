import { useEffect, useState } from 'preact/hooks';
import { DIET_NOTICES, MEALS, dietDayType } from '../../data/diet';
import { ROUTINE } from '../../data/routine';
import { DAY_MODE_LABEL, EXTRA_LABEL, extraTitle, type DayMode, type Extra, type ExtraKind } from '../../domain/days';
import { addDays, formatShort, mondayOf, todayKey, weekdayOf } from '../../domain/dates';
import { programPosition, sessionForDate } from '../../domain/program';
import { canMakeUp, suggestReduced } from '../../domain/progress';
import { buildDay, type ScheduleItem } from '../../domain/schedule';
import { PHASE_LABEL, SESSION_LABEL, WEEKDAY_LABEL, type SessionId } from '../../domain/types';
import { needsBackupReminder, requestPersistence } from '../../storage/backup';
import { addWater, getDoneIds, listBody, getSession, getSetting, getWater, getWellness, saveWellness, setSetting, toggleCheck, type WellnessRec } from '../../storage/db';
import { Banner } from '../components/Banner';
import { CheckItem } from '../components/CheckItem';
import { Scale } from '../components/Scale';
import { dayModeKey, dayTimesKey, extrasKey, loadSettings, saturdayCourtKey, volleyKey, type AppSettings } from '../settings';
import { loadDayContext, type DayContext } from '../dayContext';
import { WATER_GOAL, withTracking } from '../compliance';


interface State {
  settings: AppSettings;
  items: ScheduleItem[];
  done: Set<string>;
  water: number;
  wellness?: WellnessRec;
  sessionDone: boolean;
  court: boolean;
  backup: boolean;
  noticesSeen: boolean;
  makeUps: Array<{ date: string; sessionId: SessionId }>;
  weighedToday: boolean;
  ctx: DayContext;
}

async function load(date: string): Promise<State> {
  const settings = await loadSettings(date);
  const ctx = await loadDayContext(date, settings);
  const court = ctx.saturdayCourt;
  const items = buildDay(date, ctx);
  const makeUps: State['makeUps'] = [];
  for (let d = mondayOf(date); d < date; d = addDays(d, 1)) {
    if (d < settings.startDate || (await loadDayContext(d, settings)).paused) continue;
    const sid = sessionForDate(d);
    if (sid && canMakeUp(sid, d, date) && !(await getSession(d))?.completedAt) makeUps.push({ date: d, sessionId: sid });
  }
  return {
    settings, items, court, makeUps, ctx,
    done: await getDoneIds(date),
    water: await getWater(date),
    wellness: await getWellness(date),
    sessionDone: !!(await getSession(date))?.completedAt,
    backup: await needsBackupReminder(new Date()),
    noticesSeen: await getSetting('noticesSeen', false),
    weighedToday: (await listBody()).some((b) => b.date === date && b.weightKg !== undefined),
  };
}

export function Hoje({ date: dateProp }: { date?: string } = {}) {
  const [today, setToday] = useState(todayKey());
  const date = dateProp ?? today;
  const [s, setS] = useState<State | null>(null);
  const [draft, setDraft] = useState<Partial<WellnessRec>>({});
  const reload = () => load(date).then(setS);

  useEffect(() => { void requestPersistence(); }, []);
  useEffect(() => {
    // O app pode ficar aberto de um dia para o outro: confere a data ao voltar e a cada minuto.
    const refresh = () => setToday(todayKey());
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    const id = setInterval(refresh, 60_000);
    return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); clearInterval(id); };
  }, []);
  useEffect(() => { void reload(); }, [date]);
  if (!s) return <section class="screen"><h1>Hoje</h1><p class="muted">Carregando…</p></section>;

  const pos = programPosition(date, s.settings.startDate, s.settings.pauses);
  const { trackable, done, pct } = withTracking(s.items, s.done, { water: s.water, wellness: !!s.wellness, sessionDone: s.sessionDone });
  const doneCount = trackable.filter((i) => done.has(i.id)).length;
  const plyoDay = s.items.some((i) => i.sessionId === 'inferiorA' || i.sessionId === 'inferiorB');
  const reduced = suggestReduced(s.wellness) || (s.ctx.gameNear && plyoDay);
  const livre = s.ctx.dayMode !== 'normal';
  const weekdayVolleys = ROUTINE[dietDayType(date)].filter((e) => e.kind === 'volley');
  const setMode = async (m: DayMode) => { await setSetting(dayModeKey(date), m); await reload(); };
  const setVolley = async (id: string, on: boolean) => { await setSetting(volleyKey(date), { ...s.ctx.volleyOn, [id]: on }); await reload(); };
  const saveExtras = async (list: Extra[]) => { await setSetting(extrasKey(date), list); await reload(); };
  const saveDayTimes = async (t: Record<string, string>) => { await setSetting(dayTimesKey(date), t); await reload(); };
  const isSaturday = weekdayOf(date) === 6;

  const toggle = async (id: string) => { await toggleCheck(date, id); await reload(); };
  const water = async (ml: number) => { await addWater(date, ml); await reload(); };
  const saveW = async () => {
    const w = { date, sono: draft.sono ?? 3, joelho: draft.joelho ?? 1, ombro: draft.ombro ?? 1, disposicao: draft.disposicao ?? 3 };
    await saveWellness(w);
    await reload();
  };

  return (
    <section class="screen">
      <h1>Hoje <span class="muted small">{WEEKDAY_LABEL[weekdayOf(date)]} {formatShort(date)}</span></h1>
      <div class="row spread">
        <span class="chip">{`Semana ${pos.week} · ${PHASE_LABEL[pos.phase]}`}</span>
        {!pos.started && <span class="small muted">Programa começa em {formatShort(pos.startsOn)}</span>}
        {pos.paused && <span class="chip">⏸ Programa pausado</span>}
      </div>

      <div role="radiogroup" aria-label="Tipo do dia" class="row" style="gap:6px;margin:10px 0;flex-wrap:wrap">
        {(['normal', 'folga', 'ferias'] as DayMode[]).map((m) => (
          <label key={m} class={s.ctx.dayMode === m ? 'chip current-mode' : 'chip'} style="cursor:pointer;padding:6px 12px">
            <input type="radio" name="tipo-dia" checked={s.ctx.dayMode === m} onChange={() => setMode(m)} style="margin-right:6px" />
            {DAY_MODE_LABEL[m]}
          </label>
        ))}
      </div>

      {!s.noticesSeen && (
        <Banner tone="info">
          {DIET_NOTICES.map((n) => <p key={n} style="margin:4px 0">{n}</p>)}
          <button class="btn small" onClick={async () => { await setSetting('noticesSeen', true); await reload(); }}>Entendi</button>
        </Banner>
      )}
      {s.backup && (
        <Banner>Faça um backup dos seus registros (o navegador pode apagar dados de apps sem uso). <a href="#/ajustes">Fazer backup</a></Banner>
      )}

      <div class="card">
        <div class="row spread small"><span>{`${doneCount} de ${trackable.length} feitos`}</span><span>{pct}%</span></div>
        <div class="progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      </div>

      {weekdayOf(date) === 1 && !s.weighedToday && (
        <Banner tone="info">
          Dia de pesar: em jejum, depois do banheiro. <a href="#/evolucao">Registrar peso</a>
          {Number(date.slice(8)) <= 7 && <> · 1ª segunda do mês: medidas e teste de salto.</>}
        </Banner>
      )}

      {s.makeUps.map((m) => (
        <Banner key={m.date} tone="info">
          Treino perdido em {formatShort(m.date)}. <a href={`#/treino/${m.date}`}>{`Repor hoje: ${SESSION_LABEL[m.sessionId]}`}</a>
        </Banner>
      ))}

      {livre && weekdayVolleys.map((v) => (
        <label class="card row spread" key={v.id}>
          <span>{`Teve vôlei hoje? (${v.title})`}</span>
          <input type="checkbox" checked={s.ctx.volleyOn?.[v.id] !== false} onChange={() => setVolley(v.id, s.ctx.volleyOn?.[v.id] === false)} />
        </label>
      ))}

      {isSaturday && !livre && (
        <label class="card row spread">
          <span>Tem quadra hoje?</span>
          <input type="checkbox" checked={s.court} onChange={async () => { await setSetting(saturdayCourtKey(date), !s.court); await reload(); }} />
        </label>
      )}

      <div class="list">
        {s.items.map((item) =>
          item.kind === 'training' ? (
            <div class={done.has('treino') ? 'check-item done' : 'check-item'} key={item.id}>
              <input type="checkbox" aria-label={`Marcar treino feito: ${item.title}`} checked={done.has('treino')} onChange={() => toggle('treino')} />
              <span class="time">{item.time}</span>
              <a class="title" href={`#/treino/${date}`}>▶ {item.title}</a>
            </div>
          ) : (
            <CheckItem key={item.id} item={item} done={done.has(item.id)} onToggle={() => toggle(item.id)} options={item.mealId ? MEALS[item.mealId]?.options : undefined} />
          ),
        )}
      </div>

      <ExtrasEditor extras={s.ctx.extras} onSave={saveExtras} />
      <DayTimesEditor items={s.items} dayTimes={s.ctx.dayTimes ?? {}} onSave={saveDayTimes} />

      <div class="card">
        <div class="row spread">
          <span>💧 Água <strong>{`${(s.water / 1000).toLocaleString('pt-BR')} / ${(WATER_GOAL / 1000).toLocaleString('pt-BR')} L`}</strong></span>
          <span class="row">
            <button class="btn secondary small" aria-label="Tirar 500 ml" onClick={() => water(-500)} disabled={s.water <= 0}>−</button>
            <button class="btn small" onClick={() => water(500)}>+ 500 ml</button>
          </span>
        </div>
        <div class="progress" aria-hidden="true"><span style={{ width: `${Math.min(100, (s.water / WATER_GOAL) * 100)}%`, background: 'var(--accent-2)' }} /></div>
      </div>
      {reduced && (
        <Banner>Sugestão: versão reduzida do treino hoje (sem saltos, uma série a menos){s.ctx.gameNear ? ' — teve jogo hoje ou ontem' : ''}. Ela aparece ao abrir o treino.</Banner>
      )}
      {!s.wellness && (
        <div class="card">
          <h2 style="margin-top:0">Como você está hoje? <span class="muted small">(10 segundos)</span></h2>
          <Scale label="Sono" value={draft.sono} onChange={(v) => setDraft({ ...draft, sono: v })} />
          <Scale label="Dor no joelho" value={draft.joelho} onChange={(v) => setDraft({ ...draft, joelho: v })} />
          <Scale label="Dor no ombro" value={draft.ombro} onChange={(v) => setDraft({ ...draft, ombro: v })} />
          <Scale label="Disposição" value={draft.disposicao} onChange={(v) => setDraft({ ...draft, disposicao: v })} />
          <p class="small muted">Sono e disposição: 1 = péssimo, 5 = ótimo. Dor: 1 = nenhuma, 5 = muita.</p>
          <button class="btn" onClick={saveW}>Salvar bem-estar</button>
        </div>
      )}

    </section>
  );
}

const KINDS = Object.keys(EXTRA_LABEL) as ExtraKind[];

function ExtrasEditor({ extras, onSave }: { extras: Extra[]; onSave: (l: Extra[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ kind: 'jogo' as ExtraKind, time: '', durationMin: '', note: '', name: '' });
  const save = async () => {
    if (!/^\d{2}:\d{2}$/.test(f.time)) return;
    const x: Extra = { id: Date.now().toString(36), kind: f.kind, time: f.time };
    const dur = parseInt(f.durationMin, 10);
    if (dur > 0) x.durationMin = dur;
    if (f.note.trim()) x.note = f.note.trim();
    if (f.kind === 'outra' && f.name.trim()) x.name = f.name.trim();
    await onSave([...extras, x]);
    setF({ kind: 'jogo', time: '', durationMin: '', note: '', name: '' });
    setOpen(false);
  };
  return (
    <div class="card">
      {extras.length > 0 && (
        <ul class="small" style="list-style:none;padding:0;margin:0 0 8px">
          {extras.map((x) => (
            <li key={x.id} class="row spread" style="margin:4px 0">
              <span>{`⭐ ${x.time} · ${extraTitle(x)}`}</span>
              <button class="btn secondary small" aria-label={`Remover ${extraTitle(x)} ${x.time}`} onClick={() => onSave(extras.filter((e) => e.id !== x.id))}>Remover</button>
            </li>
          ))}
        </ul>
      )}
      {!open ? (
        <button class="btn secondary" onClick={() => setOpen(true)}>+ Atividade extra</button>
      ) : (
        <div class="grid2">
          <label class="small">Tipo de atividade
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: (e.target as HTMLSelectElement).value as ExtraKind })}>
              {KINDS.map((k) => <option key={k} value={k}>{EXTRA_LABEL[k]}</option>)}
            </select>
          </label>
          {f.kind === 'outra' && (
            <label class="small">Qual atividade?<input type="text" value={f.name} placeholder="ex.: funcional, bike, trilha" onInput={(e) => setF({ ...f, name: (e.target as HTMLInputElement).value })} /></label>
          )}
          <label class="small">Horário da atividade<input type="time" value={f.time} onInput={(e) => setF({ ...f, time: (e.target as HTMLInputElement).value })} /></label>
          <label class="small">Duração (min)<input type="text" inputMode="numeric" value={f.durationMin} onInput={(e) => setF({ ...f, durationMin: (e.target as HTMLInputElement).value })} /></label>
          <label class="small">Observação<input type="text" value={f.note} onInput={(e) => setF({ ...f, note: (e.target as HTMLInputElement).value })} /></label>
          <button class="btn" onClick={save}>Salvar atividade</button>
          <button class="btn secondary" onClick={() => setOpen(false)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

function DayTimesEditor({ items, dayTimes, onSave }: { items: ScheduleItem[]; dayTimes: Record<string, string>; onSave: (t: Record<string, string>) => Promise<void> }) {
  const [t, setT] = useState<Record<string, string>>(dayTimes);
  const editable = items.filter((i) => i.kind !== 'supplement');
  return (
    <details class="card">
      <summary>Horários de hoje</summary>
      <p class="small muted">Muda só a data de hoje (ex.: treinei às 18h). A rotina fixa fica em Ajustes.</p>
      {editable.map((i) => (
        <label key={i.id} class="row spread" style="margin-top:6px">
          <span class="small">{i.title}</span>
          <input type="time" style="width:120px" aria-label={`Horário hoje: ${i.title}`} value={t[i.id] ?? i.time}
            onInput={(e) => setT({ ...t, [i.id]: (e.target as HTMLInputElement).value })} />
        </label>
      ))}
      <button class="btn secondary" style="margin-top:8px" onClick={() => onSave(Object.fromEntries(Object.entries(t).filter(([, v]) => /^\d{2}:\d{2}$/.test(v))))}>Salvar horários de hoje</button>
    </details>
  );
}
