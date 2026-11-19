import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { FONTES, LEGENDA, Paleta, RITMO } from "../dna";

export type Palavra = { word: string; start: number; end: number };

const easeOut = Easing.bezier(...RITMO.curva);

/** Normaliza para comparar com a lista de destaques (sem acento, sem pontuação). */
const chave = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/** Quebra em grupos de até N palavras, respeitando pontuação e pausas da fala. */
function agrupar(palavras: Palavra[]): number[][] {
  const grupos: number[][] = [];
  let atual: number[] = [];
  palavras.forEach((p, i) => {
    const anterior = palavras[i - 1];
    const quebra =
      atual.length >= LEGENDA.palavrasVisiveis ||
      (anterior && /[.!?:;]$/.test(anterior.word)) ||
      (anterior && p.start - anterior.end > LEGENDA.pausa);
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
 * Legenda palavra-a-palavra, janela de 3-5 palavras, uma em destaque.
 * Fica na base de 36% da altura — assinatura visual das referências.
 */
export const Legenda: React.FC<{
  palavras: Palavra[];
  paleta: Paleta;
  destaques?: string[];
}> = ({ palavras, paleta, destaques = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const grupos = React.useMemo(() => agrupar(palavras), [palavras]);
  if (!palavras.length || t < palavras[0].start) return null;

  // grupo ativo = último que já começou; some 0.6s após o fim da última palavra
  let g = grupos.length - 1;
  while (g > 0 && t < palavras[grupos[g][0]].start) g--;
  const fimGrupo = palavras[grupos[g][grupos[g].length - 1]].end;
  const proximo = grupos[g + 1] ? palavras[grupos[g + 1][0]].start : Infinity;
  if (t > fimGrupo + 0.6 && t < proximo) return null;

  const inicio = grupos[g][0];
  const grupo = grupos[g].map((i) => palavras[i]);
  const set = new Set(destaques.map(chave));

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: LEGENDA.centroY - LEGENDA.tamanho * 0.6,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0 12px",
        padding: "0 90px",
      }}
    >
      {grupo.map((p, i) => {
        const global = inicio + i;
        const visivel = t >= p.start;
        const prog = interpolate(t, [p.start, p.start + 0.12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOut,
        });
        const destacada = set.has(chave(p.word));
        return (
          <span
            key={global}
            style={{
              fontFamily: FONTES.corpo,
              fontSize: LEGENDA.tamanho,
              fontWeight: LEGENDA.peso,
              color: destacada ? paleta.acento : paleta.forte,
              opacity: visivel ? prog : 0,
              transform: `translateY(${(1 - (visivel ? prog : 0)) * 8}px)`,
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
