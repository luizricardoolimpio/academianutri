import { weekdayOf } from '../domain/dates';

export type DietDayType = 'academiaAlmoco' | 'terca' | 'quarta' | 'sabado' | 'domingo';

export function dietDayType(dateKey: string): DietDayType {
  switch (weekdayOf(dateKey)) {
    case 2: return 'terca';
    case 3: return 'quarta';
    case 6: return 'sabado';
    case 0: return 'domingo';
    default: return 'academiaAlmoco';
  }
}

export const DIET_DAY_LABEL: Record<DietDayType, string> = {
  academiaAlmoco: 'Academia no almoço (seg, qui, sex)',
  terca: 'Gasto alto — vôlei de quadra à noite',
  quarta: 'Gasto alto — academia + vôlei de areia',
  sabado: 'Gasto alto — areia + quadra',
  domingo: 'Dia leve — cardio e aulas',
};

/** Gramas de carboidrato (arroz, batata, mandioca, macarrão, batata-doce — cozidos). Nunca zero. */
export const CARB_GRAMS: Record<DietDayType, { almoco: number; jantar: number | 'livre' }> = {
  academiaAlmoco: { almoco: 70, jantar: 50 },
  terca: { almoco: 100, jantar: 70 },
  quarta: { almoco: 100, jantar: 70 },
  sabado: { almoco: 100, jantar: 'livre' },
  domingo: { almoco: 70, jantar: 'livre' },
};

export const CARB_SOURCES = 'arroz branco/integral, batata inglesa, batata-doce, mandioca, batata baroa ou macarrão (cozidos)';

const PROTEINAS_ALMOCO = 'Proteína: patinho moído 140 g · filé de frango 150 g · carne de porco magra 150 g · peixe magro (tilápia, sardinha, atum) 150 g';
const VEGETAIS = 'Vegetais e folhosos à vontade — mínimo 150 g (abobrinha, cenoura, beterraba, brócolis, couve, alface, espinafre)';

export const MEALS: Record<string, { name: string; options: string[] }> = {
  cafe: {
    name: 'Café da manhã',
    options: [
      '150 g de mamão ou manga + 40 g de whey + 200 ml de Itambé Fit · acompanha 120 g de fruta',
      '2 ovos mexidos + 30 g de queijo minas frescal (ou 1 col. sopa de cottage) + 120 g de fruta',
      'Omelete de 3 ovos + 60 g de aveia + 1 banana + 1 col. de pasta de amendoim',
      'Tapioca com frango desfiado e queijo branco + fatia de mamão + castanhas',
      'Panqueca de aveia (aveia + ovos + banana) + fio de mel + frutas vermelhas',
    ],
  },
  lancheManha: {
    name: 'Lanche da manhã',
    options: [
      '150 g de fruta (manga, uva, melancia, melão, morango, mamão ou abacaxi) + 1 Itambé Fit ou iogurte grego light',
    ],
  },
  almocoRapido: {
    name: 'Almoço rápido pós-treino',
    options: [
      `Marmita pronta: proteína (140–150 g) + carbo do dia + ${VEGETAIS.toLowerCase()} — preparada no domingo/quarta`,
      'Shake: 2 scoops de whey + 250 ml de leite desnatado + 100 g de morango + ½ mamão',
      'Wrap integral (Rap10) + 70 g de frango, patinho, tilápia ou lombo desfiado + alface e tomate',
    ],
  },
  almoco: {
    name: 'Almoço',
    options: [PROTEINAS_ALMOCO, `Carboidrato: ${CARB_SOURCES}`, VEGETAIS, 'Sobremesa: 100 g de fruta (uva, melancia, manga, melão, abacaxi ou ½ mamão)'],
  },
  lancheTarde: {
    name: 'Lanche da tarde',
    options: [
      '1 iogurte desnatado + 1 scoop de whey + 20 g de aveia + 30 g de queijo minas + 100 g de fruta',
      '3 torradas integrais + 60 g de cottage + 1 ovo mexido + 100 g de fruta',
      '2 scoops de whey + 250 ml de leite desnatado + morango e mamão',
      '1 wrap integral + 70 g de frango/patinho + salada + 150 ml de leite desnatado',
    ],
  },
  lancheCasa: {
    name: 'Lanche (entre as aulas em casa)',
    options: ['100 g de fruta (abacaxi, kiwi, manga ou mamão) + 150 ml de Itambé Fit', 'Iogurte desnatado + 20 g de aveia'],
  },
  preVolei: {
    name: 'Pré-vôlei',
    options: [
      'Banana + 1 col. de pasta de amendoim + café sem açúcar',
      '100 g de batata-doce cozida + 1 ovo cozido',
      'Pão francês + fatia de queijo branco',
      '40 g de aveia + 1 banana amassada + mel',
    ],
  },
  posVolei: {
    name: 'Pós-vôlei',
    options: ['Shake de whey (30–40 g) + 1 fruta', 'Banana + aveia + whey + leite desnatado'],
  },
  jantar: {
    name: 'Jantar',
    options: [
      'Proteína: patinho moído 140 g · filé de frango 150 g · carne de porco magra 150 g',
      `Carboidrato: ${CARB_SOURCES}`,
      'Salada no mínimo 150 g (vegetais, legumes, folhosos)',
      '250 g de gelatina zero + 200 ml de Itambé Fit (ou iogurte zero)',
    ],
  },
  refeicaoLivre: {
    name: 'Refeição livre',
    options: ['Coma o que quiser, sem exageros. Beba água.'],
  },
};

export const DIET_RULES: string[] = [
  'Água: 3 a 4 litros por dia (mais em dia de jogo).',
  'Duas refeições livres por semana: sábado e domingo à noite.',
  'Evitar: industrializados (biscoitos, chocolates, balas), açúcar refinado, geleias, bebidas açucaradas.',
  'Liberados: café e chás sem açúcar, refrigerante zero com moderação, água de coco em dia de vôlei intenso.',
  'Temperar com alho, cebola, ervas e limão; nada de caldo pronto; sal moderado; azeite 1–2 col./dia.',
  'Proteínas, carboidratos e legumes podem ser trocados entre si respeitando as quantidades.',
  'Perdeu um horário? Ajuste sem culpa — o importante é completar o dia.',
];

export const DIET_NOTICES: string[] = [
  'Carboidratos e refeições livres foram adaptados a seu pedido (carbo nunca zerado, porções menores em dias leves). Vale mostrar à sua nutricionista.',
  'O termogênico (Stimerex) tem estimulantes: combine o uso com seu médico, principalmente com treino intenso à noite. Nunca depois das 14h.',
];

/** Preparo das marmitas para os almoços rápidos (seg, qui, sex). */
export const MEAL_PREP: string[] = [
  '3 porções de proteína (≈450 g no total): frango, patinho ou tilápia',
  '3 porções de 70 g de carboidrato cozido',
  '≈500 g de legumes (brócolis, abobrinha, cenoura) — assados ou no vapor',
  'Potes com tampa; marmita de sexta pode ser feita na quarta',
];
