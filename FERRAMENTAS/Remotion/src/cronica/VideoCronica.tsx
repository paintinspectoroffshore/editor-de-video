// Estilo CRÔNICA — casca do vídeo: mesa de montagem, película (grão, poeira, tremor, flash de projetor),
// fundo de vídeo real tratado como arquivo, câmera sobre a mesa, legenda palavra a palavra com marca-texto,
// régua/linha do tempo como barra de progresso, carimbos de cabeçalho e sons. Blocos em ./blocos.tsx.
import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { FPS, clamp, seg } from "../editorial/movimento";
import { BLOCOS, BlocoCr, CR, FT, alfa, fr, norm, sonsDoBloco } from "./blocos";

export type Palavra = { word: string; start: number; end: number };
export type FundoCr = "mesa" | { video: string; escuro?: number; pb?: boolean; inicio?: number; vel?: number; foco?: number; zoom?: number; desfoque?: number };
export type CenaCr = {
  duracao: number;
  legenda?: "base" | "topo" | "nao";
  fundo?: FundoCr;
  transicao?: "pelicula" | "zoom" | "corte";
  capitulo?: string;
  escurecer?: number;
  camera?: { zoom?: number; x?: number; y?: number; em?: number; dur?: number };
  blocos: BlocoCr[];
};
export type RoteiroCr = {
  base: string;
  cor?: string;
  selo?: string;
  data?: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  palavras?: Palavra[];
  destaques?: string[];
  cenas: CenaCr[];
};

/* ------------------------------------------------------------ fundo: mesa + película */

const Mesa: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 42%, ${CR.mesa2} 0%, ${CR.mesa} 62%, #0A0806 100%)` }}>
      <Img src={staticFile("texturas/fibra.png")} style={{ position: "absolute", inset: 0, width: 1080, height: 1920, opacity: 0.1, mixBlendMode: "screen", transform: `translate(${Math.sin(f * 0.01) * 6}px, 0)` }} />
      {/* grade discreta de tapete de corte */}
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${alfa(CR.creme, 0.035)} 2px, transparent 2px), linear-gradient(90deg, ${alfa(CR.creme, 0.035)} 2px, transparent 2px)`, backgroundSize: "108px 108px", backgroundPosition: "-2px -2px" }} />
    </AbsoluteFill>
  );
};

const FundoVideo: React.FC<{ fd: Exclude<FundoCr, "mesa">; base: string; dur: number }> = ({ fd, base, dur }) => {
  const f = useCurrentFrame();
  const z = (fd.zoom ?? 1.08) + interpolate(f, [0, dur], [0, 0.07], clamp);
  const tremor = Math.floor(f / 2);
  const tx = (random(`vx${tremor}`) - 0.5) * 3, ty = (random(`vy${tremor}`) - 0.5) * 4;
  const pb = fd.pb !== false;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`${base}/assets/stock/${fd.video}.mp4`)}
        muted
        startFrom={seg(fd.inicio ?? 0)}
        playbackRate={fd.vel ?? 1}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fd.foco ?? 50}% 50%`, transform: `scale(${z}) translate(${tx}px, ${ty}px)`, filter: pb ? "grayscale(1) sepia(0.28) contrast(1.18) brightness(0.85)" : "saturate(0.55) sepia(0.2) contrast(1.12) brightness(0.85)", ...(fd.desfoque ? { filter: `${pb ? "grayscale(1) sepia(0.28) contrast(1.18) brightness(0.85)" : "saturate(0.55) sepia(0.2) contrast(1.12) brightness(0.85)"} blur(${fd.desfoque}px)` } : {}) }}
      />
      <AbsoluteFill style={{ background: alfa(CR.mesa, fd.escuro ?? 0.6) }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 65% at 50% 45%, transparent 30%, rgba(8,6,4,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Grão animado + poeira + riscos + vinheta + leve oscilação de luz do projetor. */
const Pelicula: React.FC = () => {
  const f = useCurrentFrame();
  const sd = f % 6;
  const risco = random(`r${Math.floor(f / 3)}`);
  const xr = random(`rx${Math.floor(f / 3)}`) * 1080;
  const luz = 0.035 * (random(`l${f}`) - 0.5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "overlay" }}>
        <filter id={`gr${sd}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={sd * 7 + 1} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#gr${sd})`} />
      </svg>
      {risco < 0.22 && <div style={{ position: "absolute", left: xr, top: 0, width: 2, height: 1920, background: alfa(CR.creme, 0.12) }} />}
      {Array.from({ length: 3 }).map((_, i) => {
        const r = random(`p${i}${Math.floor(f / 2)}`);
        if (r > 0.35) return null;
        return <div key={i} style={{ position: "absolute", left: random(`px${i}${f}`) * 1080, top: random(`py${i}${f}`) * 1920, width: 3 + r * 8, height: 3 + r * 5, borderRadius: 6, background: alfa(CR.creme, 0.25) }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 95% 75% at 50% 48%, transparent 55%, rgba(5,4,3,0.6) 100%)" }} />
      <AbsoluteFill style={{ background: luz > 0 ? `rgba(255,240,215,${luz})` : `rgba(0,0,0,${-luz})` }} />
    </AbsoluteFill>
  );
};

/** Filtro de tinta irregular para carimbos (referenciado por url(#cr-tinta)). */
const Filtros: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="cr-tinta">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={3} result="ru" />
      <feDisplacementMap in="SourceGraphic" in2="ru" scale={4} result="d" />
      <feComponentTransfer in="ru" result="m">
        <feFuncA type="discrete" tableValues="1 1 1 0.4 1 1" />
      </feComponentTransfer>
      <feComposite in="d" in2="m" operator="in" />
    </filter>
  </svg>
);

/* ------------------------------------------------------------ régua de progresso + cabeçalho */

const ReguaTempo: React.FC<{ total: number; cortes: number[]; cor: string }> = ({ total, cortes, cor }) => {
  const f = useCurrentFrame();
  const x0 = 60, x1 = 1020, y = 34;
  const X = (fr_: number) => x0 + (fr_ / total) * (x1 - x0);
  const segs = Math.floor(total / FPS);
  const t = Math.floor(f / FPS);
  return (
    <svg width={1080} height={80} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={alfa(CR.creme, 0.25)} strokeWidth={3} />
      {Array.from({ length: segs + 1 }).map((_, i) => (
        <line key={i} x1={X(i * FPS)} x2={X(i * FPS)} y1={y} y2={y + (i % 5 === 0 ? 12 : 6)} stroke={alfa(CR.creme, i % 5 === 0 ? 0.45 : 0.22)} strokeWidth={2} />
      ))}
      {cortes.map((k, i) => (
        <line key={`c${i}`} x1={X(k)} x2={X(k)} y1={y - 10} y2={y + 18} stroke={alfa(CR.creme, 0.7)} strokeWidth={3} />
      ))}
      <line x1={x0} x2={X(f)} y1={y} y2={y} stroke={cor} strokeWidth={5} />
      <path d={`M ${X(f) - 9} ${y - 18} L ${X(f) + 9} ${y - 18} L ${X(f)} ${y - 4} Z`} fill={cor} />
      <text x={Math.min(x1 - 40, Math.max(x0 + 40, X(f)))} y={y + 40} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={20} fill={alfa(CR.creme, 0.7)}>
        {`00:${String(t).padStart(2, "0")}`}
      </text>
    </svg>
  );
};

const Cabecalho: React.FC<{ selo?: string; data?: string; capitulo?: string; ini: number; cor: string }> = ({ selo, data, capitulo, ini, cor }) => {
  const f = useCurrentFrame();
  const cap = capitulo ?? "";
  // sem capítulo o intervalo ficava [4,4] e o Remotion quebrava: garante duração mínima de 1 frame
  const n = Math.round(interpolate(f, [ini + 4, ini + 5 + cap.length * 1.2], [0, cap.length], clamp));
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 96, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FT.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: alfa(CR.creme, 0.72), textTransform: "uppercase" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: cor, opacity: Math.floor(f / 15) % 2 ? 1 : 0.35 }} />
        {selo ?? "CRÔNICA"}
        {cap && <span style={{ color: alfa(CR.creme, 0.45) }}>{` · ${cap.slice(0, n)}`}</span>}
      </span>
      {data && <span style={{ border: `2px solid ${alfa(CR.creme, 0.5)}`, padding: "4px 12px", borderRadius: 4 }}>{data}</span>}
    </div>
  );
};

/* ------------------------------------------------------------ legenda palavra a palavra */

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

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; pos: CenaCr["legenda"] }[]; cor: string }> = ({ palavras, destaques, janelas, cor }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const grupos = React.useMemo(() => agrupar(palavras, janelas.map((j) => j.inicio)), [palavras, janelas]);
  const dest = React.useMemo(() => new Set(destaques.map(norm)), [destaques]);
  const gi = grupos.findIndex((g, i) => {
    const ini = palavras[g[0]].start - 0.05;
    const prox = grupos[i + 1] ? palavras[grupos[i + 1][0]].start - 0.05 : palavras[g[g.length - 1]].end + 0.6;
    return t >= ini && t < Math.min(prox, palavras[g[g.length - 1]].end + 0.6);
  });
  if (gi < 0) return null;
  const g = grupos[gi];
  const jan = janelas.find((j) => palavras[g[0]].start >= j.inicio - 0.05 && palavras[g[0]].start < j.fim) ?? janelas[0];
  if (jan.pos === "nao") return null;
  const top = jan.pos === "topo" ? 230 : 1420;
  const escuro = cor && parseInt(cor.slice(1, 3), 16) * 0.299 + parseInt(cor.slice(3, 5), 16) * 0.587 + parseInt(cor.slice(5, 7), 16) * 0.114 > 140;
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 10px" }}>
      {g.map((i) => {
        const w = palavras[i];
        const p = interpolate(f, [seg(w.start) - 2, seg(w.start) + 3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const atual = t >= w.start - 0.03 && (palavras[i + 1] ? t < palavras[i + 1].start - 0.03 : t < w.end + 0.3);
        const ac = dest.has(norm(w.word)) || /\d/.test(w.word);
        const hp = atual ? interpolate(f, [seg(w.start) - 1, seg(w.start) + 3], [0, 1], clamp) : 0;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", padding: "0 12px", opacity: p, transform: `translateY(${(1 - p) * 16}px) rotate(${atual ? -1.2 : 0}deg) scale(${atual ? 1.04 : 1})` }}>
            {hp > 0 && <span style={{ position: "absolute", left: 0, top: 10, bottom: 6, width: `${hp * 100}%`, background: cor, borderRadius: 6, transform: "skewX(-6deg)" }} />}
            <span style={{ position: "relative", fontFamily: FT.serif, fontWeight: 800, fontSize: 80, lineHeight: 1.12, letterSpacing: -0.5, color: hp > 0.4 ? (escuro ? CR.tinta : CR.creme) : ac ? cor : CR.creme, textShadow: hp > 0.4 ? "none" : "0 6px 22px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.6)" }}>
              {w.word.replace(/[.,!?;:…]+$/, "")}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ cena */

const Cena: React.FC<{ cena: CenaCr; dur: number; base: string; primeira: boolean; cor: string }> = ({ cena, dur, base, primeira, cor }) => {
  const f = useCurrentFrame();
  const tr = primeira ? "corte" : cena.transicao ?? "pelicula";
  // câmera: respira devagar (1 → 1,025) + zoom opcional sobre um ponto da mesa
  const cam = cena.camera;
  const respira = interpolate(f, [0, dur], [1, 1.025], clamp);
  const zc = cam ? interpolate(f, [fr(cam.em, 0), fr(cam.em, 0) + seg(cam.dur ?? 1.2)], [1, cam.zoom ?? 1.15], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
  let entra = 1, desliza = 0, desfoque = 0;
  if (tr === "zoom") {
    entra = interpolate(f, [0, 12], [1.28, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    desfoque = interpolate(f, [0, 10], [10, 0], clamp);
  }
  if (tr === "pelicula") desliza = interpolate(f, [0, 5], [-140, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const escuro = cena.escurecer ? interpolate(f, [0, 10], [0, cena.escurecer], clamp) : 0;
  return (
    <AbsoluteFill>
      {cena.fundo && cena.fundo !== "mesa" && <FundoVideo fd={cena.fundo} base={base} dur={dur} />}
      {escuro > 0 && <AbsoluteFill style={{ background: `rgba(5,4,3,${escuro})` }} />}
      <AbsoluteFill style={{ transform: `translateY(${desliza}px) scale(${respira * zc * entra})`, transformOrigin: `${cam?.x ?? 50}% ${cam?.y ?? 45}%`, filter: desfoque > 0.3 ? `blur(${desfoque}px)` : undefined }}>
        {cena.blocos.map((b, i) => {
          const ini = fr(b.em, 2 + i * 5);
          const fim = b.ate !== undefined ? seg(b.ate) : dur + 10;
          if (f > fim) return null;
          const saida = b.ate !== undefined ? interpolate(f, [fim - 6, fim], [1, 0], clamp) : 1;
          const Comp = BLOCOS[b.tipo];
          if (!Comp || f < ini - 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: b.x ?? 70, top: b.y ?? 400, zIndex: b.z ?? 1 + i, opacity: saida, transform: saida < 1 ? `translateY(${(1 - saida) * -30}px)` : undefined }}>
              <Comp b={b} c={{ f, ini, base, cor, dur }} />
            </div>
          );
        })}
      </AbsoluteFill>
      {tr === "pelicula" && f < 8 && (
        <>
          <AbsoluteFill style={{ background: `rgba(255,244,222,${interpolate(f, [0, 1, 6], [0.9, 0.7, 0], clamp)})` }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(f, [0, 6], [1700, -120], clamp), height: 90, background: "#050403", opacity: 0.85 }} />
        </>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ vídeo */

export const VideoCronica: React.FC<RoteiroCr> = (r) => {
  const f = useCurrentFrame();
  const cor = r.cor ?? CR.acento;
  let cursor = 0;
  const janelas = r.cenas.map((c) => {
    const frames = Math.round(c.duracao * FPS);
    const j = { inicio: cursor / FPS, fim: (cursor + frames) / FPS, frames, from: cursor, pos: c.legenda ?? "base" };
    cursor += frames;
    return j;
  });
  const total = Math.max(1, cursor);
  const atual = Math.max(0, janelas.findIndex((j) => f >= j.from && f < j.from + j.frames));
  const sons: { frame: number; nome: string; vol: number }[] = [];
  r.cenas.forEach((c, i) => {
    if (i > 0 && (c.transicao ?? "pelicula") !== "corte") sons.push({ frame: janelas[i].from, nome: c.transicao === "zoom" ? "whoosh" : "click", vol: c.transicao === "zoom" ? 0.3 : 0.4 });
    c.blocos.forEach((b, k) => {
      const ini = fr(b.em, 2 + k * 5);
      sonsDoBloco(b, ini).forEach(([d, nome, vol]) => sons.push({ frame: janelas[i].from + Math.round(d), nome, vol }));
    });
  });
  // tremor de projetor (gate weave) bem leve no conteúdo todo
  const gw = Math.floor(f / 2);
  const wx = (random(`gx${gw}`) - 0.5) * 1.6, wy = (random(`gy${gw}`) - 0.5) * 2.2;

  return (
    <AbsoluteFill style={{ background: CR.mesa }}>
      <Filtros />
      <Mesa />
      <AbsoluteFill style={{ transform: `translate(${wx}px, ${wy}px)` }}>
        {r.cenas.map((c, i) => (
          <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
            <Cena cena={c} dur={janelas[i].frames} base={r.base} primeira={i === 0} cor={cor} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Cabecalho selo={r.selo} data={r.data} capitulo={r.cenas[atual]?.capitulo} ini={janelas[atual]?.from ?? 0} cor={cor} />
      <Legenda palavras={r.palavras ?? []} destaques={r.destaques ?? []} janelas={janelas} cor={cor} />
      <Pelicula />
      <ReguaTempo total={total} cortes={janelas.slice(1).map((j) => j.from)} cor={cor} />
      {r.narracao && <Audio src={staticFile(r.narracao)} />}
      {r.trilha && <Audio src={staticFile(r.trilha)} volume={r.volumeTrilha ?? 0.1} loop />}
      {sons.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, s.frame)} durationInFrames={FPS}>
          <Audio src={staticFile(`sfx/${s.nome}.wav`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadadosCr: CalculateMetadataFunction<RoteiroCr> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
