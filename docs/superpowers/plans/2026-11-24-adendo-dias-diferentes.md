# Adendo — Dias diferentes, atividades extras e pausa — Plano

> Executado em linha (executing-plans), mesmo branch. Spec: §12 de `docs/superpowers/specs/2026-11-24-app-treino-dieta-volei-design.md`.

**Armazenamento:** tudo em `settings` (sem migração de banco; entra no backup):
`dayMode:<data>` = 'normal'|'folga'|'ferias' · `vacations` = {from,to}[] · `volley:<data>:<id>` = boolean ·
`dayTimes:<data>` = Record<id,hora> · `extras:<data>` = Extra[] · `pauses` = {from, to?}[].

### Task A: domínio
- `src/domain/days.ts`: `type DayMode`; `dayModeFor(date, explicit?, vacations)`; `interface Extra { id; kind: 'volei-quadra'|'volei-areia'|'jogo'|'academia'|'cardio'|'outra'; time; durationMin?; note? }`; `EXTRA_LABEL`; `hasGame(extras)`.
- `programPosition(date, start, pauses = [])`: dias pausados (entre início e data) não contam; retorna também `paused: boolean`.
- `buildDay(date, settings)` aceita `dayMode`, `volleyOn`, `dayTimes`, `extras`, `paused`:
  folga/férias → rotina `livre` + treino do dia (09:30) + vôlei do dia (se `volleyOn[id] !== false`); refeição livre no jantar de sáb/dom;
  extras viram itens (`extra-<id>`, kind 'volley' para vôlei/jogo, 'extra' para os demais); `dayTimes` vale só para a data;
  `paused` remove o treino de academia (mobilidade/cardio também). Carbo de gasto alto se houver vôlei ativo ou extra de vôlei/jogo.
- Testes: `tests/domain/days.test.ts` (modos, férias, pausa, folga de terça com e sem vôlei, extras, carbo, horários por data).

### Task B: telas
- Hoje: seletor do tipo do dia; "Teve vôlei hoje?" em folga/férias; "+ Atividade extra" (form + remover); "Horários de hoje";
  chip "Programa pausado"; banner de versão reduzida quando há jogo hoje/ontem e o treino tem saltos.
- Treino: versão reduzida padrão também quando há jogo hoje ou ontem.
- Ajustes: períodos de férias (adicionar/remover); Pausar/Retomar programa.
- Semana: mostra "Folga"/"Férias" e extras do dia.
- `loadDay(date)` em `src/ui/dayContext.ts` monta os ajustes do dia (usado por Hoje, Semana, Evolução, compliance).
- Testes em `tests/ui/dias.test.tsx`.
