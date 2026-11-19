import { Easing, interpolate, spring } from "remotion";

export const FPS = 30;
const suave = Easing.bezier(0.22, 1, 0.36, 1);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Progresso 0..1 de uma entrada que começa em `ini` (frames) e dura `dur`. */
export const prog = (frame: number, ini: number, dur = 12) =>
  interpolate(frame, [ini, ini + dur], [0, 1], { ...clamp, easing: suave });

/** Mola com leve overshoot — para carimbos e cards "batendo" na mesa. */
export const mola = (frame: number, ini: number, rigidez = 180, amortecimento = 14) =>
  spring({ frame: frame - ini, fps: FPS, config: { stiffness: rigidez, damping: amortecimento, mass: 0.9 } });

/** Entrada padrão de card: sobe 60px, gira um pouco e assenta. */
export const entradaCard = (frame: number, ini: number, rot = 0) => {
  const m = mola(frame, ini, 160, 16);
  return {
    opacity: interpolate(m, [0, 0.35], [0, 1], clamp),
    transform: `translateY(${(1 - m) * 70}px) rotate(${rot + (1 - m) * 3}deg)`,
  };
};

/** Saída rápida da cena: nos últimos frames, sobe e some. */
export const saidaCena = (frame: number, dur: number) => {
  const p = interpolate(frame, [dur - 6, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return { opacity: 1 - p, transform: `translateY(${-p * 40}px)` };
};

export const seg = (s: number) => Math.round(s * FPS);

export const fmtBR = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
