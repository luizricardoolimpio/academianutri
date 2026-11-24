import { CARB_GRAMS, CARB_SOURCES, DIET_DAY_LABEL, DIET_NOTICES, DIET_RULES, MEAL_PREP, MEALS, dietDayType } from '../../data/diet';
import { ROUTINE } from '../../data/routine';
import { SUPPLEMENTS } from '../../data/supplements';
import { formatShort, todayKey, weekdayOf } from '../../domain/dates';
import { WEEKDAY_LABEL } from '../../domain/types';
import { Banner } from '../components/Banner';

export function Dieta({ date: dateProp }: { date?: string } = {}) {
  const date = dateProp ?? todayKey();
  const type = dietDayType(date);
  const carbs = CARB_GRAMS[type];
  const meals = ROUTINE[type].filter((e) => e.kind === 'meal');
  return (
    <section class="screen">
      <h1>Dieta</h1>
      <p class="small muted">{WEEKDAY_LABEL[weekdayOf(date)]} {formatShort(date)} — {DIET_DAY_LABEL[type]}</p>
      <div class="card">
        <strong>Carboidrato hoje</strong>
        <p style="margin:6px 0">{`Almoço: ${carbs.almoco} g`} · {carbs.jantar === 'livre' ? 'Jantar: refeição livre' : `Jantar: ${carbs.jantar} g`}</p>
        <p class="small muted" style="margin:0">Fontes: {CARB_SOURCES}.</p>
      </div>

      {meals.map((e) => {
        const meal = MEALS[e.mealId!];
        return (
          <details class="card" key={e.id} open={e.id === 'almoco'}>
            <summary><strong>{e.time}</strong> · {e.title}</summary>
            <ul class="small">{meal.options.map((o) => <li key={o}>{o}</li>)}</ul>
          </details>
        );
      })}

      <h2>Suplementos</h2>
      <ul class="card small" style="padding-left:28px">
        {SUPPLEMENTS.map((s) => (
          <li key={s.id}><strong>{s.name}</strong> — {s.dose}{s.enabledByDefault ? '' : ' (desligado — ative em Ajustes se voltar a tomar)'}</li>
        ))}
      </ul>

      <h2>Preparo das marmitas (domingo)</h2>
      <ul class="card small" style="padding-left:28px">{MEAL_PREP.map((m) => <li key={m}>{m}</li>)}</ul>

      <h2>Regras gerais</h2>
      <ul class="card small" style="padding-left:28px">{DIET_RULES.map((r) => <li key={r}>{r}</li>)}</ul>

      {DIET_NOTICES.map((n) => <Banner key={n} tone="info">{n}</Banner>)}
    </section>
  );
}
