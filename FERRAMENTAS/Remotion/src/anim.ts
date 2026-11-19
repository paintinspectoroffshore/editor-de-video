import { interpolate, Easing } from "remotion";
import { RITMO } from "./dna";

const easeOut = Easing.bezier(...RITMO.curva);

/** Entrada padrão: fade + subida de 8px, com atraso em cascata. */
export function entrada(frame: number, ordem = 0) {
  const t = frame - ordem * RITMO.stagger;
  const p = interpolate(t, [0, RITMO.entrada], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  return { opacity: p, transform: `translateY(${(1 - p) * 8}px)` };
}

/** Fade de entrada e saída da cena inteira. */
export function fadeCena(frame: number, duracao: number) {
  const f = RITMO.crossfade;
  return interpolate(frame, [0, f, duracao - f, duracao], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

/** Micro-zoom contínuo 1.00 -> 1.04: impede a tela de parecer parada. */
export function microZoom(frame: number, duracao: number) {
  return interpolate(frame, [0, duracao], [1, 1.04], {
    extrapolateRight: "clamp",
  });
}

/** Contagem progressiva de número. */
export function contar(frame: number, valor: number, ordem = 0) {
  const t = frame - ordem * RITMO.stagger;
  return interpolate(t, [0, RITMO.countUp], [0, valor], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

/** Crescimento de barra da esquerda para a direita (0..1). */
export function crescer(frame: number, ordem = 0) {
  const t = frame - ordem * RITMO.stagger;
  return interpolate(t, [0, RITMO.countUp], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

export const fmt = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
