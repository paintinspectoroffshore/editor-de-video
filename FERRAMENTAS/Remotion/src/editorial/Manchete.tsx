import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ED, FONTE } from "./tema";
import { FPS, clamp } from "./movimento";

export type Palavra = { word: string; start: number; end: number };
export type Janela = { inicio: number; fim: number; vinho: boolean };

const MAX_PALAVRAS = 3;
const PAUSA = 0.3;

const chave = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** Agrupa palavras em blocos curtos: até 3 palavras, quebrando em pontuação, pausa ou troca de cena. */
function agrupar(palavras: Palavra[], cortes: number[]): number[][] {
  const grupos: number[][] = [];
  let atual: number[] = [];
  palavras.forEach((p, i) => {
    const ant = palavras[i - 1];
    const trocouCena = ant && cortes.some((c) => ant.start < c && p.start >= c - 0.05);
    const quebra =
      atual.length >= MAX_PALAVRAS ||
      (ant && /[.!?:;,]$/.test(ant.word)) ||
      (ant && p.start - ant.end > PAUSA) ||
      trocouCena;
    if (quebra && atual.length) {
      grupos.push(atual);
      atual = [];
    }
    atual.push(i);
  });
  if (atual.length) grupos.push(atual);
  return grupos;
}

/**
 * Manchete cinética no topo — no estilo editorial, a "legenda" É a manchete:
 * palavras gigantes, condensadas, entrando com desfoque, números e destaques em vinho.
 */
export const Manchete: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: Janela[] }> = ({
  palavras,
  destaques,
  janelas,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cortes = React.useMemo(() => janelas.map((j) => j.inicio), [janelas]);
  const grupos = React.useMemo(() => agrupar(palavras, cortes), [palavras, cortes]);
  const set = React.useMemo(() => new Set(destaques.map(chave)), [destaques]);

  if (!palavras.length || t < palavras[0].start - 0.02) return null;

  let g = grupos.length - 1;
  while (g > 0 && t < palavras[grupos[g][0]].start - 0.02) g--;
  const grupo = grupos[g].map((i) => palavras[i]);

  const janela = janelas.find((j) => t >= j.inicio && t < j.fim);
  const vinho = janela?.vinho ?? false;

  const texto = grupo.map((p) => p.word).join(" ");
  const chars = texto.length;
  const base = Math.max(104, Math.min(178, 1850 / Math.max(7, chars)));

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 150,
        height: 420,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "flex-start",
        alignItems: "baseline",
        columnGap: base * 0.22,
        rowGap: 0,
      }}
    >
      {grupo.map((p, i) => {
        const ini = p.start - 0.02;
        const k = interpolate(t, [ini, ini + 0.16], [0, 1], clamp);
        const numero = /\d/.test(p.word);
        const destaque = set.has(chave(p.word));
        const cor = vinho
          ? destaque || numero
            ? ED.amarelo
            : ED.papel
          : numero || destaque
            ? ED.vinho
            : ED.tinta;
        const tamanho = numero ? base * 1.22 : base;
        return (
          <span
            key={`${g}-${i}`}
            style={{
              fontFamily: FONTE.manchete,
              fontWeight: 700,
              fontSize: tamanho,
              lineHeight: 0.98,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: cor,
              opacity: k,
              filter: `blur(${(1 - k) * 14}px)`,
              transform: `translateY(${(1 - k) * 18}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {p.word}
          </span>
        );
      })}
    </div>
  );
};
