// Estilo LEONIDA — vibe GTA VI (pôr do sol de Vice City). Estende o motor da Crônica (janelas, âncoras,
// legenda palavra a palavra, sons por bloco) com: clipes trocando a cada ~2 s com "soco" de zoom + flash,
// fundo synthwave desenhado, HUD de capítulo (A–E), crédito "Imagens: Rockstar Games" e trilha com ducking + laço.
import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Easing, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { FPS, clamp, seg } from "../editorial/movimento";
import { BLOCOS, BlocoLe, FL, LE, alfa, borda, fr, neon, norm, sonsDoBloco } from "./blocos";

type Palavra = { word: string; start: number; end: number };
type FundoLe = "sol" | { videos: string[]; troca?: number; escuro?: number; foco?: number; inicio?: number; recorte?: number };
export type CenaLe = {
  duracao: number;
  legenda?: "base" | "topo" | "nao";
  fundo?: FundoLe;
  capitulo?: string; // "A · MAPA"
  transicao?: "soco" | "corte";
  escurecer?: number;
  credito?: boolean;
  blocos: BlocoLe[];
};
export type RoteiroLe = {
  base: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  trilhaLaco?: number; // s onde a 2ª volta da música começa
  palavras?: Palavra[];
  destaques?: string[];
  credito?: string;
  cenas: CenaLe[];
};

const MP3 = new Set(["whoosh-cine", "impacto-trailer", "moedas", "moeda-game", "notificacao", "sirene", "impacto"]);
const sfx = (nome: string) => staticFile(`sfx/${nome}.${MP3.has(nome) ? "mp3" : "wav"}`);

/* ------------------------------------------------------------ fundos */

const Palmeira: React.FC<{ x: number; y: number; s: number; flip?: boolean }> = ({ x, y, s, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill={LE.tinta}>
    <path d="M0 0 Q10 -160 40 -330 L52 -328 Q26 -160 16 0 Z" />
    {[-150, -115, -70, -30, 10, 40].map((a, i) => (
      <path key={i} transform={`translate(46 -330) rotate(${a})`} d="M0 0 Q70 -30 150 10 Q80 -8 0 8 Z" />
    ))}
  </g>
);

const Sol: React.FC = () => {
  const f = useCurrentFrame();
  const hz = 1180;
  const desl = (f * 2.2) % 60;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${LE.noite} 0%, ${LE.roxo} 36%, #5c1a5c 54%, #b8336f 62%, ${LE.noite} 62.3%, #12061c 100%)` }}>
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`sx${i}`) * 1080, top: random(`sy${i}`) * 900, width: 3, height: 3, borderRadius: 2, background: "#fff", opacity: 0.25 + 0.5 * Math.abs(Math.sin(f * 0.05 + i)) }} />
      ))}
      <div style={{ position: "absolute", left: 540 - 330, top: hz - 520, width: 660, height: 660, borderRadius: "50%", background: `linear-gradient(180deg, ${LE.amarelo} 0%, ${LE.laranja} 45%, ${LE.rosa} 85%)`, boxShadow: `0 0 120px ${alfa(LE.rosa, 0.6)}`, WebkitMaskImage: "linear-gradient(180deg, #000 0 48%, transparent 48% 52%, #000 52% 62%, transparent 62% 66%, #000 66% 74%, transparent 74% 79%, #000 79% 85%, transparent 85% 91%, #000 91%)", clipPath: `inset(0 0 ${660 - 520}px 0)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Palmeira x={70} y={hz + 6} s={1.15} />
        <Palmeira x={1010} y={hz + 6} s={0.95} flip />
        {Array.from({ length: 23 }, (_, i) => {
          const x = -1200 + i * 150;
          return <line key={i} x1={540} y1={hz} x2={x} y2={1920} stroke={alfa(LE.rosa, 0.55)} strokeWidth={2} />;
        })}
        {Array.from({ length: 14 }, (_, i) => {
          const t = (i * 60 + desl) / 840;
          const y = hz + Math.pow(t, 2.2) * (1920 - hz) * 1.0;
          return <line key={`h${i}`} x1={0} x2={1080} y1={y} y2={y} stroke={alfa(LE.rosa, 0.25 + 0.5 * t)} strokeWidth={1 + 3 * t} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "rgba(10,3,16,0.28)" }} />
    </AbsoluteFill>
  );
};

const Tomada: React.FC<{ src: string; dur: number; inicio: number; foco: number; recorte?: number }> = ({ src, dur, inicio, foco, recorte }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 7], [1.2, 1.02], { ...clamp, easing: Easing.out(Easing.cubic) }) + interpolate(f, [0, dur], [0, 0.07], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo src={src} muted startFrom={seg(inicio)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${foco}% 50%`, transform: `scale(${z * (recorte ?? 1)})`, transformOrigin: recorte ? "50% 0%" : undefined, filter: "saturate(1.15) contrast(1.06)" }} />
      {f < 5 && <AbsoluteFill style={{ background: `rgba(255,240,250,${interpolate(f, [0, 5], [0.55, 0], clamp)})` }} />}
    </AbsoluteFill>
  );
};

const FundoVideos: React.FC<{ fd: Exclude<FundoLe, "sol">; base: string; dur: number }> = ({ fd, base, dur }) => {
  const troca = seg(fd.troca ?? 2.2);
  const n = Math.max(1, Math.round(dur / troca)); // a última tomada absorve a sobra (sem "piscada" de 3 frames)
  const usos: Record<string, number> = {};
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, k) => {
        // "gta_skyline@1.3" = começa o clipe em 1,3 s (pula logo/cartela do início)
        const [v, ofs] = fd.videos[k % fd.videos.length].split("@");
        const u = (usos[v] = (usos[v] ?? -1) + 1);
        const d = k === n - 1 ? dur - k * troca : troca;
        return (
          <Sequence key={k} from={k * troca} durationInFrames={d}>
            <Tomada src={staticFile(`${base}/assets/stock/${v}.mp4`)} dur={d} inicio={ofs !== undefined ? Number(ofs) : (fd.inicio ?? 0) + (u % 2) * 0.9} foco={fd.foco ?? 50} recorte={fd.recorte} />
          </Sequence>
        );
      })}
      {/* tinta pôr do sol + topo/rodapé roxos para o texto respirar */}
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${alfa(LE.rosa, 0.22)} 0%, transparent 45%, ${alfa(LE.laranja, 0.18)} 100%)`, mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: alfa(LE.noite, fd.escuro ?? 0.3) }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alfa(LE.noite, 0.75)} 0%, transparent 18%, transparent 62%, ${alfa(LE.noite, 0.85)} 100%)` }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ HUD */

const Progresso: React.FC<{ total: number; capitulos: number[] }> = ({ total, capitulos }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 9, background: "rgba(255,255,255,0.12)" }}>
      <div style={{ height: "100%", width: `${(f / total) * 100}%`, background: `linear-gradient(90deg, ${LE.rosa}, ${LE.laranja})`, boxShadow: neon(LE.rosa, 0.5) }} />
      {capitulos.map((c, i) => <div key={i} style={{ position: "absolute", top: 0, left: `${(c / total) * 100}%`, width: 4, height: 9, background: LE.amarelo }} />)}
    </div>
  );
};

const Capitulo: React.FC<{ texto?: string; ini: number }> = ({ texto, ini }) => {
  const f = useCurrentFrame();
  if (!texto) return null;
  const [letra, ...resto] = texto.split("·").map((s) => s.trim());
  const p = interpolate(f, [ini, ini + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: "absolute", left: 50, top: 104, display: "flex", alignItems: "center", gap: 12, transform: `translateX(${(1 - p) * -60}px)`, opacity: p }}>
      <div style={{ width: 62, height: 62, borderRadius: 12, background: LE.amarelo, color: LE.tinta, fontFamily: FL.display, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: neon(LE.amarelo, 0.5) }}>{letra}</div>
      {resto.length > 0 && <div style={{ fontFamily: FL.display, fontSize: 44, letterSpacing: 2, color: LE.branco, textShadow: borda(4) }}>{resto.join(" · ")}</div>}
    </div>
  );
};

/* ------------------------------------------------------------ legenda cinética (branca, contorno preto grosso) */

// números por extenso também ficam amarelos na legenda
const NUMS = new Set("duas dois tres quatro cinco seis sete oito nove dez treze dezenove vinte trinta quarenta setenta oitenta noventa cento duzentos quatrocentos setecentos mil milhoes bilhao bilhoes virgula".split(" "));

function agrupar(p: Palavra[], cortes: number[]): number[][] {
  const g: number[][] = [];
  let a: number[] = [];
  p.forEach((w, i) => {
    const ant = p[i - 1];
    const corte = ant && cortes.some((c) => ant.start < c && w.start >= c - 0.05);
    const longo = a.reduce((s, k) => s + p[k].word.length, 0) + w.word.length > 16;
    if (a.length && (a.length >= 3 || longo || /[.!?:;,…]$/.test(ant.word) || w.start - ant.end > 0.3 || corte)) {
      g.push(a);
      a = [];
    }
    a.push(i);
  });
  if (a.length) g.push(a);
  return g;
}

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; pos: CenaLe["legenda"] }[] }> = ({ palavras, destaques, janelas }) => {
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
  const top = jan.pos === "topo" ? 230 : 1430;
  return (
    <div style={{ position: "absolute", top, left: 50, right: 50, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: "0 34px" }}>
      {g.map((i) => {
        const w = palavras[i];
        const s0 = seg(w.start);
        const p = interpolate(f, [s0 - 2, s0 + 3], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
        const atual = t >= w.start - 0.03 && (palavras[i + 1] ? t < palavras[i + 1].start - 0.03 : t < w.end + 0.3);
        const limpo = w.word.replace(/[.,!?;:…]+$/, "");
        const num = /\d/.test(limpo) || NUMS.has(norm(limpo));
        const ac = dest.has(norm(limpo));
        const cor = num ? LE.amarelo : ac ? LE.rosa : LE.branco;
        return (
          <span key={i} style={{ display: "inline-block", fontFamily: FL.display, fontSize: 108, lineHeight: 1.08, textTransform: "uppercase", color: cor, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 30}px) scale(${(atual ? 1.1 : 1) * (0.7 + 0.3 * p)}) rotate(${atual ? -2 : 0}deg)`, textShadow: `${borda(9)}, 0 10px 24px rgba(0,0,0,0.6)${num || ac ? ", " + neon(cor, 0.6) : ""}` }}>
            {limpo}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ cena */

const Cena: React.FC<{ cena: CenaLe; dur: number; base: string; primeira: boolean }> = ({ cena, dur, base, primeira }) => {
  const f = useCurrentFrame();
  const tr = primeira ? "soco" : cena.transicao ?? "soco";
  const entra = tr === "soco" ? interpolate(f, [0, 8], [1.22, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const desfoque = tr === "soco" ? interpolate(f, [0, 6], [12, 0], clamp) : 0;
  const tremor = f < 10 ? (random(`t${f}`) - 0.5) * (10 - f) * 2 : 0;
  const respira = interpolate(f, [0, dur], [1, 1.03], clamp);
  const fundo = cena.fundo ?? "sol";
  const escuro = cena.escurecer ? interpolate(f, [0, 10], [0, cena.escurecer], clamp) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${entra}) translate(${tremor}px, ${-tremor}px)`, filter: desfoque > 0.3 ? `blur(${desfoque}px)` : undefined }}>
        {fundo === "sol" ? <Sol /> : <FundoVideos fd={fundo} base={base} dur={dur} />}
      </AbsoluteFill>
      {escuro > 0 && <AbsoluteFill style={{ background: `rgba(10,3,16,${escuro})` }} />}
      <AbsoluteFill style={{ transform: `scale(${respira * entra})`, transformOrigin: "50% 45%" }}>
        {cena.blocos.map((b, i) => {
          const ini = fr(b.em, 2 + i * 5);
          const fim = b.ate !== undefined ? seg(b.ate) : dur + 10;
          if (f > fim) return null;
          const saida = b.ate !== undefined ? interpolate(f, [fim - 6, fim], [1, 0], clamp) : 1;
          const Comp = BLOCOS[b.tipo];
          if (!Comp || f < ini - 1) return null;
          const centro = b.centro ?? b.x === undefined;
          return (
            <div key={i} style={{ position: "absolute", left: centro ? 0 : b.x, width: centro ? 1080 : undefined, display: centro ? "flex" : undefined, justifyContent: "center", top: b.y ?? 400, zIndex: b.z ?? 1 + i, opacity: saida, transform: saida < 1 ? `scale(${0.9 + 0.1 * saida})` : undefined }}>
              <Comp b={b} c={{ f, ini, base, dur }} />
            </div>
          );
        })}
      </AbsoluteFill>
      {tr === "soco" && f < 6 && <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(255,255,255,${interpolate(f, [0, 6], [0.85, 0], clamp)}), ${alfa(LE.rosa, interpolate(f, [0, 6], [0.6, 0], clamp))})` }} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ vídeo */

export const VideoLeonida: React.FC<RoteiroLe> = (r) => {
  const f = useCurrentFrame();
  let cursor = 0;
  const janelas = r.cenas.map((c) => {
    const frames = Math.round(c.duracao * FPS);
    const j = { inicio: cursor / FPS, fim: (cursor + frames) / FPS, frames, from: cursor, pos: c.legenda ?? "base" };
    cursor += frames;
    return j;
  });
  const total = Math.max(1, cursor);
  const atual = Math.max(0, janelas.findIndex((j) => f >= j.from && f < j.from + j.frames));
  const aberturas = r.cenas.map((c, i) => i === 0 || c.capitulo !== r.cenas[i - 1].capitulo);
  // início do capítulo atual (para animar o selo só quando o capítulo muda)
  let iniCap = 0;
  for (let i = atual; i >= 0; i--) if (aberturas[i]) { iniCap = janelas[i].from; break; }

  const sons: { frame: number; nome: string; vol: number; dur: number }[] = [];
  r.cenas.forEach((c, i) => {
    if (aberturas[i]) sons.push({ frame: janelas[i].from, nome: "impacto-trailer", vol: 0.32, dur: 3 * FPS });
    else if ((c.transicao ?? "soco") !== "corte") sons.push({ frame: janelas[i].from, nome: "whoosh-cine", vol: 0.28, dur: FPS + 10 });
    c.blocos.forEach((b, k) => {
      const ini = fr(b.em, 2 + k * 5);
      sonsDoBloco(b, ini).forEach(([d, nome, vol]) => sons.push({ frame: janelas[i].from + Math.round(d), nome, vol, dur: MP3.has(nome) ? 2 * FPS : FPS }));
    });
  });

  // ducking: música baixa enquanto há fala (média móvel para não "bombear")
  const palavras = r.palavras ?? [];
  const fala = React.useMemo(() => {
    const a = new Float32Array(total + 1);
    palavras.forEach((w) => {
      for (let k = Math.max(0, seg(w.start - 0.15)); k <= Math.min(total, seg(w.end + 0.25)); k++) a[k] = 1;
    });
    const m = new Float32Array(total + 1);
    let acc = 0;
    const J = 8;
    for (let k = 0; k <= total; k++) {
      acc += a[k] - (k - 2 * J - 1 >= 0 ? a[k - 2 * J - 1] : 0);
      m[Math.max(0, k - J)] = acc / (2 * J + 1);
    }
    return m;
  }, [palavras, total]);
  const volBase = r.volumeTrilha ?? 0.16;
  const LMUS = seg(105.6), XF = seg(3), laco = seg(r.trilhaLaco ?? 0);
  const voltas: number[] = [];
  for (let s = 0; s < total; s += (voltas.length === 1 ? LMUS : LMUS - laco) - XF) voltas.push(s);
  const credito = r.credito ?? "Imagens: Rockstar Games";
  const cenaAtual = r.cenas[atual];
  const temJogo = cenaAtual && (cenaAtual.credito ?? (cenaAtual.fundo !== undefined && cenaAtual.fundo !== "sol"));

  return (
    <AbsoluteFill style={{ background: LE.noite }}>
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <Cena cena={c} dur={janelas[i].frames} base={r.base} primeira={i === 0} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(10,3,16,0.6) 100%)" }} />
      <Capitulo texto={cenaAtual?.capitulo} ini={iniCap} />
      {temJogo && <div style={{ position: "absolute", right: 46, top: 120, fontFamily: FL.ui, fontWeight: 600, fontSize: 22, color: "#fff", opacity: 0.6, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>{credito}</div>}
      <Legenda palavras={palavras} destaques={r.destaques ?? []} janelas={janelas} />
      <Progresso total={total} capitulos={janelas.filter((_, i) => aberturas[i] && i > 0).map((j) => j.from)} />
      {r.narracao && <Audio src={staticFile(r.narracao)} />}
      {r.trilha && voltas.map((ini, k) => {
        const off = k === 0 ? 0 : laco;
        const dur = Math.min(LMUS - off, total - ini);
        return (
          <Sequence key={`m${k}`} from={ini} durationInFrames={Math.max(1, dur)}>
            <Audio src={staticFile(r.trilha!)} startFrom={off} volume={(fl) => {
              const g = ini + fl;
              const entra = k === 0 ? 1 : interpolate(fl, [0, XF], [0, 1], clamp);
              const sai = k < voltas.length - 1 ? interpolate(fl, [dur - XF, dur], [1, 0], clamp) : interpolate(g, [total - seg(1.5), total], [1, 0], clamp);
              return volBase * (1 - 0.45 * (fala[Math.min(g, total)] ?? 0)) * entra * sai;
            }} />
          </Sequence>
        );
      })}
      {sons.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, s.frame)} durationInFrames={s.dur}>
          <Audio src={sfx(s.nome)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadadosLe: CalculateMetadataFunction<RoteiroLe> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
