// Estilo CRÔNICA: documentário de arquivo vivo. Mesa de montagem escura e quente, recortes de papel reais
// (borda rasgada, fita, marca-texto), gráficos de jornal que se desenham sozinhos com anotações à mão,
// carimbos em mono. Serif editorial (Fraunces) nos títulos, mono (JetBrains) nos dados, Archivo Black nos números.
// Inspiração (estudo, sem copiar): catálogo 34/35 (FT), 36 (WaPo), 38 (BBC), 40 (Morning Brew), 05/07 (dossiê), 26.
// Cada bloco aceita x, y, z, em (entra) e ate (sai); sub-itens com "em"/"*Em" são âncoras em segundos da cena.
import React from "react";
import { Easing, Img, continueRender, delayRender, interpolate, interpolateColors, random, staticFile } from "remotion";
import { clamp, fmtBR, mola, prog, seg } from "../editorial/movimento";

export const CR = {
  mesa: "#15110D",
  mesa2: "#2A2119",
  papel: "#EFE6D2",
  papel2: "#DCCFB2",
  tinta: "#1B1611",
  creme: "#F3EBDD",
  cinza: "#9C9183",
  linha: "#3B332A",
  queda: "#E0473C",
  frio: "#9FB4C2",
  azulIG: "#0095F6",
  acento: "#F7931A",
};
export const FT = {
  serif: "Fraunces, Georgia, serif",
  mono: "JetBrains Mono, monospace",
  pesada: "Archivo Black, Impact, sans-serif",
  ui: "Inter, sans-serif",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlocoCr = { tipo: string; x?: number; y?: number; z?: number; em?: number; ate?: number; [k: string]: any };
export type Ctx = { f: number; ini: number; base: string; cor: string; dur: number };
type P = { b: BlocoCr; c: Ctx };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Qq = any;

const suave = Easing.bezier(0.22, 1, 0.36, 1);
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
export const fr = (s: number | undefined, padrao: number) => (typeof s === "number" ? seg(s) : padrao);
export const corDe = (v: string | undefined, c: Ctx) =>
  !v || v === "acento" ? c.cor : v === "queda" || v === "vermelho" ? CR.queda : v === "creme" ? CR.creme : v === "cinza" ? CR.cinza : v === "frio" ? CR.frio : v;
export const alfa = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};
/** Texto escuro ou claro conforme o fundo (para pílulas e marca-texto na cor de acento). */
const sobre = (hex: string) => {
  const h = hex.replace("#", "");
  if (h.length !== 6) return CR.tinta;
  const l = 0.299 * parseInt(h.slice(0, 2), 16) + 0.587 * parseInt(h.slice(2, 4), 16) + 0.114 * parseInt(h.slice(4, 6), 16);
  return l > 140 ? CR.tinta : CR.creme;
};
const ano = (d: string | number) => {
  if (typeof d === "number") return d;
  const [y, m, dd] = d.split("-").map(Number);
  return y + ((m || 1) - 1) / 12 + ((dd || 1) - 1) / 365;
};
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const compacto = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e6) return `${fmtBR(v / 1e6, v % 1e6 ? 1 : 0)} mi`;
  if (a >= 1e3) return `${fmtBR(v / 1e3, v % 1e3 && a < 1e4 ? 1 : 0)} mil`;
  return fmtBR(v, a < 10 && v % 1 ? 1 : 0);
};
const num = (v: number, casas = 0) => fmtBR(v, casas).replace(/^-/, "−");

/* ------------------------------------------------------------ peças */

/** Rótulo mono "datilografado" com traço na cor de acento. */
export const Kicker: React.FC<{ texto: string; c: Ctx; ini: number; cor?: string }> = ({ texto, c, ini, cor }) => {
  const n = Math.round(interpolate(c.f, [ini, ini + Math.max(8, texto.length * 0.9)], [0, texto.length], clamp));
  return (
    <div style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: cor ?? CR.cinza, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
      <span style={{ width: 34 * prog(c.f, ini, 8), height: 6, background: c.cor, display: "inline-block" }} />
      {texto.slice(0, n)}
      <span style={{ opacity: n < texto.length || Math.floor(c.f / 8) % 2 ? 1 : 0, color: c.cor }}>▍</span>
    </div>
  );
};

/** Pílula de fonte: papel creme, tinta escura, ponto na cor de acento. */
export const Pilula: React.FC<{ texto: string; p?: number; c: Ctx; tam?: number }> = ({ texto, p = 1, c, tam = 26 }) => (
  <span style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: tam, letterSpacing: 1.5, background: CR.papel, color: CR.tinta, padding: "9px 22px 9px 18px", borderRadius: 40, display: "inline-flex", alignItems: "center", gap: 12, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, whiteSpace: "nowrap", textTransform: "uppercase", boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
    <span style={{ width: 12, height: 12, borderRadius: 6, background: c.cor, display: "inline-block" }} />
    {texto}
  </span>
);

/** Papel com textura de fibra e (opcional) borda rasgada em cima e embaixo. */
const rasgo = (seed: string, rasgada: boolean) => {
  if (!rasgada) return undefined;
  const pts: string[] = [];
  const passos = 34;
  for (let i = 0; i <= passos; i++) pts.push(`${((i / passos) * 100).toFixed(2)}% ${(2 + random(`${seed}t${i}`) * 9).toFixed(1)}px`);
  for (let i = passos; i >= 0; i--) pts.push(`${((i / passos) * 100).toFixed(2)}% calc(100% - ${(2 + random(`${seed}b${i}`) * 9).toFixed(1)}px)`);
  return `polygon(${pts.join(",")})`;
};
export const Papel: React.FC<{ seed: string; rasgada?: boolean; w?: number; pad?: string | number; cor?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ seed, rasgada = true, w, pad = 0, cor = CR.papel, children, style }) => (
  <div style={{ filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.55)) drop-shadow(0 4px 6px rgba(0,0,0,0.35))", width: w, ...style }}>
    <div style={{ position: "relative", background: cor, padding: pad, clipPath: rasgo(seed, rasgada) }}>
      <Img src={staticFile("texturas/fibra.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22, mixBlendMode: "multiply", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  </div>
);

const Fita: React.FC<{ x: number; y: number; rot: number; p: number; w?: number }> = ({ x, y, rot, p, w = 180 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: 50, transform: `rotate(${rot}deg) scale(${0.6 + 0.4 * p})`, opacity: p, background: "linear-gradient(180deg, rgba(246,238,214,0.78), rgba(226,214,184,0.7))", boxShadow: "0 3px 8px rgba(0,0,0,0.25)", clipPath: "polygon(0 8%, 4% 0, 8% 10%, 12% 2%, 100% 0, 97% 30%, 100% 55%, 96% 80%, 100% 100%, 6% 100%, 0 88%, 3% 60%, 0 34%)", zIndex: 5 }} />
);

/** Elipse feita "à mão" (traço que se desenha). */
const elipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx + rx * 0.25} ${cy - ry * 1.04} C ${cx + rx * 1.18} ${cy - ry * 1.0}, ${cx + rx * 1.12} ${cy + ry * 1.06}, ${cx} ${cy + ry} C ${cx - rx * 1.14} ${cy + ry * 0.98}, ${cx - rx * 1.1} ${cy - ry * 1.02}, ${cx + rx * 0.05} ${cy - ry * 1.0} C ${cx + rx * 0.55} ${cy - ry * 1.08}, ${cx + rx * 0.85} ${cy - ry * 0.86}, ${cx + rx * 0.98} ${cy - ry * 0.55}`;

/** Seta à mão (curva leve + ponta). */
const Seta: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; cor: string; curva?: number; esp?: number }> = ({ x1, y1, x2, y2, p, cor, curva = 0.2, esp = 5 }) => {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - (dy / len) * len * curva, cy = (y1 + y2) / 2 + (dx / len) * len * curva;
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const a = 22, ab = 0.5;
  const hp = interpolate(p, [0.8, 1], [0, 1], clamp);
  return (
    <g fill="none" stroke={cor} strokeWidth={esp} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {hp > 0 && <path opacity={hp} d={`M ${x2 - a * Math.cos(ang - ab)} ${y2 - a * Math.sin(ang - ab)} L ${x2} ${y2} L ${x2 - a * Math.cos(ang + ab)} ${y2 - a * Math.sin(ang + ab)}`} />}
    </g>
  );
};

const Check: React.FC<{ p: number; cor: string; s?: number }> = ({ p, cor, s = 84 }) => (
  <svg width={s} height={s} viewBox="0 0 84 84" style={{ position: "absolute", left: -4, top: -12, overflow: "visible" }}>
    <path d="M10 46 L33 68 L80 6" fill="none" stroke={cor} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);
const Xis: React.FC<{ p: number; cor: string; s?: number }> = ({ p, cor, s = 84 }) => (
  <svg width={s} height={s} viewBox="0 0 84 84" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <path d="M14 12 L70 72" fill="none" stroke={cor} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, p * 2)} />
    <path d="M72 14 L12 70" fill="none" stroke={cor} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, p * 2 - 1)} />
  </svg>
);

/** Palavras com acento (cor) e marca-texto (faixa que passa por trás). */
const Frase: React.FC<{ texto: string; acento: Set<string>; marca: Set<string>; mp: number; c: Ctx; style: React.CSSProperties }> = ({ texto, acento, marca, mp, c, style }) => {
  const ws = texto.split(" ");
  return (
    <div style={style}>
      {ws.map((w, i) => {
        const k = norm(w);
        const m = marca.has(k) ? mp : 0;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", marginRight: i < ws.length - 1 ? "0.24em" : 0 }}>
            {m > 0 && <span style={{ position: "absolute", left: "-0.12em", top: "0.14em", bottom: "0.02em", width: `calc(${m * 100}% + ${m * 0.24}em)`, background: c.cor, transform: "skewX(-8deg) rotate(-1deg)", borderRadius: 4, zIndex: 0 }} />}
            <span style={{ position: "relative", zIndex: 1, color: m > 0.45 ? sobre(c.cor) : acento.has(k) ? c.cor : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Hook: tamanho natural de uma imagem (para recortar um trecho do print). */
const useTamanho = (src: string) => {
  const [t, setT] = React.useState<{ w: number; h: number } | null>(null);
  const [h] = React.useState(() => delayRender(`recorte ${src}`));
  React.useEffect(() => {
    const im = new Image();
    im.onload = () => {
      setT({ w: im.naturalWidth, h: im.naturalHeight });
      continueRender(h);
    };
    im.onerror = () => {
      setT({ w: 16, h: 9 });
      continueRender(h);
    };
    im.src = src;
  }, [src, h]);
  return t;
};

/* ------------------------------------------------------------ manchete / título */

const Manchete: React.FC<P> = ({ b, c }) => {
  const acento = new Set<string>((b.acento ?? []).map(norm));
  const marca = new Set<string>((b.marca ?? []).map(norm));
  const mp = interpolate(c.f, [fr(b.marcaEm, c.ini + 14), fr(b.marcaEm, c.ini + 14) + 10], [0, 1], { ...clamp, easing: suave });
  const tam = b.tamanho ?? 118;
  return (
    <div style={{ width: b.w ?? 940, textAlign: b.alinhar ?? "left" }}>
      {b.kicker && <div style={{ marginBottom: 28, display: "flex", justifyContent: b.alinhar === "center" ? "center" : "flex-start" }}><Kicker texto={b.kicker} c={c} ini={c.ini} /></div>}
      {(b.linhas as string[]).map((l, i) => {
        const p = prog(c.f, c.ini + 3 + i * 4, 14);
        const ital = b.italico === true || (Array.isArray(b.italico) && b.italico.includes(i));
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: tam * 0.08 }}>
            <Frase
              texto={l}
              acento={acento}
              marca={marca}
              mp={mp}
              c={c}
              style={{ fontFamily: FT.serif, fontWeight: 800, fontStyle: ital ? "italic" : "normal", fontSize: tam, lineHeight: 1.02, letterSpacing: -1.5, color: b.cor ? corDe(b.cor, c) : CR.creme, transform: `translateY(${(1 - p) * 105}%)`, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}
            />
          </div>
        );
      })}
      {b.sub && <div style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: b.tamSub ?? 46, color: CR.cinza, marginTop: 22, opacity: prog(c.f, c.ini + 12, 12) }}>{b.sub}</div>}
      {b.fonte && <div style={{ marginTop: 30 }}><Pilula texto={b.fonte} c={c} p={prog(c.f, c.ini + 16, 10)} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------ número gigante */

const Numero: React.FC<P> = ({ b, c }) => {
  const casas = b.casas ?? 0;
  const dur = seg(b.contar ?? 1.1);
  const pc = interpolate(c.f, [c.ini, c.ini + dur], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const de = b.de ?? 0;
  const v = de + ((b.valor as number) - de) * pc;
  const txt = num(v, casas);
  const cor = corDe(b.cor ?? "creme", c);
  const tam = b.tamanho ?? (txt.length <= 3 ? 330 : txt.length <= 5 ? 250 : 190);
  const m = mola(c.f, c.ini, 200, 15);
  return (
    <div style={{ width: b.w ?? 940, textAlign: b.alinhar ?? "left" }}>
      {b.kicker && <div style={{ marginBottom: 10, display: "flex", justifyContent: b.alinhar === "center" ? "center" : "flex-start" }}><Kicker texto={b.kicker} c={c} ini={c.ini} /></div>}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: b.alinhar === "center" ? "center" : "flex-start", gap: 14, transform: `scale(${0.86 + 0.14 * m})`, transformOrigin: b.alinhar === "center" ? "center" : "left center", opacity: Math.min(1, m * 2) }}>
        {b.prefixo && <span style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: tam * 0.36, color: CR.cinza }}>{b.prefixo}</span>}
        <span style={{ fontFamily: FT.pesada, fontSize: tam, lineHeight: 1, letterSpacing: -4, color: cor, textShadow: `0 0 60px ${alfa(cor.startsWith("#") ? cor : CR.creme, 0.25)}` }}>{txt}</span>
        {b.sufixo && <span style={{ fontFamily: FT.pesada, fontSize: tam * 0.42, color: cor }}>{b.sufixo}</span>}
      </div>
      {b.unidade && <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: b.tamUnidade ?? 70, color: CR.creme, lineHeight: 1.05, marginTop: 4, opacity: prog(c.f, c.ini + 6, 10) }}>{b.unidade}</div>}
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 30, flexWrap: "wrap", justifyContent: b.alinhar === "center" ? "center" : "flex-start" }}>
        {b.fonte && <Pilula texto={b.fonte} c={c} p={prog(c.f, c.ini + 10, 10)} />}
        {b.data && <Carimbinho texto={b.data} c={c} ini={c.ini + 14} />}
      </div>
      {b.nota && <div style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: 42, color: CR.cinza, marginTop: 24, opacity: prog(c.f, fr(b.notaEm, c.ini + 16), 10), maxWidth: 900 }}>{b.nota}</div>}
    </div>
  );
};

/* ------------------------------------------------------------ carimbo */

const Carimbinho: React.FC<{ texto: string; c: Ctx; ini: number; cor?: string; rot?: number; tam?: number }> = ({ texto, c, ini, cor, rot = -4, tam = 28 }) => {
  const m = mola(c.f, ini, 320, 18);
  const k = cor ?? c.cor;
  return (
    <span style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: tam, letterSpacing: 3, color: k, border: `4px solid ${k}`, padding: "6px 16px", borderRadius: 6, textTransform: "uppercase", display: "inline-block", transform: `rotate(${rot}deg) scale(${2 - m})`, opacity: c.f < ini ? 0 : Math.min(0.92, m * 3), whiteSpace: "nowrap", filter: "url(#cr-tinta)" }}>
      {texto}
    </span>
  );
};

const Carimbo: React.FC<P> = ({ b, c }) => {
  const m = mola(c.f, c.ini, 320, 18);
  const k = corDe(b.cor, c);
  return (
    <div style={{ display: "inline-block", border: `7px solid ${k}`, outline: `3px solid ${k}`, outlineOffset: 6, padding: "14px 30px", borderRadius: 10, color: k, transform: `rotate(${b.rot ?? -7}deg) scale(${2.2 - 1.2 * m})`, opacity: Math.min(0.9, m * 3), filter: "url(#cr-tinta)", textAlign: "center" }}>
      <div style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: b.tamanho ?? 54, letterSpacing: 5, textTransform: "uppercase", lineHeight: 1.05, whiteSpace: "pre" }}>{b.texto}</div>
      {b.sub && <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: (b.tamanho ?? 54) * 0.45, letterSpacing: 3, textTransform: "uppercase", marginTop: 6 }}>{b.sub}</div>}
    </div>
  );
};

const Aviso: React.FC<P> = ({ b, c }) => (
  <div style={{ width: b.w ?? 940, textAlign: "center", opacity: prog(c.f, c.ini, 10) }}>
    <div style={{ height: 2, background: alfa(CR.creme, 0.25), marginBottom: 14 }} />
    <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: b.tamanho ?? 24, letterSpacing: 1, color: alfa(CR.creme, 0.75) }}>{b.texto}</div>
  </div>
);

/* ------------------------------------------------------------ recorte (print como papel) */

const Recorte: React.FC<P> = ({ b, c }) => {
  const src = staticFile(`${c.base}/assets/${b.img}`);
  const tam = useTamanho(src);
  const W = b.w ?? 900;
  const pad = b.margem ?? 22;
  const iw = W - pad * 2;
  const k = { x: 0, y: 0, w: 100, h: 100, ...(b.corte ?? {}) };
  const nat = tam ?? { w: 16, h: 9 };
  const larg = iw / (k.w / 100);
  const alt = larg * (nat.h / nat.w);
  const ih = alt * (k.h / 100);
  const m = mola(c.f, c.ini, 110, 14);
  const rot = (b.rot ?? -1.5) + (1 - m) * (b.rot && b.rot > 0 ? 9 : -9);
  const t = (c.f - c.ini) / 30;
  const deriva = 1 + Math.min(0.035, t * 0.006);
  const seed = `${b.img}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marcas: any[] = b.marca ? (Array.isArray(b.marca) ? b.marca : [b.marca]) : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circulos: any[] = b.circulo ? (Array.isArray(b.circulo) ? b.circulo : [b.circulo]) : [];
  return (
    <div style={{ width: W, position: "relative", opacity: Math.min(1, m * 3), transform: `translateY(${(1 - m) * -140}px) rotate(${rot}deg) scale(${(1.22 - 0.22 * m) * deriva})`, transformOrigin: "50% 40%" }}>
      {b.fita !== false && (
        <>
          <Fita x={-40} y={-18} rot={-32} p={prog(c.f, c.ini + 8, 6)} />
          <Fita x={W - 140} y={-18} rot={28} p={prog(c.f, c.ini + 10, 6)} />
        </>
      )}
      <Papel seed={seed} rasgada={b.borda !== "reta"} pad={`${pad + (b.borda !== "reta" ? 8 : 0)}px ${pad}px`} cor={b.papel ?? "#F7F3EA"}>
        <div style={{ position: "relative", width: iw, height: ih, overflow: "hidden", filter: b.pb ? "grayscale(1) contrast(1.1)" : "contrast(1.04) saturate(0.9)" }}>
          <Img src={src} style={{ position: "absolute", width: larg, height: alt, left: (-k.x / 100) * larg, top: (-k.y / 100) * alt, maxWidth: "none" }} />
          {marcas.map((mk, i) => {
            const mp = interpolate(c.f, [fr(mk.em, c.ini + 18 + i * 8), fr(mk.em, c.ini + 18 + i * 8) + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
            return (
              <div key={i} style={{ position: "absolute", left: `${mk.x}%`, top: `${mk.y}%`, height: `${mk.h}%`, width: `${(mk.w * mp).toFixed(2)}%`, background: alfa(corDe(mk.cor, c), 0.55), mixBlendMode: "multiply", borderRadius: 3, transform: "rotate(-0.6deg)" }} />
            );
          })}
          {circulos.length > 0 && (
            <svg width={iw} height={ih} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {circulos.map((ci, i) => {
                const cp = interpolate(c.f, [fr(ci.em, c.ini + 26), fr(ci.em, c.ini + 26) + 14], [0, 1], clamp);
                return <path key={i} d={elipse(((ci.x + ci.w / 2) / 100) * iw, ((ci.y + ci.h / 2) / 100) * ih, (ci.w / 200) * iw * 1.08, (ci.h / 200) * ih * 1.25)} fill="none" stroke={corDe(ci.cor ?? "queda", c)} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cp} />;
              })}
            </svg>
          )}
        </div>
      </Papel>
      {b.data && (
        <div style={{ position: "absolute", right: 26, bottom: b.legenda || b.fonte ? 90 : 26 }}>
          <Carimbinho texto={b.data} c={c} ini={fr(b.dataEm, c.ini + 14)} cor={corDe(b.corData ?? "queda", c)} rot={-6} tam={30} />
        </div>
      )}
      {(b.fonte || b.legenda) && (
        <div style={{ marginTop: 22, display: "flex", gap: 16, alignItems: "center", opacity: prog(c.f, c.ini + 12, 10), transform: `rotate(${-rot * 0.6}deg)` }}>
          {b.fonte && <Pilula texto={b.fonte} c={c} />}
          {b.legenda && <span style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: 36, color: CR.creme, textShadow: "0 4px 14px rgba(0,0,0,0.7)" }}>{b.legenda}</span>}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ gráfico de jornal */

const nice = (raw: number) => {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return ([1, 2, 2.5, 5, 10].find((s) => s * mag >= raw) ?? 10) * mag;
};

const Grafico: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 940, H = b.h ?? 760;
  const papel = !!b.papel;
  const tinta = papel ? CR.tinta : CR.creme;
  const apagado = papel ? "rgba(27,22,17,0.55)" : CR.cinza;
  const grade = papel ? "rgba(27,22,17,0.14)" : "rgba(243,235,221,0.11)";
  const cor = corDe(b.cor, c);
  const pre = b.prefixo ?? "", suf = b.sufixo ?? "";
  const eixo = b.eixo !== false;
  const padL = eixo ? 132 : 24, padR = b.padR ?? 36;
  const padT = (b.titulo ? (b.subtitulo ? 150 : 104) : 44) + 30;
  const padB = (eixo ? 64 : 24) + (b.fonte ? 52 : 0);
  const pw = W - padL - padR, ph = H - padT - padB;

  let serie = ((b.serie ?? []) as [string, number][]).map(([d, v]) => ({ t: ano(d), v: Number(v) }));
  if (b.periodo) serie = serie.filter((p) => p.t >= ano(b.periodo[0]) - 0.001 && p.t <= ano(b.periodo[1]) + 0.001);
  const n = serie.length;
  if (n < 2) return null;
  const t0 = serie[0].t, t1 = serie[n - 1].t + (b.folga ?? 0);
  let topo = -Infinity;
  const dd = serie.map((p) => {
    topo = Math.max(topo, p.v);
    return (p.v / topo - 1) * 100;
  });
  const log = !!b.log;
  const vs = serie.map((p) => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const vmin = b.min ?? (log ? lo * 0.6 : lo - (hi - lo) * 0.08);
  const vmax = b.max ?? (log ? hi * 1.6 : hi + (hi - lo) * 0.08);
  const L = (v: number) => (log ? Math.log10(Math.max(v, 1e-9)) : v);
  const fp = (v: number) => (L(v) - L(vmin)) / (L(vmax) - L(vmin));
  const qMin = b.quedaMin ?? -100;
  const fq = (q: number) => (q - qMin) / -qMin;
  const mq = b.modo === "queda" ? 1 : b.quedaEm !== undefined ? interpolate(c.f, [seg(b.quedaEm), seg(b.quedaEm) + 26], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 0;
  const X = (t: number) => padL + ((t - t0) / (t1 - t0)) * pw;
  const Yf = (fr_: number) => padT + ph * (1 - fr_);
  const Yv = (v: number, q: number) => Yf(fp(v) * (1 - mq) + fq(q) * mq);
  const noTempo = (t: number) => {
    let i = serie.findIndex((p) => p.t >= t);
    if (i <= 0) i = i === 0 ? 1 : n - 1;
    const a = serie[i - 1], z = serie[i];
    const k = Math.max(0, Math.min(1, (t - a.t) / (z.t - a.t || 1)));
    return { v: a.v + (z.v - a.v) * k, q: dd[i - 1] + (dd[i] - dd[i - 1]) * k };
  };

  const dDur = seg(b.desenho ?? 2.2);
  const dp = dDur <= 0 ? 1 : interpolate(c.f, [c.ini + 4, c.ini + 4 + dDur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const fimDesenho = c.ini + 4 + dDur;
  const head = dp * (n - 1);
  const kk = Math.floor(head);
  const pts: [number, number][] = [];
  for (let i = 0; i <= kk; i++) pts.push([X(serie[i].t), Yv(serie[i].v, dd[i])]);
  if (kk < n - 1) {
    const r = head - kk;
    const a = serie[kk], z = serie[kk + 1];
    pts.push([X(a.t + (z.t - a.t) * r), Yv(a.v + (z.v - a.v) * r, dd[kk] + (dd[kk + 1] - dd[kk]) * r)]);
  }
  const linha = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const ult = pts[pts.length - 1];
  const yZero = Yf(fq(0) * mq + 0 * (1 - mq));
  const fundoArea = `${pts[0][0]},${padT + ph} ${linha} ${ult[0]},${padT + ph}`;
  const areaQueda = `${pts[0][0]},${yZero} ${linha} ${ult[0]},${yZero}`;

  // eixos
  const ticksP: number[] = [];
  if (log) {
    for (let e = Math.ceil(Math.log10(vmin)); e <= Math.floor(Math.log10(vmax)); e++) ticksP.push(Math.pow(10, e));
  } else {
    const st = nice((vmax - vmin) / 4);
    for (let v = Math.ceil(vmin / st) * st; v <= vmax; v += st) ticksP.push(v);
  }
  const ticksQ = [0, -25, -50, -75, -100].filter((q) => q >= qMin);
  const anos = t1 - t0;
  const ticksX: { t: number; txt: string }[] = [];
  if (anos >= 2) {
    const passo = b.passoAnos ?? (anos > 10 ? 2 : 1);
    for (let y = Math.ceil(t0); y <= t1; y += passo) ticksX.push({ t: y, txt: `${y}` });
  } else {
    const passoM = Math.max(1, Math.ceil((anos * 12) / 6));
    const m0 = Math.ceil(t0 * 12 - 0.001);
    for (let m = m0; m / 12 <= t1; m += passoM) {
      const y = Math.floor(m / 12), mi = ((m % 12) + 12) % 12;
      ticksX.push({ t: m / 12, txt: mi === 0 || m === m0 ? `${MESES[mi]}/${String(y).slice(2)}` : MESES[mi] });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marcos: any[] = b.marcos ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anots: any[] = b.anotacoes ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arcos: any[] = b.arcos ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faixas: any[] = b.faixas ?? [];
  const hoje = b.hoje ? (b.hoje === true ? {} : b.hoje) : null;

  const ent = papel ? mola(c.f, c.ini, 140, 16) : prog(c.f, c.ini, 12);
  const corpo = (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`cr-ar-${c.ini}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cor} stopOpacity={0.28} />
          <stop offset="1" stopColor={cor} stopOpacity={0} />
        </linearGradient>
      </defs>
      {b.titulo && (
        <text x={eixo ? 24 : 24} y={64} fontFamily={FT.serif} fontWeight={800} fontSize={b.tamTitulo ?? 50} fill={tinta} opacity={prog(c.f, c.ini, 10)}>
          {b.titulo}
        </text>
      )}
      {b.subtitulo && (
        <text x={24} y={112} fontFamily={FT.mono} fontWeight={500} fontSize={26} fill={apagado} opacity={prog(c.f, c.ini + 4, 10)}>
          {b.subtitulo}
        </text>
      )}
      {/* faixas horizontais */}
      {faixas.map((fx, i) => {
        const p = prog(c.f, fr(fx.em, fimDesenho + 4 + i * 8), 14);
        const k = corDe(fx.cor, c);
        const ya = Yv(fx.ate ?? fx.de, 0), yb = Yv(fx.de, 0);
        const yc = (ya + yb) / 2, hh = Math.max(8, yb - ya) * p;
        return (
          <g key={`fx${i}`} opacity={Math.min(1, p * 1.5) * (1 - mq)}>
            <rect x={padL} y={yc - hh / 2} width={pw} height={hh} fill={alfa(k, 0.18)} />
            <line x1={padL} x2={padL + pw} y1={yc - hh / 2} y2={yc - hh / 2} stroke={k} strokeWidth={3} strokeDasharray="10 8" />
            <line x1={padL} x2={padL + pw} y1={yc + hh / 2} y2={yc + hh / 2} stroke={k} strokeWidth={3} strokeDasharray="10 8" />
            {fx.rotulo && (
              <text x={fx.rotuloLado === "dir" ? padL + pw - 10 : padL + 10} y={yc - hh / 2 - 12} textAnchor={fx.rotuloLado === "dir" ? "end" : "start"} fontFamily={FT.mono} fontWeight={700} fontSize={fx.tam ?? 26} fill={k}>
                {fx.rotulo}
              </text>
            )}
          </g>
        );
      })}
      {/* grade + eixo y */}
      {eixo &&
        ticksP.map((v, i) => {
          const y = Yf(fp(v));
          return (
            <g key={`tp${i}`} opacity={(1 - mq) * ent}>
              <line x1={padL} x2={padL + pw} y1={y} y2={y} stroke={grade} strokeWidth={2} />
              <text x={padL - 16} y={y + 9} textAnchor="end" fontFamily={FT.mono} fontWeight={500} fontSize={25} fill={apagado}>
                {`${pre}${compacto(v)}${suf}`}
              </text>
            </g>
          );
        })}
      {eixo &&
        mq > 0 &&
        ticksQ.map((q, i) => {
          const y = Yf(fq(q));
          return (
            <g key={`tq${i}`} opacity={mq}>
              <line x1={padL} x2={padL + pw} y1={y} y2={y} stroke={q === 0 ? alfa(CR.creme, 0.4) : grade} strokeWidth={q === 0 ? 3 : 2} />
              <text x={padL - 16} y={y + 9} textAnchor="end" fontFamily={FT.mono} fontWeight={700} fontSize={25} fill={q === 0 ? tinta : CR.queda}>
                {q === 0 ? "topo" : `${num(q)}%`}
              </text>
            </g>
          );
        })}
      {eixo && (
        <g opacity={ent}>
          <line x1={padL} x2={padL + pw} y1={padT + ph} y2={padT + ph} stroke={apagado} strokeWidth={2} />
          {ticksX.map((tk, i) => (
            <g key={`tx${i}`}>
              <line x1={X(tk.t)} x2={X(tk.t)} y1={padT + ph} y2={padT + ph + 12} stroke={apagado} strokeWidth={2} />
              <text x={X(tk.t)} y={padT + ph + 44} textAnchor="middle" fontFamily={FT.mono} fontWeight={500} fontSize={24} fill={apagado}>
                {tk.txt}
              </text>
            </g>
          ))}
        </g>
      )}
      {/* marcos verticais (halvings etc.) */}
      {marcos.map((mk, i) => {
        const p = prog(c.f, fr(mk.em, c.ini + 8 + i * 6), 14);
        const x = X(ano(mk.data));
        const k = mk.cor ? corDe(mk.cor, c) : apagado;
        return (
          <g key={`mk${i}`} opacity={p}>
            <line x1={x} x2={x} y1={padT - 6} y2={padT - 6 + (ph + 6) * p} stroke={k} strokeWidth={2.5} strokeDasharray="6 8" />
            {mk.rotulo && (
              <text x={x} y={padT - 18} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={mk.tam ?? 22} fill={k} letterSpacing={1}>
                {mk.rotulo}
              </text>
            )}
          </g>
        );
      })}
      {/* área e linha */}
      <polygon points={fundoArea} fill={`url(#cr-ar-${c.ini})`} opacity={(1 - mq) * (b.area === false ? 0 : 1)} />
      {mq > 0 && <polygon points={areaQueda} fill={alfa(CR.queda, 0.32)} opacity={mq} />}
      <polyline points={linha} fill="none" stroke={cor} strokeWidth={b.espessura ?? 6} strokeLinejoin="round" strokeLinecap="round" opacity={1 - mq} style={{ filter: papel ? "none" : `drop-shadow(0 0 10px ${alfa(cor, 0.5)})` }} />
      {mq > 0 && <polyline points={linha} fill="none" stroke={CR.queda} strokeWidth={b.espessura ?? 6} strokeLinejoin="round" strokeLinecap="round" opacity={mq} />}
      {dp < 1 && dp > 0 && <circle cx={ult[0]} cy={ult[1]} r={11} fill={papel ? cor : CR.creme} style={{ filter: `drop-shadow(0 0 12px ${cor})` }} />}
      {/* arcos (de um ponto a outro, com rótulo) */}
      {arcos.map((a, i) => {
        const p = interpolate(c.f, [fr(a.em, fimDesenho + 4 + i * 10), fr(a.em, fimDesenho + 4 + i * 10) + 14], [0, 1], { ...clamp, easing: suave });
        if (p <= 0) return null;
        const k = corDe(a.cor, c);
        const ta = ano(a.de), tb = ano(a.para);
        const va = noTempo(ta), vb = noTempo(tb);
        const x1 = X(ta), y1 = Yv(va.v, va.q), x2 = X(tb), y2 = Yv(vb.v, vb.q);
        const cy = Math.min(y1, y2) - (a.altura ?? b.alturaArco ?? 110);
        const cx = (x1 + x2) / 2;
        const ang = Math.atan2(y2 - cy, x2 - cx);
        const ax = 0.25 * x1 + 0.5 * cx + 0.25 * x2, ay = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
        const hp = interpolate(p, [0.85, 1], [0, 1], clamp);
        const txt = String(a.texto ?? "");
        const tw = txt.length * 17 + 26;
        return (
          <g key={`ar${i}`}>
            <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} fill="none" stroke={k} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            {hp > 0 && <path opacity={hp} d={`M ${x2 - 20 * Math.cos(ang - 0.5)} ${y2 - 20 * Math.sin(ang - 0.5)} L ${x2} ${y2} L ${x2 - 20 * Math.cos(ang + 0.5)} ${y2 - 20 * Math.sin(ang + 0.5)}`} fill="none" stroke={k} strokeWidth={4} strokeLinecap="round" />}
            {txt && (
              <g opacity={hp} transform={`translate(${ax}, ${ay - 8})`}>
                <rect x={-tw / 2} y={-22} width={tw} height={40} rx={8} fill={k} />
                <text x={0} y={8} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={26} fill={sobre(k)}>
                  {txt}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {/* anotações à mão */}
      {anots.map((a, i) => {
        const ini = fr(a.em, fimDesenho + 6 + i * 9);
        const p = interpolate(c.f, [ini, ini + 12], [0, 1], { ...clamp, easing: suave });
        if (p <= 0) return null;
        const k = corDe(a.cor, c);
        const t = ano(a.data);
        const pv = noTempo(t);
        const x = X(t), y = Yv(a.valor ?? pv.v, a.queda ?? pv.q);
        const lado = a.lado ?? "cima";
        const dist = a.dist ?? 120;
        const linhas = String(a.texto ?? "").split("\n");
        const tam = a.tam ?? 26;
        const tw = Math.max(...linhas.map((l) => l.length)) * tam * 0.62 + 30;
        const th = linhas.length * tam * 1.2 + 18;
        let lx = x + (a.dx ?? 0), ly = y + (a.dy ?? 0);
        if (lado === "cima") ly -= dist;
        if (lado === "baixo") ly += dist;
        if (lado === "esq") lx -= dist + tw / 2;
        if (lado === "dir") lx += dist + tw / 2;
        lx = Math.max(tw / 2 + 4, Math.min(W - tw / 2 - 4, lx));
        ly = Math.max(padT + th / 2, Math.min(padT + ph - th / 2, ly));
        const r0 = a.raio ?? 24;
        const bx = lx, by = lado === "baixo" ? ly - th / 2 : lado === "cima" ? ly + th / 2 : ly;
        const vx = x - bx, vy = y - by, vl = Math.hypot(vx, vy) || 1;
        const tp = interpolate(c.f, [ini + 8, ini + 16], [0, 1], { ...clamp, easing: suave });
        return (
          <g key={`an${i}`}>
            {a.marca !== "nada" && (a.marca === "ponto" ? <circle cx={x} cy={y} r={10 * p} fill={k} stroke={CR.mesa} strokeWidth={3} /> : <path d={elipse(x, y, r0, r0 * 0.9)} fill="none" stroke={k} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />)}
            {vl > r0 + 30 && <Seta x1={bx} y1={by} x2={x - (vx / vl) * (r0 + 10)} y2={y - (vy / vl) * (r0 + 10)} p={interpolate(c.f, [ini + 4, ini + 14], [0, 1], clamp)} cor={k} curva={0.18} esp={4} />}
            <g opacity={tp} transform={`translate(${lx}, ${ly}) rotate(${a.rot ?? (i % 2 ? 1.5 : -1.5)}) scale(${0.85 + 0.15 * tp})`}>
              <rect x={-tw / 2} y={-th / 2} width={tw} height={th} rx={6} fill={k} />
              {linhas.map((l, j) => (
                <text key={j} x={0} y={-th / 2 + 9 + tam * 0.95 + j * tam * 1.2} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={tam} fill={sobre(k)}>
                  {l}
                </text>
              ))}
            </g>
          </g>
        );
      })}
      {/* ponto "hoje" */}
      {hoje &&
        (() => {
          const ini = fr(hoje.em, fimDesenho + 2);
          const p = mola(c.f, ini, 220, 12);
          if (c.f < ini) return null;
          const t = hoje.data ? ano(hoje.data) : serie[n - 1].t;
          const pv = noTempo(t);
          const x = X(t), y = Yv(hoje.valor ?? pv.v, pv.q);
          const pulso = ((c.f - ini) % 36) / 36;
          const k = corDe(hoje.cor ?? "creme", c);
          const txt = hoje.rotulo ?? "HOJE";
          const tw = txt.length * 16 + 30;
          const esq = hoje.lado !== "dir";
          return (
            <g>
              <circle cx={x} cy={y} r={14 + pulso * 46} fill="none" stroke={k} strokeWidth={3} opacity={1 - pulso} />
              <circle cx={x} cy={y} r={13 * p} fill={k} stroke={CR.mesa} strokeWidth={4} />
              <g opacity={Math.min(1, p)} transform={`translate(${esq ? x - 26 - tw : x + 26}, ${y - 70})`}>
                <rect x={0} y={0} width={tw} height={42} rx={21} fill={k} />
                <text x={tw / 2} y={30} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={26} fill={sobre(k)}>
                  {txt}
                </text>
              </g>
            </g>
          );
        })()}
      {b.fonte && (
        <text x={24} y={H - 18} fontFamily={FT.mono} fontWeight={500} fontSize={22} fill={apagado} opacity={prog(c.f, c.ini + 10, 10)}>
          {`FONTE: ${b.fonte}`.toUpperCase()}
        </text>
      )}
    </svg>
  );
  const op = b.opacidade ?? 1;
  if (!papel) return <div style={{ opacity: ent * op }}>{corpo}</div>;
  return (
    <div style={{ opacity: Math.min(1, ent * 2) * op, transform: `translateY(${(1 - ent) * 90}px) rotate(${b.rot ?? -0.6}deg)` }}>
      <Papel seed={`g${c.ini}`} w={W}>
        {corpo}
      </Papel>
    </div>
  );
};

/* ------------------------------------------------------------ relógio do ciclo */

const Relogio: React.FC<P> = ({ b, c }) => {
  const R = b.raio ?? 330;
  const M = 130;
  const S = 2 * (R + M);
  const cx = S / 2, cy = S / 2;
  const total = b.total ?? 48;
  const ang = (mes: number) => (mes / total) * 2 * Math.PI - Math.PI / 2;
  const pt = (mes: number, r: number) => [cx + r * Math.cos(ang(mes)), cy + r * Math.sin(ang(mes))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  const fin = b.final ?? null;
  const ent = mola(c.f, c.ini, 120, 15);
  const pIni = fr(b.ponteiroEm, c.ini + 8);
  const pFim = fin ? fr(fin.em, pIni + 60) : pIni + 60;
  const alvo = fin ? fin.mes : itens.length ? itens[itens.length - 1].mes : 0;
  const pp = interpolate(c.f, [pIni, pFim], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const mesAgora = alvo * pp;
  const assenta = fin ? mola(c.f, pFim, 260, 10) : 1;
  const angP = ang(mesAgora) + (fin && c.f >= pFim ? (1 - assenta) * 0.06 : 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rotulos: any[] = b.rotulos ?? [{ mes: 0, texto: "HALVING" }];
  const fundoA = b.fundo ?? 0.62;
  const piscando = fin && c.f >= pFim ? (Math.floor((c.f - pFim) / 9) % 2 === 0 ? 1 : 0.35) : 1;
  const passoAnel = b.passoAnel ?? 40;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rAnel = (it: any, i: number) => R - 8 - (it.anel ?? i) * passoAnel;
  const k = corDe(b.cor, c);
  const sweep = (() => {
    if (mesAgora <= 0.01) return "";
    const [x0, y0] = pt(0, R - 30);
    const [x1, y1] = pt(mesAgora, R - 30);
    const grande = mesAgora / total > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${x0} ${y0} A ${R - 30} ${R - 30} 0 ${grande} 1 ${x1} ${y1} Z`;
  })();
  return (
    <div style={{ width: S, opacity: Math.min(1, ent * 2) }}>
    <svg width={S} height={S} style={{ overflow: "visible", display: "block", transform: `scale(${0.85 + 0.15 * ent}) rotate(${(1 - ent) * -20}deg)` }}>
      <circle cx={cx} cy={cy} r={R + 6} fill={alfa(CR.mesa, fundoA)} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={alfa(CR.creme, 0.85)} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={R - 22} fill="none" stroke={alfa(CR.creme, 0.2)} strokeWidth={2} />
      {sweep && <path d={sweep} fill={alfa(k, 0.16)} />}
      {Array.from({ length: total }).map((_, i) => {
        const grande = i % (total / 4) === 0;
        const [x0, y0] = pt(i, R - (grande ? 40 : 22));
        const [x1, y1] = pt(i, R - 6);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={alfa(CR.creme, grande ? 0.9 : 0.4)} strokeWidth={grande ? 5 : 2.5} />;
      })}
      {rotulos.map((r, i) => {
        const [x, y] = pt(r.mes, R - 74);
        return (
          <text key={i} x={x} y={y + 9} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={22} letterSpacing={2} fill={alfa(CR.creme, 0.7)} opacity={prog(c.f, c.ini + 6, 10)}>
            {r.texto}
          </text>
        );
      })}
      {/* ponteiro */}
      <g opacity={prog(c.f, pIni - 6, 8)}>
        <line x1={cx - Math.cos(angP) * 40} y1={cy - Math.sin(angP) * 40} x2={cx + Math.cos(angP) * (R - 46)} y2={cy + Math.sin(angP) * (R - 46)} stroke={k} strokeWidth={9} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${alfa(k, 0.6)})` }} />
        <circle cx={cx} cy={cy} r={22} fill={k} stroke={CR.mesa} strokeWidth={5} />
      </g>
      {/* anéis: cada ciclo é um anel (de fora para dentro) */}
      {[...itens, ...(fin ? [fin] : [])].map((it, i) => {
        const rr = rAnel(it, i);
        return rr < R - 10 ? <circle key={`an${i}`} cx={cx} cy={cy} r={rr} fill="none" stroke={alfa(CR.creme, 0.13)} strokeWidth={2} strokeDasharray="4 10" opacity={prog(c.f, c.ini + 4 + i * 3, 10)} /> : null;
      })}
      {itens.map((it, i) => {
        const ini = fr(it.em, c.ini + 12 + i * 10);
        const p = mola(c.f, ini, 240, 11);
        if (c.f < ini) return null;
        const kk = corDe(it.cor ?? "queda", c);
        const [x, y] = pt(it.mes, rAnel(it, i));
        const brilho = interpolate(c.f - ini, [0, 6, 20], [0, 1, 0.35], clamp);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={26 + 30 * brilho} fill={alfa(kk, 0.25 * brilho)} />
            <circle cx={x} cy={y} r={15 * p} fill={kk} stroke={CR.mesa} strokeWidth={4} />
          </g>
        );
      })}
      {fin && c.f >= pFim - 4 && (() => {
        const [x, y] = pt(fin.mes, rAnel(fin, itens.length));
        const p = mola(c.f, pFim - 4, 240, 10);
        return (
          <g opacity={piscando}>
            <circle cx={x} cy={y} r={30 + 10 * Math.sin(c.f * 0.4)} fill={alfa(k, 0.3)} />
            <circle cx={x} cy={y} r={18 * p} fill={k} stroke={CR.mesa} strokeWidth={4} />
          </g>
        );
      })()}
      {b.centro !== false && (
        <g opacity={prog(c.f, pIni, 10)}>
          <text x={cx} y={cy - 96} textAnchor="middle" fontFamily={FT.pesada} fontSize={80} fill={CR.creme} style={{ paintOrder: "stroke", stroke: CR.mesa, strokeWidth: 10 }}>
            {`${b.prefixoCentro ?? "MÊS "}${Math.round(mesAgora)}`}
          </text>
          <text x={cx} y={cy - 56} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={22} letterSpacing={3} fill={CR.cinza} style={{ paintOrder: "stroke", stroke: CR.mesa, strokeWidth: 8 }}>
            {b.centro ?? `DE ${total} DO CICLO`}
          </text>
        </g>
      )}
    </svg>
    {b.lista !== false && (
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px 30px", marginTop: 10 }}>
        {[...itens, ...(fin ? [fin] : [])].map((it, i) => {
          const eFinal = fin && i === itens.length;
          const ini = eFinal ? pFim - 4 : fr(it.em, c.ini + 12 + i * 10);
          const p = prog(c.f, ini, 8);
          const kk = eFinal ? k : corDe(it.cor ?? "queda", c);
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: FT.mono, fontWeight: 700, fontSize: it.tam ?? 32, color: eFinal ? k : CR.creme, opacity: p * (eFinal ? piscando : 1), transform: `translateY(${(1 - p) * 12}px)` }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: kk, display: "inline-block" }} />
              {it.rotulo}
            </span>
          );
        })}
      </div>
    )}
    </div>
  );
};

/* ------------------------------------------------------------ linha do tempo */

const LinhaTempo: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 940;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ms: any[] = b.marcos ?? [];
  const n = ms.length;
  const vmax = Math.max(...ms.map((m) => Number(m.valor) || 0), 1);
  const D = b.moeda ?? 170;
  const yL = D + 70;
  const xs = ms.map((_, i) => 70 + (i * (W - 140)) / Math.max(1, n - 1));
  const ult = ms.reduce((acc, m, i) => (c.f >= fr(m.em, c.ini + 6 + i * 9) ? i : acc), -1);
  const lp = ult < 0 ? 0 : interpolate(c.f, [fr(ms[ult].em, c.ini + 6 + ult * 9) - 6, fr(ms[ult].em, c.ini + 6 + ult * 9)], [ult > 0 ? xs[ult - 1] : 0, xs[ult]], clamp);
  const ct = b.contador;
  return (
    <div style={{ width: W, position: "relative", height: yL + 190 + (ct ? 150 : 0) }}>
      <div style={{ position: "absolute", left: 0, top: yL - 2, width: W, height: 4, background: alfa(CR.creme, 0.15) }} />
      <div style={{ position: "absolute", left: 0, top: yL - 3, width: lp, height: 6, background: c.cor, boxShadow: `0 0 16px ${alfa(c.cor, 0.6)}` }} />
      {ms.map((m, i) => {
        const ini = fr(m.em, c.ini + 6 + i * 9);
        const p = mola(c.f, ini, 200, 13);
        if (c.f < ini - 1) return null;
        const v = Number(m.valor) || 0;
        const d = Math.max(34, D * Math.sqrt(v / vmax));
        const est = !!m.estimado;
        const vtxt = m.texto ?? fmtBR(v, v % 1 ? String(v).split(".")[1].length : 0);
        return (
          <div key={i} style={{ position: "absolute", left: xs[i], top: 0, width: 0 }}>
            <div style={{ position: "absolute", left: -d / 2, top: yL - 30 - d, width: d, height: d, borderRadius: d, background: est ? "transparent" : `radial-gradient(circle at 35% 30%, ${alfa("#FFFFFF", 0.35)}, ${c.cor} 55%)`, border: est ? `4px dashed ${c.cor}` : `4px solid ${alfa(CR.mesa, 0.6)}`, transform: `scale(${p})`, transformOrigin: "50% 100%", boxShadow: est ? "none" : `0 10px 30px ${alfa(c.cor, 0.35)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {d > 90 && <span style={{ fontFamily: FT.pesada, fontSize: d * 0.42, color: alfa(CR.tinta, 0.75) }}>{b.simbolo ?? "₿"}</span>}
            </div>
            <div style={{ position: "absolute", left: -11, top: yL - 11, width: 22, height: 22, borderRadius: 11, background: est ? CR.mesa : c.cor, border: `4px solid ${c.cor}`, transform: `scale(${p})` }} />
            <div style={{ position: "absolute", left: -120, width: 240, top: yL + 26, textAlign: "center", opacity: Math.min(1, p * 2) }}>
              <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: 48, color: CR.creme, lineHeight: 1 }}>{m.rotulo}</div>
              <div style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: m.tam ?? 30, color: c.cor, marginTop: 12 }}>{vtxt}</div>
              {b.unidade && <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 22, color: CR.cinza, marginTop: 4 }}>{b.unidade}</div>}
            </div>
          </div>
        );
      })}
      {ct && (() => {
        const ini = fr(ct.em, c.ini + 6 + n * 9 + 6);
        const p = prog(c.f, ini, 10);
        const pc = interpolate(c.f, [ini, ini + 30], [0, 1], { ...clamp, easing: suave });
        const v0 = ct.de ?? ct.inicio ?? 0;
        const v = v0 + (ct.valor - v0) * pc;
        const fr0 = ct.inicio ?? 0;
        const frac = ct.alvo ? Math.max(0, Math.min(1, (v - fr0) / (ct.alvo - fr0))) : 0;
        return (
          <div style={{ position: "absolute", left: 0, top: yL + 210, width: W, opacity: p }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FT.mono, fontWeight: 700, fontSize: 28, color: CR.creme, letterSpacing: 1 }}>
              <span>{(ct.rotulo ?? "BLOCO").toUpperCase()} <span style={{ color: c.cor }}>{fmtBR(Math.round(v))}</span></span>
              {ct.alvo && <span style={{ color: CR.cinza }}>{fmtBR(ct.alvo)}</span>}
            </div>
            {ct.alvo && (
              <div style={{ marginTop: 14, height: 14, background: alfa(CR.creme, 0.12), borderRadius: 8, overflow: "hidden" }}>
                <div style={{ width: `${frac * 100}%`, height: "100%", background: `repeating-linear-gradient(-45deg, ${c.cor} 0 10px, ${alfa(c.cor, 0.7)} 10px 20px)` }} />
              </div>
            )}
            {ct.rotuloAlvo && <div style={{ marginTop: 10, textAlign: "right", fontFamily: FT.mono, fontWeight: 500, fontSize: 22, color: CR.cinza, textTransform: "uppercase", letterSpacing: 1 }}>{ct.rotuloAlvo}</div>}
          </div>
        );
      })()}
      {b.fonte && <div style={{ position: "absolute", left: 0, bottom: -60, opacity: prog(c.f, c.ini + 20, 10) }}><Pilula texto={b.fonte} c={c} tam={22} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------ placar / card */

const Placar: React.FC<P> = ({ b, c }) => {
  const m = mola(c.f, c.ini, 150, 16);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ls: any[] = b.linhas ?? [];
  const escuro = !!b.escuro;
  const tinta = escuro ? CR.creme : CR.tinta;
  const corpo = (
    <>
      <div style={{ background: escuro ? c.cor : CR.tinta, color: escuro ? sobre(c.cor) : CR.papel, fontFamily: FT.mono, fontWeight: 700, fontSize: 32, letterSpacing: 4, padding: "20px 34px", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
        <span>{b.titulo}</span>
        {b.data && <span style={{ opacity: 0.7 }}>{b.data}</span>}
      </div>
      <div style={{ padding: "16px 36px 30px" }}>
        {ls.map((l, i) => {
          const ini = fr(l.em, c.ini + 8 + i * 8);
          const p = prog(c.f, ini, 10);
          const pc = interpolate(c.f, [ini, ini + seg(l.contar ?? 0.9)], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
          const v = (l.de ?? 0) + (Number(l.valor) - (l.de ?? 0)) * pc;
          const k = l.cor ? corDe(l.cor, c) : tinta;
          const grande = !!l.grande;
          return (
            <div key={i} style={{ opacity: p, transform: `translateX(${(1 - p) * -30}px)`, borderTop: i ? `3px dotted ${alfa(escuro ? CR.creme : CR.tinta, 0.3)}` : "none", padding: "18px 0 14px" }}>
              <div style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 26, letterSpacing: 2, color: escuro ? CR.cinza : alfa(CR.tinta, 0.6), textTransform: "uppercase" }}>{l.rotulo}</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, marginTop: 4 }}>
                <span style={{ fontFamily: FT.pesada, fontSize: grande ? 150 : 84, lineHeight: 1.05, color: k, letterSpacing: -2 }}>
                  {l.valor === undefined ? l.texto : `${l.prefixo ?? ""}${num(v, l.casas ?? 0)}${l.sufixo ?? ""}`}
                </span>
                {l.nota && <span style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 26, color: escuro ? CR.cinza : alfa(CR.tinta, 0.6), textAlign: "right" }}>{l.nota}</span>}
              </div>
            </div>
          );
        })}
        {b.fonte && <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 21, color: escuro ? CR.cinza : alfa(CR.tinta, 0.55), marginTop: 8, textTransform: "uppercase" }}>{`Fonte: ${b.fonte}`}</div>}
      </div>
    </>
  );
  const est: React.CSSProperties = { opacity: Math.min(1, m * 2), transform: `translateY(${(1 - m) * 90}px) rotate(${(1 - m) * -3 + (b.rot ?? -0.8)}deg)` };
  return escuro ? (
    <div style={{ ...est, width: b.w ?? 940, background: alfa(CR.mesa, 0.85), border: `2px solid ${alfa(CR.creme, 0.2)}`, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>{corpo}</div>
  ) : (
    <div style={est}>
      <Papel seed={`p${c.ini}`} w={b.w ?? 940} rasgada={b.borda === "rasgada"}>
        {corpo}
      </Papel>
    </div>
  );
};

/* ------------------------------------------------------------ barras */

const Barras: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 940;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const its: any[] = b.itens ?? [];
  if (b.orientacao === "vertical") {
    const H = b.h ?? 420;
    const vmax = Math.max(...its.map((i) => Math.abs(Number(i.valor) || 0)), 1);
    const temNeg = its.some((i) => i.valor < 0), temPos = its.some((i) => i.valor > 0);
    const y0 = temNeg && temPos ? H / 2 : temNeg ? 40 : H - 40;
    const esc = (temNeg && temPos ? H / 2 - 40 : H - 80) / vmax;
    const bw = (W / its.length) * 0.66;
    return (
      <div style={{ width: W }}>
        {b.titulo && <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: 48, color: CR.creme, marginBottom: 20, opacity: prog(c.f, c.ini, 10) }}>{b.titulo}</div>}
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          <line x1={0} x2={W} y1={y0} y2={y0} stroke={alfa(CR.creme, 0.4)} strokeWidth={2} />
          {its.map((it, i) => {
            const p = prog(c.f, fr(it.em, c.ini + 6 + i * 2), 12);
            const v = Number(it.valor) || 0;
            const h = Math.abs(v) * esc * p;
            const k = it.cor ? corDe(it.cor, c) : v < 0 ? CR.queda : c.cor;
            const x = (i + 0.5) * (W / its.length) - bw / 2;
            return (
              <g key={i}>
                <rect x={x} y={v < 0 ? y0 : y0 - h} width={bw} height={h} fill={k} />
                {it.rotulo && <text x={x + bw / 2} y={v < 0 ? y0 - 14 : y0 + 32} textAnchor="middle" fontFamily={FT.mono} fontWeight={500} fontSize={20} fill={CR.cinza} opacity={p}>{it.rotulo}</text>}
              </g>
            );
          })}
        </svg>
        {b.total && <div style={{ fontFamily: FT.pesada, fontSize: 96, color: corDe(b.corTotal ?? "queda", c), marginTop: 10, opacity: prog(c.f, fr(b.totalEm, c.ini + 6 + its.length * 2 + 6), 10) }}>{b.total}</div>}
        {b.fonte && <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 22, color: CR.cinza, marginTop: 10, textTransform: "uppercase" }}>{`Fonte: ${b.fonte}`}</div>}
      </div>
    );
  }
  const vmax = b.max ?? Math.max(...its.map((i) => Number(i.valor) || 0), 1);
  const bw = W - (b.reserva ?? 210);
  return (
    <div style={{ width: W }}>
      {b.titulo && <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: b.tamTitulo ?? 56, color: CR.creme, marginBottom: 34, lineHeight: 1.05, opacity: prog(c.f, c.ini, 10) }}>{b.titulo}</div>}
      {its.map((it, i) => {
        const ini = fr(it.em, c.ini + 8 + i * 10);
        const p = interpolate(c.f, [ini, ini + 20], [0, 1], { ...clamp, easing: suave });
        const v = Number(it.valor) || 0;
        const k = corDe(it.cor, c);
        const tp = mola(c.f, ini + 14, 260, 12);
        return (
          <div key={i} style={{ marginBottom: 34, opacity: prog(c.f, ini - 2, 6) }}>
            <div style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 30, color: CR.creme, letterSpacing: 1, marginBottom: 10 }}>
              {it.rotulo}
              {it.nota && <span style={{ color: CR.cinza, fontWeight: 500 }}>{`  ${it.nota}`}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ width: (bw * v * p) / vmax, height: b.altura ?? 74, background: `linear-gradient(90deg, ${alfa(k, 0.55)}, ${k})`, borderRadius: "0 8px 8px 0", boxShadow: `0 0 26px ${alfa(k, 0.35)}` }} />
              <span style={{ fontFamily: FT.pesada, fontSize: b.tamTexto ?? 70, color: k, opacity: c.f >= ini + 14 ? 1 : 0, transform: `scale(${0.6 + 0.4 * tp})`, display: "inline-block" }}>{it.texto ?? fmtBR(v)}</span>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        {b.fonte ? <Pilula texto={b.fonte} c={c} tam={22} p={prog(c.f, c.ini + 14, 10)} /> : <span />}
        {b.selo && <Carimbinho texto={b.selo} c={c} ini={fr(b.seloEm, c.ini + 8 + its.length * 10 + 10)} cor={CR.creme} rot={-5} tam={24} />}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ régua de meses */

const Regua: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 940;
  const a = b.inicio ?? 0, z = b.fim ?? 18;
  const passo = b.passo ?? 1, maior = b.maior ?? 6;
  const X = (v: number) => 20 + ((v - a) / (z - a)) * (W - 40);
  const yB = 230;
  const ent = prog(c.f, c.ini, 12);
  const fx = b.faixa;
  const fp = fx ? prog(c.f, fr(fx.em, c.ini + 10), 14) : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ms: any[] = b.marcas ?? [];
  const cur = b.cursor;
  const ci = cur ? fr(cur.em, c.ini + 20 + ms.length * 8) : 0;
  const cp = cur ? interpolate(c.f, [ci, ci + 26], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) }) : 0;
  const ticks: number[] = [];
  for (let v = a; v <= z + 1e-6; v += passo) ticks.push(v);
  return (
    <div style={{ width: W }}>
      {b.titulo && <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: b.tamTitulo ?? 52, color: CR.creme, marginBottom: 10, opacity: ent }}>{b.titulo}</div>}
      <svg width={W} height={yB + 150} style={{ overflow: "visible", opacity: ent }}>
        {fx && <rect x={X(fx.de)} y={yB - 175} width={(X(fx.ate) - X(fx.de)) * fp} height={175} fill={alfa(corDe(fx.cor, c), 0.2)} />}
        {fx && fx.rotulo && <text x={(X(fx.de) + X(fx.ate)) / 2} y={yB - 188} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={24} fill={corDe(fx.cor, c)} opacity={fp}>{fx.rotulo}</text>}
        <rect x={10} y={yB} width={W - 20} height={70} rx={6} fill={CR.papel} />
        {ticks.map((v, i) => {
          const g = Math.abs(v % maior) < 1e-6;
          return (
            <g key={i}>
              <line x1={X(v)} x2={X(v)} y1={yB} y2={yB + (g ? 34 : 18)} stroke={CR.tinta} strokeWidth={g ? 4 : 2} />
              {g && <text x={X(v)} y={yB + 62} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={22} fill={CR.tinta}>{fmtBR(v)}</text>}
            </g>
          );
        })}
        {ms.map((m, i) => {
          const p = mola(c.f, fr(m.em, c.ini + 14 + i * 8), 240, 13);
          const x = X(m.valor);
          const lin = m.linha ?? i % 3;
          return (
            <g key={i} opacity={Math.min(1, p * 2)}>
              <line x1={x} x2={x} y1={yB - 20 - lin * 50} y2={yB} stroke={alfa(CR.creme, 0.7)} strokeWidth={3} />
              <circle cx={x} cy={yB - 20 - lin * 50} r={8 * p} fill={CR.creme} />
              <text x={x} y={yB - 34 - lin * 50} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={26} fill={CR.creme}>{m.rotulo ?? fmtBR(m.valor, 1)}</text>
            </g>
          );
        })}
        {cur && c.f >= ci && (() => {
          const x = X(a + (cur.valor - a) * cp);
          const k = corDe(cur.cor, c);
          const txt = cur.rotulo ?? `HOJE: ${fmtBR(cur.valor, 1)}`;
          const tw = txt.length * 17 + 34;
          return (
            <g>
              <line x1={x} x2={x} y1={yB - 150} y2={yB + 70} stroke={k} strokeWidth={6} />
              <path d={`M ${x - 16} ${yB + 92} L ${x + 16} ${yB + 92} L ${x} ${yB + 70} Z`} fill={k} />
              <rect x={Math.min(W - tw, Math.max(0, x - tw / 2))} y={yB + 100} width={tw} height={46} rx={23} fill={k} />
              <text x={Math.min(W - tw, Math.max(0, x - tw / 2)) + tw / 2} y={yB + 132} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={28} fill={sobre(k)}>{txt}</text>
            </g>
          );
        })()}
      </svg>
      {b.unidade && <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 24, color: CR.cinza, marginTop: 8, textTransform: "uppercase", letterSpacing: 2 }}>{b.unidade}</div>}
      {b.nota && <div style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: 40, color: CR.creme, marginTop: 18, opacity: prog(c.f, fr(b.notaEm, ci + 20), 10) }}>{b.nota}</div>}
    </div>
  );
};

/* ------------------------------------------------------------ fluxo (setas + partículas) */

const Fluxo: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 940;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nos: any[] = b.nos ?? [];
  const n = nos.length;
  const hN = b.alturaNo ?? 128, gap = b.espaco ?? 92;
  const risco = b.risco !== false;
  const wN = W - (risco ? 150 : 0) - 120;
  const H = n * hN + (n - 1) * gap;
  const cores = nos.map((no, i) => (no.cor ? corDe(no.cor, c) : interpolateColors(n > 1 ? i / (n - 1) : 0, [0, 0.45, 1], [CR.frio, c.cor, CR.queda])));
  const xo = (i: number) => (i % 2 ? 120 : 0);
  const yo = (i: number) => i * (hN + gap);
  return (
    <div style={{ width: W, position: "relative", height: H + (b.fonte ? 70 : 0) }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {nos.slice(0, -1).map((_, i) => {
          const ini = fr(nos[i + 1].em, c.ini + 10 + (i + 1) * 14) - 8;
          const p = interpolate(c.f, [ini, ini + 10], [0, 1], clamp);
          const x1 = xo(i) + wN / 2, y1 = yo(i) + hN, x2 = xo(i + 1) + wN / 2, y2 = yo(i + 1);
          const k = cores[i + 1];
          return (
            <g key={i}>
              <Seta x1={x1} y1={y1 + 8} x2={x2} y2={y2 - 10} p={p} cor={alfa(k, 0.9)} curva={i % 2 ? 0.25 : -0.25} esp={6} />
              {p >= 1 &&
                Array.from({ length: 6 }).map((__, j) => {
                  const s = ((c.f - ini) * 0.035 + j / 6) % 1;
                  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
                  const cv = i % 2 ? 0.25 : -0.25;
                  const qx = (x1 + x2) / 2 - (dy / len) * len * cv, qy = (y1 + y2) / 2 + (dx / len) * len * cv;
                  const px = (1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * qx + s * s * x2;
                  const py = (1 - s) * (1 - s) * (y1 + 8) + 2 * (1 - s) * s * qy + s * s * (y2 - 10);
                  return <circle key={j} cx={px} cy={py} r={9} fill={interpolateColors(s, [0, 1], [cores[i], cores[i + 1]])} opacity={Math.sin(s * Math.PI)} />;
                })}
            </g>
          );
        })}
      </svg>
      {nos.map((no, i) => {
        const ini = fr(no.em, c.ini + 10 + i * 14);
        const p = mola(c.f, ini, 200, 14);
        const k = cores[i];
        return (
          <div key={i} style={{ position: "absolute", left: xo(i), top: yo(i), width: wN, height: hN, borderRadius: 18, border: `4px solid ${k}`, background: `linear-gradient(90deg, ${alfa(k.startsWith("#") ? k : CR.creme, 0.22)}, ${alfa(CR.mesa, 0.85)})`, display: "flex", alignItems: "center", gap: 26, padding: "0 30px", boxSizing: "border-box", opacity: Math.min(1, p * 2), transform: `scale(${0.8 + 0.2 * p})`, boxShadow: `0 18px 40px rgba(0,0,0,0.45), 0 0 30px ${k.startsWith("#") ? alfa(k, 0.25) : "transparent"}` }}>
            <span style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 30, color: k }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: no.tam ?? 56, color: CR.creme, lineHeight: 1 }}>{no.rotulo}</div>
              {no.sub && <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 24, color: CR.cinza, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{no.sub}</div>}
            </div>
          </div>
        );
      })}
      {risco && (
        <div style={{ position: "absolute", right: 0, top: 0, width: 110, height: H, display: "flex", flexDirection: "column", alignItems: "center", opacity: prog(c.f, c.ini + 6, 12) }}>
          <span style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 20, color: CR.frio, letterSpacing: 1, textAlign: "center" }}>{b.rotuloTopo ?? "MENOS RISCO"}</span>
          <div style={{ flex: 1, width: 16, borderRadius: 8, margin: "14px 0", background: `linear-gradient(180deg, ${CR.frio}, ${c.cor} 45%, ${CR.queda})` }} />
          <span style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 20, color: CR.queda, letterSpacing: 1, textAlign: "center" }}>{b.rotuloBase ?? "MAIS RISCO"}</span>
        </div>
      )}
      {b.fonte && <div style={{ position: "absolute", left: 0, top: H + 24 }}><Pilula texto={b.fonte} c={c} tam={22} p={prog(c.f, c.ini + 12, 10)} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------ medidor 0–100 */

const Medidor: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 900;
  const R = W * 0.4, cx = W / 2, cy = R + 70;
  const max = b.max ?? 100;
  const A = (v: number) => Math.PI + (v / max) * Math.PI;
  const P_ = (v: number, r: number) => [cx + r * Math.cos(A(v)), cy + r * Math.sin(A(v))];
  const arco = (v0: number, v1: number, r: number) => {
    const [x0, y0] = P_(v0, r), [x1, y1] = P_(v1, r);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const ini = c.ini + 10;
  const sp = mola(c.f, ini, 70, 8);
  const v = Math.max(0, (b.valor ?? 0) * sp);
  const k = corDe(b.cor, c);
  const corte = b.corte;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marcas: any[] = b.marcas ?? [];
  const ent = prog(c.f, c.ini, 12);
  return (
    <div style={{ width: W, opacity: ent }}>
      {b.titulo && <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: b.tamTitulo ?? 52, color: CR.creme, textAlign: "center", lineHeight: 1.05 }}>{b.titulo}</div>}
      <svg width={W} height={cy + 190} style={{ overflow: "visible" }}>
        <defs>
          <pattern id={`cr-hach-${c.ini}`} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={14} height={14} fill={alfa(k, 0.25)} />
            <rect width={6} height={14} fill={alfa(k, 0.8)} />
          </pattern>
        </defs>
        <path d={arco(0, max, R)} fill="none" stroke={alfa(CR.creme, 0.12)} strokeWidth={56} />
        {corte !== undefined && <path d={arco(corte, max, R)} fill="none" stroke={`url(#cr-hach-${c.ini})`} strokeWidth={56} />}
        {v > 0.2 && <path d={arco(0, Math.min(v, max), R)} fill="none" stroke={CR.creme} strokeWidth={22} strokeLinecap="round" opacity={0.9} />}
        {Array.from({ length: 21 }).map((_, i) => {
          const tv = (i / 20) * max;
          const g = i % 5 === 0;
          const [x0, y0] = P_(tv, R + 36), [x1, y1] = P_(tv, R + (g ? 60 : 48));
          const [lx, ly] = P_(tv, R + 92);
          return (
            <g key={i}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={alfa(CR.creme, g ? 0.8 : 0.35)} strokeWidth={g ? 4 : 2} />
              {g && <text x={lx} y={ly + 9} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={26} fill={CR.cinza}>{fmtBR(tv)}</text>}
            </g>
          );
        })}
        {corte !== undefined && (() => {
          const [x0, y0] = P_(corte, R - 40), [x1, y1] = P_(corte, R + 130);
          return (
            <g opacity={prog(c.f, c.ini + 6, 10)}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={k} strokeWidth={5} strokeDasharray="10 7" />
              <text x={x1 + 10} y={y1 - 12} textAnchor="start" fontFamily={FT.mono} fontWeight={700} fontSize={26} fill={k}>{b.rotuloCorte ?? `CORTE ${corte}`}</text>
            </g>
          );
        })()}
        {marcas.map((m, i) => {
          const p = prog(c.f, fr(m.em, ini + 30 + i * 8), 10);
          const [x, y] = P_(m.valor, R - 44);
          const [lx, ly] = P_(m.valor, R - 86);
          return (
            <g key={i} opacity={p}>
              <circle cx={x} cy={y} r={10} fill={alfa(CR.creme, 0.7)} />
              <text x={lx} y={ly + 8} textAnchor="middle" fontFamily={FT.mono} fontWeight={700} fontSize={22} fill={alfa(CR.creme, 0.75)}>{m.rotulo}</text>
            </g>
          );
        })}
        {(() => {
          const [x, y] = P_(Math.min(v, max), R - 20);
          return (
            <g>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={k} strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${alfa(k, 0.6)})` }} />
              <circle cx={cx} cy={cy} r={26} fill={k} stroke={CR.mesa} strokeWidth={6} />
            </g>
          );
        })()}
        <text x={cx} y={cy + 140} textAnchor="middle" fontFamily={FT.pesada} fontSize={130} fill={CR.creme}>
          {Math.round(v)}
          <tspan fontFamily={FT.mono} fontWeight={700} fontSize={44} fill={CR.cinza}>{`/${max}`}</tspan>
        </text>
      </svg>
      {b.nota && <div style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: 42, color: CR.creme, textAlign: "center", marginTop: 6, opacity: prog(c.f, fr(b.notaEm, ini + 34), 10) }}>{b.nota}</div>}
      {b.fonte && <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}><Pilula texto={b.fonte} c={c} tam={22} p={prog(c.f, ini + 20, 10)} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------ grade de 100 */

const Grade: React.FC<P> = ({ b, c }) => {
  const W = b.w ?? 780;
  const total = b.total ?? 100, cols = b.colunas ?? 10, gap = 10;
  const cel = (W - gap * (cols - 1)) / cols;
  const nG = b.n ?? 0;
  const gIni = fr(b.cinzaEm, c.ini + 26);
  const gDur = seg(b.duracaoCinza ?? 1.6);
  const ordem = React.useMemo(() => Array.from({ length: total }, (_, i) => i).sort((a, z) => random(`gr${a}`) - random(`gr${z}`)), [total]);
  const rank = React.useMemo(() => {
    const r: number[] = [];
    ordem.forEach((idx, k) => (r[idx] = k));
    return r;
  }, [ordem]);
  const cont = Math.round(interpolate(c.f, [gIni, gIni + gDur], [0, nG], clamp));
  const k = corDe(b.cor, c);
  return (
    <div style={{ width: W }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 26, opacity: prog(c.f, gIni - 4, 8) }}>
        <span style={{ fontFamily: FT.pesada, fontSize: 150, color: CR.queda, lineHeight: 1 }}>{`${cont}${b.sufixo ?? "%"}`}</span>
        {b.texto && <span style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: 46, color: CR.creme, lineHeight: 1.05, maxWidth: W - 330 }}>{b.texto}</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap }}>
        {Array.from({ length: total }).map((_, i) => {
          const r = Math.floor(i / cols), co = i % cols;
          const pe = mola(c.f, c.ini + (r + co) * 0.9, 260, 14);
          const cinza = rank[i] < nG ? gIni + (rank[i] / Math.max(1, nG)) * gDur : Infinity;
          const g = c.f >= cinza;
          const tg = g ? interpolate(c.f, [cinza, cinza + 4], [1.15, 1], clamp) : 1;
          return (
            <div key={i} style={{ width: cel, height: cel, borderRadius: 6, background: g ? "#4A433B" : k, transform: `scale(${pe * tg})`, position: "relative", overflow: "hidden", boxShadow: g ? "none" : `0 0 14px ${alfa(k, 0.3)}` }}>
              {g && (
                <svg width={cel} height={cel} style={{ position: "absolute", inset: 0 }}>
                  <path d={`M ${cel * (0.2 + random(`a${i}`) * 0.3)} 0 L ${cel * 0.45} ${cel * 0.4} L ${cel * 0.3} ${cel * 0.6} L ${cel * (0.55 + random(`b${i}`) * 0.3)} ${cel}`} fill="none" stroke="#1B1611" strokeWidth={3} />
                  <path d={`M ${cel * 0.45} ${cel * 0.4} L ${cel} ${cel * (0.3 + random(`d${i}`) * 0.3)}`} fill="none" stroke="#1B1611" strokeWidth={2} />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      {b.fonte && <div style={{ marginTop: 26 }}><Pilula texto={b.fonte} c={c} tam={22} p={prog(c.f, gIni + gDur, 10)} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------ síntese ✔ / ✖ */

const Sintese: React.FC<P> = ({ b, c }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ls: any[] = b.linhas ?? [];
  return (
    <div style={{ width: b.w ?? 940 }}>
      {b.titulo && <div style={{ marginBottom: 34 }}><Kicker texto={b.titulo} c={c} ini={c.ini} /></div>}
      {ls.map((l, i) => {
        const ini = fr(l.em, c.ini + 6 + i * 14);
        const p = prog(c.f, ini, 10);
        const mp = interpolate(c.f, [ini + 6, ini + 16], [0, 1], clamp);
        const k = l.ok ? c.cor : CR.queda;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 34, marginBottom: 40, opacity: p, transform: `translateX(${(1 - p) * -40}px)` }}>
            <div style={{ position: "relative", width: 84, height: 84, border: `5px solid ${alfa(CR.creme, 0.8)}`, borderRadius: 8, flexShrink: 0 }}>{l.ok ? <Check p={mp} cor={k} /> : <Xis p={mp} cor={k} />}</div>
            <div>
              {l.rotulo && <div style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: k, textTransform: "uppercase" }}>{l.rotulo}</div>}
              <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: l.tam ?? 62, color: CR.creme, lineHeight: 1.05 }}>{l.texto}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ CTA */

const Aviao: React.FC<{ s: number; cor: string }> = ({ s, cor }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinejoin="round">
    <path d="M22 3 L9.5 13.5 M22 3 L15 21 L11 13.5 L3 10 Z" />
  </svg>
);

const Cta: React.FC<P> = ({ b, c }) => {
  const acento = new Set<string>((b.acento ?? []).map(norm));
  const pq = fr(b.perguntaEm, c.ini + 16);
  const pe = fr(b.enviarEm, pq + 20);
  const pf = fr(b.perfilEm, pe + 16);
  const pa = fr(b.avisoEm, c.ini);
  const mq = mola(c.f, pq, 160, 14);
  const me = mola(c.f, pe, 200, 12);
  const mp = mola(c.f, pf, 180, 14);
  const pulso = 1 + 0.07 * Math.sin(c.f * 0.35);
  return (
    <div style={{ width: b.w ?? 940, position: "relative" }}>
      {b.kicker && <div style={{ marginBottom: 24 }}><Kicker texto={b.kicker} c={c} ini={c.ini} /></div>}
      {((b.linhas ?? []) as string[]).map((l, i) => {
        const p = prog(c.f, c.ini + 3 + i * 4, 12);
        return (
          <div key={i} style={{ overflow: "hidden" }}>
            <Frase texto={l} acento={acento} marca={new Set()} mp={0} c={c} style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: b.tamanho ?? 96, lineHeight: 1.04, letterSpacing: -1, color: CR.creme, transform: `translateY(${(1 - p) * 105}%)` }} />
          </div>
        );
      })}
      {b.pergunta && c.f >= pq && (
        <div style={{ marginTop: 50, opacity: Math.min(1, mq * 2), transform: `translateY(${(1 - mq) * 60}px) rotate(-1deg)` }}>
          <Papel seed="cta" rasgada pad="38px 36px 34px">
            <span style={{ position: "absolute", left: 0, top: -6, fontFamily: FT.pesada, fontSize: 30, letterSpacing: 2, background: c.cor, color: sobre(c.cor), padding: "6px 22px", borderRadius: 30, transform: `scale(${pulso})`, transformOrigin: "left center", display: "inline-block" }}>{b.comenta ?? "COMENTA"}</span>
            <div style={{ fontFamily: FT.serif, fontWeight: 800, fontSize: 58, color: CR.tinta, paddingTop: 48, lineHeight: 1.05 }}>{b.pergunta}</div>
          </Papel>
        </div>
      )}
      {b.enviar && c.f >= pe && (
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, me * 2), transform: `translateX(${(1 - me) * -60}px)` }}>
          <div style={{ transform: `scale(${pulso}) rotate(${(1 - me) * -30}deg)` }}><Aviao s={92} cor={c.cor} /></div>
          <span style={{ fontFamily: FT.serif, fontStyle: "italic", fontWeight: 600, fontSize: 44, color: CR.creme, lineHeight: 1.1 }}>{b.enviar}</span>
        </div>
      )}
      {b.usuario && c.f >= pf && (
        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 24, opacity: Math.min(1, mp * 2), transform: `scale(${0.8 + 0.2 * mp})`, transformOrigin: "left center" }}>
          {b.avatar && <Img src={staticFile(`${c.base}/assets/${b.avatar}`)} style={{ width: 104, height: 104, borderRadius: 60, border: `4px solid ${c.cor}`, objectFit: "cover" }} />}
          <div style={{ fontFamily: FT.ui, fontWeight: 800, fontSize: 48, color: CR.creme }}>@{String(b.usuario).replace(/^@/, "")}</div>
          <div style={{ fontFamily: FT.ui, fontWeight: 700, fontSize: 38, color: "#fff", background: CR.azulIG, padding: "12px 32px", borderRadius: 16 }}>Seguir</div>
        </div>
      )}
      {b.aviso && c.f >= pa && (
        <div style={{ position: "absolute", left: 70 - (b.x ?? 70), top: (b.avisoY ?? 1790) - (b.y ?? 400), width: 940, textAlign: "center", opacity: prog(c.f, pa, 10) }}>
          <div style={{ height: 2, background: alfa(CR.creme, 0.25), marginBottom: 14 }} />
          <div style={{ fontFamily: FT.mono, fontWeight: 500, fontSize: 24, color: alfa(CR.creme, 0.78) }}>{b.aviso}</div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ registro */

export const BLOCOS: Record<string, React.FC<P>> = {
  manchete: Manchete,
  titulo: Manchete,
  numero: Numero,
  carimbo: Carimbo,
  aviso: Aviso,
  recorte: Recorte,
  grafico: Grafico,
  relogio: Relogio,
  linhaTempo: LinhaTempo,
  placar: Placar,
  card: Placar,
  barras: Barras,
  regua: Regua,
  fluxo: Fluxo,
  medidor: Medidor,
  grade: Grade,
  sintese: Sintese,
  cta: Cta,
};

export function sonsDoBloco(b: BlocoCr, ini: number): [number, string, number][] {
  const s: [number, string, number][] = [];
  const cada = (lista: Qq[] | undefined, padrao: (i: number) => number, nome: string, vol: number) =>
    (lista ?? []).forEach((it: Qq, i: number) => s.push([fr(it.em, padrao(i)), nome, vol]));
  switch (b.tipo) {
    case "numero":
      s.push([ini, "tick", 0.5]);
      break;
    case "carimbo":
      s.push([ini, "carimbo", 0.6]);
      break;
    case "recorte":
      s.push([ini, "whoosh", 0.3], [ini + 6, "carimbo", 0.3]);
      break;
    case "grafico": {
      const fim = ini + 4 + seg(b.desenho ?? 2.2);
      s.push([ini, "whoosh", 0.2]);
      cada(b.anotacoes, (i) => fim + 6 + i * 9, "click", 0.35);
      cada(b.arcos, (i) => fim + 4 + i * 10, "click", 0.25);
      if (b.quedaEm !== undefined) s.push([seg(b.quedaEm), "whoosh", 0.3]);
      break;
    }
    case "relogio":
      cada(b.itens, (i) => ini + 12 + i * 10, "tick", 0.5);
      if (b.final) s.push([fr(b.final.em, fr(b.ponteiroEm, ini + 8) + 60), "pop", 0.55]);
      break;
    case "linhaTempo":
      cada(b.marcos, (i) => ini + 6 + i * 9, "pop", 0.3);
      break;
    case "placar":
    case "card":
      s.push([ini, "whoosh", 0.25]);
      cada(b.linhas, (i) => ini + 8 + i * 8, "tick", 0.4);
      break;
    case "barras":
      if (b.orientacao !== "vertical") cada(b.itens, (i) => ini + 8 + i * 10, "pop", 0.3);
      else s.push([ini, "whoosh", 0.25]);
      break;
    case "regua":
      if (b.cursor) s.push([fr(b.cursor.em, ini + 20 + (b.marcas ?? []).length * 8), "click", 0.4]);
      break;
    case "fluxo":
      cada(b.nos, (i) => ini + 10 + i * 14, "pop", 0.3);
      break;
    case "medidor":
      s.push([ini + 10, "whoosh", 0.25]);
      break;
    case "grade":
      s.push([fr(b.cinzaEm, ini + 26), "tick", 0.45]);
      break;
    case "sintese":
      cada(b.linhas, (i) => ini + 12 + i * 14, "carimbo", 0.4);
      break;
    case "cta":
      if (b.usuario) s.push([fr(b.perfilEm, fr(b.enviarEm, fr(b.perguntaEm, ini + 16) + 20) + 16), "pop", 0.5]);
      break;
  }
  return s;
}
