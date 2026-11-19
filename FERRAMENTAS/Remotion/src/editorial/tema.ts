/**
 * Estilo EDITORIAL (ref07): jornal impresso / zine.
 * Papel off-white com grade de pontos, tinta preta, vinho como acento,
 * cards com borda grossa e sombra dura deslocada, carimbos tortos.
 */
import type React from "react";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const sub = { subsets: ["latin", "latin-ext"] as ("latin" | "latin-ext")[] };
loadOswald("normal", { weights: ["500", "600", "700"], ...sub });
loadInter("normal", { weights: ["600", "700", "800", "900"], ...sub });
loadMono("normal", { weights: ["400", "500", "700"], ...sub });

export const ED = {
  papel: "#F1EFEA",
  papelEscuro: "#E7E4DD",
  ponto: "rgba(0,0,0,0.075)",
  tinta: "#161616",
  cinza: "#5E5E5E",
  cinzaClaro: "#9A9A9A",
  vinho: "#7A1A1A",
  vinhoVivo: "#8E1F1F",
  verde: "#1F6B3A",
  amarelo: "#E8C34A",
  branco: "#FFFFFF",
} as const;

export const FONTE = {
  manchete: '"Oswald", "Arial Narrow", sans-serif',
  corpo: '"Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

/** Zona de conteúdo da cena (abaixo da manchete, acima da UI do Instagram). */
export const ZONA = { topo: 600, base: 1590, esquerda: 60, direita: 60 } as const;
export const ZONA_L = 1080 - ZONA.esquerda - ZONA.direita; // 960
export const ZONA_A = ZONA.base - ZONA.topo; // 990

export const BORDA = 4;
export const SOMBRA = 10;

/** Card com borda grossa e sombra dura (assinatura do estilo). */
export const cardDuro = (sombra: string = ED.tinta): React.CSSProperties => ({
  background: ED.branco,
  border: `${BORDA}px solid ${ED.tinta}`,
  boxShadow: `${SOMBRA}px ${SOMBRA}px 0 ${sombra}`,
});
