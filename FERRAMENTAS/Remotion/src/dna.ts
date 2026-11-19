/**
 * DNA visual — fonte única de verdade.
 * Espelha REFERÊNCIAS/FOLHA-DE-ESTILO.md. Mudou lá, muda aqui.
 */

export const FORMATO = {
  largura: 1080,
  altura: 1920,
  fps: 30,
  seguroTopo: 230,
  seguroBase: 422,
} as const;

export const PALETAS = {
  darkTech: {
    fundo: "#0A0A0A",
    card: "#141414",
    borda: "#262626",
    acento: "#FF5C35",
    positivo: "#22C55E",
    negativo: "#DC2626",
    forte: "#FFFFFF",
    medio: "#A3A3A3",
    fraco: "#525252",
  },
  darkAlerta: {
    fundo: "#0A0A0A",
    card: "#141414",
    borda: "#262626",
    acento: "#E63946",
    positivo: "#A3A3A3",
    negativo: "#E63946",
    forte: "#FFFFFF",
    medio: "#A3A3A3",
    fraco: "#525252",
  },
  lightEditorial: {
    fundo: "#F5F3EF",
    card: "#FFFFFF",
    borda: "#1A1A1A",
    acento: "#8B1A1A",
    positivo: "#1B5E3A",
    negativo: "#8B1A1A",
    forte: "#1A1A1A",
    medio: "#4A4A4A",
    fraco: "#8A8A8A",
  },
} as const;

export type NomePaleta = keyof typeof PALETAS;
export type Paleta = (typeof PALETAS)[NomePaleta];

export const FONTES = {
  display: '"Archivo Black", system-ui, sans-serif',
  corpo: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

export const RITMO = {
  /** Curva padrão: rápido no início, assentamento suave. */
  curva: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** Atraso em cascata entre elementos irmãos (frames @30fps). */
  stagger: 3,
  entrada: 10,
  crossfade: 9,
  countUp: 18,
} as const;

/**
 * Painel enquadrado pelos corner brackets (medido nas refs: ~18% a ~68% da altura).
 * Todo conteúdo da cena vive aqui dentro.
 */
export const PAINEL = {
  topo: 350,
  base: 1310,
  lateral: 56,
  respiro: 52,
} as const;

/** Legenda: centro em ~72% da altura, logo abaixo do painel. */
export const LEGENDA = {
  centroY: 1385,
  tamanho: 46,
  peso: 700,
  palavrasVisiveis: 5,
  /** pausa (s) que força quebra de grupo */
  pausa: 0.35,
} as const;
