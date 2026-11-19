// Estilo DOSSIÊ: investigação escura. Gramática do catálogo 05 e 07, sem copiar arte:
// preto pontilhado, número gigante com pílula da fonte, ficha creme com caixinha e círculo vermelho à mão,
// mapa pontilhado, palavra-chave em vermelho. Cada bloco aceita x, y, z, em (entra) e ate (sai).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FPS, clamp, mola, prog, seg } from "../editorial/movimento";

export const DO = {
  fundo: "#0D0D11",
  ponto: "#26262E",
  creme: "#ECE5D3",
  cremeEsc: "#8A8370",
  tinta: "#16161B",
  vermelho: "#E5333F",
  cinza: "#8C8C99",
  branco: "#F2EEE6",
  azulIG: "#0095F6",
};
const F = { pesada: "Archivo Black, Impact, sans-serif", mono: "JetBrains Mono, monospace", ui: "Inter, sans-serif" };

export type Palavra = { word: string; start: number; end: number };
// Blocos são dados do roteiro.json (âncoras "@palavra" já viram segundos no produzir.py)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlocoDo = { tipo: string; x?: number; y?: number; z?: number; em?: number; ate?: number; [k: string]: any };
export type CenaDo = { duracao: number; legenda?: "base" | "topo" | "nao"; blocos: BlocoDo[] };
export type RoteiroDo = {
  base: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  palavras?: Palavra[];
  destaques?: string[];
  cenas: CenaDo[];
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const fr = (s: number | undefined, padrao: number) => (typeof s === "number" ? seg(s) : padrao);

/* ------------------------------------------------------------ peças */

const Kicker: React.FC<{ texto: string; cor?: string }> = ({ texto, cor }) => (
  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: cor ?? DO.cinza, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 16 }}>
    <span style={{ width: 16, height: 16, background: DO.vermelho, display: "inline-block" }} />
    {texto}
  </div>
);

const Pilula: React.FC<{ texto: string; p?: number }> = ({ texto, p = 1 }) => (
  <span
    style={{
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 34,
      letterSpacing: 2,
      background: DO.branco,
      color: DO.tinta,
      padding: "10px 26px",
      borderRadius: 40,
      display: "inline-block",
      opacity: p,
      transform: `translateY(${(1 - p) * 14}px)`,
      whiteSpace: "nowrap",
    }}
  >
    {texto}
  </span>
);

const Palavras: React.FC<{ texto: string; vermelho: Set<string>; style: React.CSSProperties }> = ({ texto, vermelho, style }) => (
  <div style={style}>
    {texto.split(" ").map((w, i) => (
      <span key={i} style={{ color: vermelho.has(norm(w)) ? DO.vermelho : undefined }}>
        {w}
        {i < texto.split(" ").length - 1 ? " " : ""}
      </span>
    ))}
  </div>
);

/* ------------------------------------------------------------ blocos */

type Ctx = { f: number; ini: number; base: string };

const Manchete: React.FC<{ b: BlocoDo; c: Ctx }> = ({ b, c }) => {
  const ver = new Set<string>((b.vermelho ?? []).map(norm));
  const t = c.f - c.ini;
  const glitch = b.glitch && t < 12 ? (random(`g${c.f}`) - 0.5) * 26 : 0;
  return (
    <div style={{ width: b.w ?? 940 }}>
      {b.kicker && <div style={{ marginBottom: 26, opacity: prog(c.f, c.ini, 8) }}><Kicker texto={b.kicker} /></div>}
      {(b.linhas as string[]).map((l, i) => {
        const p = prog(c.f, c.ini + i * 3, 10);
        return (
          <Palavras
            key={i}
            texto={l}
            vermelho={ver}
            style={{
              fontFamily: F.pesada,
              fontSize: b.tamanho ?? 150,
              lineHeight: 1.0,
              color: DO.branco,
              textTransform: "uppercase",
              opacity: p,
              transform: `translateY(${(1 - p) * 50}px) translateX(${glitch}px)`,
              textShadow: glitch ? `${glitch * 0.6}px 0 ${DO.vermelho}, ${-glitch * 0.6}px 0 #3AA0FF` : "none",
            }}
          />
        );
      })}
    </div>
  );
};

const Numero: React.FC<{ b: BlocoDo; c: Ctx }> = ({ b, c }) => {
  const p = interpolate(c.f, [c.ini, c.ini + 20], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const valor = Math.round((b.valor as number) * p);
  const txt = `${b.prefixo ?? ""}${valor}${b.sufixo ?? ""}`;
  const tam = b.tamanho ?? (txt.length <= 2 ? 380 : txt.length <= 3 ? 300 : 250);
  const m = mola(c.f, c.ini, 200, 15);
  return (
    <div style={{ width: b.w ?? 940 }}>
      {b.kicker && <div style={{ opacity: prog(c.f, c.ini, 8) }}><Kicker texto={b.kicker} /></div>}
      <div style={{ fontFamily: F.pesada, fontSize: tam, lineHeight: 1.02, color: DO.branco, transform: `scale(${0.85 + 0.15 * m})`, transformOrigin: "left center", opacity: Math.min(1, m * 2) }}>
        {txt.split("").map((ch, i) => (
          <span key={i} style={{ color: /[+%]/.test(ch) ? DO.vermelho : undefined }}>{ch}</span>
        ))}
      </div>
      {b.unidade && (
        <div style={{ fontFamily: F.pesada, fontSize: b.tamUnidade ?? 92, color: DO.branco, lineHeight: 1, marginTop: -6, opacity: prog(c.f, c.ini + 6, 10), textTransform: "uppercase" }}>
          {b.unidade}
        </div>
      )}
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 30, flexWrap: "wrap" }}>
        {b.fonte && <Pilula texto={b.fonte} p={prog(c.f, c.ini + 10, 10)} />}
      </div>
      {b.nota && (
        <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 42, color: DO.cinza, marginTop: 26, opacity: prog(c.f, c.ini + 16, 10), maxWidth: 900 }}>
          {b.nota}
        </div>
      )}
    </div>
  );
};

const Check: React.FC<{ p: number }> = ({ p }) => (
  <svg width={84} height={84} viewBox="0 0 84 84" style={{ position: "absolute", left: -6, top: -14 }}>
    <path d="M10 44 L32 66 L78 8" fill="none" stroke={DO.vermelho} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={120} strokeDashoffset={120 * (1 - p)} />
  </svg>
);

const Circulo: React.FC<{ p: number; w: number }> = ({ p, w }) => (
  <svg width={w + 120} height={150} viewBox={`0 0 ${w + 120} 150`} style={{ position: "absolute", left: -60, top: -42, overflow: "visible" }}>
    <path
      d={`M ${w * 0.55} 22 C ${w + 110} 6, ${w + 120} 120, ${w * 0.5} 128 C 20 136, -10 70, 40 34 C 90 6, ${w * 0.8} 14, ${w + 60} 40`}
      fill="none"
      stroke={DO.vermelho}
      strokeWidth={7}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  </svg>
);

const Ficha: React.FC<{ b: BlocoDo; c: Ctx }> = ({ b, c }) => {
  const m = mola(c.f, c.ini, 160, 16);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  return (
    <div style={{ width: b.w ?? 940, opacity: Math.min(1, m * 2), transform: `translateY(${(1 - m) * 80}px) rotate(${(1 - m) * -3 + (b.rot ?? -0.8)}deg)`, boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
      <div style={{ background: DO.tinta, color: DO.creme, fontFamily: F.mono, fontWeight: 700, fontSize: 40, letterSpacing: 3, padding: "24px 36px", textTransform: "uppercase" }}>{b.cabecalho}</div>
      <div style={{ background: DO.creme, padding: "30px 40px 44px" }}>
        {b.sub && <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 32, color: DO.cremeEsc, letterSpacing: 2, marginBottom: 30, textTransform: "uppercase" }}>{b.sub}</div>}
        {itens.map((it, i) => {
          const ie = fr(it.em, c.ini + 6 + i * 5);
          const p = prog(c.f, ie, 8);
          const okP = it.okEm !== undefined ? prog(c.f, seg(it.okEm), 8) : 0;
          const ciP = it.circuloEm !== undefined ? interpolate(c.f, [seg(it.circuloEm), seg(it.circuloEm) + 12], [0, 1], clamp) : 0;
          const piP = it.pilula ? prog(c.f, fr(it.pilulaEm, ie + 8), 8) : 0;
          const largura = String(it.t).length * 37;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 34, marginTop: i ? 34 : 0, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <div style={{ position: "relative", width: 72, height: 72, border: `6px solid ${DO.tinta}`, flexShrink: 0 }}>
                {okP > 0 && <Check p={okP} />}
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: it.tam ?? 58, color: DO.tinta, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1.1 }}>{it.t}</div>
                {ciP > 0 && <Circulo p={ciP} w={largura} />}
                {it.pilula && (
                  <div style={{ marginTop: 12 }}>
                    <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, background: DO.tinta, color: DO.creme, padding: "6px 18px", borderRadius: 30, opacity: piP, display: "inline-block" }}>{it.pilula}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Onda: React.FC<{ b: BlocoDo; c: Ctx }> = ({ b, c }) => {
  const n = b.barras ?? 46;
  const w = b.w ?? 940;
  const h = b.altura ?? 260;
  const cortes: number[] = (b.cortes ?? []).map((k: { em: number }) => seg(k.em));
  const feitos = cortes.filter((k) => c.f >= k).length;
  const recem = cortes.some((k) => c.f >= k && c.f < k + 6);
  let amp = cortes.length ? 1 - (feitos / cortes.length) * 0.92 : 1;
  if (b.apagar) amp *= interpolate(c.f - c.ini, [0, 24], [1, 0.04], clamp);
  const entra = prog(c.f, c.ini, 10);
  const cor = amp < 0.15 ? DO.cinza : DO.vermelho;
  return (
    <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: entra, filter: amp > 0.15 ? `drop-shadow(0 0 22px ${DO.vermelho}88)` : "none", transform: recem ? `translateX(${(random(`o${c.f}`) - 0.5) * 30}px)` : "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const env = Math.sin((i / (n - 1)) * Math.PI) * 0.75 + 0.25;
        const mov = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.9 + c.f * 0.32) * Math.cos(i * 0.37 - c.f * 0.17));
        const alt = Math.max(8, h * env * mov * amp * entra);
        return <div key={i} style={{ width: (w / n) * 0.55, height: alt, background: cor, borderRadius: 6 }} />;
      })}
    </div>
  );
};

// Contorno simplificado do Brasil (lon, lat). Desenho estilizado, não cartográfico.
const BR: [number, number][] = [
  [-60.0, 5.2], [-56.5, 1.9], [-54.0, 2.2], [-51.6, 4.2], [-50.0, 1.8], [-48.5, -1.0], [-44.3, -2.5], [-41.0, -2.9],
  [-38.5, -3.7], [-35.2, -5.4], [-34.8, -7.1], [-35.7, -9.6], [-38.5, -13.0], [-39.0, -17.5], [-40.3, -20.3],
  [-41.0, -22.0], [-43.2, -22.9], [-46.3, -24.0], [-48.5, -26.0], [-48.6, -28.5], [-50.2, -31.0], [-52.1, -32.2],
  [-53.4, -33.7], [-53.6, -32.5], [-55.5, -30.9], [-57.6, -30.2], [-56.0, -28.0], [-54.6, -25.6], [-54.3, -24.0],
  [-55.6, -22.6], [-57.9, -22.1], [-58.2, -19.9], [-57.5, -18.0], [-58.4, -16.3], [-60.2, -15.1], [-60.6, -13.6],
  [-62.8, -12.9], [-65.3, -11.0], [-66.5, -9.9], [-69.5, -11.0], [-72.4, -10.0], [-73.9, -7.3], [-72.9, -5.2],
  [-70.0, -4.3], [-69.5, -1.0], [-69.9, 1.0], [-67.0, 2.0], [-64.0, 2.0], [-63.4, 3.9], [-61.0, 4.5],
];
const CIDADES: [number, number][] = [
  [-46.6, -23.5], [-43.2, -22.9], [-43.9, -19.9], [-47.9, -15.8], [-38.5, -13.0], [-34.9, -8.05], [-38.5, -3.7],
  [-60.0, -3.1], [-51.2, -30.0], [-49.3, -25.4], [-48.5, -1.45], [-49.3, -16.7],
];

const Mapa: React.FC<{ b: BlocoDo; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 1000;
  const k = w / 40; // 40 graus de largura (-74 a -34)
  const px = (lon: number) => (lon + 74) * k;
  const py = (lat: number) => (5.5 - lat) * k;
  const pts = BR.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(" ");
  const entra = prog(c.f, c.ini, 16);
  return (
    <svg width={w} height={40 * k} style={{ opacity: entra * (b.opacidade ?? 0.95), overflow: "visible" }}>
      <defs>
        <pattern id="pontos" width={14} height={14} patternUnits="userSpaceOnUse">
          <circle cx={7} cy={7} r={3.4} fill="#3B3B48" />
        </pattern>
      </defs>
      <polygon points={pts} fill="url(#pontos)" stroke="#2E2E38" strokeWidth={2} />
      {CIDADES.map(([lo, la], i) => {
        const ini = c.ini + 10 + i * 3;
        const p = mola(c.f, ini, 220, 12);
        const pulso = ((c.f - ini) % 30) / 30;
        return (
          <g key={i} opacity={Math.min(1, p * 2)}>
            {c.f > ini && <circle cx={px(lo)} cy={py(la)} r={14 + pulso * 40} fill="none" stroke={DO.vermelho} strokeWidth={3} opacity={1 - pulso} />}
            <circle cx={px(lo)} cy={py(la)} r={14 * p} fill={DO.vermelho} />
          </g>
        );
      })}
    </svg>
  );
};

const Aviao: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={DO.branco} strokeWidth={1.8} strokeLinejoin="round">
    <path d="M22 3 L9.5 13.5 M22 3 L15 21 L11 13.5 L3 10 Z" />
  </svg>
);

const Cta: React.FC<{ b: BlocoDo; c: Ctx }> = ({ b, c }) => {
  const ver = new Set<string>((b.vermelho ?? []).map(norm));
  const pe = fr(b.perfilEm, c.ini + 30);
  const pq = fr(b.perguntaEm, c.ini + 40);
  const pulso = 1 + 0.06 * Math.sin(c.f * 0.35);
  const mp = mola(c.f, pe, 180, 14);
  const mq = mola(c.f, pq, 160, 15);
  return (
    <div style={{ width: 940 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ transform: `scale(${prog(c.f, c.ini, 10) * pulso})` }}><Aviao s={150} /></div>
        <Kicker texto={b.kicker ?? "ENVIAR"} />
      </div>
      {(b.linhas as string[]).map((l, i) => {
        const p = prog(c.f, c.ini + 4 + i * 3, 10);
        return <Palavras key={i} texto={l} vermelho={ver} style={{ fontFamily: F.pesada, fontSize: b.tamanho ?? 120, lineHeight: 1.02, color: DO.branco, textTransform: "uppercase", opacity: p, transform: `translateY(${(1 - p) * 40}px)` }} />;
      })}
      {b.pergunta && (
        <div style={{ marginTop: 56, background: DO.creme, padding: "28px 36px", opacity: Math.min(1, mq * 2), transform: `translateY(${(1 - mq) * 60}px) rotate(-0.8deg)` }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: DO.cremeEsc, letterSpacing: 2 }}>COMENTA AQUI</div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 50, color: DO.tinta, marginTop: 8 }}>{b.pergunta}</div>
        </div>
      )}
      {b.usuario && (
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, mp * 2), transform: `scale(${0.8 + 0.2 * mp})`, transformOrigin: "left center" }}>
          {b.avatar && <Img src={staticFile(`${c.base}/assets/${b.avatar}`)} style={{ width: 110, height: 110, borderRadius: 60, border: `4px solid ${DO.branco}`, objectFit: "cover" }} />}
          <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 50, color: DO.branco }}>@{b.usuario}</div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 40, color: "#fff", background: DO.azulIG, padding: "14px 34px", borderRadius: 16 }}>Seguir</div>
        </div>
      )}
    </div>
  );
};

const BLOCOS: Record<string, React.FC<{ b: BlocoDo; c: Ctx }>> = { manchete: Manchete, numero: Numero, ficha: Ficha, onda: Onda, mapa: Mapa, cta: Cta };

function sonsDoBloco(b: BlocoDo, ini: number): [number, string, number][] {
  const s: [number, string, number][] = [];
  if (b.tipo === "numero") s.push([ini, "tick", 0.5]);
  if (b.tipo === "ficha") {
    s.push([ini, "whoosh", 0.3]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b.itens ?? []).forEach((it: any) => {
      if (it.okEm !== undefined) s.push([seg(it.okEm), "carimbo", 0.55]);
      if (it.circuloEm !== undefined) s.push([seg(it.circuloEm), "click", 0.5]);
    });
  }
  if (b.tipo === "onda") (b.cortes ?? []).forEach((k: { em: number }) => s.push([seg(k.em), "click", 0.35]));
  if (b.tipo === "cta") s.push([fr(b.perfilEm, ini + 30), "pop", 0.5]);
  return s;
}

/* ------------------------------------------------------------ legenda */

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

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; pos: CenaDo["legenda"] }[] }> = ({ palavras, destaques, janelas }) => {
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
  const top = jan.pos === "topo" ? 220 : 1420;
  return (
    <div style={{ position: "absolute", top, left: 70, right: 70, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 28px" }}>
      {g.map((i) => {
        const w = palavras[i];
        const p = interpolate(f, [seg(w.start) - 2, seg(w.start) + 3], [0, 1], clamp);
        const verm = dest.has(norm(w.word)) || /\d/.test(w.word);
        return (
          <span key={i} style={{ fontFamily: F.pesada, fontSize: 80, lineHeight: 1.15, textTransform: "uppercase", color: verm ? DO.vermelho : DO.branco, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, display: "inline-block", textShadow: "0 6px 20px rgba(0,0,0,0.8)" }}>
            {w.word.replace(/[.,!?;:…]+$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ cena e vídeo */

const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: DO.fundo }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${DO.ponto} 2.2px, transparent 2.8px)`, backgroundSize: "34px 34px", backgroundPosition: `0 ${-f * 0.4}px` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 70% at 50% 45%, transparent 40%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

const Cena: React.FC<{ cena: CenaDo; dur: number; base: string; primeira: boolean }> = ({ cena, dur, base, primeira }) => {
  const f = useCurrentFrame();
  const soco = primeira ? 1 : interpolate(f, [0, 6], [1.04, 1], clamp);
  return (
    <AbsoluteFill style={{ transform: `scale(${soco})` }}>
      {cena.blocos.map((b, i) => {
        const ini = fr(b.em, 2 + i * 5);
        const fim = b.ate !== undefined ? seg(b.ate) : dur + 10;
        if (f > fim) return null;
        const saida = b.ate !== undefined ? interpolate(f, [fim - 5, fim], [1, 0], clamp) : 1;
        const Comp = BLOCOS[b.tipo];
        if (!Comp || f < ini - 1) return null;
        return (
          <div key={i} style={{ position: "absolute", left: b.x ?? 70, top: b.y ?? 400, zIndex: b.z ?? 1 + i, opacity: saida }}>
            <Comp b={b} c={{ f, ini, base }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const VideoDossie: React.FC<RoteiroDo> = (r) => {
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
    if (i > 0) sons.push({ frame: janelas[i].from, nome: "whoosh", vol: 0.28 });
    c.blocos.forEach((b, k) => {
      const ini = fr(b.em, 2 + k * 5);
      sonsDoBloco(b, ini).forEach(([d, nome, vol]) => sons.push({ frame: janelas[i].from + Math.round(d), nome, vol }));
    });
  });

  return (
    <AbsoluteFill style={{ background: DO.fundo }}>
      <Fundo />
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <Cena cena={c} dur={janelas[i].frames} base={r.base} primeira={i === 0} />
        </Sequence>
      ))}
      <Legenda palavras={r.palavras ?? []} destaques={r.destaques ?? []} janelas={janelas} />
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${(f / total) * 100}%`, background: DO.vermelho }} />
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

export const calcularMetadadosDo: CalculateMetadataFunction<RoteiroDo> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
