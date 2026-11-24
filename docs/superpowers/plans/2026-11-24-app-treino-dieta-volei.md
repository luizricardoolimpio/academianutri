# App de Treino, Dieta e Vôlei — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA offline, de um único usuário, que mostra o dia (treino, vôlei, refeições, suplementos), guia a execução do treino com vídeo, registra com um toque e mostra a evolução.

**Architecture:** Site estático (Vite + Preact + TypeScript) com service worker. O plano (exercícios, programa, dieta, rotina) é conteúdo versionado em `src/data/`. A lógica pura fica em `src/domain/` e é testada sem navegador. Os registros ficam em IndexedDB no celular, com backup em arquivo JSON compartilhado para o Google Drive. Os lembretes são eventos recorrentes no Google Calendar.

**Tech Stack:** Node 22, Vite 5, Preact 10, TypeScript 5, `idb` 8, `vite-plugin-pwa` 0.20, Vitest 2 + `@testing-library/preact` + jsdom + `fake-indexeddb`, Playwright pré-instalado (`require('playwright')`, sem instalar outro), Python 3 + `pdfplumber` (já instalado) para extrair os PDFs. Deploy no GitHub Pages via GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-24-app-treino-dieta-volei-design.md`

## Global Constraints

- Toda a interface em **português do Brasil**; identificadores de código em inglês.
- Funciona **offline** depois da primeira abertura; nenhum recurso essencial depende de rede (vídeo do YouTube e imagens remotas são os únicos itens que exigem rede).
- **Sem servidor, sem login, sem conta nova.** Custo zero.
- Vite `base: '/academianutri/'`; rotas por hash (`#/hoje`, `#/treino/:date`, `#/semana`, `#/treinos`, `#/treinos/:exerciseId`, `#/dieta`, `#/evolucao`, `#/ajustes`).
- **Datas sempre locais** no formato `YYYY-MM-DD` gerado por `toLocalDateKey(d: Date)`; nunca `toISOString()` para chave de dia (Brasil é UTC−3).
- Registrar um item = **1 toque**; nenhuma digitação obrigatória para marcar algo como feito.
- Pliometria só em **Inferior A (seg)** e **Inferior B (qui)**. Exercícios principais com **2–3 repetições na reserva**; nenhuma prescrição "0–1 na reserva" ou "até a falha".
- Ciclo de **12 semanas**: semanas 1–4 `base`, 5–8 `forca`, 9–11 `potencia`, 12 `descarga` (séries −50%, sem pliometria de profundidade); depois recomeça.
- Data de início padrão: **segunda-feira seguinte** à primeira abertura; editável.
- Grade fixa: seg `inferiorA` 11h30 · ter `mobilidade` + vôlei quadra 20h–22h30 · qua `superiorA` 11h45 + areia 21h–22h · qui `inferiorB` 11h30 · sex `superiorB` 11h30 · sáb areia 11h–13h + quadra (interruptor) · dom `cardio` 9h.
- Dieta: carbo **nunca zero**. Gasto alto (ter, qua, sáb): almoço **100 g**, jantar **70 g**. Academia no almoço (seg, qui, sex): almoço **70 g**, jantar **50 g**. Domingo: almoço **70 g**. Refeições livres: **sábado e domingo à noite**.
- Suplementos ligados: Stimerex (no café, **nunca após 14h**), creatina (2 doses), ômega 3 (2 caps almoço + 1 jantar), polivitamínico (após almoço), whey. **Glutamina e psyllium cadastrados, desligados.**
- Avisos fixos no app: carbo/refeições livres adaptados a pedido (mostrar à nutricionista); termogênico tem estimulantes (combinar com o médico).
- Água: meta **3,5 L**, botão soma **500 ml**.
- Os PDFs da SalteMais **não** vão para o repositório (pasta `fontes/` no `.gitignore`).

## Review Focus

1. **Registro perto da meia-noite** (ex.: pós-vôlei às 22h45, 23h30) — deve contar no dia local, não no dia seguinte em UTC. Teste em Task 2.
2. **Data antes do início do programa e depois da semana 12** — antes: tela mostra "Programa começa em DD/MM" e a semana 1 como prévia; depois: ciclo 2 semana 1. Teste em Task 2.
3. **Restaurar backup corrompido, de outra versão ou vazio** — não pode apagar os dados atuais; mostra erro. Teste em Task 6.
4. **Exercício sem carga anterior e carga digitada com vírgula ("22,5")** — campo vazio (não "0"/"NaN"); "22,5" vira 22.5. Teste em Task 6 e Task 8.
5. **Navegador apagando os dados** (iOS limpa PWA sem uso) — pedir armazenamento persistente e mostrar aviso de backup quando nunca houve backup e já existem registros, ou após 7 dias. Teste em Task 6.

---

## File Structure

```
package.json · vite.config.ts · tsconfig.json · index.html · .gitignore
.github/workflows/deploy.yml
public/icons/icon-192.png · icon-512.png · maskable-512.png
scripts/extract_saltemais.py          # PDF → JSON (nomes, prescrições, links)
scripts/test_extract_saltemais.py
fontes/                               # PDFs baixados (ignorado pelo git)
src/
  main.tsx · app.tsx                  # boot, roteador por hash, barra de abas
  domain/
    types.ts                          # tipos compartilhados (Task 2)
    dates.ts                          # toLocalDateKey, weekday, addDays (Task 2)
    program.ts                        # posição no ciclo, sessão do dia, versão reduzida (Task 2/4)
    schedule.ts                       # linha do tempo do dia (Task 5)
    progress.ts                       # cumprimento, última carga, reposição (Task 6)
  data/
    saltemais.json                    # gerado pela Task 3
    exercises.ts · program.ts         # Task 4
    diet.ts · supplements.ts · routine.ts   # Task 5
  storage/
    db.ts · backup.ts                 # Task 6
  ui/
    components/ CheckItem.tsx · RestTimer.tsx · LineChart.tsx · Banner.tsx
    screens/ Hoje.tsx · Treino.tsx · Semana.tsx · Treinos.tsx · Exercicio.tsx · Dieta.tsx · Evolucao.tsx · Ajustes.tsx
tests/                                # Vitest, espelha src/
e2e/smoke.mjs                         # Playwright em viewport de celular
docs/pesquisa/apps-similares.md · artigos.md
```

---

### Task 1: Esqueleto do app, abas e deploy

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/app.tsx`, `.github/workflows/deploy.yml`, `public/icons/*`
- Test: `tests/app.test.tsx`

**Interfaces:**
- Produces: `App` (componente raiz); `useRoute(): { path: string; params: Record<string,string> }`; `navigate(hash: string): void`. Abas na ordem: Hoje, Semana, Treinos, Dieta, Evolução (Ajustes por ícone no topo).

- [ ] **Step 1: Criar projeto** — `npm create vite@5` (template `preact-ts`) na raiz do repo; adicionar `idb`, `vite-plugin-pwa`, `vitest`, `jsdom`, `@testing-library/preact`, `fake-indexeddb`. Scripts: `dev`, `build`, `test` (`vitest run`), `e2e` (`node e2e/smoke.mjs`). `.gitignore`: `node_modules`, `dist`, `fontes/`.
- [ ] **Step 2: Teste que falha**

```tsx
test('mostra as cinco abas e abre Hoje por padrão', () => {
  render(<App />);
  for (const t of ['Hoje','Semana','Treinos','Dieta','Evolução'])
    expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Hoje/);
});
test('hash #/dieta abre a tela Dieta', async () => {
  location.hash = '#/dieta'; render(<App />);
  expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Dieta');
});
```

- [ ] **Step 3: Rodar** `npm test` → FAIL.
- [ ] **Step 4: Implementar** `App`, `useRoute`, `navigate` e telas-placeholder com `<h1>`. `vite.config.ts`: `base: '/academianutri/'`, `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'Treino & Dieta — Vôlei', short_name: 'TreinoVôlei', lang: 'pt-BR', display: 'standalone', theme_color, icons }, workbox: { globPatterns: ['**/*.{js,css,html,png,svg,json}'], runtimeCaching: imagens de raw.githubusercontent.com com CacheFirst } })`. Ícones gerados (bola de vôlei estilizada, simples).
- [ ] **Step 5: Rodar** `npm test` → PASS; `npm run build` → sem erros, `dist/sw.js` existe.
- [ ] **Step 6: Workflow** `deploy.yml`: em `push` para `main` e `workflow_dispatch`: `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`.
- [ ] **Step 7: Commit** `feat: esqueleto PWA com abas e deploy`

---

### Task 2: Datas, tipos e posição no programa

**Files:**
- Create: `src/domain/types.ts`, `src/domain/dates.ts`, `src/domain/program.ts`
- Test: `tests/domain/dates.test.ts`, `tests/domain/program.test.ts`

**Interfaces:**
- Produces:
  - `type Phase = 'base'|'forca'|'potencia'|'descarga'`
  - `type SessionId = 'inferiorA'|'superiorA'|'inferiorB'|'superiorB'|'mobilidade'|'cardio'`
  - `type Weekday = 0|1|2|3|4|5|6` (0 = domingo)
  - `toLocalDateKey(d: Date): string`, `fromDateKey(k: string): Date`, `weekdayOf(k: string): Weekday`, `addDays(k: string, n: number): string`, `nextMonday(k: string): string`
  - `programPosition(dateKey: string, startKey: string): { started: boolean; startsOn: string; cycle: number; week: number /*1–12*/; phase: Phase }`
  - `WEEK_GRID: Record<Weekday, SessionId | null>` = `{0:'cardio',1:'inferiorA',2:'mobilidade',3:'superiorA',4:'inferiorB',5:'superiorB',6:null}`
  - `sessionForDate(dateKey: string): SessionId | null`

- [ ] **Step 1: Testes que falham**

```ts
test('chave local não pula de dia às 23h30 em UTC-3', () => {
  process.env.TZ = 'America/Sao_Paulo';
  expect(toLocalDateKey(new Date(2026, 10, 24, 23, 30))).toBe('2026-11-24');
});
test('próxima segunda a partir de terça 24/11/2026', () =>
  expect(nextMonday('2026-11-24')).toBe('2026-11-30'));
test.each([
  ['2026-11-30', 1, 1, 'base'], ['2026-12-27', 1, 4, 'base'], ['2026-12-28', 1, 5, 'forca'],
  ['2027-01-25', 1, 9, 'potencia'], ['2027-02-15', 1, 12, 'descarga'], ['2027-02-22', 2, 1, 'base'],
])('posição em %s', (d, cycle, week, phase) =>
  expect(programPosition(d, '2026-11-30')).toMatchObject({ started: true, cycle, week, phase }));
test('antes do início: não começou, mostra prévia da semana 1', () =>
  expect(programPosition('2026-11-25', '2026-11-30'))
    .toEqual({ started: false, startsOn: '2026-11-30', cycle: 1, week: 1, phase: 'base' }));
test('grade semanal', () => {
  expect(sessionForDate('2026-11-30')).toBe('inferiorA'); // seg
  expect(sessionForDate('2026-12-03')).toBe('inferiorB'); // qui
  expect(sessionForDate('2026-12-05')).toBeNull();        // sáb
});
```

Configurar Vitest com `env: { TZ: 'America/Sao_Paulo' }`.

- [ ] **Step 2: Rodar** `npx vitest run tests/domain` → FAIL.
- [ ] **Step 3: Implementar** as funções acima; aritmética de dias em datas locais ao meio-dia para evitar horário de verão.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat: datas locais e posição no ciclo de 12 semanas`

---

### Task 3: Extrair exercícios e vídeos dos PDFs da SalteMais

**Files:**
- Create: `scripts/extract_saltemais.py`, `scripts/test_extract_saltemais.py`, `src/data/saltemais.json`
- Fontes: pasta do Drive "Aplicativo Academia - Nutri - Voleibol" (id `1qB0F2Kv8esz8o9B0yJFRi29J6y3oqRiP`): 21 PDFs `Salto--na--Academia--Avançado*` e 9 PDFs `Fase--N-----DIA--M--Ataque Forte`.

**Interfaces:**
- Produces: `src/data/saltemais.json` = `Array<{ program: 'salto'|'ataque'; week?: number; phase?: 1|2|3; day: 1|2|3; order: number; name: string; sets: string; reps: string; notes?: string; videoUrl?: string }>`

- [ ] **Step 1: Baixar** os 30 PDFs com `mcp__Google_Drive__download_file_content` para `fontes/` (decodificar base64).
- [ ] **Step 2: Teste que falha** (`python3 -I -m pytest scripts/test_extract_saltemais.py`):

```python
def test_semana1_dia1():
    rows = extract('fontes/Salto--na--Academia--Avançado-----Semana--1-----Dia--1.pdf')
    names = [r['name'] for r in rows]
    assert names[:3] == ['ESTEIRA REVERSA', 'SHOCK PAUSE JUMPS', 'ELEVATED SPEED STEPS']
    shock = next(r for r in rows if r['name'] == 'SHOCK PAUSE JUMPS')
    assert (shock['sets'], shock['reps']) == ('4', '5')
    assert shock['videoUrl'] == 'https://youtu.be/sWTAZdXH0Fk'
def test_ataque_fase1_dia1_supino():
    rows = extract('fontes/Fase--1-----DIA--1--Ataque Forte.pdf')
    assert any(r['name'] == 'Supino Reto Barra' and r['videoUrl'] for r in rows)
```

- [ ] **Step 3: Rodar** → FAIL.
- [ ] **Step 4: Implementar** `extract(path) -> list[dict]` com `pdfplumber`: palavras com coordenadas por página; linhas de tabela = linhas com padrão `N / M`; o link de cada linha é o `page.hyperlinks` cujo retângulo cruza verticalmente a linha (o texto extraído **não** segue a ordem dos links). `main()` percorre `fontes/`, deduz `program/week/phase/day` do nome do arquivo (arquivos "Dia 1-2-3" têm três dias por página — separar pelo cabeçalho `DIA N`), grava `src/data/saltemais.json`.
- [ ] **Step 5: Rodar** → PASS. Conferir à mão 3 arquivos (S1D1, S10, Fase 3 Dia 3) contra os PDFs e anotar no commit.
- [ ] **Step 6: Commit** `feat: extração de exercícios e vídeos da SalteMais`

---

### Task 4: Biblioteca de exercícios e programa de treino

**Files:**
- Create: `src/data/exercises.ts`, `src/data/program.ts`; Modify: `src/domain/program.ts`
- Test: `tests/data/program.test.ts`

**Interfaces:**
- Consumes: `Phase`, `SessionId`, `programPosition`, `src/data/saltemais.json`.
- Produces:
  - `interface Exercise { id: string; name: string; muscles: string[]; equipment: string; videoUrl?: string; imageUrl?: string; how: string[]; mistakes: string[] }`
  - `searchVideoUrl(e: Exercise): string` → `https://www.youtube.com/results?search_query=` + nome + ` execução`
  - `EXERCISES: Record<string, Exercise>`
  - `interface Prescription { exerciseId: string; sets: number; reps: string; restSec: number; load?: string; rir?: string; notes?: string; plyoContactsPerSet?: number }`
  - `PROGRAM: Record<Exclude<SessionId,'mobilidade'|'cardio'>, Record<Phase, Prescription[]>>` e `ROUTINES: Record<'mobilidade'|'cardio', Prescription[]>`
  - `sessionPlan(sessionId: SessionId, phase: Phase, reduced: boolean): Prescription[]`
  - `plyoContacts(p: Prescription[]): number`
  - `allPrescriptions(): Prescription[]` (todas as sessões × fases + rotinas; usado nos testes)

- [ ] **Step 1: Testes que falham**

```ts
test('todo exercício referenciado existe e tem vídeo ou busca', () => {
  for (const s of allPrescriptions()) {
    const e = EXERCISES[s.exerciseId]; expect(e).toBeDefined();
    expect(e.videoUrl ?? searchVideoUrl(e)).toMatch(/^https:\/\/(youtu\.be|www\.youtube\.com)\//);
    expect(e.how.length).toBeGreaterThan(0);
  }
});
test.each([['base',40],['forca',50],['potencia',60],['descarga',20]])(
  'contatos de salto por sessão em %s ≤ %i', (phase, cap) => {
    for (const id of ['inferiorA','inferiorB'] as const)
      expect(plyoContacts(PROGRAM[id][phase])).toBeLessThanOrEqual(cap);
    for (const id of ['superiorA','superiorB'] as const)
      expect(plyoContacts(PROGRAM[id][phase])).toBe(0);
});
test('nenhuma prescrição até a falha', () => {
  for (const s of allPrescriptions()) expect(s.rir ?? '2-3').not.toMatch(/^0/);
});
test('descarga = metade das séries da potência, arredondado para cima, mín. 1', () => { /* compara ids comuns */ });
test('versão reduzida remove saltos e tira 1 série (mín. 1)', () => {
  const r = sessionPlan('inferiorA', 'forca', true);
  expect(plyoContacts(r)).toBe(0);
  expect(r[0].sets).toBe(Math.max(1, PROGRAM.inferiorA.forca.find(p => !p.plyoContactsPerSet)!.sets - 1));
});
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Escrever o conteúdo.** Seguir a tabela §6.2 do spec. Fontes por fase: `base` ← Salto semanas 1–4 (dias 1 e 3) + Ataque Fase 1; `forca` ← Salto 5–8 + Ataque Fase 1→2; `potencia` ← Salto 9–10 + Ataque Fase 3; `descarga` derivada de `potencia`. Inclui exercícios das Fichas A–D (máquinas) e prevenção (rotação externa, face pull, Y-T-W, nórdico/spanish squat, mobilidade de tornozelo) em toda sessão. Sem os "Dia 2" de sprint/campo. Sessões com ~50 min (≤ 8 exercícios + aquecimento). Vídeo: `videoUrl` da SalteMais quando existir; para os demais, vídeo em português de canal de educação física; imagem: `imageUrl` da free-exercise-db (`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<id>/0.jpg`) quando houver correspondência. `mobilidade`: 90/90 de quadril, tornozelo, torácica, gato-camelo (15 min). `cardio`: 40 min zona 2 + mobilidade.
- [ ] **Step 4: Implementar** `sessionPlan` e `plyoContacts`.
- [ ] **Step 5: Rodar** → PASS.
- [ ] **Step 6: Commit** `feat: biblioteca de exercícios e programa periodizado`

---

### Task 5: Dieta, suplementos e linha do tempo do dia

**Files:**
- Create: `src/data/diet.ts`, `src/data/supplements.ts`, `src/data/routine.ts`, `src/domain/schedule.ts`
- Test: `tests/domain/schedule.test.ts`

**Interfaces:**
- Consumes: `weekdayOf`, `sessionForDate`, `programPosition`.
- Produces:
  - `type DietDayType = 'academiaAlmoco'|'terca'|'quarta'|'sabado'|'domingo'`; `dietDayType(dateKey): DietDayType`
  - `CARB_GRAMS: Record<DietDayType, { almoco: number; jantar: number | 'livre' }>`
  - `MEALS: Record<string, { name: string; options: string[] }>` com as opções e quantidades do protocolo (café 1–5, lanche manhã, almoço rápido: marmita/shake/wrap, lanche tarde 1–4, pré-treino 1–5, pós-vôlei, jantar) e `DIET_RULES: string[]`, `DIET_NOTICES: string[]`
  - `interface Supplement { id: 'stimerex'|'creatina'|'omega3'|'polivitaminico'|'whey'|'glutamina'|'psyllium'; name: string; dose: string; enabledByDefault: boolean; notAfter?: string }`
  - `SUPPLEMENTS: Supplement[]`
  - `interface ScheduleItem { id: string; time: string /*HH:MM*/; kind: 'meal'|'supplement'|'training'|'volley'|'water'|'wellness'; title: string; detail?: string; mealId?: string; sessionId?: SessionId }`
  - `buildDay(dateKey: string, settings: { enabledSupplements: string[]; saturdayCourt: boolean; timeOverrides?: Record<string,string> }): ScheduleItem[]` (ordenado por `time`)

- [ ] **Step 1: Testes que falham**

```ts
const base = { enabledSupplements: ['stimerex','creatina','omega3','polivitaminico','whey'], saturdayCourt: true };
test('segunda: horários do spec', () => {
  const d = buildDay('2026-11-30', base).filter(i => i.kind !== 'supplement');
  expect(d.map(i => i.time)).toEqual(['06:30','09:30','11:30','12:25','14:40','17:30','19:45']);
  expect(d.find(i => i.kind === 'training')!.sessionId).toBe('inferiorA');
});
test('terça: vôlei quadra 20h e pós-vôlei 22h45', () => {
  const d = buildDay('2026-12-01', base);
  expect(d.find(i => i.kind === 'volley')).toMatchObject({ time: '20:00', title: expect.stringMatching(/Quadra/) });
  expect(d.some(i => i.time === '22:45' && i.kind === 'meal')).toBe(true);
});
test.each([['2026-12-01',100,70],['2026-12-02',100,70],['2026-12-05',100,'livre'],['2026-11-30',70,50],['2026-12-06',70,'livre']])(
  'carbo em %s', (d, a, j) => expect(CARB_GRAMS[dietDayType(d)]).toEqual({ almoco: a, jantar: j }));
test('refeição livre só sábado e domingo à noite', () => {
  const livres = ['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04','2026-12-05','2026-12-06']
    .flatMap(k => buildDay(k, base).filter(i => /livre/i.test(i.title)).map(() => weekdayOf(k)));
  expect(livres.sort()).toEqual([0, 6]);
});
test('Stimerex nunca depois das 14h e glutamina/psyllium desligados', () => {
  for (const k of ['2026-11-30','2026-12-01','2026-12-05','2026-12-06']) {
    const d = buildDay(k, base);
    for (const i of d.filter(i => i.id.startsWith('stimerex'))) expect(i.time < '14:00').toBe(true);
    expect(d.some(i => /glutamina|psyllium/i.test(i.title))).toBe(false);
  }
});
test('sábado sem quadra remove a quadra e o lanche entre jogos', () => {
  const d = buildDay('2026-12-05', { ...base, saturdayCourt: false });
  expect(d.filter(i => i.kind === 'volley')).toHaveLength(1);
});
test('creatina: duas doses por dia', () => {
  for (const k of ['2026-11-30','2026-12-05']) expect(buildDay(k, base).filter(i => i.id.startsWith('creatina'))).toHaveLength(2);
});
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Escrever o conteúdo** de `diet.ts`/`supplements.ts`/`routine.ts` a partir do spec §7 (linhas do tempo por tipo de dia, tabela de carbo, avisos fixos, regras gerais) e do Protocolo Alimentar (opções e quantidades). Doses: creatina 1 no café, 2 no pós-treino (seg/qua/qui/sex), pós-vôlei (ter) ou almoço (sáb/dom); ômega 3 2 caps no almoço + 1 no jantar; polivitamínico após o almoço; Stimerex no café.
- [ ] **Step 4: Implementar** `buildDay`, aplicando `timeOverrides` por `id` antes de ordenar.
- [ ] **Step 5: Rodar** → PASS.
- [ ] **Step 6: Commit** `feat: dieta, suplementos e linha do tempo diária`

---

### Task 6: Armazenamento, backup e cálculos de progresso

**Files:**
- Create: `src/storage/db.ts`, `src/storage/backup.ts`, `src/domain/progress.ts`
- Test: `tests/storage/db.test.ts`, `tests/storage/backup.test.ts`, `tests/domain/progress.test.ts`

**Interfaces:**
- Produces:
  - Stores IndexedDB (`openDb(): Promise<IDBPDatabase>`; nome `treino-volei`, versão 1): `checks` (key `${date}|${itemId}`, `{date,itemId,done,at}`), `sets` (`{id,date,sessionId,exerciseId,setIndex,reps?,loadKg?,at}`, índice `exerciseId`), `sessions` (`{date,sessionId,rpe?,reduced,completedAt?}`), `wellness` (`{date,sono,joelho,ombro,disposicao}` 1–5), `water` (`{date,ml}`), `body` (`{date,weightKg?,measures?: Record<string,number>}`), `jumps` (`{date,reachCm?,jumpCm?}`), `settings` (key/value: `startDate`, `enabledSupplements`, `saturdayCourt`, `timeOverrides`, `weightGoalKg`, `lastBackupAt`)
  - `toggleCheck(date, itemId): Promise<boolean>`, `isChecked(date, itemId): Promise<boolean>`, `addWater(date, ml): Promise<number>`, `saveSet(s): Promise<void>`, `getSetting<T>(k, fallback: T): Promise<T>`, `setSetting(k, v): Promise<void>`
  - `parseLoad(input: string): number | undefined` ("22,5" → 22.5; "" → undefined)
  - `lastLoad(exerciseId): Promise<{ loadKg?: number; reps?: string; date: string } | undefined>`
  - `compliance(items: ScheduleItem[], doneIds: Set<string>): number` (0–100, itens `wellness` e `water` contam como 1 item cada)
  - `canMakeUp(missed: SessionId, missedDate: string, today: string): boolean`
  - `exportBackup(): Promise<Blob>` (`{ app:'treino-volei', version:1, exportedAt, data:{...stores} }`), `importBackup(file: File): Promise<{ ok: true } | { ok: false; error: string }>`, `exportCsv(): Promise<Blob>`, `shareOrDownload(blob, filename): Promise<void>` (Web Share API com arquivo; senão download), `needsBackupReminder(now: Date): Promise<boolean>`, `requestPersistence(): Promise<boolean>`

- [ ] **Step 1: Testes que falham** (`import 'fake-indexeddb/auto'`)

```ts
test('parseLoad aceita vírgula e vazio', () => {
  expect(parseLoad('22,5')).toBe(22.5); expect(parseLoad('')).toBeUndefined(); expect(parseLoad('abc')).toBeUndefined();
});
test('lastLoad sem histórico é undefined; com histórico traz a mais recente', async () => {
  expect(await lastLoad('supino-reto')).toBeUndefined();
  await saveSet({ ...set, date: '2026-11-30', loadKg: 40 }); await saveSet({ ...set, date: '2026-12-02', loadKg: 42.5 });
  expect(await lastLoad('supino-reto')).toMatchObject({ loadKg: 42.5, date: '2026-12-02' });
});
test('toggleCheck alterna', async () => {
  expect(await toggleCheck('2026-11-30','cafe')).toBe(true); expect(await toggleCheck('2026-11-30','cafe')).toBe(false);
});
test('backup ida e volta preserva tudo', async () => { /* grava, exporta, limpa, importa, compara */ });
test.each([['{}'],['not json'],['{"app":"outro","version":1,"data":{}}'],['{"app":"treino-volei","version":99,"data":{}}']])(
  'backup inválido %s não apaga dados', async (txt) => {
    await toggleCheck('2026-11-30','cafe');
    expect((await importBackup(new File([txt], 'b.json'))).ok).toBe(false);
    expect(await isChecked('2026-11-30','cafe')).toBe(true);
  });
test('lembrete de backup: com dados e nunca salvo → sim; salvo há 3 dias → não; há 8 dias → sim', async () => { ... });
test('canMakeUp: superior vai para ter/dom da mesma semana; inferior nunca', () => {
  expect(canMakeUp('superiorA','2026-12-02','2026-12-06')).toBe(true);  // qua → dom
  expect(canMakeUp('superiorB','2026-12-04','2026-12-05')).toBe(false); // sáb
  expect(canMakeUp('inferiorA','2026-11-30','2026-12-01')).toBe(false);
  expect(canMakeUp('superiorA','2026-12-02','2026-12-08')).toBe(false); // outra semana
});
test('compliance', () => expect(compliance(items4, new Set(['a','b','c']))).toBe(75));
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar.** `importBackup` valida `app`, `version === 1` e o formato de cada store **antes** de abrir transação; grava tudo numa única transação (substitui). `exportBackup` atualiza `lastBackupAt` somente após `shareOrDownload` concluir. Semana = segunda a domingo.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat: armazenamento local, backup e cálculos de progresso`

---

### Task 7: Tela Hoje

**Files:**
- Create: `src/ui/screens/Hoje.tsx`, `src/ui/components/CheckItem.tsx`, `src/ui/components/Banner.tsx`
- Test: `tests/ui/hoje.test.tsx`

**Interfaces:**
- Consumes: `buildDay`, `programPosition`, `toggleCheck`, `addWater`, `compliance`, `canMakeUp`, `needsBackupReminder`, `requestPersistence`, settings.
- Produces: rota `#/hoje`; item de treino navega para `#/treino/:date`.

- [ ] **Step 1: Testes que falham** (data fixa com `vi.setSystemTime(new Date(2026,10,30,10,0))`)

```tsx
test('lista os itens do dia em ordem e marca com um toque', async () => {
  render(<Hoje />);
  const cafe = await screen.findByRole('checkbox', { name: /06:30.*Café/ });
  await userEvent.click(cafe); expect(cafe).toBeChecked();
  expect(screen.getByText(/1 de \d+ feitos/)).toBeInTheDocument();
});
test('mostra Semana 1 · Base e o treino Inferior A', async () => {
  render(<Hoje />);
  expect(await screen.findByText('Semana 1 · Base')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Inferior A/ })).toHaveAttribute('href', '#/treino/2026-11-30');
});
test('água soma 500 ml', async () => { /* clica +, vê 0,5 / 3,5 L */ });
test('antes do início mostra "Programa começa em 30/11"', async () => { /* setSystemTime 25/11 */ });
test('check de bem-estar com joelho 4 sugere treino reduzido', async () => { /* responde, vê "Sugestão: versão reduzida" */ });
test('banner de backup aparece com dados e sem backup', async () => { ... });
test('sábado tem interruptor "Tem quadra hoje?"', async () => { ... });
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar** conforme o esboço §5.1 do spec (barra de progresso, avisos fixos da dieta na primeira vez, "fazer hoje" quando `canMakeUp`). Chamar `requestPersistence()` na primeira montagem.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat: tela Hoje`

---

### Task 8: Execução do treino

**Files:**
- Create: `src/ui/screens/Treino.tsx`, `src/ui/components/RestTimer.tsx`
- Test: `tests/ui/treino.test.tsx`

**Interfaces:**
- Consumes: `sessionForDate`, `programPosition`, `sessionPlan`, `EXERCISES`, `searchVideoUrl`, `lastLoad`, `saveSet`, `parseLoad`, store `sessions`, `wellness`.
- Produces: rota `#/treino/:date`; ao concluir grava `sessions` e marca o item de treino do dia em `checks`.

- [ ] **Step 1: Testes que falham**

```tsx
test('mostra um exercício por vez com séries, descanso e vídeo', async () => {
  render(<Treino date="2026-11-30" />);
  expect(await screen.findByText(/1\/\d+/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /vídeo/i })).toHaveAttribute('href', expect.stringMatching(/youtu/));
});
test('carga vem da última vez; campo vazio sem histórico', async () => { /* sem histórico: value '' ; com 42,5 salvo: '42,5' */ });
test('marcar série inicia descanso', async () => { /* clica série 1, vê cronômetro com restSec */ });
test('digitar "22,5" salva 22.5', async () => { ... });
test('versão reduzida não tem saltos', async () => { /* wellness joelho 4 → toggle reduzido → sem exercícios com plyo */ });
test('concluir pede RPE e marca o treino feito no dia', async () => { ... });
test('dia sem treino mostra "Hoje é dia de descanso da academia"', async () => { /* sáb */ });
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar** (botões +/− 2,5 kg; tela não apaga durante o treino com `navigator.wakeLock` quando disponível; vídeo abre em nova aba).
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat: execução guiada do treino`

---

### Task 9: Telas Semana, Treinos (biblioteca) e Dieta

**Files:**
- Create: `src/ui/screens/Semana.tsx`, `Treinos.tsx`, `Exercicio.tsx`, `Dieta.tsx`
- Test: `tests/ui/semana.test.tsx`, `tests/ui/treinos.test.tsx`, `tests/ui/dieta.test.tsx`

**Interfaces:**
- Consumes: `WEEK_GRID`, `buildDay`, `compliance`, `PROGRAM`, `EXERCISES`, `MEALS`, `CARB_GRAMS`, `DIET_RULES`, `DIET_NOTICES`, supplements.

- [ ] **Step 1: Testes que falham**

```tsx
test('Semana mostra 7 dias com sessão, vôlei e % feito', ...);           // seg "Inferior A", ter "Quadra 20h", sáb "Areia 11h"
test('Treinos: busca "supino" filtra a lista', ...);
test('Exercício mostra como fazer, erros comuns, vídeo e imagem', ...);
test('Treinos: abas de fase mostram as 4 sessões da fase', ...);
test('Dieta mostra carbo do dia e opções do almoço rápido', ...);       // seg: "70 g", "Marmita", "Shake", "Wrap"
test('Dieta mostra os avisos fixos', ...);
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar.** Dieta inclui a lista de preparo de marmitas no domingo (proteínas e legumes para seg/qui/sex).
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat: telas Semana, Treinos e Dieta`

---

### Task 10: Evolução

**Files:**
- Create: `src/ui/screens/Evolucao.tsx`, `src/ui/components/LineChart.tsx`
- Test: `tests/ui/evolucao.test.tsx`

**Interfaces:**
- Consumes: stores `body`, `jumps`, `sets`, `checks`; `compliance`; setting `weightGoalKg`.
- Produces: `LineChart({ points: {x: string; y: number}[]; goal?: number; unit: string })` em SVG puro.

- [ ] **Step 1: Testes que falham**

```tsx
test('registrar peso 95 e ver no gráfico', ...);
test('meta de peso desenha linha de meta', ...);
test('medidas usam os campos da planilha', ...);   // Peso, % Gordura, Massa Magra, Pescoço, Ombros, Peitoral, Braço D/E, Antebraço D/E, Cintura, Abdômen, Quadril, Coxa D/E, Panturrilha D/E
test('carga por exercício mostra a evolução do supino', ...);
test('cumprimento semanal em % das últimas 8 semanas', ...);
test('teste de salto mensal grava alcance e salto em cm', ...);
test('sem dados mostra estado vazio com instrução', ...);
```

- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar.** Lembrete na tela Hoje: peso toda segunda; medidas e salto na 1ª segunda do mês.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat: tela Evolução com gráficos`

---

### Task 11: Ajustes, PWA offline e teste no celular

**Files:**
- Create: `src/ui/screens/Ajustes.tsx`, `e2e/smoke.mjs`
- Test: `tests/ui/ajustes.test.tsx`, `e2e/smoke.mjs`

**Interfaces:**
- Consumes: settings, `exportBackup`, `importBackup`, `exportCsv`, `shareOrDownload`, `SUPPLEMENTS`.

- [ ] **Step 1: Testes que falham**

```tsx
test('mudar data de início altera a semana mostrada em Hoje', ...);
test('ligar glutamina adiciona item às 06:15', ...);
test('editar horário do almoço reordena o dia', ...);
test('Salvar backup chama shareOrDownload com treino-volei-AAAA-MM-DD.json', ...);
test('Restaurar com arquivo inválido mostra erro e mantém dados', ...);
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar.** **Step 4: Rodar** → PASS.
- [ ] **Step 5: E2E** `e2e/smoke.mjs` com `require('playwright')`, `devices['Pixel 7']` e `devices['iPhone 13']`: `npm run build && npx vite preview --base /academianutri/`; abre `#/hoje`, marca o café, abre o treino, volta; depois `context.setOffline(true)`, recarrega e confirma que Hoje abre e o check persiste; captura de tela (deviceScaleFactor do dispositivo) para mostrar ao usuário.
- [ ] **Step 6: Rodar** `npm run e2e` → "OK" para os dois dispositivos.
- [ ] **Step 7: Commit** `feat: ajustes, offline e teste em celular`

---

### Task 12: Pesquisa — apps similares e artigos

**Files:**
- Create: `docs/pesquisa/apps-similares.md`, `docs/pesquisa/artigos.md`

- [ ] **Step 1: Apps** — VERT, VolleyTrain, VOL Fitness, Jump AI, VertMax, House of Volley, Hevy, Strong: o que fazem, preço, o que este app aproveita/não faz. Fontes com link.
- [ ] **Step 2: Artigos** — busca com Elicit (`mcp__Elicit__search_papers`) e PubMed: pliometria em voleibol, treino de força para salto/ataque, prevenção de ombro e tendinopatia patelar em voleibolistas, treino para atletas master (40+), perda de peso com preservação de massa magra. 8–15 artigos, resumo de 2–3 linhas em português e link cada.
- [ ] **Step 3: Verificar** que todo link abre (HTTP 200) e que nenhum resumo afirma algo que o artigo não diz.
- [ ] **Step 4: Commit** `docs: pesquisa de apps e artigos`

---

### Task 13: Publicação e lembretes no Google Calendar

- [ ] **Step 1: Pedir ao usuário** que torne o repositório público e ative *Settings → Pages → Source: GitHub Actions*; abrir PR de `claude/gifted-bell-40pcjp` para `main` **somente com autorização do usuário**.
- [ ] **Step 2: Após o merge,** confirmar que `https://luizricardoolimpio.github.io/academianutri/` abre e funciona offline no celular dele.
- [ ] **Step 3: Lembretes** — mostrar ao usuário a lista de eventos recorrentes (≤ 6 por dia: café+suplementos, lanche manhã, treino, almoço+suplementos, lanche/pré-vôlei, jantar/pós-vôlei; água em 3 lembretes), cada um com link `…/#/hoje`; **criar com `mcp__Google_Calendar__create_event` somente após ele confirmar**.
- [ ] **Step 4:** Enviar ao usuário o passo a passo para instalar na tela inicial (Android e iPhone).
