import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "./tema";
import { ED, ZONA, ZONA_L } from "./tema";
import { FPS, clamp, saidaCena, seg } from "./movimento";
import { Manchete, Palavra } from "./Manchete";
import { BlocoEd, BlocoEditorial, SFX_DO_BLOCO } from "./blocos";

export type CenaEd = {
  duracao: number;
  fundo?: "papel" | "vinho";
  blocos: BlocoEd[];
};

export type RoteiroEd = {
  base: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  palavras?: Palavra[];
  destaques?: string[];
  cenas: CenaEd[];
};

/* --------------------------------------------------------- fundo de papel */

const Papel: React.FC = () => (
  <AbsoluteFill style={{ background: ED.papel }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${ED.ponto} 2.2px, transparent 2.4px)`, backgroundSize: "34px 34px", backgroundPosition: "17px 17px" }} />
    {/* textura estática pré-gerada (feTurbulence por quadro deixava o render 3x mais lento) */}
    <Img src={staticFile("texturas/fibra.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: 0.07, mixBlendMode: "multiply" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 75% at 50% 45%, transparent 60%, rgba(60,40,20,0.10) 100%)" }} />
  </AbsoluteFill>
);

/** Cortina vinho que sobe cobrindo a tela (transição de ênfase da referência). */
const Cortina: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const entra = interpolate(f, [0, 7], [1920, 0], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const sai = interpolate(f, [dur - 6, dur], [0, -1920], { ...clamp, easing: (t) => t * t });
  return <AbsoluteFill style={{ background: ED.vinho, transform: `translateY(${entra + sai}px)` }} />;
};

/* --------------------------------------------------------- cena */

const Cena: React.FC<{ cena: CenaEd; dur: number; inicio: number; base: string }> = ({ cena, dur, inicio, base }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, dur], [1, 1.025], clamp);
  const fluxo = cena.blocos.filter((b) => b.x === undefined && b.y === undefined);
  const livres = cena.blocos.filter((b) => b.x !== undefined || b.y !== undefined);
  const iniDe = (b: BlocoEd, i: number) => (b.em !== undefined ? seg(b.em) : 4 + i * 8);

  return (
    <AbsoluteFill>
      {cena.fundo === "vinho" && <Cortina dur={dur} />}
      <AbsoluteFill style={{ ...saidaCena(f, dur) }}>
        <div
          style={{
            position: "absolute",
            left: ZONA.esquerda,
            top: ZONA.topo,
            width: ZONA_L,
            height: ZONA.base - ZONA.topo,
            transform: `scale(${zoom})`,
            transformOrigin: "50% 40%",
          }}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 44 }}>
            {fluxo.map((b, i) => (
              <BlocoEditorial key={i} b={b} c={{ ini: iniDe(b, cena.blocos.indexOf(b)), dur, inicioCena: inicio, base }} />
            ))}
          </div>
          {livres.map((b, i) => (
            <div key={`l${i}`} style={{ position: "absolute", left: b.x ?? 0, top: b.y ?? 0, zIndex: b.z ?? 1 }}>
              <BlocoEditorial b={b} c={{ ini: iniDe(b, cena.blocos.indexOf(b)), dur, inicioCena: inicio, base }} />
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------- efeitos sonoros */

type Som = { frame: number; nome: string; vol: number };

function sonsDaCena(cena: CenaEd, inicio: number): Som[] {
  const sons: Som[] = [];
  if (cena.fundo === "vinho") sons.push({ frame: inicio, nome: "whoosh", vol: 0.5 });
  cena.blocos.forEach((b, i) => {
    const ini = inicio + (b.em !== undefined ? seg(b.em) : 4 + i * 8);
    const nome = SFX_DO_BLOCO[b.tipo];
    if (nome) sons.push({ frame: ini, nome, vol: nome === "carimbo" ? 0.7 : 0.35 });
    if (b.tipo === "checklist") {
      b.itens.forEach((it, k) => {
        if (it.marcado) sons.push({ frame: it.em !== undefined ? inicio + seg(it.em) : ini + 8 + k * 12, nome: "click", vol: 0.5 });
      });
    }
    if (b.tipo === "seguir") sons.push({ frame: ini + seg(1.3), nome: "click", vol: 0.7 });
    if (b.tipo === "antesdepois") sons.push({ frame: ini + 46, nome: "click", vol: 0.7 });
  });
  return sons;
}

/* --------------------------------------------------------- vídeo */

export const VideoEditorial: React.FC<RoteiroEd> = (r) => {
  let cursor = 0;
  const janelas: { inicio: number; fim: number; vinho: boolean; frames: number; from: number }[] = r.cenas.map((c) => {
    const frames = Math.round(c.duracao * FPS);
    const j = { inicio: cursor / FPS, fim: (cursor + frames) / FPS, vinho: c.fundo === "vinho", frames, from: cursor };
    cursor += frames;
    return j;
  });
  const sons = r.cenas.flatMap((c, i) => sonsDaCena(c, janelas[i].from));

  return (
    <AbsoluteFill style={{ background: ED.papel }}>
      <Papel />
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <Cena cena={c} dur={janelas[i].frames} inicio={janelas[i].from} base={r.base} />
        </Sequence>
      ))}

      <Manchete palavras={r.palavras ?? []} destaques={r.destaques ?? []} janelas={janelas} />

      {r.narracao && <Audio src={staticFile(r.narracao)} />}
      {r.trilha && <Audio src={staticFile(r.trilha)} volume={r.volumeTrilha ?? 0.1} loop />}
      {sons.map((s, i) => (
        <Sequence key={`s${i}`} from={s.frame} durationInFrames={FPS}>
          <Audio src={staticFile(`sfx/${s.nome}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadadosEd: CalculateMetadataFunction<RoteiroEd> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
