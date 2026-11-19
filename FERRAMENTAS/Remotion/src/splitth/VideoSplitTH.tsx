// Estilo SPLITTH (ref. 54 · "TH com painel de dados no topo"): 40% de cima = painel de papel milimetrado que troca
// a cada tópico ("// 01 · tema" + STATUS + régua de progresso); 60% de baixo = gravação do rosto (janelas móveis,
// desfoque onde o original tem texto queimado, último quadro congelado); legenda amarela na emenda dos dois.
// Cada bloco aceita x, y (TOPO do bloco, px do vídeo), z, em e ate (segundos da cena; âncoras "@palavra" viram
// segundos no produzir.py). Sem x = centralizado. Cena aceita rotulo, status e legenda:"nao".
import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Freeze,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FPS, clamp } from "../editorial/movimento";
import { BLOCOS, BlocoS, F, P, fr, mola, sonsDoBloco } from "./blocos";

export type Palavra = { word: string; start: number; end: number };
export type CenaS = { duracao: number; rotulo?: string; status?: string; legenda?: "nao" | "sim"; blocos: BlocoS[] };
export type JanelaRosto = { de: number; y: number; desfoque?: boolean };
export type RoteiroS = {
  base: string;
  cenas: CenaS[];
  rosto?: { video: string; janelas?: JanelaRosto[]; duracao?: number; fonte?: string };
  narracao?: string;
  palavras?: Palavra[];
  destaques?: string[];
};

const suave = Easing.bezier(0.22, 1, 0.36, 1);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const PAINEL = 0.4; // fração da altura ocupada pelo painel
const FUSAO = 110; // px do degradê que funde o papel no vídeo

// ---------- rosto ----------
const Rosto: React.FC<{ r: RoteiroS; W: number; H: number }> = ({ r, W, H }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const ro = r.rosto!;
  const js = ro.janelas?.length ? ro.janelas : [{ de: 0, y: 0 }];
  let y = js[0].y;
  let d = js[0].desfoque ? 1 : 0;
  for (let i = 1; i < js.length; i++) {
    const p = interpolate(t, [js[i].de, js[i].de + 0.4], [0, 1], { ...clamp, easing: suave });
    y += (js[i].y - y) * p;
    d += ((js[i].desfoque ? 1 : 0) - d) * p;
  }
  const topo = Math.round(H * PAINEL);
  const vh = (W * 16) / 9; // fonte vertical 9:16 na largura toda
  const ultimo = ro.duracao ? Math.floor(ro.duracao * FPS) - 2 : Infinity;
  const video = (
    <OffthreadVideo
      src={staticFile(`${r.base}/${ro.video}`)}
      muted
      style={{ width: W, height: vh, objectFit: "cover", display: "block", filter: d > 0.01 ? `blur(${26 * d}px)` : undefined }}
    />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: topo, width: W, height: H - topo, overflow: "hidden", background: "#111" }}>
      <div style={{ position: "absolute", left: 0, top: -y, width: W, height: vh, transform: `scale(${1 + 0.08 * d})`, transformOrigin: `50% ${y + (H - topo) / 2}px` }}>
        {f > ultimo ? <Freeze frame={ultimo}>{video}</Freeze> : video}
      </div>
      {d > 0.01 && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#000", opacity: 0.35 * d }} />
          <div style={{ position: "absolute", inset: 0, background: P.azul, opacity: 0.18 * d }} />
        </>
      )}
      {ro.fonte && (
        <div style={{ position: "absolute", left: 60, bottom: 44, fontFamily: F.mono, fontSize: 22, color: "rgba(255,255,255,0.72)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{ro.fonte}</div>
      )}
    </div>
  );
};

// ---------- painel (papel + cabeçalho + régua) ----------
const Papel: React.FC<{ W: number; H: number }> = ({ W, H }) => {
  const topo = Math.round(H * PAINEL);
  const grade = "rgba(26,26,26,0.06)";
  const fundo = {
    backgroundColor: P.papel,
    backgroundImage: `linear-gradient(${grade} 1.5px, transparent 1.5px), linear-gradient(90deg, ${grade} 1.5px, transparent 1.5px)`,
    backgroundSize: "48px 48px",
    backgroundPosition: "12px 12px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: topo, ...fundo }} />
      <div
        style={{
          position: "absolute", left: 0, top: topo, width: W, height: FUSAO, ...fundo,
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 45%, transparent 100%)",
          maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 45%, transparent 100%)",
        }}
      />
    </>
  );
};

const Regua: React.FC<{ W: number; total: number }> = ({ W, total }) => {
  const f = useCurrentFrame();
  const larg = W - 120;
  const n = Math.floor(larg / 12);
  const prog = Math.min(1, f / Math.max(1, total - 1));
  return (
    <svg width={larg} height={18} style={{ position: "absolute", left: 60, top: 204 }}>
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = i * 12 + 0.75;
        const azul = x <= prog * larg;
        const alto = i % 5 === 0;
        return <line key={i} x1={x} x2={x} y1={alto ? 0 : 6} y2={18} stroke={azul ? P.azul : "rgba(26,26,26,0.28)"} strokeWidth={azul ? 2 : 1.5} />;
      })}
      <line x1={0} x2={prog * larg} y1={17} y2={17} stroke={P.azul} strokeWidth={2} />
    </svg>
  );
};

const Cabecalho: React.FC<{ cena: CenaS; dur: number; W: number }> = ({ cena, dur, W }) => {
  const f = useCurrentFrame();
  const op = interpolate(f, [0, 8, dur - 6, dur], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 60, width: W - 120, top: 146, height: 48, display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: op }}>
      <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 30, color: P.azul, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>{cena.rotulo ?? ""}</div>
      {cena.status && (
        <div style={{ textAlign: "right", fontFamily: F.mono, textTransform: "uppercase" }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: P.cinza, letterSpacing: "0.18em", marginBottom: 2 }}>status</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: P.azul, letterSpacing: "0.04em" }}>{cena.status}</div>
        </div>
      )}
    </div>
  );
};

const Cena: React.FC<{ cena: CenaS; dur: number; base: string; W: number; entra: boolean; sai: boolean }> = ({ cena, dur, base, W, entra, sai }) => {
  const f = useCurrentFrame();
  const pIn = entra ? interpolate(f, [0, 10], [0, 1], { ...clamp, easing: suave }) : 1;
  const pOut = sai ? interpolate(f, [dur - 9, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) }) : 0;
  const dx = (1 - pIn) * 110 - pOut * 110;
  const op = Math.min(entra ? interpolate(f, [0, 6], [0, 1], clamp) : 1, 1 - pOut);
  return (
    <AbsoluteFill>
      <Cabecalho cena={cena} dur={dur} W={W} />
      {cena.blocos.map((b, i) => {
        const Comp = BLOCOS[b.tipo];
        if (!Comp) return null;
        const fim = typeof b.ate === "number" ? fr(b.ate) : Infinity;
        if (f > fim + 8) return null;
        const saiBloco = fim === Infinity ? 1 : interpolate(f, [fim, fim + 8], [1, 0], clamp);
        const noPainel = b.tipo !== "cta";
        return (
          <div
            key={i}
            style={{
              position: "absolute", top: b.y ?? (noPainel ? 260 : 960), zIndex: b.z ?? i,
              ...(typeof b.x === "number" ? { left: b.x } : { left: 0, width: W, display: "flex", justifyContent: "center" }),
              transform: noPainel ? `translateX(${dx}px)` : undefined, opacity: (noPainel ? op : 1 - pOut) * saiBloco,
            }}
          >
            <Comp b={b} c={{ f, base, W, dur }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- legenda (2 linhas, amarela, contorno preto) ----------
type Grupo = { ini: number; fim: number; linhas: Palavra[][] };
const agrupar = (ps: Palavra[], janelas: { inicio: number; fim: number; leg: boolean }[]): Grupo[] => {
  const grupos: Grupo[] = [];
  janelas.forEach((j) => {
    if (!j.leg) return;
    const daCena = ps.filter((w) => w.start >= j.inicio - 0.02 && w.start < j.fim - 0.02);
    let linhas: Palavra[][] = [];
    let linha: Palavra[] = [];
    const fecha = (forcaGrupo: boolean) => {
      if (linha.length) linhas.push(linha);
      linha = [];
      if (linhas.length >= 2 || (forcaGrupo && linhas.length)) {
        grupos.push({ ini: linhas[0][0].start, fim: j.fim, linhas });
        linhas = [];
      }
    };
    daCena.forEach((w, k) => {
      const txt = [...linha, w].map((x) => x.word).join(" ");
      // não deixa 1 palavra órfã antes do ponto: se ela fecha a frase, a linha estica até 31 caracteres
      const fechaFrase = /[.?!…,;:]$/.test(w.word) && txt.length <= 31 && linha.length < 7;
      const orfa = k + 1 < daCena.length && /[.?!…]$/.test(daCena[k + 1].word) && txt.length <= 22;
      if (linha.length && !fechaFrase && !orfa && (txt.length > 26 || linha.length >= 6)) fecha(false);
      linha.push(w);
      if (/[.?!…]$/.test(w.word)) fecha(true);
      else if (/[,;:]$/.test(w.word)) fecha(false);
    });
    fecha(true);
  });
  // cada grupo some quando o próximo começa (ou 0,7 s depois da última palavra)
  grupos.forEach((g, i) => {
    const ult = g.linhas[g.linhas.length - 1];
    const fimFala = ult[ult.length - 1].end + 0.7;
    g.fim = Math.min(g.fim, fimFala, grupos[i + 1]?.ini ?? Infinity);
  });
  return grupos;
};

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; leg: boolean }[]; centro: number; W: number }> = ({ palavras, destaques, janelas, centro, W }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const grupos = React.useMemo(() => agrupar(palavras, janelas), [palavras, janelas]);
  const dest = React.useMemo(() => new Set(destaques.map(norm)), [destaques]);
  const g = grupos.find((x) => t >= x.ini && t < x.fim);
  if (!g) return null;
  const m = mola(f, Math.round(g.ini * FPS), 320, 18);
  const todas = g.linhas.flat();
  return (
    <div
      style={{
        position: "absolute", left: 60, width: W - 120, top: centro, transform: `translateY(-50%) scale(${0.82 + 0.18 * m})`,
        textAlign: "center", fontFamily: F.ui, fontWeight: 800, fontSize: 64, lineHeight: 1.14, letterSpacing: "-0.01em",
        opacity: interpolate(m, [0, 0.4], [0, 1], clamp),
      }}
    >
      {g.linhas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          {l.map((w, k) => {
            const idx = todas.indexOf(w);
            const prox = todas[idx + 1];
            const ativa = t >= w.start && t < (prox ? prox.start : w.end + 0.3);
            return (
              <span
                key={k}
                style={{
                  display: "inline-block", margin: "0 0.17em", color: dest.has(norm(w.word)) ? "#FFFFFF" : P.amarelo,
                  WebkitTextStroke: "8px #000", paintOrder: "stroke fill", textShadow: "0 5px 16px rgba(0,0,0,0.45)",
                  transform: `scale(${ativa ? 1.06 : 1})`,
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ---------- composição ----------
export const VideoSplitTH: React.FC<RoteiroS> = (r) => {
  const { width: W, height: H } = useVideoConfig();
  let cursor = 0;
  const janelas = r.cenas.map((c) => {
    const frames = Math.max(1, Math.round(c.duracao * FPS));
    const j = { from: cursor, frames, inicio: cursor / FPS, fim: (cursor + frames) / FPS, leg: c.legenda !== "nao" };
    cursor += frames;
    return j;
  });
  const total = Math.max(1, cursor);
  const sons: { frame: number; arq: string; vol: number }[] = [];
  r.cenas.forEach((c, i) =>
    c.blocos.forEach((b) => sonsDoBloco(b).forEach(([s, arq, vol]) => sons.push({ frame: janelas[i].from + Math.round(s * FPS), arq, vol }))),
  );
  const topo = Math.round(H * PAINEL);
  return (
    <AbsoluteFill style={{ background: P.papel }}>
      {r.rosto?.video && <Rosto r={r} W={W} H={H} />}
      <Papel W={W} H={H} />
      <Regua W={W} total={total} />
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <Cena cena={c} dur={janelas[i].frames} base={r.base} W={W} entra={i > 0} sai={i < r.cenas.length - 1} />
        </Sequence>
      ))}
      <Legenda palavras={r.palavras ?? []} destaques={r.destaques ?? []} janelas={janelas} centro={topo + 47} W={W} />
      {r.narracao && <Audio src={staticFile(r.narracao)} />}
      {sons.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, s.frame)} durationInFrames={FPS * 2}>
          <Audio src={staticFile(`sfx/${s.arq}`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadadosSplitTH: CalculateMetadataFunction<RoteiroS> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.max(1, Math.round(c.duracao * FPS)), 0)),
});

