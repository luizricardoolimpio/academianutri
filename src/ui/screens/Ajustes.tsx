import { useEffect, useState } from 'preact/hooks';
import { DIET_DAY_LABEL, type DietDayType } from '../../data/diet';
import { ROUTINE } from '../../data/routine';
import { SUPPLEMENTS } from '../../data/supplements';
import { formatShort, todayKey } from '../../domain/dates';
import { exportCsv, importBackup, saveBackupNow, shareOrDownload } from '../../storage/backup';
import { getSetting, setSetting } from '../../storage/db';
import { Banner } from '../components/Banner';
import { loadSettings, type AppSettings } from '../settings';

const TYPES = Object.keys(DIET_DAY_LABEL) as DietDayType[];

export function Ajustes() {
  const today = todayKey();
  const [s, setS] = useState<AppSettings | null>(null);
  const [start, setStart] = useState('');
  const [type, setType] = useState<DietDayType>('academiaAlmoco');
  const [times, setTimes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const reload = async () => {
    const st = await loadSettings(today);
    setS(st);
    setStart(st.startDate);
    setTimes(st.timeOverrides);
    setLastBackup(await getSetting<string | null>('lastBackupAt', null));
  };
  useEffect(() => { void reload(); }, []);
  if (!s) return <section class="screen"><h1>Ajustes</h1><p class="muted">Carregando…</p></section>;

  const toggleSupp = async (id: string) => {
    const next = s.enabledSupplements.includes(id) ? s.enabledSupplements.filter((x) => x !== id) : [...s.enabledSupplements, id];
    await setSetting('enabledSupplements', next);
    await reload();
  };
  const saveTimes = async () => {
    const clean = Object.fromEntries(Object.entries(times).filter(([, v]) => /^\d{2}:\d{2}$/.test(v)));
    await setSetting('timeOverrides', clean);
    setMsg({ ok: true, text: 'Horários salvos.' });
    await reload();
  };
  const backup = async () => {
    try {
      await saveBackupNow();
      setMsg({ ok: true, text: 'Backup gerado. No celular, escolha "Salvar no Drive" na tela de compartilhar.' });
      await reload();
    } catch {
      setMsg({ ok: false, text: 'Backup cancelado.' });
    }
  };
  const restore = async (file: File | undefined) => {
    if (!file) return;
    if (!window.confirm('Restaurar substitui todos os registros atuais pelos do arquivo. Continuar?')) return;
    const r = await importBackup(file);
    setMsg(r.ok ? { ok: true, text: 'Backup restaurado.' } : { ok: false, text: r.error });
    await reload();
  };

  return (
    <section class="screen">
      <h1>Ajustes</h1>
      {msg && (msg.ok ? <Banner tone="info">{msg.text}</Banner> : <div class="banner" role="alert">{msg.text}</div>)}

      <h2>Backup</h2>
      <div class="card">
        <p class="small" style="margin-top:0">Seus registros ficam só neste celular. {lastBackup ? `Último backup: ${formatShort(lastBackup)}.` : 'Nenhum backup ainda.'}</p>
        <div class="row" style="flex-wrap:wrap">
          <button class="btn" onClick={backup}>💾 Salvar backup</button>
          <button class="btn secondary" onClick={async () => shareOrDownload(new Blob([await exportCsv()], { type: 'text/csv' }), `treino-volei-${today}.csv`)}>Exportar planilha (CSV)</button>
        </div>
        <label class="small" style="display:block;margin-top:10px">Restaurar backup
          <input type="file" accept="application/json,.json" onChange={(e) => restore((e.target as HTMLInputElement).files?.[0])} />
        </label>
      </div>

      <h2>Programa</h2>
      <div class="card grid2">
        <label>Início do programa<input type="date" value={start} onInput={(e) => setStart((e.target as HTMLInputElement).value)} /></label>
        <button class="btn secondary" style="align-self:end" onClick={async () => { if (/^\d{4}-\d{2}-\d{2}$/.test(start)) { await setSetting('startDate', start); await reload(); setMsg({ ok: true, text: 'Início salvo.' }); } }}>Salvar início</button>
      </div>

      <h2>Suplementos</h2>
      <div class="list">
        {SUPPLEMENTS.map((sp) => (
          <label class="check-item" key={sp.id}>
            <input type="checkbox" checked={s.enabledSupplements.includes(sp.id)} onChange={() => toggleSupp(sp.id)} />
            <span class="title">{sp.name} <span class="muted small">· {sp.dose}</span></span>
          </label>
        ))}
      </div>

      <h2>Horários</h2>
      <div class="card">
        <label>Tipo de dia
          <select value={type} onChange={(e) => setType((e.target as HTMLSelectElement).value as DietDayType)}>
            {TYPES.map((t) => <option key={t} value={t}>{DIET_DAY_LABEL[t]}</option>)}
          </select>
        </label>
        {ROUTINE[type].map((e) => (
          <label key={e.id} class="row spread" style="margin-top:8px">
            <span class="small">{e.title}</span>
            <input type="time" style="width:120px" aria-label={`Horário: ${e.title}`} value={times[`${type}:${e.id}`] ?? e.time}
              onInput={(ev) => setTimes({ ...times, [`${type}:${e.id}`]: (ev.target as HTMLInputElement).value })} />
          </label>
        ))}
        <button class="btn secondary" style="margin-top:10px" onClick={saveTimes}>Salvar horários</button>
      </div>

      <h2>Instalar no celular</h2>
      <div class="card small">
        <p style="margin-top:0"><strong>Android (Chrome):</strong> menu ⋮ → "Adicionar à tela inicial" / "Instalar app".</p>
        <p style="margin-bottom:0"><strong>iPhone (Safari):</strong> botão Compartilhar → "Adicionar à Tela de Início".</p>
      </div>
    </section>
  );
}
