export type SupplementId = 'stimerex' | 'creatina' | 'omega3' | 'polivitaminico' | 'whey' | 'glutamina' | 'psyllium';

export interface Supplement {
  id: SupplementId;
  name: string;
  dose: string;
  enabledByDefault: boolean;
  notAfter?: string;
}

export const SUPPLEMENTS: Supplement[] = [
  { id: 'stimerex', name: 'Stimerex (termogênico)', dose: '1 cápsula no café', enabledByDefault: true, notAfter: '14:00' },
  { id: 'creatina', name: 'Creatina', dose: '1 scoop (2× ao dia)', enabledByDefault: true },
  { id: 'omega3', name: 'Ômega 3', dose: '2 cápsulas no almoço + 1 no jantar', enabledByDefault: true },
  { id: 'polivitaminico', name: 'Polivitamínico', dose: '1 cápsula após o almoço', enabledByDefault: true },
  { id: 'whey', name: 'Whey protein', dose: '30–40 g', enabledByDefault: true },
  { id: 'glutamina', name: 'Glutamina', dose: '15 g em jejum', enabledByDefault: false },
  { id: 'psyllium', name: 'Psyllium', dose: '1 colher de chá nas refeições', enabledByDefault: false },
];

export const DEFAULT_SUPPLEMENTS = SUPPLEMENTS.filter((s) => s.enabledByDefault).map((s) => s.id as string);
