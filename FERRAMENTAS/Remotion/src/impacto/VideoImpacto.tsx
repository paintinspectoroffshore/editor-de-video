import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FONTE, IM } from "./tema";
import { FPS, clamp, seg } from "../editorial/movimento";
import { BlocoIm, BlocoImpacto, Y_PADRAO, sonsDoBloco } from "./blocos";

export type Palavra = { word: string; start: number; end: number };

type Fundo =
  | "escuro"
  | { video?: string; videos?: string[]; troca?: number; inicio?: number; foco?: number; escuro?: number; vel?: number; pb?: boolean };

export type CenaIm = {
  duracao: number;
  fundo?: Fundo;
  flash?: boolean;
  legenda?: "base" | "topo" | "meio" | "nao";
  blocos: BlocoIm[];
};

export type RoteiroIm = {
  base: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  palavras?: Palavra[];
  destaques?: string[];
  cenas: CenaIm[];
};

/* ------------------------------------------------------------ fundos */

const FundoEscuro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: IM.fundo }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${IM.linha}55 2px, transparent 2px), linear-gradient(90deg, ${IM.linha}55 2px, transparent 2px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${f * 0.8}px`,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 80%)",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 40% at 50% 30%, ${IM.lima}22, transparent 70%)` }} />
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ arq: string; base: string; inicio?: number; foco?: number; vel?: number; pb?: boolean; dur: number }> = ({ arq, base, inicio, foco, vel, pb, dur }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], [1.08, 1.18], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`${base}/assets/stock/${arq}.mp4`)}
        muted
        startFrom={seg(inicio ?? 0)}
        playbackRate={vel ?? 1}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${foco ?? 50}% 50%`,
          transform: `scale(${z})`,
          filter: `saturate(${pb ? 0 : 0.6}) contrast(1.15) brightness(0.8)`,
        }}
      />
    </AbsoluteFill>
  );
};

const FundoVideo: React.FC<{ fd: Exclude<Fundo, "escuro">; base: string; dur: number }> = ({ fd, base, dur }) => {
  const lista = fd.videos ?? (fd.video ? [fd.video] : []);
  const troca = seg(fd.troca ?? 0.7);
  const fatias = lista.length > 1 ? Math.ceil(dur / troca) : 1;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {lista.length === 1 && <Clip arq={lista[0]} base={base} inicio={fd.inicio} foco={fd.foco} vel={fd.vel} pb={fd.pb} dur={dur} />}
      {lista.length > 1 &&
        Array.from({ length: fatias }).map((_, i) => (
          <Sequence key={i} from={i * troca} durationInFrames={troca}>
            <Clip arq={lista[i % lista.length]} base={base} inicio={(fd.inicio ?? 1) + Math.floor(i / lista.length) * 2} foco={fd.foco} vel={fd.vel} pb={fd.pb} dur={troca} />
          </Sequence>
        ))}
      {/* escurece em cima e embaixo (legenda e UI do Instagram) + tom da marca */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${0.55 * (fd.escuro ?? 1)}) 0%, rgba(0,0,0,${0.15 * (fd.escuro ?? 1)}) 35%, rgba(0,0,0,${0.25 * (fd.escuro ?? 1)}) 55%, rgba(0,0,0,${0.85 * (fd.escuro ?? 1)}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)` }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ legenda cinética */

const chave = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function agrupar(p: Palavra[], cortes: number[]): number[][] {
  const g: number[][] = [];
  let a: number[] = [];
  p.forEach((w, i) => {
    const ant = p[i - 1];
    const corte = ant && cortes.some((c) => ant.start < c && w.start >= c - 0.05);
    if (a.length && (a.length >= 3 || /[.!?:;,]$/.test(ant.word) || w.start - ant.end > 0.3 || corte)) {
      g.push(a);
      a = [];
    }
    a.push(i);
  });
  if (a.length) g.push(a);
  return g;
}

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; pos: CenaIm["legenda"] }[] }> = ({ palavras, destaques, janelas }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const grupos = React.useMemo(() => agrupar(palavras, janelas.map((j) => j.inicio)), [palavras, janelas]);
  const dest = React.useMemo(() => new Set(destaques.map(chave)), [destaques]);
  const gi = grupos.findIndex((g, i) => {
    const ini = palavras[g[0]].start - 0.05;
    const prox = grupos[i + 1] ? palavras[grupos[i + 1][0]].start - 0.05 : palavras[g[g.length - 1]].end + 0.6;
    return t >= ini && t < Math.min(prox, palavras[g[g.length - 1]].end + 0.6);
  });
  if (gi < 0) return null;
  const g = grupos[gi];
  const jan = janelas.find((j) => palavras[g[0]].start >= j.inicio - 0.05 && palavras[g[0]].start < j.fim) ?? janelas[0];
  if (jan.pos === "nao") return null;
  const top = jan.pos === "topo" ? 210 : jan.pos === "meio" ? 860 : 1330;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 42px" }}>
        {g.map((i) => {
          const w = palavras[i];
          const fi = seg(w.start);
          const p = interpolate(f, [fi - 2, fi + 4], [0, 1], clamp);
          const ativa = t >= w.start - 0.03 && t < w.end + 0.05;
          const k = chave(w.word);
          const lima = dest.has(k) || /\d/.test(w.word);
          return (
            <span
              key={i}
              style={{
                fontFamily: FONTE.impacto,
                fontSize: 104,
                lineHeight: 1.12,
                textTransform: "uppercase",
                color: lima ? IM.lima : IM.branco,
                WebkitTextStroke: "16px #000",
                paintOrder: "stroke fill",
                opacity: p,
                transform: `scale(${(1.15 - 0.15 * p) * (ativa ? 1.05 : 1)}) translateY(${(1 - p) * 24}px)`,
                display: "inline-block",
                filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.6))",
              }}
            >
              {w.word.replace(/[.,!?;:…]+$/, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ cena */

const Cena: React.FC<{ cena: CenaIm; dur: number; base: string }> = ({ cena, dur, base }) => {
  const f = useCurrentFrame();
  const soco = interpolate(f, [0, 7], [1.07, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const flash = cena.flash ? interpolate(f, [0, 1, 5], [0.85, 0.85, 0], clamp) : 0;
  const fd = cena.fundo ?? "escuro";
  return (
    <AbsoluteFill style={{ transform: `scale(${soco})` }}>
      {fd === "escuro" ? <FundoEscuro /> : <FundoVideo fd={fd} base={base} dur={dur} />}
      {cena.blocos.map((b, i) => {
        const ini = b.em !== undefined ? seg(b.em) : 3 + i * 6;
        const livre = b.x !== undefined;
        return (
          <div key={i} style={{ position: "absolute", left: livre ? b.x : 0, top: b.y ?? Y_PADRAO[b.tipo], zIndex: b.z ?? 1 + i }}>
            <BlocoImpacto b={b} c={{ ini, dur, base }} />
          </div>
        );
      })}
      {flash > 0 && <AbsoluteFill style={{ background: "#fff", opacity: flash }} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ vídeo */

export const VideoImpacto: React.FC<RoteiroIm> = (r) => {
  const f = useCurrentFrame();
  let cursor = 0;
  const janelas = r.cenas.map((c) => {
    const frames = Math.round(c.duracao * FPS);
    const j = { inicio: cursor / FPS, fim: (cursor + frames) / FPS, frames, from: cursor, pos: c.legenda ?? "base" };
    cursor += frames;
    return j;
  });
  const total = Math.max(1, cursor);
  const sons: { frame: number; nome: string; vol: number }[] = [];
  r.cenas.forEach((c, i) => {
    if (c.flash) sons.push({ frame: janelas[i].from, nome: "whoosh", vol: 0.45 });
    c.blocos.forEach((b, k) => {
      const ini = janelas[i].from + (b.em !== undefined ? seg(b.em) : 3 + k * 6);
      sonsDoBloco(b).forEach(([d, nome, vol]) => sons.push({ frame: Math.round(ini + d), nome, vol }));
    });
  });

  return (
    <AbsoluteFill style={{ background: IM.fundo }}>
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <Cena cena={c} dur={janelas[i].frames} base={r.base} />
        </Sequence>
      ))}
      <Legenda palavras={r.palavras ?? []} destaques={r.destaques ?? []} janelas={janelas} />
      {/* barra de progresso: segura a retenção */}
      <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${(f / total) * 100}%`, background: IM.lima, boxShadow: `0 0 18px ${IM.lima}` }} />

      {r.narracao && <Audio src={staticFile(r.narracao)} />}
      {r.trilha && <Audio src={staticFile(r.trilha)} volume={r.volumeTrilha ?? 0.12} loop />}
      {sons.map((s, i) => (
        <Sequence key={`s${i}`} from={s.frame} durationInFrames={FPS}>
          <Audio src={staticFile(`sfx/${s.nome}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadadosIm: CalculateMetadataFunction<RoteiroIm> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
