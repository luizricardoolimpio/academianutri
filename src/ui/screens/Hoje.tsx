import { useEffect, useState } from 'preact/hooks';
import { DIET_NOTICES, MEALS } from '../../data/diet';
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
import { loadSettings, saturdayCourtKey, type AppSettings } from '../settings';
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
}

async function load(date: string): Promise<State> {
  const settings = await loadSettings(date);
  const court = await getSetting(saturdayCourtKey(date), true);
  const items = buildDay(date, { enabledSupplements: settings.enabledSupplements, saturdayCourt: court, timeOverrides: settings.timeOverrides });
  const makeUps: State['makeUps'] = [];
  for (let d = mondayOf(date); d < date; d = addDays(d, 1)) {
    if (d < settings.startDate) continue;
    const sid = sessionForDate(d);
    if (sid && canMakeUp(sid, d, date) && !(await getSession(d))?.completedAt) makeUps.push({ date: d, sessionId: sid });
  }
  return {
    settings, items, court, makeUps,
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

  const pos = programPosition(date, s.settings.startDate);
  const { trackable, done, pct } = withTracking(s.items, s.done, { water: s.water, wellness: !!s.wellness, sessionDone: s.sessionDone });
  const doneCount = trackable.filter((i) => done.has(i.id)).length;
  const reduced = suggestReduced(s.wellness);
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

      {isSaturday && (
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
      {!s.wellness ? (
        <div class="card">
          <h2 style="margin-top:0">Como você está hoje? <span class="muted small">(10 segundos)</span></h2>
          <Scale label="Sono" value={draft.sono} onChange={(v) => setDraft({ ...draft, sono: v })} />
          <Scale label="Dor no joelho" value={draft.joelho} onChange={(v) => setDraft({ ...draft, joelho: v })} />
          <Scale label="Dor no ombro" value={draft.ombro} onChange={(v) => setDraft({ ...draft, ombro: v })} />
          <Scale label="Disposição" value={draft.disposicao} onChange={(v) => setDraft({ ...draft, disposicao: v })} />
          <p class="small muted">Sono e disposição: 1 = péssimo, 5 = ótimo. Dor: 1 = nenhuma, 5 = muita.</p>
          <button class="btn" onClick={saveW}>Salvar bem-estar</button>
        </div>
      ) : reduced ? (
        <Banner>Sugestão: versão reduzida do treino hoje (sem saltos, uma série a menos). Ela aparece ao abrir o treino.</Banner>
      ) : null}

    </section>
  );
}
