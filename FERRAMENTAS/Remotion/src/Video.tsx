import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  CalculateMetadataFunction,
} from "remotion";
import { FORMATO, NomePaleta, PAINEL, PALETAS } from "./dna";
import { fadeCena, microZoom } from "./anim";
import { Moldura } from "./componentes/Moldura";
import { Legenda, Palavra } from "./componentes/Legenda";
import { Bloco, RenderBloco } from "./componentes/blocos";

export type Cena = {
  rotulo?: string;
  /** duração em segundos */
  duracao: number;
  /** alinhamento vertical do conteúdo */
  posicao?: "topo" | "centro";
  blocos: Bloco[];
};

export type Roteiro = {
  titulo: string;
  perfil?: string;
  badge?: string;
  paleta: NomePaleta;
  /** caminho relativo a public/ (o script de render copia pra lá) */
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  palavras?: Palavra[];
  destaques?: string[];
  cenas: Cena[];
};

const CenaView: React.FC<{ cena: Cena; idx: number; roteiro: Roteiro; frames: number }> = ({
  cena,
  idx,
  roteiro,
  frames,
}) => {
  const frame = useCurrentFrame();
  const paleta = PALETAS[roteiro.paleta];
  const escuro = roteiro.paleta !== "lightEditorial";
  return (
    <AbsoluteFill style={{ opacity: fadeCena(frame, frames) }}>
      <AbsoluteFill
        style={{
          transform: `scale(${microZoom(frame, frames)})`,
          transformOrigin: "50% 43%",
          top: PAINEL.topo + (cena.rotulo ? 110 : PAINEL.respiro),
          bottom: FORMATO.altura - PAINEL.base + PAINEL.respiro,
          left: PAINEL.lateral + PAINEL.respiro,
          right: PAINEL.lateral + PAINEL.respiro,
          width: "auto",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: cena.posicao === "topo" ? "flex-start" : "center",
          gap: 38,
        }}
      >
        {cena.blocos.map((b, i) => (
          <RenderBloco key={i} bloco={b} paleta={paleta} ordem={i * 2} escuro={escuro} />
        ))}
      </AbsoluteFill>
      <Moldura
        paleta={paleta}
        perfil={roteiro.perfil}
        badge={roteiro.badge}
        rotulo={cena.rotulo}
        numero={cena.rotulo ? String(idx + 1).padStart(2, "0") : undefined}
        escuro={escuro}
      />
    </AbsoluteFill>
  );
};

export const Video: React.FC<Roteiro> = (roteiro) => {
  const paleta = PALETAS[roteiro.paleta];
  const escuro = roteiro.paleta !== "lightEditorial";
  let cursor = 0;
  return (
    <AbsoluteFill
      style={{
        background: escuro
          ? `radial-gradient(ellipse 80% 50% at 50% 35%, #1A1310 0%, ${paleta.fundo} 70%)`
          : `${paleta.fundo} radial-gradient(#00000014 1.5px, transparent 1.5px) 0 0 / 28px 28px`,
      }}
    >
      {roteiro.cenas.map((c, i) => {
        const frames = Math.round(c.duracao * FORMATO.fps);
        const from = cursor;
        cursor += frames;
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <CenaView cena={c} idx={i} roteiro={roteiro} frames={frames} />
          </Sequence>
        );
      })}

      <Legenda palavras={roteiro.palavras ?? []} paleta={paleta} destaques={roteiro.destaques} />

      {roteiro.narracao && <Audio src={staticFile(roteiro.narracao)} />}
      {roteiro.trilha && (
        <Audio src={staticFile(roteiro.trilha)} volume={roteiro.volumeTrilha ?? 0.12} loop />
      )}
    </AbsoluteFill>
  );
};

export const calcularMetadados: CalculateMetadataFunction<Roteiro> = ({ props }) => {
  const segundos = props.cenas.reduce((s, c) => s + c.duracao, 0);
  return { durationInFrames: Math.max(1, Math.round(segundos * FORMATO.fps)) };
};
