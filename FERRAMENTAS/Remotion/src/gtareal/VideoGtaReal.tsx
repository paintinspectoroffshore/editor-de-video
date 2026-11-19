// Estilo GTA REAL — vídeo do jogo sempre exposto, cores originais, informação leve por cima.
// Derivado do Leonida (mesmo motor: janelas, âncoras "@palavra", legenda palavra a palavra, soco + flash nos cortes,
// sons por bloco, trilha com ducking + laço), mas SEM: fundo desenhado, tinta/gradiente, escurecimento, vinheta,
// saturação extra, selo de capítulo e blocos grandes. Fonte e crédito: texto pequeno no canto superior direito.
import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Easing, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { FPS, clamp, seg } from "../editorial/movimento";
import { BLOCOS, BlocoGr, FL, LE, fr, norm, sonsDoBloco } from "./blocos";
import { borda, neon } from "../leonida/blocos";

type Palavra = { word: string; start: number; end: number };
/** videos: "yt04" ou "yt04@1.3" (começa o clipe em 1,3 s). Sem "escuro"/"recorte": vídeo real, sem máscara. */
type FundoGr = { videos: string[]; troca?: number; foco?: number; inicio?: number };
/** recorte mínimo por clipe, só para esconder letreiro queimado do criador: zoom + ponto que fica fixo */
type Recorte = { zoom: number; origem?: string };
export type CenaGr = {
  duracao: number;
  legenda?: "base" | "topo" | "nao";
  fundo: FundoGr;
  capitulo?: string; // só marca o capítulo na barra de progresso e toca o impacto (não aparece na tela)
  transicao?: "soco" | "corte";
  fonte?: string; // "IGN via eXputer" -> canto superior direito, pequeno
  blocos: BlocoGr[];
};
export type RoteiroGr = {
  base: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  trilhaLaco?: number;
  palavras?: Palavra[];
  destaques?: string[];
  credito?: string;
  recortes?: Record<string, Recorte>;
  cenas: CenaGr[];
};

const MP3 = new Set(["whoosh-cine", "impacto-trailer", "moedas", "moeda-game", "notificacao", "sirene", "impacto"]);
const sfx = (nome: string) => staticFile(`sfx/${nome}.${MP3.has(nome) ? "mp3" : "wav"}`);

/* ------------------------------------------------------------ vídeo de fundo (cores originais) */

const Tomada: React.FC<{ src: string; dur: number; inicio: number; foco: number; rec?: Recorte }> = ({ src, dur, inicio, foco, rec }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, 7], [1.14, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) }) + interpolate(f, [0, dur], [0, 0.05], clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo src={src} muted startFrom={seg(inicio)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${foco}% 50%`, transform: `scale(${z * (rec?.zoom ?? 1)})`, transformOrigin: rec?.origem ?? "50% 50%" }} />
      {f < 4 && <AbsoluteFill style={{ background: `rgba(255,255,255,${interpolate(f, [0, 4], [0.35, 0], clamp)})` }} />}
    </AbsoluteFill>
  );
};

const FundoVideos: React.FC<{ fd: FundoGr; base: string; dur: number; recortes: Record<string, Recorte> }> = ({ fd, base, dur, recortes }) => {
  const troca = seg(fd.troca ?? 2.2);
  const n = Math.max(1, Math.round(dur / troca));
  const usos: Record<string, number> = {};
  if (!fd.videos.length) return null; // só a demo do Studio
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, k) => {
        const [v, ofs] = fd.videos[k % fd.videos.length].split("@");
        const u = (usos[v] = (usos[v] ?? -1) + 1);
        const d = k === n - 1 ? dur - k * troca : troca;
        return (
          <Sequence key={k} from={k * troca} durationInFrames={d}>
            <Tomada src={staticFile(`${base}/assets/stock/${v}.mp4`)} dur={d} inicio={ofs !== undefined ? Number(ofs) : (fd.inicio ?? 0) + (u % 2) * 0.9} foco={fd.foco ?? 50} rec={recortes[v]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ HUD mínimo */

const Progresso: React.FC<{ total: number; capitulos: number[] }> = ({ total, capitulos }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 5, background: "rgba(255,255,255,0.18)" }}>
      <div style={{ height: "100%", width: `${(f / total) * 100}%`, background: `linear-gradient(90deg, ${LE.rosa}, ${LE.laranja})` }} />
      {capitulos.map((c, i) => <div key={i} style={{ position: "absolute", top: 0, left: `${(c / total) * 100}%`, width: 3, height: 5, background: LE.amarelo }} />)}
    </div>
  );
};

/** fonte da cena + crédito: ~19 px, canto superior direito, discreto */
const Creditos: React.FC<{ fonte?: string; credito: string }> = ({ fonte, credito }) => (
  <div style={{ position: "absolute", right: 26, top: 22, maxWidth: 620, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, fontFamily: FL.ui, fontWeight: 600, fontSize: 19, lineHeight: 1.25, color: "#fff", opacity: 0.78, textAlign: "right", textShadow: "0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.6)" }}>
    {fonte && <div>Fonte: {fonte}</div>}
    <div>{credito}</div>
  </div>
);

/* ------------------------------------------------------------ legenda palavra a palavra (um pouco menor que a do Leonida) */

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

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; pos: CenaGr["legenda"] }[] }> = ({ palavras, destaques, janelas }) => {
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
  const top = jan.pos === "topo" ? 260 : 1440;
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", gap: "0 26px" }}>
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
          <span key={i} style={{ display: "inline-block", fontFamily: FL.display, fontSize: 86, lineHeight: 1.08, textTransform: "uppercase", color: cor, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 24}px) scale(${(atual ? 1.08 : 1) * (0.7 + 0.3 * p)}) rotate(${atual ? -2 : 0}deg)`, textShadow: `${borda(6)}, 0 8px 18px rgba(0,0,0,0.55)${num || ac ? ", " + neon(cor, 0.4) : ""}` }}>
            {limpo}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ cena */

const Cena: React.FC<{ cena: CenaGr; dur: number; base: string; primeira: boolean; recortes: Record<string, Recorte> }> = ({ cena, dur, base, primeira, recortes }) => {
  const f = useCurrentFrame();
  const tr = primeira ? "soco" : cena.transicao ?? "soco";
  const entra = tr === "soco" ? interpolate(f, [0, 8], [1.18, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const desfoque = tr === "soco" ? interpolate(f, [0, 6], [10, 0], clamp) : 0;
  const tremor = f < 10 ? (random(`t${f}`) - 0.5) * (10 - f) * 2 : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${entra}) translate(${tremor}px, ${-tremor}px)`, filter: desfoque > 0.3 ? `blur(${desfoque}px)` : undefined }}>
        <FundoVideos fd={cena.fundo} base={base} dur={dur} recortes={recortes} />
      </AbsoluteFill>
      <AbsoluteFill>
        {cena.blocos.map((b, i) => {
          const ini = fr(b.em, 2 + i * 5);
          const fim = b.ate !== undefined ? seg(b.ate) : dur + 10;
          if (f > fim) return null;
          const saida = b.ate !== undefined ? interpolate(f, [fim - 6, fim], [1, 0], clamp) : 1;
          const Comp = BLOCOS[b.tipo];
          if (!Comp || f < ini - 1) return null;
          const centro = b.centro ?? b.x === undefined;
          return (
            <div key={i} style={{ position: "absolute", left: centro ? 0 : b.x, width: centro ? 1080 : undefined, display: centro ? "flex" : undefined, justifyContent: "center", top: b.y ?? 180, zIndex: b.z ?? 1 + i, opacity: saida, transform: saida < 1 ? `scale(${0.9 + 0.1 * saida})` : undefined }}>
              <Comp b={b} c={{ f, ini, base, dur }} />
            </div>
          );
        })}
      </AbsoluteFill>
      {tr === "soco" && f < 5 && <AbsoluteFill style={{ background: `rgba(255,255,255,${interpolate(f, [0, 5], [0.7, 0], clamp)})` }} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ vídeo */

export const VideoGtaReal: React.FC<RoteiroGr> = (r) => {
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
  const recortes = r.recortes ?? {};

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

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <Cena cena={c} dur={janelas[i].frames} base={r.base} primeira={i === 0} recortes={recortes} />
        </Sequence>
      ))}
      <Creditos fonte={r.cenas[atual]?.fonte} credito={r.credito ?? "Imagens: Rockstar Games"} />
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

export const calcularMetadadosGr: CalculateMetadataFunction<RoteiroGr> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
