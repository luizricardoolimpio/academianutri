# App de Treino, Dieta e Vôlei — Documento de Projeto

**Data:** 24/11/2026 · **Status:** rascunho para aprovação · **Usuário único:** Luiz Ricardo

---

## 1. Intenção (o porquê)

Hoje o treino é feito "de forma aleatória": há três fontes de treino (Fichas A–D da academia, programa
**Salto na Academia Avançado** e programa **Ataque Forte**, ambos da SalteMais), um protocolo alimentar
da nutricionista (2023) e uma planilha de controle que não funciona porque preencher planilha todo dia
é cansativo e fácil de esquecer.

O app existe para:

1. **Dizer o que fazer hoje** — treino, vôlei, refeições e suplementos encaixados na rotina real da semana.
2. **Tornar o registro mais rápido que a planilha** — marcar com um toque, com a última carga já preenchida.
3. **Mostrar como fazer cada exercício** — vídeo (prioridade) e/ou imagem, porque só o nome não basta.
4. **Mostrar a evolução** — cargas, peso, medidas, cumprimento semanal.

**Objetivos de médio/longo prazo do atleta, em ordem de igual peso:** pular mais alto, atacar mais forte,
reduzir peso — com foco em saúde e bem-estar, **sem treinos pesados demais**.

**Perfil:** 42 anos, 1,80 m, 95 kg, joga vôlei há 30+ anos, ~60 treinos de academia nos últimos 2 meses
→ nível intermediário/avançado, mas atleta master (recuperação mais lenta, joelhos e ombros prioritários).

## 2. Metas, não-metas e anti-metas

**Metas**
- Tela "Hoje" que mostra a agenda do dia na ordem dos horários, com check de um toque.
- Execução guiada do treino: exercício → séries/reps/descanso → vídeo → registro de carga.
- Programa de treino periodizado montado a partir das três fontes, adaptado ao perfil (ver §6).
- Plano alimentar por tipo de dia, com opções práticas para os dias de treino no almoço (ver §7).
- Evolução: gráficos de peso, medidas, carga por exercício, % de cumprimento.
- Funciona offline na academia; instalável na tela inicial do celular.
- Backup dos dados no Google Drive.
- Lembretes via Google Calendar.

**Não-metas (agora)**
- Sincronização automática entre aparelhos ou acesso de terceiros (nutricionista) — possível evolução futura (opção B).
- Contagem de calorias/macros por alimento, código de barras, banco de alimentos.
- Medição de salto por câmera/sensor (apps como VERT/VertMax fazem isso; aqui o salto é registrado manualmente).
- Prescrever suplementos novos. A lista "avançada" do Plano de Performance (beta-alanina, HMB etc.) **não** entra no checklist.
- Mudar a prescrição da nutricionista (quantidades e alimentos). O app organiza; não reescreve a dieta.

**Anti-metas (seria fracasso mesmo funcionando)**
- Registrar dar mais trabalho que a planilha (mais de ~2 toques por item ou digitação obrigatória).
- Treino que empilha pliometria em cima do volume de vôlei e machuca joelho/tendão.
- App que depende de internet na academia.
- Dados perdidos sem aviso.

## 3. Restrições

- **Rotina fixa da semana (nova):**

| Dia | Trabalho | Vôlei | Academia (decidido) |
|---|---|---|---|
| Seg | Escola 7h–11h30 e 13h–17h; aulas online em casa 17h30–19h30 | — | 11h30 (almoço) |
| Ter | Manhã em casa (aulas); escola 13h–17h; aulas 17h30–19h30 | **Quadra 20h–22h30 (pesado)** | — (mobilidade 15 min em casa) |
| Qua | Escola 7h–11h30; aulas em casa 14h–19h30 | **Areia 21h–22h (pesado)** | 11h45 |
| Qui | Igual segunda | — | 11h30 (almoço) |
| Sex | Igual segunda | — | 11h30 (almoço) |
| Sáb | Aulas em casa 7h–9h | **Areia 11h–13h + Quadra 14h–16h ou 15h–17h (variável)** | — |
| Dom | Aulas em casa ~13h–17h | — | Manhã: cardio leve 40 min + mobilidade |

- Intervalos na escola: **9h30–9h50** e **14h40–15h**. Café da manhã **antes das 7h** nos dias de escola.
- Aulas particulares são sempre em casa → dá para lanchar entre 17h30 e 19h30.
- Celular é o aparelho principal; uso na academia com rede ruim.
- Custo zero; sem conta nova em serviço externo.
- Os PDFs da SalteMais são material pessoal do usuário: o app usa os nomes, prescrições e links de vídeo
  para uso próprio; os PDFs não são republicados.

## 4. Abordagens consideradas

| | Abordagem | Prós | Contras |
|---|---|---|---|
| **A ✅** | **App web instalável (PWA) com dados no celular**, backup no Drive, lembretes no Google Calendar | Offline, grátis, sem conta nova, rápido de construir e de ajustar | Troca de celular depende do backup |
| B | PWA + banco na nuvem com login | Sincroniza aparelhos; dá acesso à nutricionista | Conta/serviço externo, login, mais peças |
| C | App nativo de loja | Notificações próprias | Lento de construir; iPhone exige US$ 99/ano; cada mudança de treino = nova versão |
| ✗ | Planilha Google como base | — | Precisa de internet, lenta, é o que o usuário quer abandonar |

**Escolhida: A** (pelo usuário, 24/11/2026). Pode evoluir para B sem perder dados (o formato de backup é o mesmo).

## 5. O app

### 5.1 Telas

```
┌─ HOJE (seg 24/11) ───────────────┐   ┌─ TREINO: Inferior A ─────────────┐
│ Semana 3 · Fase Base             │   │ 2/7  Shock Pause Jumps           │
│ ▓▓▓▓▓▓░░░░ 6 de 11 feitos        │   │ 4 × 5 · caixa 30 cm · desc. 90"  │
│                                  │   │ [▶ vídeo]  [🖼 imagem]  [ℹ dicas]│
│ ✅ 06h15 Glutamina 15g           │   │                                  │
│ ✅ 06h30 Café da manhã  (opção 1)│   │ Série 1  ✅ 5 reps               │
│ ✅ 09h30 Lanche manhã            │   │ Série 2  ✅ 5 reps               │
│ ▶  11h30 TREINO Inferior A       │   │ Série 3  ☐  [ toque p/ feito ]   │
│ ☐  12h25 Almoço rápido (marmita) │   │ Série 4  ☐                       │
│ ☐  14h40 Lanche tarde            │   │                                  │
│ ☐  17h30 Lanche                  │   │ ⏱ descanso 01:12                 │
│ ☐  19h45 Jantar                  │   │ Última vez: 4×5 caixa 30 cm      │
│ 💧 Água  ▓▓▓▓░░ 2,0 / 3,5 L [+]  │   │ Sensação (RPE): 😌 🙂 😤 🥵       │
│ 💊 Suplementos  4/6              │   │      [◀ anterior]  [próximo ▶]   │
└──────────────────────────────────┘   └──────────────────────────────────┘
 [Hoje] [Semana] [Treinos] [Dieta] [Evolução]
```

- **Hoje** — linha do tempo do dia; cada item marca com um toque; refeições abrem as opções do protocolo;
  "água" soma em copos de 500 ml; check rápido de bem-estar pela manhã (sono, dor no joelho/ombro, disposição, 1–5).
- **Execução de treino** — um exercício por vez, séries com toque, carga pré-preenchida da última vez
  (ajustável com +/−), cronômetro de descanso automático, botão de vídeo, RPE ao final.
- **Semana** — grade da semana (§3) com status de cada dia.
- **Treinos** — programa completo por fase/semana; biblioteca de exercícios com busca, vídeo, imagem, músculos, dicas e erros comuns.
- **Dieta** — refeições por tipo de dia, opções e quantidades da nutricionista, regras gerais (água, evitar, temperos), lista de suplementos.
- **Evolução** — peso (registro semanal, sugerido segunda de manhã em jejum), medidas (mensal, campos da planilha),
  salto (teste mensal: alcance/altura registrados manualmente), gráfico de carga por exercício, % de cumprimento semanal.
- **Ajustes** — backup/restauração, data de início do programa, editar horários, refazer semana.

### 5.2 Vídeos e imagens dos exercícios

- **Fonte 1:** links do YouTube já presentes nos PDFs da SalteMais (um por exercício). Extração pelas
  coordenadas dos links no PDF (o texto extraído não preserva a ordem), conferida manualmente.
- **Fonte 2:** para exercícios das Fichas A–D e complementos sem link, curadoria de vídeos em português
  de canais de educação física reconhecidos.
- **Imagens:** base aberta [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (domínio público)
  quando houver correspondência.
- Vídeo abre no app do YouTube (não embutido — offline não tocaria de qualquer forma). Texto de execução
  (posição, pegada, erros comuns) fica salvo no app e funciona offline.

### 5.3 Dados, backup e lembretes

- Dados no próprio navegador do celular (IndexedDB), com pedido de armazenamento persistente.
- **Backup:** botão "Salvar no Drive" gera um arquivo JSON; o app avisa após 7 dias sem backup.
  Restauração importa o mesmo arquivo. Exportação CSV opcional para abrir na planilha.
- **Lembretes:** eventos recorrentes criados no Google Calendar do usuário (refeições-chave, treino,
  suplementos agrupados, lembrete de água). Cada evento traz o link que abre o app na tela certa.
- O plano (programa, dieta, exercícios) é conteúdo do app em arquivos de dados versionados no repositório;
  os registros do usuário ficam só no celular.

### 5.4 Tecnologia (decisão do construtor, aceita na abordagem A)

- PWA estática: HTML + JavaScript (framework leve, ex. Preact/Vite) + service worker para offline.
- Sem servidor. Hospedagem estática gratuita apontando para o repositório `academianutri` (ver pergunta em aberto §9).
- Testes automatizados da lógica (qual treino é hoje, progressão de semana, cálculo de cumprimento) e teste
  em navegador simulando celular.

## 6. Programa de treino

### 6.1 Princípios

- **4 sessões de academia/semana de ~50 min**, no máximo 2 com pliometria.
- **Pliometria só seg e qui**, a ≥ 48 h de terça à noite e de sábado. Volume de saltos na academia
  bem abaixo do original da SalteMais, porque o vôlei (≈ 4 sessões, sábado ≈ 4 h) já é carga de salto.
  Base: meta-análise em voleibol mostra ganhos semelhantes com volume baixo
  ([PMC7429440](https://pmc.ncbi.nlm.nih.gov/articles/PMC7429440)); em temporada os jogos fornecem boa parte dos saltos
  ([Human Kinetics](https://us.humankinetics.com/blogs/excerpt/training-power-for-volleyball)).
- **Esforço controlado:** séries principais deixando 2–3 repetições na reserva (não ir à falha); onde a
  SalteMais pede "0–1 na reserva" ou "mais pesado possível", o app usa 2–3 de reserva.
- Pular as sessões de "sprint/saltos a 100%" de campo da SalteMais (Dia 2 dos programas de salto) — o vôlei cumpre esse papel.
- Prevenção de ombro e joelho em toda sessão (rotação externa, face pull, Y-T-W, nórdico/espanhol, mobilidade de tornozelo).
- **Periodização (do Plano de Performance):** 4 semanas Base → 4 semanas Força → 3 semanas Potência → 1 semana Descarga (−50%) = ciclo de 12 semanas, repetível.
- **Ajuste automático por bem-estar:** se o check da manhã indicar dor ≥ 3 em joelho/ombro ou sono ruim, o app sugere a versão reduzida do treino (sem saltos, −1 série).

### 6.2 Estrutura das sessões

| Sessão | Dia | Origem principal | Conteúdo-base |
|---|---|---|---|
| **Inferior A — força + salto** | Seg | Salto Avançado (Dia 1/3) + Ficha C | Aquecimento (esteira reversa, mobilidade de tornozelo) · 2–3 exercícios de salto de baixo volume (shock pause jumps, saltos máximos, line hops) · força: terra hexagonal/sumo, elevação pélvica, búlgaro · nórdico ou spanish squat · panturrilha explosiva |
| **Superior A — força de ataque** | Qua | Ataque Forte (Dia 1) + Fichas A/B | Mobilidade de ombro/peitoral · supino/supino máquina · push press ou landmine press · remada · face pull · rotação externa · core anti-rotação (pallof) |
| **Inferior B — potência + salto** | Qui | Salto Avançado (Dia 3) + Ficha C | Saltos (box jump/drop) baixo volume · agachamento/hack ou box squat · step-up · stiff unilateral · spanish squat · core |
| **Superior B — ombro, braço e core** | Sex | Ataque Forte (Dias 2/3) + Fichas A/D | Barra fixa ou pulley · remada unilateral · desenvolvimento unilateral · bíceps/tríceps (ficha D) · Y-T-W · rotação de tronco na polia · punho/antebraço |
| Mobilidade | Ter | Plano de Performance | 15 min em casa: 90/90 de quadril, tornozelo, torácica, gato-camelo |
| Cardio leve | Dom | — | 40 min bike/caminhada inclinada em zona 2 + mobilidade |

A seleção exata por fase segue a progressão dos programas originais: a fase **Base** usa as semanas 1–4 do
Salto Avançado e a Fase 1 (Força) do Ataque Forte; **Força** usa as semanas 5–8 e a Fase 1→2; **Potência**
usa as semanas 9–10 e a Fase 3 (Potência). Volumes reduzidos conforme §6.1.

## 7. Plano alimentar

Fonte: **Protocolo Alimentar da nutricionista (ciclo de carboidratos, 10/2023)** — quantidades e opções mantidas.

- **Regras gerais no app:** 3–4 L de água/dia; uma refeição livre por semana; evitar industrializados, açúcar,
  bebidas açucaradas; refrigerante zero, café e chás liberados; temperos naturais, sal moderado.
- **Suplementos (checklist diário):** glutamina 15 g em jejum · creatina (2 doses/dia, conforme protocolo) ·
  psyllium 3×/dia nas refeições · ômega 3 (3 cápsulas após refeições) · polivitamínico após o almoço · whey conforme refeições.
- **Ciclo de carboidratos:** o protocolo zera o carboidrato no almoço e no jantar 5×/semana (só legumes, folhosos e proteína).
  Os dias com carboidrato ficam nos dias de maior gasto — ver pergunta em aberto §9.
- **Almoço rápido (seg, qui, sex — treino 11h30, aula às 13h):** prioridade para opções que cabem em ~25 min:
  1. **Marmita pronta** do protocolo (proteína 140–150 g + ≥150 g de legumes/folhosos), preparada no domingo/quarta;
  2. **Shake**: 2 scoops de whey + 250 ml de leite desnatado + morango e mamão (opção do protocolo) + fruta;
  3. **Wrap integral** + 70 g de frango/patinho + salada.
  O app sugere no domingo uma lista de preparo das marmitas da semana.
- **Linha do tempo por tipo de dia** (horários editáveis):

| Tipo de dia | Linha do tempo |
|---|---|
| Seg/Qui/Sex (treino no almoço) | 06h15 glutamina · 06h30 café · 09h30 lanche manhã · 11h30 treino · 12h25 almoço rápido · 14h40 lanche tarde · 17h30 lanche · 19h45 jantar |
| Ter (vôlei quadra à noite) | 07h café · 10h lanche · 12h almoço · 14h40 lanche · 17h30 lanche · 19h15 pré-vôlei · 20h vôlei · 22h45 pós-vôlei (whey + fruta) |
| Qua (treino 11h45 + areia 21h) | 06h15 glutamina · 06h30 café · 09h30 lanche · 11h45 treino · 12h50 almoço · 16h lanche · 18h30 jantar leve · 20h15 pré-vôlei leve · 21h vôlei · 22h15 pós-vôlei |
| Sáb (areia + quadra) | 06h45 café · 10h15 pré-vôlei · 11h vôlei areia · 13h15 almoço · 14h/15h vôlei quadra · 17h lanche pós · noite: refeição livre |
| Dom (cardio + aulas à tarde) | 08h café · 09h cardio leve · 10h30 lanche · 12h30 almoço · 15h lanche · 19h jantar |

## 8. Conteúdo extra no repositório

- `docs/pesquisa/apps-similares.md` — VERT, VolleyTrain, VOL Fitness, Jump AI, VertMax, House of Volley, Hevy/Strong:
  o que fazem, preço, o que aproveitamos.
- `docs/pesquisa/artigos.md` — evidência sobre treino de força/pliometria para voleibol e para atletas master
  (busca com Elicit + PubMed), com resumo em português e link.

## 9. Perguntas em aberto (do usuário)

1. **Dias com carboidrato:** o protocolo zera carbo no almoço e no jantar 5×/semana; o Plano de Performance e a
   planilha dizem "almoço COM carbo" quase todo dia. Proposta: **carbo no almoço de ter e sáb, e no jantar de ter e qua**
   (dias de vôlei pesado). Confirmar — idealmente com a nutricionista.
2. **Refeição livre:** o protocolo permite **uma** por semana; o Plano de Performance dava o domingo inteiro livre.
   Proposta: seguir a nutricionista — **uma, sábado à noite**.
3. **Hospedagem:** o repositório `academianutri` parece privado. Opções: (a) tornar o repositório público
   (o código e o plano ficam visíveis; os registros nunca saem do celular); (b) manter privado e hospedar num serviço
   gratuito que lê repositórios privados (Cloudflare Pages ou Netlify), o que exige criar uma conta gratuita.
4. **Suplementos em uso hoje:** confirmar a lista (o Plano de Performance cita termogênico, que não está no protocolo da nutricionista).

## 10. Decisões do construtor (para revisão)

- Pliometria 2×/semana, reps em reserva 2–3, sessões de sprint/campo da SalteMais removidas.
- Ciclo de 12 semanas começando na segunda-feira seguinte à instalação; o usuário pode mudar a data.
- Registro de peso semanal, medidas mensais, teste de salto mensal.
- Check de bem-estar matinal com sugestão de treino reduzido.
- Vídeos abrem no YouTube; texto de execução salvo offline.
- Backup manual com aviso a cada 7 dias.
- Treino perdido: a sessão fica marcada como "não feita"; na tela Hoje aparece "fazer hoje" se houver outro dia
  livre de academia antes do próximo bloco pesado de vôlei (nunca empurra pernas para ter ou sáb).
- Sábado: a quadra da tarde é variável → interruptor "tem quadra hoje?" que ajusta horários do lanche.
- Lembretes no Calendar limitados a ~6 por dia (refeições agrupadas com suplementos; água em 3 lembretes).
- Meta de peso definida pelo usuário na tela Evolução (sem valor pré-definido).
- Peso inicial do programa: 95 kg (o Plano de Performance dizia 92 kg; vale o atual).

## 11. O que fica para o construtor

- Seleção fina dos exercícios por semana dentro de cada fase, respeitando §6.
- Correspondência exercício → vídeo → imagem, e textos de execução.
- Visual (cores, tipografia), ícone do app, textos de interface.
- Estrutura interna de código e testes.
