// Estilo TRAÇO: esboço técnico em traço preto fino sobre branco-gelo:
// celulares pretos flutuando com sombra elíptica, torres em treliça, relevo ondulado, órbitas e trajetos pontilhados,
// rótulos mono pequenos, muito espaço vazio. Acento único: o degradê laranja→amarelo do app (X-GO / Hermes).
// Cada bloco aceita x, y (CENTRO do bloco), z, em (entra) e ate (sai); âncoras "@palavra" viram segundos no produzir.py.
// Cena aceita camera {zoom, x, y} (número fixo ou [de, para]), legenda base|topo|nao e transicao "corte" (sem pan).
import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FPS, clamp, mola as molaBase, prog, seg } from "../editorial/movimento";

export const TR = {
  fundo: "#F6F6F4",
  tinta: "#111111",
  cinza: "#8E8E8A",
  linha: "#BDBDB7",
  claro: "#D9D9D4",
  laranja: "#EE7E31", // tons medidos no app (assets/app/home.png)
  amarelo: "#FBE74D",
  acento: "#E8711F", // laranja um pouco mais fundo para TEXTO sobre branco (legível)
  ouro: "#D4A64A",
  verde: "#2FBF71",
  azulIG: "#0095F6",
};
const GRAD_PADRAO = `linear-gradient(100deg, ${TR.laranja}, ${TR.amarelo})`;
let GRAD = GRAD_PADRAO; // paleta mono: vira papel branco (só contorno)
// paleta:"mono" (ref. 79, 18/11/2026): branco/cinza/preto, zero laranja. Trocada no início do render de VideoTraco.
const TR_PADRAO = { ...TR };
const TR_MONO: typeof TR = {
  fundo: "#F5F5F5", tinta: "#111111", cinza: "#898988", linha: "#C9CAC9", claro: "#E2E2E1",
  laranja: "#262726", amarelo: "#262726", acento: "#111111", ouro: "#898988", verde: "#262726", azulIG: "#262726",
};
// forja: todo bloco entra DESENHADO (guia tracejada → contorno com cursor-mira → conteúdo). Liga com paleta mono ou entrada:"forja".
const MODO = { mono: false, forja: false };
// fonteAcento: "serifa" (Instrument Serif itálica, padrão) | "industrial" (Barlow Condensed itálica caixa-alta, placa técnica). Trocado no início do render.
const ACENTO_SERIFA: React.CSSProperties = { fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontWeight: 400, lineHeight: 1.0, letterSpacing: "-0.01em", textTransform: "none" };
const ACENTO_INDUSTRIAL: React.CSSProperties = { fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif', fontStyle: "italic", fontWeight: 600, lineHeight: 1.0, letterSpacing: "0.03em", textTransform: "uppercase" };
let ACENTO: React.CSSProperties = ACENTO_SERIFA;
let ACENTO_ESC = 1;
// sem salto: na forja a mola vira curva suave sem overshoot (nada de pop/escala/salto)
const mola = (f: number, ini: number, rigidez?: number, amortecimento?: number) =>
  MODO.forja ? interpolate(f, [ini, ini + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) }) : molaBase(f, ini, rigidez, amortecimento);
// acento no texto: laranja (padrão) ou, na mono, tinta sublinhada fina
const estAcento = (): React.CSSProperties =>
  MODO.mono ? { color: TR.tinta, textDecoration: "underline", textDecorationThickness: 3, textUnderlineOffset: "0.14em" } : { color: TR.acento };
const F = { pesada: "Archivo Black, Impact, sans-serif", serifa: '"Instrument Serif", Georgia, serif', mono: "JetBrains Mono, monospace", ui: "Inter, sans-serif" };

export type Palavra = { word: string; start: number; end: number };
// Tempo por palavra da narração + quadro em que a cena começa: o Lobo abre a boca só quando há fala (E5, 16/11/2026).
const FalaCtx = React.createContext<{ palavras: Palavra[]; from: number }>({ palavras: [], from: 0 });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlocoTr = { tipo: string; x?: number; y?: number; z?: number; em?: number; ate?: number; [k: string]: any };
type Valor = number | [number, number];
export type CenaTr = {
  duracao: number;
  legenda?: "base" | "topo" | "nao";
  transicao?: "corte" | "pan";
  camera?: { zoom?: Valor; x?: Valor; y?: Valor };
  negativo?: boolean; // cena em negativo (ref. 79): fundo #111, tinta e traços brancos; laranja e imagens mantêm a cor
  blocos: BlocoTr[];
};
export type RoteiroTr = {
  base: string;
  narracao?: string;
  trilha?: string;
  volumeTrilha?: number;
  palavras?: Palavra[];
  destaques?: string[];
  mascote?: boolean;
  paleta?: "mono" | "laranja"; // mono = ref. 79 (branco/cinza/preto, linha fina) — padrão dos vídeos a partir de 18/11/2026
  fonteAcento?: "serifa" | "industrial"; // fonte do termo-chave: serifa itálica (padrão) ou condensada técnica (temas industriais)
  entrada?: "forja" | "normal"; // forja = blocos desenhados (liga sozinha com paleta mono; "normal" desliga)
  cenas: CenaTr[];
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const fr = (s: number | undefined, padrao: number) => (typeof s === "number" ? seg(s) : padrao);
const suave = Easing.bezier(0.45, 0, 0.25, 1);
const flut = (f: number, fase = 0, amp = 10) => Math.sin((f / FPS) * 2.2 + fase) * amp;

type Ctx = { f: number; ini: number; fim: number; base: string };

/* ------------------------------------------------------------ ícones em traço (viewBox 24) */

const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const ICONES: Record<string, string> = {
  wifi: "M2 8.5a15 15 0 0 1 20 0M5 12a10.5 10.5 0 0 1 14 0M8.5 15.5a5.5 5.5 0 0 1 7 0M12 19h.01",
  globo: `${circ(12, 12, 9)}M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18`,
  nuvem: "M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z",
  cadeado: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2.5",
  chat: "M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5",
  memoria: "M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3",
  skills: "M13 2L4 14h7l-1 8 9-12h-7z",
  ferramentas: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  rotinas: `${circ(12, 12, 9)}M12 7v5l3.2 2`,
  telegram: "M21 4L3 11l6 2 2 6 3.5-4 4.5 4zM9 13l12-9",
  whatsapp: "M4 20l1.3-4A8 8 0 1 1 8 18.7zM9.2 8.6c-.3 2.9 3.1 6.5 6.2 6.2l.8-1.4-1.9-1-.9.8a4.4 4.4 0 0 1-2-2l.8-.9-1-1.9z",
  instagram: `M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z${circ(12, 12, 3.8)}M16.8 7.2h.01`,
  aprovacao: `${circ(12, 12, 9)}M8 12.5l2.6 2.6L16 9.6`,
  casa: "M3 11l9-7 9 7M5.5 9.5V20h13V9.5M10 20v-6h4v6",
  relogio: "M9 3h6l1 3H8zM9 21h6l1-3H8zM8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 9.5V12l1.6 1",
  lua: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  sol: `${circ(12, 12, 4)}M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8`,
  terminal: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7 10l3 2-3 2M12.5 15H17",
  servidor: "M4 4h16v7H4zM4 13h16v7H4zM7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6",
  persona: `${circ(12, 8, 4)}M4 21a8 8 0 0 1 16 0`,
  financas: "M3 7h18v12H3zM3 11h18M7 15h4",
  fluxo: `${circ(5, 6, 2)}${circ(19, 18, 2)}M7 6h6a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3`,
  dedo: "M9 11V5a1.5 1.5 0 0 1 3 0v5M12 10V8.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-2L9 15",
  modulos: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7",
  microfone: "M9 5.5a3 3 0 0 1 6 0V11a3 3 0 0 1-6 0zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7M9 8h2M13 8h2",
  // 17/11 (agentes-24h): funções do agente e dados
  robo: `M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM12 5.2V8${circ(12, 4, 1.2)}M9.5 12.5h.01M14.5 12.5h.01M9.5 15.5h5M3 12v3.5M21 12v3.5`,
  email: "M3 6h18v12H3zM3 7l9 6.5L21 7",
  cobranca: `${circ(12, 12, 9)}M14.8 9.3c-.6-.8-1.6-1.3-2.8-1.3-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.9 2.8 2.1-1.2 2-2.8 2c-1.3 0-2.4-.5-3-1.3M12 6.5V8M12 16v1.5`,
  recibo: "M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h3",
  remedio: "M4.9 12.1l7.2-7.2a4.24 4.24 0 0 1 6 6l-7.2 7.2a4.24 4.24 0 0 1-6-6zM8.5 8.5l6 6",
  calendario: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 13.5h3v3H8z",
  saude: "M12 20C5 15.5 3 12 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-2 6.5-9 11zM5 12.5h3.5l1.5-2.5 2.5 5 1.5-2.5H19",
  lampada: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  tendencia: "M3 17l6-6 4 4 8-8M15 7h6v6",
  documento: "M6 3h8l4 4v14H6zM14 3v4h4M9 11h6M9 14.5h6M9 18h4",
  lupa: `${circ(10.5, 10.5, 6.5)}M15.3 15.3L21 21`,
  loja: "M4 9l1.5-5h13L20 9M4 9h16M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 11v9h14v-9M10 20v-5h4v5",
};

// mascote:false no topo do roteiro.json tira o Lobo/Hermes do vídeo inteiro (blocos lobo/hermes somem;
// celular tela:"lobo" e cta trocam o Lobo pelo emblema X-GO). Padrão: true (vídeo 13 continua igual).
const MascoteCtx = React.createContext(true);

const Icone: React.FC<{ nome: string; tam: number; cor?: string; espessura?: number }> = ({ nome, tam, cor = TR.tinta, espessura = 1.6 }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={MODO.mono ? Math.min(espessura, 53 / tam) : espessura} strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONES[nome] ?? ICONES.globo} />
  </svg>
);

/* ------------------------------------------------------------ peças */

const Sombra: React.FC<{ w: number; topo: number; bob: number }> = ({ w, topo, bob }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: topo,
      width: w,
      height: w * 0.16,
      marginLeft: -w / 2,
      borderRadius: "50%",
      background: "radial-gradient(ellipse at center, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.10) 45%, rgba(0,0,0,0) 72%)",
      transform: `scale(${1 - bob / 90})`,
    }}
  />
);

const Rotulo: React.FC<{ texto: string; tam?: number; cor?: string; p?: number }> = ({ texto, tam = 32, cor = TR.tinta, p = 1 }) => (
  <div
    style={{
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: tam,
      letterSpacing: tam * 0.14,
      color: cor,
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 14,
      whiteSpace: "nowrap",
      opacity: p,
      transform: `translateY(${(1 - p) * 12}px)`,
    }}
  >
    <span style={{ width: tam * 0.36, height: tam * 0.36, background: MODO.mono ? "transparent" : GRAD, border: MODO.mono ? `2px solid ${TR.tinta}` : undefined, borderRadius: MODO.mono ? "50%" : 0, display: "inline-block", flexShrink: 0 }} />
    {texto}
  </div>
);

const PilulaFonte: React.FC<{ texto: string; p?: number; tam?: number }> = ({ texto, p = 1, tam = 26 }) => (
  <span
    style={{
      fontFamily: F.mono,
      fontWeight: 500,
      fontSize: tam,
      letterSpacing: 1,
      color: TR.tinta,
      background: "#FFFFFF",
      border: `2.5px solid ${TR.tinta}`,
      padding: "8px 22px",
      borderRadius: 40,
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      opacity: p,
      transform: `translateY(${(1 - p) * 12}px)`,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 12, height: 12, borderRadius: 6, background: TR.laranja, display: "inline-block" }} />
    {texto}
  </span>
);

const Chip: React.FC<{ t: string; icone?: string; p: number; tam?: number; escuro?: boolean }> = ({ t, icone, p, tam = 34, escuro }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: icone ? `12px 28px 12px 18px` : "12px 28px",
      background: escuro ? TR.tinta : "#FFFFFF",
      color: escuro ? "#FFFFFF" : TR.tinta,
      border: `3px solid ${TR.tinta}`,
      borderRadius: 60,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: tam,
      letterSpacing: 2,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      opacity: Math.min(1, p * 2),
      transform: `scale(${0.6 + 0.4 * p})`,
      boxShadow: "0 14px 24px rgba(0,0,0,0.10)",
    }}
  >
    {icone && <Icone nome={icone} tam={tam * 1.35} cor={escuro ? "#FFFFFF" : TR.tinta} espessura={1.8} />}
    {t}
  </div>
);

// contador: 0→1 com saída suave (números contam, FOLHA §6) e número no formato brasileiro (8.105 · 7,8)
const conta = (f: number, ini: number, dur = 24) => interpolate(f, [ini, ini + dur], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
const fmt = (v: number, casas = 0) => {
  const [i, d] = v.toFixed(casas).split(".");
  const ii = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return d ? `${ii},${d}` : ii;
};
// palavras em acento (laranja) dentro de um texto: acento:["agentes","81%"]
const comAcento = (texto: string, acento: string[] = []) => {
  const ac = new Set(acento.map(norm));
  return texto.split(" ").map((w, i, arr) => (
    <span key={i} style={ac.has(norm(w)) ? estAcento() : undefined}>
      {w}
      {i < arr.length - 1 ? " " : ""}
    </span>
  ));
};
const useIdSvg = () => React.useId().replace(/[^a-zA-Z0-9]/g, "");

/* ------------------------------------------------------------ Emblema X-GO (substitui o Lobo quando mascote:false) */
// Disco no degradê do app, contorno preto + sombra chapada, ícone em traço (robô) e anel pontilhado girando; crachá preto embaixo.

const Emblema: React.FC<{ tam: number; f: number; icone?: string; cracha?: string; anel?: boolean }> = ({ tam, f, icone = "robo", cracha, anel = true }) => (
  <div style={{ position: "relative", width: tam, height: tam }}>
    {anel && (
      <svg width={tam * 1.36} height={tam * 1.36} style={{ position: "absolute", left: -tam * 0.18, top: -tam * 0.18, overflow: "visible" }}>
        <circle cx={tam * 0.68} cy={tam * 0.68} r={tam * 0.64} fill="none" stroke={TR.linha} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" transform={`rotate(${f * 0.5} ${tam * 0.68} ${tam * 0.68})`} />
        <circle r={6} fill={TR.laranja} cx={tam * 0.68 + tam * 0.64 * Math.cos(f * 0.05)} cy={tam * 0.68 + tam * 0.64 * Math.sin(f * 0.05)} />
      </svg>
    )}
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: GRAD, border: `${Math.max(3, tam * 0.02)}px solid ${TR.tinta}`, boxShadow: `${tam * 0.04}px ${tam * 0.04}px 0 ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icone nome={icone} tam={tam * 0.58} espessura={1.5} />
    </div>
    {cracha && (
      <div style={{ position: "absolute", left: "50%", bottom: -tam * 0.1, transform: "translateX(-50%)", background: TR.tinta, color: "#FFF", fontFamily: F.mono, fontWeight: 700, fontSize: Math.max(22, tam * 0.13), letterSpacing: 3, padding: `${tam * 0.025}px ${tam * 0.08}px`, borderRadius: 12, whiteSpace: "nowrap" }}>{cracha}</div>
    )}
  </div>
);

/* ------------------------------------------------------------ Lobo: mascote fiel ao avatar do app (preto facetado + neon laranja) */
// Ref.: assets/hermes/lobo.png do app — cabeça PRETA geométrica (facetas planas, focinho em V até o nariz), orelhas
// triangulares, contorno laranja-dourado neon com brilho, olhos âmbar com ponto de luz e halo. Corpo de mascote no mesmo
// material. A personalidade vem dos olhos neon, das orelhas, da cabeça inclinando, do rabo, de piscar e respirar.
// viewBox 200×200, pés no chão (y≈198). expressao: feliz (padrão) | acena | comemora | pensando | surpreso.
// cracha: "X-GO" · caixa: true · disco: true (medalhão escuro com aro neon, igual ao ícone do app).

const NEON = "#E8A33A";
const NEON_CLARO = "#FFC55C";
const OLHO = "#FFB23A";
const PRETO = "#121318";
const FACETA = "#1D1F2A";
const FACETA_ESC = "#08080B";
const estrela = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const k = i % 2 ? r * 0.45 : r;
    return `${i ? "L" : "M"}${(cx + Math.cos(a) * k).toFixed(1)} ${(cy + Math.sin(a) * k).toFixed(1)}`;
  }).join("") + "Z";

// braço: tubo preto com borda neon; a pata é um hexágono preto contornado
const Braco: React.FC<{ s: [number, number]; h: [number, number]; dobra?: number }> = ({ s, h, dobra = 8 }) => {
  const mx = (s[0] + h[0]) / 2 + dobra;
  const my = (s[1] + h[1]) / 2 + Math.abs(dobra) * 0.5;
  const d = `M${s[0]} ${s[1]}Q${mx.toFixed(1)} ${my.toFixed(1)} ${h[0].toFixed(1)} ${h[1].toFixed(1)}`;
  const pata = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    return `${i ? "L" : "M"}${(h[0] + Math.cos(a) * 9).toFixed(1)} ${(h[1] + Math.sin(a) * 9).toFixed(1)}`;
  }).join("") + "Z";
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={NEON} strokeWidth={14} />
      <path d={d} stroke={PRETO} strokeWidth={8.5} />
      <path d={pata} fill={PRETO} stroke={NEON} strokeWidth={2.6} strokeLinejoin="round" />
    </g>
  );
};

const braco = (s: [number, number], graus: number, comp: number): [number, number] => {
  const a = (graus * Math.PI) / 180;
  return [s[0] + Math.sin(a) * comp, s[1] - Math.cos(a) * comp];
};

const EXPRESSOES = ["feliz", "acena", "comemora", "pensando", "surpreso"];

const LoboSvg: React.FC<{ tam: number; f: number; expressao?: string; cracha?: string; caixa?: boolean; disco?: boolean; fase?: number; calado?: boolean }> = ({
  tam,
  f,
  expressao = "feliz",
  cracha,
  caixa = false,
  disco = false,
  fase = 0,
  calado = false,
}) => {
  const fala = React.useContext(FalaCtx);
  const ex = EXPRESSOES.includes(expressao) ? expressao : "feliz";
  const q = f + fase;
  const t = q / FPS;
  // piscar automático (~3,4 s; às vezes duplo) nos olhos abertos
  const ciclo = Math.floor(q / 102);
  const pq = q % 102;
  const piscaEm = random(`lobo-pisca-${ciclo}`) > 0.65 ? [84, 93] : [92];
  const pisca = Math.max(0, ...piscaEm.map((p0) => (pq >= p0 && pq < p0 + 7 ? Math.sin(((pq - p0) / 7) * Math.PI) : 0)));
  const olhoY = 1 - 0.9 * pisca;
  const brilho = 0.7 + 0.3 * Math.sin(t * 3.2); // halo dos olhos pulsando
  const resp = Math.sin(t * 2.4);
  const balanco = Math.sin(t * 1.3) * 2.2;
  const pulo = ex === "comemora" ? -Math.abs(Math.sin(t * 5.5)) * 9 : 0;
  const tremido = ex === "surpreso" ? Math.sin(q * 2.1) * 0.7 : 0;
  const tilt = ex === "pensando" ? 8 + Math.sin(t * 1.6) * 1.5 : ex === "surpreso" ? -3 : ex === "comemora" ? Math.sin(t * 5.5) * 4 : ex === "acena" ? -4 + Math.sin(t * 1.4) * 2 : Math.sin(t * 1.1) * 2.5;
  // orelhas: pose por expressão + tremidinha automática a cada ~2,7 s
  const tw = q % 81 < 14 ? Math.max(0, Math.sin(((q % 81) / 14) * Math.PI * 2)) * 9 : 0;
  const orelha: Record<string, [number, number]> = { feliz: [0, 0], acena: [4, -2], comemora: [8, -8], pensando: [2, 24], surpreso: [11, -11] };
  const oE = orelha[ex][0] - tw + tremido * 4;
  const oD = orelha[ex][1] + (ex === "pensando" ? 0 : tw * 0.6) - tremido * 4;
  const corpo = `translate(100 194) scale(${(1 + 0.012 * resp).toFixed(4)} ${(1 + 0.022 * resp).toFixed(4)}) translate(-100 -194)`;
  const cabeca = `translate(0 ${(-1.8 * resp).toFixed(2)}) rotate(${tilt.toFixed(2)} 100 136)`;

  // braços
  const oEsq: [number, number] = [74, 146];
  const oDir: [number, number] = [126, 146];
  const aAceno = 48 + Math.sin(t * 9) * 14;
  let bEsq: React.ReactNode = <Braco s={oEsq} h={[64, 178]} dobra={-6} />;
  let bDir: React.ReactNode = <Braco s={oDir} h={[136, 178]} dobra={6} />;
  let naFrente = false;
  if (caixa) {
    bEsq = <Braco s={oEsq} h={[54, 176]} dobra={-4} />;
    bDir = <Braco s={oDir} h={[146, 176]} dobra={4} />;
  } else if (ex === "acena") {
    bDir = <Braco s={oDir} h={braco(oDir, aAceno, 60)} dobra={10} />;
    naFrente = true;
  } else if (ex === "comemora") {
    const k = Math.sin(t * 11) * 7;
    bEsq = <Braco s={oEsq} h={braco(oEsq, -40 + k, 62)} dobra={-8} />;
    bDir = <Braco s={oDir} h={braco(oDir, 40 - k, 62)} dobra={8} />;
    naFrente = true;
  } else if (ex === "pensando") {
    bDir = <Braco s={oDir} h={[112, 146]} dobra={16} />;
    naFrente = true;
  } else if (ex === "surpreso") {
    bEsq = <Braco s={oEsq} h={[46, 112]} dobra={-10} />;
    bDir = <Braco s={oDir} h={[154, 112]} dobra={10} />;
    naFrente = true;
  }
  const maoAceno = ex === "acena" && !caixa ? braco(oDir, aAceno, 60) : null;

  // olhos neon (centros 78/122, y 86)
  const halo = (cx: number, r = 31) => <circle cx={cx} cy={86} r={r} fill="url(#lbHalo)" opacity={brilho} stroke="none" />;
  const olhoAberto = (cx: number, rot: number, o: { rx?: number; ry?: number; dx?: number; dy?: number; sy?: number } = {}) => (
    <g transform={`translate(${cx + (o.dx ?? 0)} ${86 + (o.dy ?? 0)}) rotate(${rot}) scale(1 ${((o.sy ?? 1) * olhoY).toFixed(3)})`} stroke="none">
      <ellipse rx={o.rx ?? 13} ry={o.ry ?? 8.5} fill={OLHO} />
      <ellipse cx={-(o.rx ?? 13) * 0.28} cy={-(o.ry ?? 8.5) * 0.18} rx={(o.rx ?? 13) * 0.36} ry={(o.ry ?? 8.5) * 0.42} fill="#FFF1CC" />
    </g>
  );
  const olhoArco = (cx: number, grosso = 6) => (
    <path d={`M${cx - 13} 91L${cx} 79L${cx + 13} 91`} fill="none" stroke={OLHO} strokeWidth={grosso} strokeLinecap="round" strokeLinejoin="round" />
  );
  let olhos: React.ReactNode;
  if (ex === "feliz") olhos = <g>{halo(78)}{halo(122)}{olhoArco(78)}{olhoArco(122)}</g>;
  else if (ex === "comemora") olhos = <g>{halo(78, 30)}{halo(122, 30)}{olhoArco(78, 7)}{olhoArco(122, 7)}</g>;
  else if (ex === "acena") olhos = <g>{halo(78)}{halo(122, 22)}{olhoAberto(78, 8)}{olhoArco(122)}</g>; // piscadinha
  else if (ex === "surpreso")
    olhos = (
      <g>
        {halo(78, 32)}
        {halo(122, 32)}
        {olhoAberto(78, 0, { rx: 14, ry: 14 })}
        {olhoAberto(122, 0, { rx: 14, ry: 14 })}
      </g>
    );
  else
    olhos = (
      <g>
        {halo(78, 20)}
        {halo(122)}
        {olhoAberto(78, 6, { dx: 3, dy: 2, sy: 0.38 })}
        {olhoAberto(122, -6, { dx: 4, dy: -3, rx: 12, ry: 9 })}
        <path d="M64 80L92 86" stroke={NEON} strokeWidth={3} strokeLinecap="round" />
        <path d="M110 70L134 64" stroke={NEON} strokeWidth={3} strokeLinecap="round" />
      </g>
    );

  // boca falando: abre e fecha enquanto uma palavra da narração está soando (ritmo ~3 sílabas/s)
  const tg = (f + fala.from) / FPS;
  const palavraAgora = calado ? undefined : fala.palavras.find((w) => tg >= w.start - 0.02 && tg <= w.end + 0.04);
  const abre = palavraAgora ? 0.3 + 0.7 * Math.abs(Math.sin(tg * 17 + palavraAgora.start * 5)) : 0;
  const bocaFalando = (
    <ellipse cx={100} cy={137} rx={6.5 + 2.5 * abre} ry={1.4 + 6.4 * abre} fill="#2B1206" stroke={NEON} strokeWidth={2.4} />
  );
  const bocas: Record<string, React.ReactNode> = {
    feliz: <path d="M90 134Q100 142 110 134" fill="none" stroke={NEON} strokeWidth={2.6} strokeLinecap="round" />,
    acena: <path d="M88 133Q100 145 112 133" fill="none" stroke={NEON} strokeWidth={2.8} strokeLinecap="round" />,
    comemora: (
      <g>
        <path d="M86 132L114 132L100 154Z" fill="#2B1206" stroke={NEON} strokeWidth={2.8} strokeLinejoin="round" />
        <ellipse cx={100} cy={142} rx={7} ry={5} fill={OLHO} opacity={0.55 + 0.3 * Math.sin(t * 6)} />
      </g>
    ),
    pensando: <path d="M92 137L108 134" fill="none" stroke={NEON} strokeWidth={2.6} strokeLinecap="round" />,
    surpreso: <ellipse cx={100} cy={140} rx={5} ry={6.5 + Math.sin(q * 0.5) * 0.6} fill="#2B1206" stroke={NEON} strokeWidth={2.4} />,
  };

  const txtCracha = (cracha ?? "").toUpperCase();
  const cr = caixa ? { x: 76, y: 170, w: 48, h: 24 } : { x: 80, y: 150, w: 40, h: 22 };
  const fsCracha = Math.min(cr.h * 0.62, (cr.w * 1.5) / Math.max(1, txtCracha.length));

  const confetes =
    ex === "comemora"
      ? Array.from({ length: 18 }, (_, i) => {
          const k = ((q + i * 11) % 46) / 46;
          const a = -Math.PI / 2 + (random(`cf-a${i}`) - 0.5) * 2.8;
          const v = 95 + random(`cf-v${i}`) * 60;
          const x = 100 + Math.cos(a) * v * k;
          const y = 26 + Math.sin(a) * v * k + 120 * k * k;
          const op = k < 0.12 ? 0 : k < 0.2 ? (k - 0.12) / 0.08 : 1 - Math.max(0, (k - 0.7) / 0.3);
          const cor = i % 2 ? TR.laranja : TR.amarelo;
          return (
            <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(q * (4 + i) + i * 40) % 360})`} opacity={op}>
              {i % 3 === 0 ? (
                <path d={estrela(0, 0, 7)} fill={cor} stroke={TR.tinta} strokeWidth={1.6} strokeLinejoin="round" />
              ) : i % 3 === 1 ? (
                <rect x={-4} y={-2} width={8} height={4} fill={cor} stroke={TR.tinta} strokeWidth={1.2} />
              ) : (
                <circle r={2.6} fill={TR.tinta} />
              )}
            </g>
          );
        })
      : null;

  return (
    <svg width={tam} height={tam} viewBox="0 0 200 200" style={{ overflow: "visible", filter: `drop-shadow(0 0 ${Math.max(2, tam * 0.016).toFixed(1)}px rgba(232,163,58,0.7))` }}>
      <defs>
        <linearGradient id="lbGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={TR.laranja} />
          <stop offset="1" stopColor={TR.amarelo} />
        </linearGradient>
        <radialGradient id="lbHalo">
          <stop offset="0" stopColor={NEON_CLARO} stopOpacity={0.95} />
          <stop offset="0.4" stopColor="#F07A2A" stopOpacity={0.5} />
          <stop offset="1" stopColor="#F07A2A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="lbFace" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#1B1D27" />
          <stop offset="1" stopColor="#0A0A0D" />
        </linearGradient>
        <radialGradient id="lbDisco" cx="0.75" cy="0.8" r="0.8">
          <stop offset="0" stopColor="#3A2508" />
          <stop offset="0.6" stopColor="#0B0B0D" />
        </radialGradient>
      </defs>
      {disco && <circle cx={100} cy={104} r={98} fill="url(#lbDisco)" stroke={NEON} strokeWidth={3.5} />}
      <g transform={`translate(0 ${pulo.toFixed(2)}) rotate(${balanco.toFixed(2)} 100 198)`}>
        <g stroke={NEON} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round">
          {/* rabo facetado abanando */}
          <g transform={`rotate(${(Math.sin(t * (ex === "comemora" ? 9 : 4)) * (ex === "pensando" ? 4 : 12)).toFixed(2)} 134 180)`}>
            <path d="M132 184L166 162L178 124L158 154L134 166Z" fill={PRETO} />
            <path d="M178 124L166 162L160 152Z" fill={FACETA} strokeWidth={1.6} />
          </g>
          {/* corpo facetado (respira) */}
          <g transform={corpo}>
            <path d="M74 134L126 134L140 160L134 192L66 192L60 160Z" fill="url(#lbFace)" />
            <path d="M84 136L100 170L116 136Z" fill={FACETA} strokeWidth={1.6} strokeOpacity={0.7} />
            <path d="M66 190L96 190L98 199L60 199Z" fill={PRETO} />
            <path d="M104 190L134 190L140 199L102 199Z" fill={PRETO} />
            {naFrente ? ex === "pensando" || ex === "acena" ? bEsq : null : bEsq}
            {!naFrente && bDir}
            {caixa && (
              <g stroke={TR.tinta} strokeWidth={3}>
                <path d="M50 164L38 152H96L100 164Z" fill="#D7A465" />
                <path d="M150 164L162 152H104L100 164Z" fill="#D7A465" />
                <rect x={50} y={164} width={100} height={38} rx={2} fill="#E9C28C" />
                <path d="M92 164V178H108V164" fill="#F5E3BC" strokeWidth={2} />
                <path d="M134 194V182M129 187L134 182L139 187M58 172H68" fill="none" strokeWidth={2.2} />
                <circle cx={54} cy={176} r={8.5} fill={PRETO} stroke={NEON} strokeWidth={2.6} />
                <circle cx={146} cy={176} r={8.5} fill={PRETO} stroke={NEON} strokeWidth={2.6} />
              </g>
            )}
            {txtCracha && (
              <g>
                <path d={`M88 138L${cr.x + 7} ${cr.y}M112 138L${cr.x + cr.w - 7} ${cr.y}`} fill="none" stroke={NEON} strokeWidth={2.2} />
                <rect x={cr.x} y={cr.y} width={cr.w} height={cr.h} rx={4} fill="url(#lbGrad)" stroke={TR.tinta} strokeWidth={2.4} />
                <text x={cr.x + cr.w / 2} y={cr.y + cr.h / 2 + fsCracha * 0.36 + 1.5} textAnchor="middle" fontFamily={F.pesada} fontSize={fsCracha} fill={TR.tinta} stroke="none">
                  {txtCracha}
                </text>
              </g>
            )}
          </g>
          {/* cabeça geométrica (fiel ao ícone do app) */}
          <g transform={cabeca}>
            <g transform={`rotate(${oE.toFixed(2)} 64 60)`}>
              <path d="M44 74L46 12L90 50Z" fill={PRETO} />
              <path d="M52 64L53 26L80 50Z" fill={FACETA} strokeWidth={1.6} strokeOpacity={0.6} />
            </g>
            <g transform={`rotate(${oD.toFixed(2)} 136 60)`}>
              <path d="M156 74L154 12L110 50Z" fill={PRETO} />
              <path d="M148 64L147 26L120 50Z" fill={FACETA} strokeWidth={1.6} strokeOpacity={0.6} />
            </g>
            <path d="M68 48L132 48L160 74L162 104L140 124L110 146L90 146L60 124L38 104L40 74Z" fill="url(#lbFace)" strokeWidth={3.2} />
            {/* facetas planas */}
            <g stroke="none">
              <path d="M100 50L116 64L100 100L84 64Z" fill={FACETA} />
              <path d="M40 74L66 88L60 124L38 104Z" fill={FACETA_ESC} />
              <path d="M160 74L134 88L140 124L162 104Z" fill={FACETA} opacity={0.7} />
              <path d="M78 108L100 100L122 108L110 146L90 146Z" fill="#16171F" />
            </g>
            <path d="M66 88L90 146M134 88L110 146" fill="none" strokeWidth={2} strokeOpacity={0.55} />
            {olhos}
            <path d="M92 124L108 124L104 131L96 131Z" fill="#000000" stroke="none" />
            <ellipse cx={100} cy={127} rx={8.5} ry={6} fill="#000000" stroke="none" />
            <ellipse cx={97} cy={125} rx={2.4} ry={1.3} fill="#5A5A66" stroke="none" />
            {abre > 0.05 && ex !== "comemora" ? bocaFalando : bocas[ex]}
          </g>
          {naFrente && (ex === "surpreso" || ex === "comemora" ? <g>{bEsq}{bDir}</g> : bDir)}
        </g>
        {maoAceno && (
          <g fill="none" stroke={NEON} strokeWidth={2.6} strokeLinecap="round" opacity={0.9}>
            <path d={`M${(maoAceno[0] + 14).toFixed(1)} ${(maoAceno[1] - 14).toFixed(1)}q6 10 1 20`} />
            <path d={`M${(maoAceno[0] + 22).toFixed(1)} ${(maoAceno[1] - 20).toFixed(1)}q8 16 1 32`} />
          </g>
        )}
        {ex === "pensando" && (
          <g transform={`translate(0 ${(Math.sin(t * 2) * 3).toFixed(2)})`} stroke={TR.tinta} strokeWidth={2.4} fill="#FFFFFF">
            <circle cx={158} cy={40} r={3.5} />
            <circle cx={168} cy={27} r={5.5} />
            <ellipse cx={186} cy={6} rx={16} ry={13} />
            <text x={186} y={12} textAnchor="middle" fontFamily={F.pesada} fontSize={17} fill={TR.acento} stroke="none">
              ?
            </text>
          </g>
        )}
        {ex === "surpreso" && (
          <g fill="none" stroke={NEON} strokeWidth={3.2} strokeLinecap="round" transform={`translate(100 30) scale(${(1 + 0.08 * Math.sin(q * 0.6)).toFixed(3)}) translate(-100 -30)`}>
            <path d="M156 30L166 16M164 44L179 38M144 20L147 4" />
            <path d="M44 30L34 16M36 44L21 38M56 20L53 4" />
          </g>
        )}
        {confetes}
      </g>
    </svg>
  );
};

const Lobo: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const tam = b.tam ?? 300;
  const m = mola(c.f, c.ini, 170, 13);
  const bob = flut(c.f, 1.3, b.flutua === false ? 0 : tam * 0.02);
  const expressao = b.expressao ?? (b.acena ? "acena" : "feliz"); // "acena: true" antigo continua valendo
  return (
    <div style={{ position: "relative", width: tam, height: tam }}>
      {b.sombra !== false && <Sombra w={tam * 0.7} topo={tam * 0.93} bob={bob} />}
      <div style={{ transform: `translateY(${bob}px) scale(${m})`, transformOrigin: "50% 100%", opacity: Math.min(1, m * 2), filter: "drop-shadow(0 12px 14px rgba(0,0,0,0.20))" }}>
        <LoboSvg tam={tam} f={c.f} expressao={expressao} cracha={b.cracha} caixa={!!b.caixa} disco={!!b.disco} fase={b.fase ?? 0} calado={!!b.calado} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ celular */

type Clipe = { video: string; inicio?: number; vel?: number; em?: number };

const Moldura: React.FC<{ tam: number; f: number; flutua?: boolean; fase?: number; children: React.ReactNode }> = ({ tam, f, flutua = true, fase = 0, children }) => {
  const bez = Math.round(tam * 0.017) + 5;
  const sh = tam - 2 * bez;
  const sw = Math.round((sh * 720) / 1560);
  const w = sw + 2 * bez;
  const bob = flutua ? flut(f, fase, tam * 0.011) : 0;
  const raio = w * 0.13;
  return (
    <div style={{ position: "relative", width: w, height: tam }}>
      <Sombra w={w * 0.95} topo={tam + tam * 0.035} bob={bob} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${bob}px)`, background: "#0A0A0B", borderRadius: raio, padding: bez, boxShadow: "inset 0 0 0 2px #2E2E30, 0 30px 50px rgba(0,0,0,0.18)" }}>
        <div style={{ width: sw, height: sh, borderRadius: raio - bez * 0.7, overflow: "hidden", position: "relative", background: "#000" }}>{children}</div>
        <div style={{ position: "absolute", top: bez + sh * 0.012, left: "50%", width: sw * 0.26, height: sh * 0.024, marginLeft: -sw * 0.13, borderRadius: 30, background: "#000" }} />
      </div>
    </div>
  );
};

const telaDims = (tam: number) => {
  const bez = Math.round(tam * 0.017) + 5;
  const sh = tam - 2 * bez;
  return { sw: Math.round((sh * 720) / 1560), sh };
};

const Toque: React.FC<{ f: number; ini: number; tam: number }> = ({ f, ini, tam }) => {
  if (f < ini - 8) return null;
  const chega = interpolate(f, [ini - 8, ini], [0, 1], { ...clamp, easing: suave });
  const aperta = f >= ini && f < ini + 5 ? 0.85 : 1;
  const onda = (f - ini) / 18;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
      {f >= ini &&
        [0, 0.4].map((d, i) => {
          const k = onda - d;
          if (k < 0 || k > 1) return null;
          return <div key={i} style={{ position: "absolute", left: -tam * (0.3 + k * 0.9), top: -tam * (0.3 + k * 0.9), width: tam * (0.6 + k * 1.8), height: tam * (0.6 + k * 1.8), borderRadius: "50%", border: `4px solid ${TR.verde}`, opacity: 1 - k }} />;
        })}
      <div style={{ position: "absolute", left: -tam * 0.22, top: -tam * 0.12 + (1 - chega) * 120, opacity: chega, transform: `scale(${aperta})`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
        <div style={{ background: "#FFFFFF", borderRadius: "50%", padding: tam * 0.08, border: `3px solid ${TR.tinta}` }}>
          <Icone nome="dedo" tam={tam * 0.6} espessura={1.9} />
        </div>
      </div>
    </div>
  );
};

// moldura:"janela": janela de computador (barra com 3 bolinhas + título mono) para gravação horizontal; w = largura, proporcao = w/h da tela.
const Janela: React.FC<{ w: number; h: number; f: number; titulo?: string; flutua?: boolean; fase?: number; children: React.ReactNode }> = ({ w, h, f, titulo, flutua = true, fase = 0, children }) => {
  const barra = Math.round(w * 0.06);
  const bob = flutua ? flut(f, fase, 8) : 0;
  return (
    <div style={{ position: "relative", width: w, height: h + barra }}>
      <Sombra w={w * 0.9} topo={h + barra + 24} bob={bob} />
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${bob}px)`, background: "#0C0C0D", borderRadius: 22, overflow: "hidden", border: "2px solid #2A2A2C", boxShadow: "0 30px 50px rgba(0,0,0,0.18)" }}>
        <div style={{ height: barra, display: "flex", alignItems: "center", gap: barra * 0.22, padding: `0 ${barra * 0.4}px`, borderBottom: "2px solid #222224" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: barra * 0.3, height: barra * 0.3, borderRadius: "50%", border: `2.5px solid ${i === 0 ? TR.laranja : "#5A5A5E"}`, display: "inline-block" }} />
          ))}
          {titulo && <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: barra * 0.38, color: "#8A8A90", marginLeft: barra * 0.3, letterSpacing: 1 }}>{titulo}</span>}
        </div>
        <div style={{ position: "relative", width: w - 4, height: h - 2, overflow: "hidden", background: "#000" }}>{children}</div>
      </div>
    </div>
  );
};

const Celular: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const mascote = React.useContext(MascoteCtx);
  const janela = b.moldura === "janela";
  const tam = b.tam ?? 960;
  const jw = b.w ?? 960;
  const jh = Math.round(jw / (b.proporcao ?? 16 / 9));
  const { sw, sh } = janela ? { sw: jw, sh: jh } : telaDims(tam);
  const m = mola(c.f, c.ini, 150, 15);
  const entrada = b.entrada === "escala" ? `scale(${0.45 + 0.55 * m})` : `translateY(${(1 - m) * 260}px)`;
  const clipes: Clipe[] = b.clipes ?? (b.video ? [{ video: b.video, inicio: b.inicio, vel: b.vel }] : []);
  const zt = b.zoomTela;
  const zEm = zt ? fr(zt.em, c.ini + 20) : 0;
  const zk = zt ? interpolate(c.f, [zEm, zEm + 14], [1, zt.escala ?? 1.8], { ...clamp, easing: suave }) : 1;
  const inicios = clipes.map((k, i) => (i === 0 ? c.ini : fr(k.em, c.ini)));
  let conteudo: React.ReactNode = null;
  if (clipes.length) {
    conteudo = clipes.map((k, i) => {
      const de = inicios[i];
      const ate = i < clipes.length - 1 ? inicios[i + 1] : c.fim + 30;
      return (
        <Sequence key={i} from={de} durationInFrames={Math.max(1, ate - de)} layout="none">
          <OffthreadVideo
            src={staticFile(`${c.base}/assets/${k.video}`)}
            muted
            startFrom={seg(k.inicio ?? 0)}
            playbackRate={k.vel ?? 1}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Sequence>
      );
    });
  } else if (b.img) {
    conteudo = <Img src={staticFile(`${c.base}/assets/${b.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  } else if (b.tela === "lobo") {
    conteudo = (
      <div style={{ position: "absolute", inset: 0, background: "#FFFBF2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: sw * 0.08 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: sh * 0.55, background: `radial-gradient(ellipse at 50% 0%, ${TR.amarelo}66, ${TR.laranja}22 45%, transparent 72%)` }} />
        {mascote ? <LoboSvg tam={sw * 0.66} f={c.f} expressao={b.expressaoLobo ?? "acena"} cracha={b.cracha} /> : <Emblema tam={sw * 0.5} f={c.f} cracha={b.cracha ?? "X-GO"} />}
        <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: sw * 0.075, color: TR.tinta }}>{b.textoTela ?? "Agente online"}</div>
        <div style={{ width: sw * 0.5, height: sw * 0.018, borderRadius: 10, background: GRAD }} />
      </div>
    );
  }
  // borrar: [{x,y,w,h,em,ate}] em % da tela do celular — desfoque forte só nessa área (esconder um valor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const borroes = (b.borrar ?? []).map((r: any, i: number) => {
    const de = fr(r.em, c.ini);
    const ate = r.ate !== undefined ? seg(r.ate) : 1e9;
    if (c.f < de - 1 || c.f > ate + 1) return null;
    const op = Math.min(interpolate(c.f, [de, de + 4], [0, 1], clamp), interpolate(c.f, [ate - 4, ate], [1, 0], clamp));
    const forca = r.forca ?? 22;
    return (
      <div
        key={`bo${i}`}
        style={{
          position: "absolute",
          left: `${r.x}%`,
          top: `${r.y}%`,
          width: `${r.w}%`,
          height: `${r.h}%`,
          borderRadius: sw * 0.03,
          backdropFilter: `blur(${forca}px) saturate(0.85)`,
          WebkitBackdropFilter: `blur(${forca}px) saturate(0.85)`,
          background: "rgba(128,128,128,0.18)",
          opacity: op,
        }}
      />
    );
  });
  const tela = (
    <>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zk})`, transformOrigin: zt?.origem ?? "50% 50%" }}>
        {conteudo}
        {borroes}
      </div>
      {b.toque && (
        <div style={{ position: "absolute", left: sw * b.toque.x, top: sh * b.toque.y }}>
          <Toque f={c.f} ini={fr(b.toque.em, c.ini + 30)} tam={(janela ? 440 : sw) * 0.24} />
        </div>
      )}
    </>
  );
  // etiqueta: {t, icone, sub, em, pos:"baixo"|"topo", escuro} — chip sobre a borda do aparelho (diz QUAL função a gravação mostra)
  const et = b.etiqueta;
  const etIni = et ? fr(et.em, c.ini + 12) : 0;
  const etM = et ? mola(c.f, etIni, 220, 13) : 0;
  const altTotal = janela ? jh + Math.round(jw * 0.06) : tam;
  return (
    <div style={{ position: "relative", transform: `${entrada} rotate(${(b.rot ?? 0) + (1 - m) * 4}deg)`, opacity: Math.min(1, m * 2) }}>
      {janela ? (
        <Janela w={jw} h={jh} f={c.f} titulo={b.titulo} flutua={b.flutua !== false} fase={b.fase ?? 0}>
          {tela}
        </Janela>
      ) : (
        <Moldura tam={tam} f={c.f} flutua={b.flutua !== false} fase={b.fase ?? 0}>
          {tela}
        </Moldura>
      )}
      {et && c.f >= etIni - 1 && (
        <div style={{ position: "absolute", left: "50%", top: et.pos === "topo" ? -34 : altTotal - 50, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 3 }}>
          <Chip t={et.t} icone={et.icone} p={etM} tam={et.tam ?? 34} escuro={et.escuro} />
          {et.sub && <PilulaFonte texto={et.sub} tam={22} p={prog(c.f, etIni + 6, 10)} />}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ cavaleiro Hermes (sprite) */

const Hermes: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const tam = b.tam ?? 460;
  const m = mola(c.f, c.ini, 160, 14);
  const bob = flut(c.f, 0.6, tam * 0.02);
  const k = Math.floor(c.f / (FPS / 8)) % 8;
  const src = b.quadros === false ? "assets/hermes/hermes.png" : `assets/hermes/hermes-frame-${k}.png`;
  const alt = b.quadros === false ? tam : tam * (500 / 560);
  return (
    <div style={{ position: "relative", width: tam, height: alt }}>
      <Sombra w={tam * 0.7} topo={alt * 0.95} bob={bob} />
      <Img src={staticFile(`${c.base}/${src}`)} style={{ width: tam, height: alt, imageRendering: "pixelated", transform: `translateY(${bob}px) scale(${m})`, opacity: Math.min(1, m * 2) }} />
    </div>
  );
};

/* ------------------------------------------------------------ desenho técnico: servidor, torre, relevo, círculos, partículas */

const Servidor: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const tam = b.tam ?? 320; // altura
  const w = tam * 0.62;
  const p = prog(c.f, c.ini, 16);
  const bob = flut(c.f, 2, b.flutua === false ? 0 : tam * 0.015);
  const dn = b.diaNoiteEm !== undefined ? fr(b.diaNoiteEm, c.ini) : -1;
  const ang = dn >= 0 ? interpolate(c.f, [dn, dn + 50], [0, Math.PI * 2], clamp) + (c.f - dn) * 0.01 : 0;
  const R = tam * 0.62;
  return (
    <div style={{ position: "relative", width: w, height: tam }}>
      <Sombra w={w * 1.2} topo={tam * 1.0} bob={bob} />
      <svg width={w} height={tam} viewBox="0 0 62 100" style={{ overflow: "visible", transform: `translateY(${bob}px)`, opacity: p }}>
        <g fill="none" stroke={TR.tinta} strokeWidth={2.4} vectorEffect="non-scaling-stroke" strokeLinecap="round">
          <path d="M31 2 V12 M24 7 a9 9 0 0 1 14 0 M20 3 a14 14 0 0 1 22 0" vectorEffect="non-scaling-stroke" />
          <rect x={4} y={12} width={54} height={84} rx={4} vectorEffect="non-scaling-stroke" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={9} y={18 + i * 19} width={44} height={14} rx={2} vectorEffect="non-scaling-stroke" />
              <path d={`M14 ${25 + i * 19} H34`} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
          <path d="M10 96 V99 M52 96 V99" vectorEffect="non-scaling-stroke" />
        </g>
        {[0, 1, 2, 3].map((i) => {
          const aceso = Math.sin(c.f * 0.35 + i * 1.7) > -0.2;
          return (
            <g key={i}>
              <circle cx={44} cy={25 + i * 19} r={2.2} fill={aceso ? TR.laranja : "none"} stroke={TR.tinta} strokeWidth={1} />
              <circle cx={49} cy={25 + i * 19} r={2.2} fill={i % 2 ? TR.tinta : "none"} stroke={TR.tinta} strokeWidth={1} />
            </g>
          );
        })}
      </svg>
      {dn >= 0 && c.f >= dn && (
        <>
          <svg width={R * 2 + 40} height={R * 2 + 40} style={{ position: "absolute", left: w / 2 - R - 20, top: tam / 2 - R - 20, overflow: "visible" }}>
            <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke={TR.linha} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={prog(c.f, dn, 10)} />
          </svg>
          {[0, Math.PI].map((d, i) => (
            <div key={i} style={{ position: "absolute", left: w / 2 + Math.cos(ang + d - Math.PI / 2) * R - 36, top: tam / 2 + Math.sin(ang + d - Math.PI / 2) * R - 36, background: TR.fundo, borderRadius: 40, padding: 4, opacity: prog(c.f, dn, 10) }}>
              <Icone nome={i ? "lua" : "sol"} tam={64} cor={i ? TR.tinta : TR.acento} espessura={1.8} />
            </div>
          ))}
        </>
      )}
      {b.rotulo && (
        <div style={{ position: "absolute", top: tam + tam * 0.12, left: "50%", transform: "translateX(-50%)" }}>
          <Rotulo texto={b.rotulo} tam={26} p={prog(c.f, c.ini + 8, 10)} />
        </div>
      )}
    </div>
  );
};

const Torre: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const h = b.tam ?? 420;
  const w = h * 0.36;
  const p = interpolate(c.f, [c.ini, c.ini + 24], [0, 1], { ...clamp, easing: suave });
  const n = 8;
  const segs: string[] = [];
  for (let i = 0; i < n; i++) {
    const y0 = 14 + (i / n) * 86;
    const y1 = 14 + ((i + 1) / n) * 86;
    const a0 = 3 + (i / n) * 15;
    const a1 = 3 + ((i + 1) / n) * 15;
    segs.push(`M${18 - a0} ${y0} L${18 + a1} ${y1} M${18 + a0} ${y0} L${18 - a1} ${y1} M${18 - a1} ${y1} H${18 + a1}`);
  }
  return (
    <svg width={w} height={h} viewBox="0 0 36 100" style={{ overflow: "visible" }}>
      <g fill="none" stroke={TR.tinta} strokeLinecap="round">
        <path d="M18 0 V14 M15 3 H21 M14 8 H22" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        <path d="M15 14 L0 100 M21 14 L36 100 M15 14 H21" strokeWidth={2.4} vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
        <path d={segs.join(" ")} strokeWidth={1.2} vectorEffect="non-scaling-stroke" opacity={p} />
      </g>
      {Math.sin(c.f * 0.3) > 0 && <circle cx={18} cy={1} r={1.6} fill={TR.laranja} />}
    </svg>
  );
};

const Relevo: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 1080;
  const h = b.h ?? 360;
  const n = b.linhas ?? 7;
  const p = interpolate(c.f, [c.ini, c.ini + 26], [0, 1], { ...clamp, easing: suave });
  const deriva = c.f * 0.6;
  const linhas = Array.from({ length: n }).map((_, i) => {
    const y0 = (i / (n - 1)) * h * 0.9 + h * 0.05;
    const amp = (h * 0.09) * (1 - i / n) + 6;
    let d = "";
    for (let x = -20; x <= w + 20; x += 16) {
      const y = y0 - amp * Math.sin((x + deriva * (0.3 + i * 0.1)) / (170 + i * 30) + i * 0.8) - amp * 0.5 * Math.sin(x / 63 + i);
      d += `${x === -20 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    return d;
  });
  return (
    <svg width={w} height={h} style={{ overflow: "visible", opacity: b.opacidade ?? 1 }}>
      {linhas.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={i === 0 ? "#9C9C97" : TR.claro} strokeWidth={i === 0 ? 2.5 : 2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      ))}
    </svg>
  );
};

// terreno (ref. 79): malha de curvas de nível em perspectiva 3D, linha fina cinza, deriva lenta; cenário de fundo (use z baixo).
// props: w h linhas colunas perspectiva(0 plano..1 forte) amp deriva desenha(quadros) cor corFrente opacidade
const Terreno: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 1080;
  const h = b.h ?? 900;
  const n = Math.max(2, b.linhas ?? 14);
  const nc = b.colunas ?? 0;
  const pers = Math.max(0, Math.min(1, b.perspectiva ?? 0.7));
  const amp = b.amp ?? 0.1;
  const dur = b.desenha ?? 34;
  const tt = (c.f / FPS) * 0.22 * (b.deriva ?? 1);
  const cor = corDe(b.cor ?? "#C9CAC9");
  const corFrente = corDe(b.corFrente ?? "#898988");
  const zf = (v: number) => 1 + pers * 3 * (1 - v); // 1 = perto (baixo), 1+3p = longe (topo)
  const zLonge = zf(0);
  const sy = (v: number) => (pers < 0.01 ? v : (1 / zf(v) - 1 / zLonge) / (1 - 1 / zLonge));
  const alt = (u: number, v: number) =>
    amp * (0.6 * Math.sin(u * 3.1 + v * 2.3 + tt) + 0.25 * Math.sin(u * 7.3 - v * 4.1 - tt * 1.3) + 0.35 * Math.cos(v * 5.7 + u * 1.7 + tt * 0.7));
  const pt = (u: number, v: number): string => {
    const z = zf(v);
    const x = w / 2 + (u * (w / 2) * (1 + pers * 1.2)) / z + Math.sin(tt * 0.5) * 12;
    const y = h * 0.06 + sy(v) * h * 0.9 - (alt(u, v) * h) / z;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  const linha = (pts: string[]) => "M" + pts.join("L");
  const fileiras = Array.from({ length: n }).map((_, i) => {
    const v = i / (n - 1);
    return { v, d: linha(Array.from({ length: 49 }).map((__, k) => pt(-1 + (2 * k) / 48, v))) };
  });
  const cols = Array.from({ length: nc }).map((_, j) => linha(Array.from({ length: 25 }).map((__, k) => pt(nc > 1 ? -1 + (2 * j) / (nc - 1) : 0, k / 24))));
  return (
    <svg width={w} height={h} style={{ overflow: "hidden", opacity: b.opacidade ?? 1, display: "block" }}>
      {fileiras.map(({ v, d }, i) => (
        <path key={i} d={d} fill="none" stroke={i === n - 1 ? corFrente : cor} strokeWidth={i === n - 1 ? 2.2 : 1.6} opacity={0.35 + 0.65 * v}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenha(c.f, c.ini + (n - 1 - i) * 2, dur)} />
      ))}
      {cols.map((d, j) => (
        <path key={`c${j}`} d={d} fill="none" stroke={cor} strokeWidth={1.4} opacity={0.6}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - desenha(c.f, c.ini + 10 + j, dur)} />
      ))}
    </svg>
  );
};

const Circulos: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const r = b.r ?? 380;
  const p = prog(c.f, c.ini, 18);
  const pulso = ((c.f - c.ini) % 50) / 50;
  return (
    <svg width={r * 2 + 20} height={r * 2 + 20} style={{ overflow: "visible", opacity: p }}>
      <g transform={`translate(${r + 10} ${r + 10})`} fill="none">
        <circle r={r} stroke={TR.linha} strokeWidth={3} strokeDasharray="2 16" strokeLinecap="round" transform={`rotate(${c.f * 0.4})`} />
        <circle r={r * 0.72} stroke={TR.claro} strokeWidth={2} />
        <circle r={r * 0.46} stroke={TR.linha} strokeWidth={2.5} strokeDasharray="2 12" strokeLinecap="round" transform={`rotate(${-c.f * 0.6})`} />
        <circle r={r * (0.46 + pulso * 0.6)} stroke={TR.tinta} strokeWidth={2} opacity={(1 - pulso) * 0.35} />
        <circle r={7} fill={TR.laranja} cx={r * Math.cos(c.f * 0.04)} cy={r * Math.sin(c.f * 0.04)} />
      </g>
    </svg>
  );
};

const Particulas: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const n = b.n ?? 40;
  const [x0, y0, w, h] = b.area ?? [0, 0, 1080, 1920];
  const p = prog(c.f, c.ini, 20);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: p }}>
      {Array.from({ length: n }).map((_, i) => {
        const rx = random(`px${i}`);
        const ry = random(`py${i}`);
        const s = 3 + random(`ps${i}`) * 7;
        const x = x0 + rx * w + Math.sin(c.f * 0.03 + i) * 14;
        const y = y0 + ((ry * h - c.f * (0.6 + rx)) % h + h) % h;
        return random(`pq${i}`) > 0.5 ? <rect key={i} x={x} y={y} width={s} height={s} fill={TR.tinta} /> : <circle key={i} cx={x} cy={y} r={s / 2} fill={TR.tinta} />;
      })}
    </svg>
  );
};

const IconeBloco: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const tam = b.tam ?? 160;
  const m = mola(c.f, c.ini, 200, 13);
  const bob = flut(c.f, b.fase ?? 0.4, b.flutua === false ? 0 : tam * 0.04);
  return (
    <div style={{ position: "relative", width: tam, height: tam, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Sombra w={tam * 0.8} topo={tam * 1.08} bob={bob} />
      <div style={{ transform: `translateY(${bob}px) scale(${m})`, opacity: Math.min(1, m * 2) }}>
        <Icone nome={b.icone} tam={tam} cor={b.cor === "laranja" ? TR.acento : TR.tinta} espessura={b.espessura ?? 1.3} />
      </div>
      {b.rotulo && (
        <div style={{ position: "absolute", top: tam * 1.25 }}>
          <Rotulo texto={b.rotulo} tam={b.tamRotulo ?? 28} p={prog(c.f, c.ini + 6, 10)} />
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ textos */

const RotuloBloco: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => <Rotulo texto={b.texto} tam={b.tam ?? 32} p={prog(c.f, c.ini, 10)} />;

const PilulaBloco: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => <PilulaFonte texto={b.texto} tam={b.tam ?? 26} p={prog(c.f, c.ini, 10)} />;

const Palavras: React.FC<{ texto: string; acento: Set<string>; style: React.CSSProperties }> = ({ texto, acento, style }) => (
  <div style={style}>
    {texto.split(" ").map((w, i, arr) => (
      <span key={i} style={acento.has(norm(w)) ? estAcento() : undefined}>
        {w}
        {i < arr.length - 1 ? " " : ""}
      </span>
    ))}
  </div>
);

const Titulo: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const ac = new Set<string>((b.acento ?? []).map(norm));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linhas: { t: string; em?: number; tam?: number; serifa?: boolean }[] = (b.linhas ?? []).map((l: any) => (typeof l === "string" ? { t: l } : l));
  return (
    <div style={{ width: b.w ?? 980, textAlign: "center" }}>
      {linhas.map((l, i) => {
        const ini = fr(l.em, c.ini + i * 4);
        const m = mola(c.f, ini, 220, 14);
        // serifa:true (no bloco ou na linha) = termo editorial em serifa itálica, peso normal, caixa normal (ref. 79)
        const sf = l.serifa ?? b.serifa;
        const fonte: React.CSSProperties = sf
          ? { ...ACENTO }
          : { fontFamily: F.pesada, lineHeight: 1.04, textTransform: "uppercase" };
        return (
          <Palavras
            key={i}
            texto={l.t}
            acento={ac}
            style={{ ...fonte, fontSize: l.tam ?? b.tam ?? (sf ? Math.round(150 * ACENTO_ESC) : 130), color: TR.tinta, opacity: Math.min(1, m * 2), transform: `translateY(${(1 - m) * 40}px) scale(${0.9 + 0.1 * m})` }}
          />
        );
      })}
    </div>
  );
};

const Numero: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  // dur (quadros da contagem, padrão 18) e casas (decimais); milhar com ponto: 8105 → 8.105
  const p = conta(c.f, c.ini, b.dur ?? 18);
  const valor = fmt(b.casas ? (b.valor as number) * p : Math.round((b.valor as number) * p), b.casas ?? 0);
  const m = mola(c.f, c.ini, 200, 14);
  return (
    <div style={{ width: b.w ?? 460, display: "flex", flexDirection: "column", alignItems: b.alinhar === "esq" ? "flex-start" : "center" }}>
      <div style={{ fontFamily: F.pesada, fontSize: b.tamanho ?? 300, lineHeight: 0.95, color: TR.tinta, transform: `scale(${0.8 + 0.2 * m})`, opacity: Math.min(1, m * 2) }}>
        {b.prefixo ?? ""}
        {valor}
        <span style={{ color: TR.acento }}>{b.sufixo ?? ""}</span>
      </div>
      {b.unidade && (
        <div style={{ fontFamily: F.pesada, fontSize: b.tamUnidade ?? 80, lineHeight: 1, color: TR.tinta, textTransform: "uppercase", opacity: prog(c.f, c.ini + 5, 10), marginTop: 4 }}>
          {b.unidade}
        </div>
      )}
      <div style={{ width: 120, height: MODO.mono ? 2 : 10, background: MODO.mono ? TR.tinta : GRAD, marginTop: 22, borderRadius: 6, transform: `scaleX(${prog(c.f, c.ini + 8, 12)})` }} />
      {b.fonte && (
        <div style={{ marginTop: 22 }}>
          <PilulaFonte texto={b.fonte} tam={24} p={prog(c.f, c.ini + 12, 10)} />
        </div>
      )}
    </div>
  );
};

const Lista: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: b.gap ?? 18, alignItems: b.alinhar === "esq" ? "flex-start" : "center" }}>
      {itens.map((it, i) => (
        <Chip key={i} t={it.t} icone={it.icone} tam={b.tam ?? 30} p={mola(c.f, fr(it.em, c.ini + i * 6), 220, 14)} escuro={it.escuro} />
      ))}
    </div>
  );
};

const ChipBloco: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const t = c.f - c.ini;
  const pisca = b.piscar !== false && t >= 0 && t < 14 ? (Math.floor(t / 3) % 2 ? 0.35 : 1) : 1;
  const bob = flut(c.f, b.fase ?? 0, 6);
  return (
    <div style={{ opacity: pisca, transform: `translateY(${bob}px)` }}>
      <Chip t={b.t} icone={b.icone} tam={b.tam ?? 32} p={mola(c.f, c.ini, 220, 13)} escuro={b.escuro} />
    </div>
  );
};

const Selo: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const r = b.r ?? 130;
  const m = mola(c.f, c.ini, 260, 12);
  const linhas: string[] = b.linhas ?? [b.texto ?? ""];
  return (
    <div style={{ position: "relative", width: r * 2, height: r * 2, transform: `scale(${1.6 - 0.6 * m}) rotate(${(b.rot ?? -10) + (1 - m) * 20}deg)`, opacity: Math.min(1, m * 2) }}>
      <svg width={r * 2} height={r * 2} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={r} cy={r} r={r - 4} fill="none" stroke={TR.tinta} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" transform={`rotate(${c.f * 0.8} ${r} ${r})`} />
      </svg>
      <div style={{ position: "absolute", inset: r * 0.12, borderRadius: "50%", background: GRAD, border: `3px solid ${TR.tinta}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: F.pesada, fontSize: b.tam ?? 46, lineHeight: 1.05, color: TR.tinta, textTransform: "uppercase" }}>{l}</div>
        ))}
      </div>
    </div>
  );
};

const Balao: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const m = mola(c.f, c.ini, 220, 13);
  const t = c.f - c.ini;
  const digitando = t < (b.espera ?? 12);
  return (
    <div style={{ position: "relative", transform: `scale(${m})`, transformOrigin: b.cauda === "esq" ? "0% 100%" : "100% 100%", opacity: Math.min(1, m * 2) }}>
      <div style={{ background: "#FFFFFF", border: `3px solid ${TR.tinta}`, borderRadius: 34, padding: "20px 32px", fontFamily: F.mono, fontWeight: 700, fontSize: b.tam ?? 36, color: TR.tinta, whiteSpace: "nowrap", boxShadow: "0 14px 24px rgba(0,0,0,0.10)", minWidth: 120, textAlign: "center" }}>
        {digitando ? (
          <span style={{ letterSpacing: 6 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ opacity: 0.3 + 0.7 * Math.max(0, Math.sin(c.f * 0.4 - i)) }}>●</span>
            ))}
          </span>
        ) : (
          b.texto
        )}
      </div>
      <svg width={40} height={30} style={{ position: "absolute", bottom: -24, [b.cauda === "esq" ? "left" : "right"]: 40, overflow: "visible" }}>
        <path d={b.cauda === "esq" ? "M0 0 L6 26 L28 0" : "M12 0 L34 26 L40 0"} fill="#FFFFFF" stroke={TR.tinta} strokeWidth={3} strokeLinejoin="round" />
        <path d={b.cauda === "esq" ? "M2 -2 H26" : "M14 -2 H38"} stroke="#FFFFFF" strokeWidth={5} />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------ pergunta (cartão de entrevista, digitada letra a letra) */
// Ficha de entrevistador: rótulo mono "PERGUNTA" + microfone em traço, pergunta em caixa alta digitada (vel = letras/quadro).
// Altura fixa desde o 1º quadro (as letras ainda não digitadas ficam invisíveis), então não empurra nada. Use no alto (y≈260).

const Pergunta: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 900;
  const tam = b.tam ?? 64;
  const texto: string = String(b.texto ?? "").toUpperCase();
  const m = mola(c.f, c.ini, 200, 15);
  const iniDig = c.ini + (b.espera ?? 8);
  const n = Math.max(0, Math.floor((c.f - iniDig) * (b.vel ?? 1.1)));
  const fim = n >= texto.length;
  const cursorOn = !fim || Math.floor(c.f / 9) % 2 === 0;
  const pulsoMic = c.f >= iniDig && !fim ? 1 + 0.08 * Math.sin(c.f * 0.9) : 1;
  return (
    <div style={{ width: w, transform: `translateY(${(1 - m) * -50}px) rotate(${b.rot ?? -1.2}deg)`, opacity: Math.min(1, m * 2) }}>
      <div style={{ position: "relative", background: "#FFFFFF", border: `3px solid ${TR.tinta}`, borderRadius: 22, padding: "26px 40px 34px", boxShadow: `10px 10px 0 ${TR.tinta}` }}>
        {/* fita adesiva da ficha */}
        <div style={{ position: "absolute", top: -18, left: "50%", width: 150, height: 34, marginLeft: -75, background: GRAD, opacity: 0.9, transform: "rotate(2deg)", border: `2px solid ${TR.tinta}` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulsoMic})` }}>
            <Icone nome="microfone" tam={38} espessura={1.8} />
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 26 * 0.3, color: TR.cinza }}>{b.rotulo ?? "PERGUNTA"}</div>
          <div style={{ flex: 1, height: 0, borderTop: `2.5px dashed ${TR.linha}`, marginLeft: 6 }} />
          {b.numero && <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: TR.acento }}>#{b.numero}</div>}
        </div>
        <div
          style={{
            fontFamily: F.pesada,
            fontSize: tam,
            lineHeight: 1.12,
            color: TR.tinta,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${tam * 1.12 - 3}px, ${TR.claro} ${tam * 1.12 - 3}px, ${TR.claro} ${tam * 1.12}px)`,
          }}
        >
          {texto.split("").map((ch, i) => (
            // cursor como filho absoluto da última letra: não cria ponto de quebra (a linha não "pula" ao digitar)
            <span key={i} style={{ position: "relative", opacity: i < n ? 1 : 0 }}>
              {ch}
              {i === Math.min(n, texto.length) - 1 && cursorOn && (
                <span style={{ position: "absolute", left: "100%", marginLeft: 4, top: "8%", width: tam * 0.09, height: "84%", background: TR.acento }} />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ terminal e passos */

const Terminal: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 920;
  const tam = b.tam ?? 34;
  const m = mola(c.f, c.ini, 170, 16);
  const enc = b.encolhe ? interpolate(c.f, [c.fim - 10, c.fim], [1, 0.4], { ...clamp, easing: suave }) : 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linhas: { t: string; em?: number; tipo?: string }[] = (b.linhas ?? []).map((l: any) => (typeof l === "string" ? { t: l } : l));
  let ultima = -1;
  const vis = linhas.map((l, i) => {
    const ini = fr(l.em, c.ini + 6 + i * 12);
    const tipo = l.tipo ?? "cmd";
    const vel = tipo === "cmd" ? (b.vel ?? 1.7) : 99;
    const n = Math.max(0, Math.floor((c.f - ini) * vel));
    if (c.f >= ini) ultima = i;
    return { ...l, tipo, ini, txt: l.t.slice(0, n), ok: c.f >= ini };
  });
  const cursor = Math.floor(c.f / 8) % 2 === 0;
  return (
    <div style={{ width: w, transform: `translateY(${(1 - m) * 120}px) scale(${enc})`, opacity: Math.min(1, m * 2), filter: MODO.mono ? undefined : "drop-shadow(0 30px 40px rgba(0,0,0,0.20))" }}>
      <div style={{ background: MODO.mono ? "#FFFFFF" : "#0C0C0D", borderRadius: 26, overflow: "hidden", border: `2px solid ${MODO.mono ? TR.tinta : "#2A2A2C"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 24px", borderBottom: `2px solid ${MODO.mono ? TR.linha : "#222224"}` }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 18, height: 18, borderRadius: 9, border: `2.5px solid ${i === 0 ? TR.laranja : "#5A5A5E"}`, display: "inline-block" }} />
          ))}
          <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 24, color: "#77777C", marginLeft: 16, letterSpacing: 1 }}>{b.titulo ?? "root@sua-vps: ~"}</span>
        </div>
        <div style={{ padding: "26px 30px 32px", minHeight: b.altura ?? 0 }}>
          {vis.map((l, i) =>
            !l.ok ? null : (
              <div key={i} style={{ fontFamily: F.mono, fontWeight: l.tipo === "cmd" ? 700 : 500, fontSize: tam, lineHeight: 1.35, color: l.tipo === "saida" ? (MODO.mono ? TR.cinza : "#9A9AA0") : MODO.mono ? TR.tinta : "#F2F2F2", whiteSpace: "pre-wrap", wordBreak: "break-all", marginTop: i ? 10 : 0, opacity: prog(c.f, l.ini, 4) }}>
                {l.tipo === "cmd" && <span style={{ color: TR.laranja }}>$ </span>}
                {l.tipo === "ok" && <span style={{ color: TR.verde }}>✓ </span>}
                {l.tipo === "saida" && <span style={{ color: "#5E5E64" }}>→ </span>}
                {l.tipo === "cmd" ? l.txt : l.t}
                {i === ultima && cursor && <span style={{ display: "inline-block", width: tam * 0.55, height: tam * 1.05, background: TR.amarelo, verticalAlign: "text-bottom", marginLeft: 4 }} />}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};

// passos com itens:[{t, sub, icone, em}] = passo a passo vertical (fechamento "comenta → recebe o passo a passo"):
// bolinha numerada + cartão; o passo anterior ganha ✓ quando o próximo entra. Sem itens = trilho horizontal antigo (ativo, rotulo).
const PassoAPasso: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 900;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens;
  const r = 46;
  const ins = itens.map((it, i) => fr(it.em, c.ini + 8 + i * 14));
  const atual = ins.reduce((a, ini, i) => (c.f >= ini ? i : a), -1);
  const alt = b.altItem ?? 150;
  const gap = b.gap ?? 34;
  const total = itens.length * alt + (itens.length - 1) * gap;
  // trilho preto avança até a bolinha do passo atual
  const linhaP = atual <= 0 ? 0 : interpolate(c.f, [ins[atual], ins[atual] + 12], [atual - 1, atual], { ...clamp, easing: suave }) / Math.max(1, itens.length - 1);
  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", gap: 26 }}>
      {b.titulo && <Rotulo texto={b.titulo} tam={30} p={prog(c.f, c.ini, 10)} />}
      <div style={{ position: "relative", height: total }}>
        <svg width={r * 2} height={total} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`M${r} ${alt / 2} V${total - alt / 2}`} stroke={TR.linha} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
          <path d={`M${r} ${alt / 2} V${alt / 2 + (total - alt) * linhaP}`} stroke={TR.tinta} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        </svg>
        {itens.map((it, i) => {
          const m = mola(c.f, ins[i], 200, 14);
          const on = i === atual;
          const feito = b.marcar !== false && i < atual;
          const y = i * (alt + gap);
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: y, width: w, height: alt, display: "flex", alignItems: "center", gap: 28, opacity: c.f < ins[i] ? 0.0 : Math.min(1, m * 2) }}>
              <div style={{ width: r * 2, height: r * 2, flexShrink: 0, borderRadius: r, background: on ? TR.tinta : feito ? "#FFF" : TR.fundo, border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: on ? "#FFF" : feito ? TR.verde : TR.tinta, transform: `scale(${0.6 + 0.4 * m})`, boxShadow: on ? `0 0 0 8px ${TR.fundo}, 0 0 0 12px ${TR.laranja}` : "none" }}>
                {feito ? "✓" : i + 1}
              </div>
              <div style={{ flex: 1, height: alt, display: "flex", alignItems: "center", gap: 22, background: "#FFF", border: `3px solid ${TR.tinta}`, borderRadius: 24, padding: "0 30px", boxShadow: on ? `10px 10px 0 ${TR.tinta}` : `5px 5px 0 ${TR.claro}`, transform: `translateX(${(1 - m) * 80}px)` }}>
                {it.icone && <Icone nome={it.icone} tam={64} espessura={1.6} cor={on ? TR.acento : TR.tinta} />}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: TR.cinza }}>PASSO {i + 1}</div>
                  <div style={{ fontFamily: F.pesada, fontSize: it.tam ?? b.tam ?? 46, lineHeight: 1.05, color: TR.tinta, textTransform: "uppercase" }}>{comAcento(it.t, it.acento ?? b.acento)}</div>
                  {it.sub && <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 24, color: TR.cinza }}>{it.sub}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Passos: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  if (Array.isArray(b.itens)) return <PassoAPasso b={b} c={c} />;
  const ativo = b.ativo ?? 1;
  const r = 44;
  const gap = 150;
  const p = prog(c.f, c.ini, 10);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, opacity: p }}>
      <div style={{ position: "relative", width: gap * 2 + r * 2, height: r * 2 }}>
        <svg width={gap * 2 + r * 2} height={r * 2} style={{ position: "absolute", inset: 0 }}>
          <path d={`M${r} ${r} H${gap * 2 + r}`} stroke={TR.tinta} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" />
        </svg>
        {[1, 2, 3].map((n, i) => {
          const on = n === ativo;
          const feito = n < ativo;
          const mm = on ? mola(c.f, c.ini + 2, 260, 12) : 1;
          return (
            <div key={n} style={{ position: "absolute", left: i * gap, top: 0, width: r * 2, height: r * 2, borderRadius: r, background: on ? TR.tinta : TR.fundo, border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: on ? "#FFF" : feito ? TR.tinta : TR.cinza, transform: `scale(${on ? 0.7 + 0.45 * mm : 1})`, boxShadow: on ? `0 0 0 8px ${TR.fundo}, 0 0 0 12px ${TR.laranja}` : "none" }}>
              {feito ? "✓" : n}
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: TR.tinta, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        Passo {ativo} <span style={{ color: TR.cinza }}>·</span> <span style={{ color: TR.acento }}>{b.rotulo}</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ órbita e conexão pontilhada */

const Orbita: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const rx = b.rx ?? 400;
  const ry = b.ry ?? 300;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  const n = Math.max(1, itens.length);
  const p = prog(c.f, c.ini, 16);
  const a0 = (b.angulo ?? -90) * (Math.PI / 180);
  const gira = c.f * (b.vel ?? 0.006);
  return (
    <div style={{ position: "relative", width: rx * 2, height: ry * 2 }}>
      <svg width={rx * 2} height={ry * 2} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: p }}>
        <ellipse cx={rx} cy={ry} rx={rx - 10} ry={ry - 10} fill="none" stroke={TR.tinta} strokeWidth={2.5} strokeDasharray="2 14" strokeLinecap="round" />
        <ellipse cx={rx} cy={ry} rx={(rx - 10) * 0.6} ry={(ry - 10) * 0.6} fill="none" stroke={TR.claro} strokeWidth={2} />
      </svg>
      {itens.map((it, i) => {
        const a = a0 + (i / n) * Math.PI * 2 + gira;
        const ie = fr(it.em, c.ini + 8 + i * 6);
        const mm = mola(c.f, ie, 220, 13);
        const x = rx + Math.cos(a) * (rx - 10);
        const y = ry + Math.sin(a) * (ry - 10);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", zIndex: 3 }}>
            <Chip t={it.t} icone={it.icone} tam={b.tam ?? 30} p={mm} escuro={it.escuro} />
          </div>
        );
      })}
    </div>
  );
};

type Pt = [number, number];
const bez = (a: Pt, k: Pt, z: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * k[0] + t * t * z[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * k[1] + t * t * z[1],
];

const Conexao: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const de: Pt = b.de;
  const para: Pt = b.para;
  const curva = b.curva ?? 160;
  const mx = (de[0] + para[0]) / 2;
  const my = (de[1] + para[1]) / 2;
  const dx = para[0] - de[0];
  const dy = para[1] - de[1];
  const L = Math.hypot(dx, dy) || 1;
  const k: Pt = [mx - (dy / L) * curva, my + (dx / L) * curva];
  const p = interpolate(c.f, [c.ini, c.ini + 18], [0, 1], { ...clamp, easing: suave });
  const N = 40;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const [x, y] = bez(de, k, para, (i / N) * p);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const corre = ((c.f - c.ini) % 36) / 36;
  const pc = bez(de, k, para, corre);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icones: any[] = b.icones ?? [];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={d} fill="none" stroke={TR.tinta} strokeWidth={4} strokeDasharray="2 14" strokeLinecap="round" strokeDashoffset={-c.f * 1.2} />
        {p >= 1 && (
          <>
            <circle cx={pc[0]} cy={pc[1]} r={18} fill={TR.laranja} opacity={0.25} />
            <circle cx={pc[0]} cy={pc[1]} r={8} fill={TR.laranja} />
          </>
        )}
        <circle cx={de[0]} cy={de[1]} r={9} fill={TR.fundo} stroke={TR.tinta} strokeWidth={3} />
        <circle cx={para[0]} cy={para[1]} r={9} fill={TR.tinta} />
      </svg>
      {icones.map((it, i) => {
        const ie = fr(it.em, c.ini + 10 + i * 8);
        const dur = it.dur ?? 16;
        if (c.f < ie || c.f > ie + dur + 10) return null;
        const t = interpolate(c.f, [ie, ie + dur], [0, 1], { ...clamp, easing: suave });
        const [x, y] = bez(de, k, para, t);
        const chegou = c.f > ie + dur;
        const onda = chegou ? (c.f - ie - dur) / 10 : 0;
        return (
          <React.Fragment key={i}>
            {!chegou && (
              <div style={{ position: "absolute", left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: 42, background: "#FFF", border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 18px rgba(0,0,0,0.15)" }}>
                <Icone nome={it.icone} tam={50} espessura={1.8} />
              </div>
            )}
            {chegou && <div style={{ position: "absolute", left: para[0] - 40 - onda * 60, top: para[1] - 40 - onda * 60, width: 80 + onda * 120, height: 80 + onda * 120, borderRadius: "50%", border: `4px solid ${TR.laranja}`, opacity: 1 - onda }} />}
            {it.t && (
              <div style={{ position: "absolute", left: x + 56, top: y - 20, opacity: chegou ? 0 : 1 }}>
                <Rotulo texto={it.t} tam={26} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ mockup da tela Ajustes (o app não tem clipe dela) */

const Campo: React.FC<{ u: number; rotulo: string; p: number; children: React.ReactNode; foco?: boolean }> = ({ u, rotulo, p, children, foco }) => (
  <div style={{ marginTop: 26 * u, opacity: 0.35 + 0.65 * p }}>
    <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 17 * u, color: "#8A8A92", letterSpacing: 1.5 * u, textTransform: "uppercase", marginBottom: 9 * u }}>{rotulo}</div>
    <div style={{ background: "#18181C", border: `${2 * u}px solid ${foco ? TR.laranja : "#2C2C32"}`, borderRadius: 16 * u, padding: `${15 * u}px ${18 * u}px`, fontFamily: F.ui, fontWeight: 600, fontSize: 22 * u, color: "#F2F2F2", minHeight: 30 * u, display: "flex", alignItems: "center", gap: 8 * u, overflow: "hidden", whiteSpace: "nowrap" }}>
      {children}
    </div>
  </div>
);

const Ajustes: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const tam = b.tam ?? 960;
  const { sw } = telaDims(tam);
  const u = sw / 430;
  const m = b.preenchido ? 1 : mola(c.f, c.ini, 150, 15);
  const t = (k: string, pad: number) => fr(b[k], pad);
  const digita = (txt: string, ini: number, vel = 1.2) => txt.slice(0, Math.max(0, Math.floor((c.f - ini) * vel)));
  const eEnd = t("enderecoEm", b.preenchido ? -99 : c.ini + 10);
  const eUsu = t("usuarioEm", b.preenchido ? -99 : c.ini + 30);
  const eSen = t("senhaEm", 99999);
  const eMan = t("manterEm", 99999);
  const eCif = t("cifraEm", 99999);
  const eCon = t("conectarEm", 99999);
  const kMan = prog(c.f, eMan, 8);
  const apertou = c.f >= eCon;
  const conectado = c.f >= eCon + 10;
  const cursor = Math.floor(c.f / 8) % 2 === 0;
  const foco = c.f >= eSen ? "sen" : c.f >= eUsu ? "usu" : c.f >= eEnd ? "end" : "";
  return (
    <div style={{ transform: `translateY(${(1 - m) * 260}px)`, opacity: Math.min(1, m * 2) }}>
      <Moldura tam={tam} f={c.f}>
        <div style={{ position: "absolute", inset: 0, background: "#0E0E10", padding: `${70 * u}px ${26 * u}px` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 40 * u, color: "#FFF" }}>Ajustes</div>
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15 * u, color: conectado ? TR.verde : "#77777E", border: `${1.5 * u}px solid ${conectado ? TR.verde : "#3A3A40"}`, borderRadius: 20 * u, padding: `${5 * u}px ${12 * u}px` }}>
              ● {conectado ? "Online" : "Offline"}
            </div>
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 19 * u, color: "#8A8A92", marginTop: 6 * u }}>Conexão com o servidor Hermes</div>
          <div style={{ height: 3 * u, width: 90 * u, background: GRAD, borderRadius: 4, marginTop: 16 * u }} />
          <Campo u={u} rotulo="Endereço do painel" p={c.f >= eEnd ? 1 : 0} foco={foco === "end"}>
            <span style={{ color: "#B9B9C0" }}>{digita("https://", eEnd, 1.4)}</span>
            <span style={{ filter: `blur(${6 * u}px)` }}>{c.f >= eEnd + 6 ? digita("seu-servidor.com", eEnd + 6, 1.4) : ""}</span>
            {foco === "end" && cursor && <span style={{ width: 2 * u, height: 26 * u, background: TR.laranja }} />}
          </Campo>
          <Campo u={u} rotulo="Usuário" p={c.f >= eUsu ? 1 : 0} foco={foco === "usu"}>
            {digita("well", eUsu, 0.6)}
            {foco === "usu" && cursor && <span style={{ width: 2 * u, height: 26 * u, background: TR.laranja }} />}
          </Campo>
          <Campo u={u} rotulo="Senha" p={c.f >= eSen ? 1 : 0} foco={foco === "sen"}>
            <span style={{ letterSpacing: 4 * u }}>{"••••••••••".slice(0, Math.max(0, Math.floor((c.f - eSen) * 0.7)))}</span>
            {foco === "sen" && !apertou && cursor && <span style={{ width: 2 * u, height: 26 * u, background: TR.laranja }} />}
          </Campo>
          <div style={{ marginTop: 26 * u, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.35 + 0.65 * Math.min(1, kMan + (c.f >= eSen ? 0.3 : 0)) }}>
            <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 21 * u, color: "#E6E6EA" }}>Manter conectado</div>
            <div style={{ width: 62 * u, height: 34 * u, borderRadius: 20 * u, background: kMan > 0.5 ? GRAD : "#2C2C32", position: "relative" }}>
              <div style={{ position: "absolute", top: 4 * u, left: (4 + kMan * 28) * u, width: 26 * u, height: 26 * u, borderRadius: 13 * u, background: "#FFF" }} />
            </div>
          </div>
          <div style={{ marginTop: 18 * u, display: "flex", alignItems: "center", gap: 10 * u, opacity: prog(c.f, eCif, 8), transform: `translateX(${(1 - prog(c.f, eCif, 8)) * -20}px)` }}>
            <Icone nome="cadeado" tam={30 * u} cor={TR.laranja} espessura={2} />
            <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17 * u, color: TR.laranja, letterSpacing: 1 * u }}>SENHA CIFRADA NO APARELHO</div>
          </div>
          <div style={{ position: "relative", marginTop: 34 * u }}>
            <div style={{ background: conectado ? TR.verde : GRAD, borderRadius: 18 * u, padding: `${19 * u}px 0`, textAlign: "center", fontFamily: F.ui, fontWeight: 800, fontSize: 26 * u, color: conectado ? "#FFF" : TR.tinta, transform: `scale(${apertou && c.f < eCon + 5 ? 0.95 : 1})` }}>
              {conectado ? "Conectado ✓" : "Conectar"}
            </div>
            {b.conectarEm !== undefined && (
              <div style={{ position: "absolute", left: "62%", top: "55%" }}>
                <Toque f={c.f} ini={eCon} tam={sw * 0.24} />
              </div>
            )}
          </div>
        </div>
      </Moldura>
    </div>
  );
};

/* ------------------------------------------------------------ CTA */

const Cta: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const ec = fr(b.palavraEm, c.ini + 6);
  const ep = fr(b.perfilEm, c.ini + 30);
  const mc = mola(c.f, ec, 240, 12);
  const mp = mola(c.f, ep, 180, 14);
  const pulso = MODO.forja ? 1 : 1 + 0.035 * Math.sin(c.f * 0.3);
  const mascote = React.useContext(MascoteCtx) && b.lobo !== false;
  const me = mola(c.f, c.ini, 200, 13);
  return (
    <div style={{ width: 960, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {mascote ? (
        <Lobo b={{ tipo: "lobo", tam: b.tamLobo ?? 250, expressao: b.expressaoLobo ?? "acena", cracha: b.cracha }} c={c} />
      ) : (
        <div style={{ transform: `translateY(${flut(c.f, 0.8, 6)}px) scale(${me})`, opacity: Math.min(1, me * 2) }}>
          <Emblema tam={b.tamLobo ?? 210} f={c.f} cracha={b.cracha ?? "X-GO"} icone={b.icone ?? "robo"} />
        </div>
      )}
      <div style={{ marginTop: 60, fontFamily: F.mono, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: TR.tinta, opacity: prog(c.f, c.ini + 4, 10) }}>{b.chamada ?? "COMENTA"}</div>
      <div style={{ position: "relative", marginTop: 16, transform: `scale(${(0.5 + 0.5 * mc) * pulso}) rotate(-2deg)`, opacity: Math.min(1, mc * 2) }}>
        <div style={{ background: GRAD, border: `5px solid ${TR.tinta}`, borderRadius: 26, padding: "8px 54px 14px", fontFamily: F.pesada, fontSize: b.tam ?? 160, lineHeight: 1.05, color: TR.tinta, boxShadow: `14px 14px 0 ${TR.tinta}` }}>
          {b.palavra ?? "AGENTE"}
        </div>
        <div style={{ position: "absolute", right: -96, bottom: -70, transform: `translateY(${Math.sin(c.f * 0.3) * 8}px)` }}>
          <div style={{ background: "#FFF", border: `3px solid ${TR.tinta}`, borderRadius: 40, padding: 14 }}>
            <Icone nome="chat" tam={64} espessura={1.8} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 34, fontFamily: F.mono, fontWeight: 500, fontSize: 28, color: TR.cinza, letterSpacing: 2, opacity: prog(c.f, ec + 8, 10) }}>{b.nota ?? "que eu te mando o link"}</div>
      {b.perfil !== false && <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 24, background: "#FFF", border: `3px solid ${TR.tinta}`, borderRadius: 30, padding: "22px 30px", opacity: Math.min(1, mp * 2), transform: `translateY(${(1 - mp) * 60}px)`, boxShadow: "0 18px 30px rgba(0,0,0,0.12)" }}>
        {b.avatar && <Img src={staticFile(`${c.base}/assets/${b.avatar}`)} style={{ width: 104, height: 104, borderRadius: 52, objectFit: "cover", border: `3px solid ${TR.tinta}` }} />}
        <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 46, color: TR.tinta }}>@{b.usuario ?? "well.free"}</div>
        <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 36, color: "#FFF", background: TR.azulIG, padding: "14px 32px", borderRadius: 14, transform: `scale(${c.f > ep + 14 && c.f < ep + 20 ? 0.92 : 1})` }}>Seguir</div>
      </div>}
    </div>
  );
};

/* ------------------------------------------------------------ blocos de dado (17/11, agentes-24h): todo número com fonte na tela */

// emblema: o "rosto" do agente sem mascote. tam icone cracha anel
const EmblemaBloco: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const tam = b.tam ?? 300;
  const m = mola(c.f, c.ini, 180, 13);
  const bob = flut(c.f, b.fase ?? 0.8, b.flutua === false ? 0 : tam * 0.025);
  return (
    <div style={{ position: "relative", width: tam, height: tam }}>
      <Sombra w={tam * 0.8} topo={tam * 1.12} bob={bob} />
      <div style={{ transform: `translateY(${bob}px) scale(${m})`, opacity: Math.min(1, m * 2) }}>
        <Emblema tam={tam} f={c.f} icone={b.icone ?? "robo"} cracha={b.cracha} anel={b.anel !== false} />
      </div>
    </div>
  );
};

// grafico: barras em traço que CRESCEM e valores que CONTAM. pontos[{rot, valor, em, destaque}], prefixo/sufixo/casas,
// titulo (rótulo mono), salto ("≈6×" no trajeto pontilhado entre a 1ª e a última barra), fonte (pílula), modo:"linha", w h max.
const Grafico: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const id = useIdSvg();
  const w = b.w ?? 900;
  const h = b.h ?? 560;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pts: any[] = b.pontos ?? [];
  const n = Math.max(1, pts.length);
  const max = b.max ?? Math.max(1, ...pts.map((p) => p.valor)) * 1.05;
  const passo = w / n;
  const larg = b.largura ?? Math.min(230, passo * 0.5);
  const xs = pts.map((_, i) => passo * (i + 0.5));
  const ins = pts.map((p, i) => fr(p.em, c.ini + 10 + i * 18));
  const ks = ins.map((ini) => conta(c.f, ini, b.dur ?? 26));
  const topo = (i: number) => h - (pts[i].valor / max) * h * ks[i];
  const linha = b.modo === "linha";
  const tv = b.tamValor ?? 96;
  const ultimo = n - 1;
  const fimBarras = ins[ultimo] + (b.dur ?? 26);
  // trajeto do salto: sai do alto da 1ª barra e mira a última (pontilhado desenhando + seta)
  const salto = b.salto && n > 1 && !linha;
  const sp = salto ? conta(c.f, fr(b.saltoEm, fimBarras - 6), 20) : 0;
  const A: Pt = [xs[0] + larg * 0.15, h - (pts[0].valor / max) * h - tv * 1.25];
  const Z: Pt = [xs[ultimo] - larg / 2 - 26, h - (pts[ultimo].valor / max) * h + 40];
  const K: Pt = [A[0] + (Z[0] - A[0]) * 0.25, Z[1] - 60];
  let dSalto = "";
  for (let i = 0; i <= 30; i++) {
    const [x, y] = bez(A, K, Z, (i / 30) * sp);
    dSalto += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const meio = bez(A, K, Z, 0.5);
  const fim = bez(A, K, Z, sp);
  const ant = bez(A, K, Z, Math.max(0, sp - 0.05));
  const ang = (Math.atan2(fim[1] - ant[1], fim[0] - ant[0]) * 180) / Math.PI;
  const mSalto = mola(c.f, fr(b.saltoEm, fimBarras - 6) + 12, 220, 12);
  const dLinha = pts.map((_, i) => `${i ? "L" : "M"}${xs[i]} ${topo(i)}`).join("");
  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", alignItems: "center", opacity: prog(c.f, c.ini, 10) }}>
      {b.titulo && (
        <div style={{ alignSelf: "flex-start", marginBottom: 24 }}>
          <Rotulo texto={b.titulo} tam={30} p={prog(c.f, c.ini, 10)} />
        </div>
      )}
      <div style={{ position: "relative", width: w, height: h + 70, marginTop: tv * 1.2 }}>
        <svg width={w} height={h + 4} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <pattern id={`hach${id}`} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={14} stroke={TR.linha} strokeWidth={3} />
            </pattern>
            <linearGradient id={`grad${id}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={TR.laranja} />
              <stop offset="1" stopColor={TR.amarelo} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke={TR.claro} strokeWidth={2} strokeDasharray="2 12" strokeLinecap="round" />
          ))}
          {!linha &&
            pts.map((p, i) => {
              const t = topo(i);
              const dest = p.destaque ?? i === ultimo;
              return <rect key={i} x={xs[i] - larg / 2} y={t} width={larg} height={Math.max(0, h - t)} rx={6} fill={dest ? `url(#grad${id})` : `url(#hach${id})`} stroke={TR.tinta} strokeWidth={3.5} />;
            })}
          {linha && (
            <>
              <path d={dLinha} fill="none" stroke={TR.tinta} strokeWidth={5} strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={xs[i]} cy={topo(i)} r={14} fill={(p.destaque ?? i === ultimo) ? TR.laranja : "#FFF"} stroke={TR.tinta} strokeWidth={4} opacity={ks[i] > 0 ? 1 : 0} />
              ))}
            </>
          )}
          <line x1={-10} x2={w + 10} y1={h} y2={h} stroke={TR.tinta} strokeWidth={4} strokeLinecap="round" />
          {salto && sp > 0 && (
            <g>
              <path d={dSalto} fill="none" stroke={TR.tinta} strokeWidth={4} strokeDasharray="2 13" strokeLinecap="round" />
              <path d="M-16 -10 L0 0 L-16 10" fill="none" stroke={TR.tinta} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${fim[0]} ${fim[1]}) rotate(${ang})`} />
            </g>
          )}
        </svg>
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: xs[i], top: (linha ? topo(i) - 34 : topo(i)) - tv * 1.12, transform: `translateX(-50%) scale(${0.85 + 0.15 * ks[i]})`, opacity: c.f >= ins[i] ? 1 : 0, whiteSpace: "nowrap", fontFamily: F.pesada, fontSize: tv, lineHeight: 1, color: TR.tinta }}>
              {b.prefixo && <span style={{ fontSize: tv * 0.42, marginRight: 6 }}>{b.prefixo}</span>}
              {fmt(p.valor * ks[i], b.casas ?? 0)}
              {b.sufixo && <span style={{ fontSize: tv * 0.5, color: TR.acento, marginLeft: 6 }}>{b.sufixo}</span>}
            </div>
            <div style={{ position: "absolute", left: xs[i], top: h + 18, transform: "translateX(-50%)", fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: (p.destaque ?? i === ultimo) ? TR.acento : TR.tinta, opacity: prog(c.f, ins[i], 8) }}>
              {p.rot}
            </div>
          </React.Fragment>
        ))}
        {salto && (
          <div style={{ position: "absolute", left: meio[0], top: meio[1] - 40, transform: `translate(-50%, -50%) scale(${mSalto}) rotate(-4deg)`, opacity: Math.min(1, mSalto * 2), background: GRAD, border: `3px solid ${TR.tinta}`, borderRadius: 18, padding: "6px 22px", fontFamily: F.pesada, fontSize: 54, color: TR.tinta, boxShadow: `6px 6px 0 ${TR.tinta}`, whiteSpace: "nowrap" }}>
            {b.salto}
          </div>
        )}
      </div>
      {b.fonte && (
        <div style={{ marginTop: 30 }}>
          <PilulaFonte texto={b.fonte} tam={24} p={prog(c.f, fimBarras, 10)} />
        </div>
      )}
    </div>
  );
};

// dado: cartão de estatística grande com contador. valor sufixo("%") casas marca(ex. "MICROSOFT") ano texto acento[] fonte
// visual: "anel" (padrão, anel enche até o %), "grade" (10×10 quadradinhos, bom p/ "mais da metade"), "nenhum" (número gigante).
const Dado: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const id = useIdSvg();
  const w = b.w ?? 920;
  const m = mola(c.f, c.ini, 170, 15);
  const ci = fr(b.contaEm, c.ini + 8);
  const k = conta(c.f, ci, b.dur ?? 30);
  const valor = b.valor as number;
  const v = valor * k;
  const sufixo = b.sufixo ?? "%";
  const visual = b.visual ?? "anel";
  const pct = Math.min(1, v / (b.max ?? 100));
  const numero = (tam: number) => (
    <div style={{ fontFamily: F.pesada, fontSize: tam, lineHeight: 0.95, color: TR.tinta, whiteSpace: "nowrap" }}>
      {b.prefixo && <span style={{ fontSize: tam * 0.45 }}>{b.prefixo}</span>}
      {fmt(b.casas ? v : Math.round(v), b.casas ?? 0)}
      <span style={{ color: TR.acento, fontSize: tam * 0.6 }}>{sufixo}</span>
    </div>
  );
  const texto = b.texto && (
    <div style={{ fontFamily: F.pesada, fontSize: b.tamTexto ?? 50, lineHeight: 1.1, color: TR.tinta, textTransform: "uppercase", opacity: prog(c.f, ci + 6, 12), transform: `translateY(${(1 - prog(c.f, ci + 6, 12)) * 16}px)` }}>
      {comAcento(b.texto, b.acento)}
    </div>
  );
  const D = b.diametro ?? 340;
  const R = D / 2 - 18;
  const C = 2 * Math.PI * R;
  let corpo: React.ReactNode;
  if (visual === "anel") {
    corpo = (
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <div style={{ position: "relative", width: D, height: D, flexShrink: 0 }}>
          <svg width={D} height={D} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id={`ga${id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={TR.laranja} />
                <stop offset="1" stopColor={TR.amarelo} />
              </linearGradient>
            </defs>
            <circle cx={D / 2} cy={D / 2} r={R + 22} fill="none" stroke={TR.linha} strokeWidth={2.5} strokeDasharray="2 12" strokeLinecap="round" transform={`rotate(${c.f * 0.4} ${D / 2} ${D / 2})`} />
            <circle cx={D / 2} cy={D / 2} r={R} fill="none" stroke={TR.claro} strokeWidth={26} />
            <circle cx={D / 2} cy={D / 2} r={R} fill="none" stroke={`url(#ga${id})`} strokeWidth={26} strokeDasharray={`${C * pct} ${C}`} transform={`rotate(-90 ${D / 2} ${D / 2})`} />
            <circle cx={D / 2} cy={D / 2} r={R + 13} fill="none" stroke={TR.tinta} strokeWidth={3} />
            <circle cx={D / 2} cy={D / 2} r={R - 13} fill="none" stroke={TR.tinta} strokeWidth={3} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{numero(b.tamNumero ?? D * 0.36)}</div>
        </div>
        <div style={{ flex: 1 }}>{texto}</div>
      </div>
    );
  } else if (visual === "grade") {
    const cheios = Math.round(v);
    corpo = (
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 30 }}>
          {numero(b.tamNumero ?? 220)}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 26px)", gap: 7 }}>
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: 5, border: `2.5px solid ${i < cheios ? TR.tinta : TR.linha}`, background: i < cheios ? (i % 2 ? TR.laranja : "#F49A3C") : "transparent" }} />
            ))}
          </div>
        </div>
        {texto}
      </div>
    );
  } else {
    corpo = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
        {numero(b.tamNumero ?? 300)}
        <div style={{ width: 120, height: MODO.mono ? 2 : 10, background: MODO.mono ? TR.tinta : GRAD, borderRadius: 6, transform: `scaleX(${k})` }} />
        {texto}
      </div>
    );
  }
  return (
    <div style={{ width: w, transform: `translateY(${(1 - m) * 90}px) rotate(${b.rot ?? 0}deg)`, opacity: Math.min(1, m * 2) }}>
      <div style={{ position: "relative", background: "#FFFFFF", border: `3px solid ${TR.tinta}`, borderRadius: 28, padding: "30px 44px 36px", boxShadow: `12px 12px 0 ${TR.tinta}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          {b.icone && <Icone nome={b.icone} tam={44} espessura={1.8} />}
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: TR.tinta, whiteSpace: "nowrap" }}>{b.marca}</div>
          <div style={{ flex: 1, height: 0, borderTop: `2.5px dashed ${TR.linha}` }} />
          {b.ano && <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 28, color: TR.acento }}>{b.ano}</div>}
        </div>
        {corpo}
        {b.fonte && (
          <div style={{ marginTop: 30 }}>
            <PilulaFonte texto={b.fonte} tam={24} p={prog(c.f, ci + 14, 10)} />
          </div>
        )}
      </div>
    </div>
  );
};

// cards: funções do agente entrando em sequência. itens[{t, sub, icone, em}], titulo, colunas (1|2), w, tam, check (✓ verde ao entrar)
const Cards: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 900;
  const col = b.colunas ?? 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  const gap = b.gap ?? 20;
  const cw = (w - (col - 1) * gap) / col;
  const tam = b.tam ?? (col === 1 ? 46 : 36);
  const ins = itens.map((it, i) => fr(it.em, c.ini + 8 + i * 9));
  const ultimo = ins.reduce((a, ini, i) => (c.f >= ini ? i : a), -1);
  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", gap: 24 }}>
      {b.titulo && <Rotulo texto={b.titulo} tam={30} p={prog(c.f, c.ini, 10)} />}
      <div style={{ display: "flex", flexWrap: "wrap", gap, justifyContent: col > 1 ? "center" : undefined }}>
        {itens.map((it, i) => {
          const m = mola(c.f, ins[i], 210, 14);
          const ck = b.check !== false ? mola(c.f, ins[i] + 10, 260, 12) : 0;
          const novo = i === ultimo;
          return (
            <div
              key={i}
              style={{
                width: cw,
                minHeight: col === 1 ? 118 : 200,
                display: "flex",
                flexDirection: col === 1 ? "row" : "column",
                alignItems: "center",
                justifyContent: col === 1 ? "flex-start" : "center",
                gap: col === 1 ? 24 : 12,
                background: "#FFF",
                border: `3px solid ${TR.tinta}`,
                borderRadius: 24,
                padding: col === 1 ? "14px 26px 14px 16px" : "22px 18px",
                boxShadow: novo ? `9px 9px 0 ${TR.tinta}` : `5px 5px 0 ${TR.claro}`,
                opacity: c.f < ins[i] ? 0 : Math.min(1, m * 2),
                transform: `translateX(${(1 - m) * 110}px) scale(${0.92 + 0.08 * m})`,
                position: "relative",
                textAlign: col === 1 ? "left" : "center",
              }}
            >
              <div style={{ width: 88, height: 88, flexShrink: 0, borderRadius: 44, background: novo ? GRAD : TR.fundo, border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icone nome={it.icone ?? "aprovacao"} tam={52} espessura={1.7} />
              </div>
              <div style={{ flex: col === 1 ? 1 : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontFamily: F.pesada, fontSize: it.tam ?? tam, lineHeight: 1.05, color: TR.tinta, textTransform: "uppercase" }}>{comAcento(it.t, it.acento)}</div>
                {it.sub && <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: col === 1 ? 24 : 21, color: TR.cinza, letterSpacing: 1 }}>{it.sub}</div>}
              </div>
              {b.check !== false && (
                <div style={{ position: col === 1 ? "relative" : "absolute", top: col === 1 ? undefined : 12, right: col === 1 ? undefined : 12, width: 52, height: 52, flexShrink: 0, borderRadius: 26, background: TR.verde, border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${ck})` }}>
                  <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// equacao: "1 AGENTE = 5 PESSOAS". n, esq ("AGENTE"), dir ("PESSOAS"), iconeEsq ("robo"), iconeDir ("persona"),
// igualEm, pessoasEm (1ª pessoa; as outras a cada 6 quadros), cracha (no emblema), fonte opcional.
const Equacao: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const n = b.n ?? 5;
  const me = mola(c.f, c.ini, 190, 13);
  const ig = fr(b.igualEm, c.ini + 14);
  const mi = mola(c.f, ig, 240, 12);
  const p0 = fr(b.pessoasEm, ig + 8);
  const ps = Array.from({ length: n }).map((_, i) => p0 + i * (b.passo ?? 6));
  const vistos = ps.filter((x) => c.f >= x).length;
  const tp = b.tamPessoa ?? Math.min(150, (940 - (n - 1) * 44) / n);
  const fimP = ps[n - 1] + 8;
  return (
    <div style={{ width: 960, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40, opacity: Math.min(1, me * 2), transform: `scale(${0.8 + 0.2 * me})` }}>
        <Emblema tam={b.tamEmblema ?? 210} f={c.f} icone={b.iconeEsq ?? "robo"} cracha={b.cracha} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: F.pesada, fontSize: 190, lineHeight: 0.9, color: TR.tinta }}>1</div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 46, letterSpacing: 8, color: TR.tinta }}>{b.esq ?? "AGENTE"}</div>
        </div>
      </div>
      <div style={{ fontFamily: F.pesada, fontSize: 170, lineHeight: 0.8, color: TR.acento, opacity: Math.min(1, mi * 2), transform: `scale(${0.4 + 0.6 * mi}) rotate(${(1 - mi) * -90}deg)` }}>=</div>
      <div style={{ display: "flex", alignItems: "center" }}>
        {ps.map((x, i) => {
          const m = mola(c.f, x, 260, 12);
          return (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: 44, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 40, color: TR.cinza, opacity: c.f >= x ? 1 : 0 }}>+</div>}
              <div style={{ width: tp, height: tp, borderRadius: tp / 2, background: "#FFF", border: `3px solid ${TR.tinta}`, boxShadow: `5px 5px 0 ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: c.f < x ? 0 : Math.min(1, m * 2), transform: `translateY(${(1 - m) * -60}px) scale(${m})` }}>
                <Icone nome={b.iconeDir ?? "persona"} tam={tp * 0.6} espessura={1.6} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, opacity: vistos ? 1 : 0 }}>
        <div style={{ fontFamily: F.pesada, fontSize: 150, lineHeight: 0.9, color: TR.tinta }}>{vistos}</div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 46, letterSpacing: 8, color: TR.tinta }}>{b.dir ?? "PESSOAS"}</div>
      </div>
      {b.fonte && <PilulaFonte texto={b.fonte} tam={24} p={prog(c.f, fimP, 10)} />}
    </div>
  );
};

// comparacao: custo de gente × 1 agente, sem preço do agente. qtd (5), unitario (1621), prefixo ("R$ "), periodo ("/MÊS"),
// rotuloUnit ("salário mínimo 2026"), tituloEsq ("5 PESSOAS"), tituloDir ("1 AGENTE"), linhasDir (["24 H POR DIA"]),
// cracha, totalEm, dirEm, fonte. O total = qtd × unitario (conta direta, contando na tela).
const Comparacao: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const qtd = b.qtd ?? 5;
  const unit = b.unitario ?? 1621;
  const pre = b.prefixo ?? "R$ ";
  const total = b.total ?? qtd * unit;
  const me = mola(c.f, c.ini, 180, 14);
  const te = fr(b.totalEm, c.ini + 20);
  const k = conta(c.f, te, b.dur ?? 28);
  const de = fr(b.dirEm, te + 24);
  const md = mola(c.f, de, 180, 14);
  const cw = 430;
  const linhasDir: string[] = b.linhasDir ?? ["24 H POR DIA"];
  const cartao: React.CSSProperties = { width: cw, minHeight: 600, background: "#FFF", border: `3px solid ${TR.tinta}`, borderRadius: 28, padding: "28px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, boxShadow: `10px 10px 0 ${TR.tinta}` };
  const tamTotal = b.tamTotal ?? 88;
  return (
    <div style={{ width: 960, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
      <div style={{ position: "relative", display: "flex", gap: 60, alignItems: "stretch" }}>
        <div style={{ ...cartao, opacity: Math.min(1, me * 2), transform: `translateX(${(1 - me) * -80}px)` }}>
          <Rotulo texto={b.tituloEsq ?? `${qtd} PESSOAS`} tam={30} />
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: qtd }).map((_, i) => (
              <div key={i} style={{ opacity: prog(c.f, c.ini + 6 + i * 4, 6) }}>
                <Icone nome="persona" tam={62} espessura={1.7} />
              </div>
            ))}
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 34, color: TR.tinta, whiteSpace: "nowrap" }}>
            {qtd} × {pre}
            {fmt(unit)}
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 21, color: TR.cinza, marginTop: -10 }}>{b.rotuloUnit ?? "salário mínimo 2026"}</div>
          <div style={{ width: "100%", borderTop: `3px dashed ${TR.linha}`, margin: "4px 0" }} />
          <div style={{ fontFamily: F.pesada, fontSize: tamTotal, lineHeight: 1, color: TR.tinta, whiteSpace: "nowrap", opacity: c.f >= te ? 1 : 0.15 }}>
            <span style={{ fontSize: tamTotal * 0.42, marginRight: 6 }}>{pre.trim()}</span>
            {fmt(Math.round(total * k))}
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: TR.acento }}>{b.periodo ?? "/MÊS"}</div>
        </div>
        <div style={{ ...cartao, background: "#FFFBF2", opacity: Math.min(1, md * 2), transform: `translateX(${(1 - md) * 80}px)`, justifyContent: "center" }}>
          <Rotulo texto={b.tituloDir ?? "1 AGENTE"} tam={30} />
          <div style={{ margin: "18px 0 26px" }}>
            <Emblema tam={180} f={c.f} cracha={b.cracha} />
          </div>
          {linhasDir.map((l, i) => (
            <div key={i} style={{ fontFamily: F.pesada, fontSize: 44, lineHeight: 1.05, color: TR.tinta, textAlign: "center", textTransform: "uppercase", opacity: prog(c.f, de + 10 + i * 6, 10) }}>
              {comAcento(l, b.acento)}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 96, height: 96, marginLeft: -48, marginTop: -48, borderRadius: 48, background: TR.tinta, color: "#FFF", fontFamily: F.pesada, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", border: `5px solid ${TR.fundo}`, transform: `scale(${mola(c.f, c.ini + 10, 240, 12)})` }}>VS</div>
      </div>
      {b.fonte && <PilulaFonte texto={b.fonte} tam={24} p={prog(c.f, te + 10, 10)} />}
    </div>
  );
};

/* ------------------------------------------------------------ 18/11 (o-que-e-agente): traços à mão e informativos */
// Traço "desenhado": path com pathLength=1 e dashoffset 1→0. Setas com ponta que aparece quando o traço chega.

const desenha = (f: number, ini: number, dur = 16) => interpolate(f, [ini, ini + dur], [0, 1], { ...clamp, easing: suave });
const quad = (a: Pt, k: Pt, z: Pt) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${k[0].toFixed(1)} ${k[1].toFixed(1)} ${z[0].toFixed(1)} ${z[1].toFixed(1)}`;
const ctrl = (a: Pt, z: Pt, curva: number): Pt => {
  const dx = z[0] - a[0];
  const dy = z[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  return [(a[0] + z[0]) / 2 - (dy / L) * curva, (a[1] + z[1]) / 2 + (dx / L) * curva];
};
const ponta = (k: Pt, z: Pt, s = 24) => {
  const a = Math.atan2(z[1] - k[1], z[0] - k[0]);
  const p1: Pt = [z[0] + Math.cos(a + 2.6) * s, z[1] + Math.sin(a + 2.6) * s];
  const p2: Pt = [z[0] + Math.cos(a - 2.6) * s, z[1] + Math.sin(a - 2.6) * s];
  return `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${z[0].toFixed(1)} ${z[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
};
const corDe = (c?: string) => (c === "laranja" ? TR.laranja : c === "acento" ? TR.acento : c === "cinza" ? TR.linha : c ?? TR.tinta);

const Traco: React.FC<{ d: string; p: number; cor?: string; esp?: number; op?: number }> = ({ d, p, cor = TR.tinta, esp = 4, op = 1 }) =>
  p <= 0 ? null : (
    <path d={d} fill="none" stroke={cor} strokeWidth={esp} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={op} />
  );

// sublinhado à mão sob um texto de largura desconhecida (fica dentro de um span relative); revela da esquerda p/ direita
const FORMAS: Record<string, string> = {
  onda: "M1 7C12 2 22 11 36 6S62 1 76 6 92 9 99 5",
  reta: "M1 7C30 4 64 8 99 4",
  dupla: "M1 5C30 3 64 6 99 3M6 10C36 8 66 11 95 8",
};
const SublinhadoMao: React.FC<{ p: number; cor?: string; esp?: number; forma?: string; baixo?: number }> = ({ p, cor = TR.laranja, esp = 7, forma = "onda", baixo = -16 }) =>
  p <= 0 ? null : (
    <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ position: "absolute", left: -6, right: -6, bottom: baixo, width: "calc(100% + 12px)", height: 22, overflow: "visible", clipPath: `inset(-20px ${(1 - p) * 100}% -20px -20px)` }}>
      <path d={FORMAS[forma] ?? FORMAS.onda} fill="none" stroke={cor} strokeWidth={esp} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );

const Marca: React.FC<{ ok: boolean; tam?: number; s: number }> = ({ ok, tam = 54, s }) => (
  <div style={{ width: tam, height: tam, flexShrink: 0, borderRadius: tam / 2, background: ok ? TR.verde : "#FFF", border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s})` }}>
    <svg width={tam * 0.58} height={tam * 0.58} viewBox="0 0 24 24" fill="none" stroke={ok ? "#FFF" : TR.tinta} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
      <path d={ok ? "M5 12.5l4.5 4.5L19 7.5" : "M7 7l10 10M17 7L7 17"} />
    </svg>
  </div>
);

/* versus: duas colunas (IA comum × Agente), linhas com ✓/✗ entrando em sequência, arco à mão ligando as colunas.
   tituloEsq tituloDir iconeEsq iconeDir dirEm linhas[{t esq dir em}] w tam rotuloArco */
const Versus: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 980;
  const gap = 96;
  const cw = (w - gap) / 2;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linhas: any[] = b.linhas ?? [
    { t: "responde", esq: true, dir: true },
    { t: "usa ferramentas", esq: false, dir: true },
    { t: "executa tarefas", esq: false, dir: true },
  ];
  const hCab = 150;
  const hL = b.alturaLinha ?? 118;
  const topo = hCab + 30;
  const h = topo + linhas.length * hL + 20;
  const tam = b.tam ?? 34;
  const mE = mola(c.f, c.ini, 200, 14);
  const dirIni = fr(b.dirEm, c.ini + 10);
  const mD = mola(c.f, dirIni, 200, 14);
  const mVs = mola(c.f, c.ini + 6, 260, 11);
  const ins = linhas.map((l, i) => fr(l.em, dirIni + 14 + i * 14));
  const pArco = desenha(c.f, dirIni + 2, 18);
  const a: Pt = [cw * 0.5, -8];
  const z: Pt = [w - cw * 0.5, -14];
  const k: Pt = [w / 2, -150];
  const coluna = (lado: "esq" | "dir") => {
    const dir = lado === "dir";
    const m = dir ? mD : mE;
    const ini = dir ? dirIni : c.ini;
    return (
      <div
        style={{
          position: "absolute",
          left: dir ? cw + gap : 0,
          top: 0,
          width: cw,
          height: h,
          background: "#FFF",
          border: `3px solid ${TR.tinta}`,
          borderRadius: 30,
          overflow: "hidden",
          boxShadow: dir ? `10px 10px 0 ${TR.tinta}` : `6px 6px 0 ${TR.claro}`,
          opacity: c.f < ini ? 0 : Math.min(1, m * 2),
          transform: `translateY(${(1 - m) * 70}px)`,
        }}
      >
        <div style={{ height: hCab, background: dir ? GRAD : TR.fundo, borderBottom: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: "#FFF", border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome={dir ? b.iconeDir ?? "robo" : b.iconeEsq ?? "chat"} tam={50} espessura={1.8} />
          </div>
          <span style={{ position: "relative", fontFamily: F.pesada, fontSize: b.tamTitulo ?? 46, color: TR.tinta, textTransform: "uppercase", lineHeight: 1 }}>
            {dir ? b.tituloDir ?? "Agente" : b.tituloEsq ?? "IA comum"}
            {dir && <SublinhadoMao p={desenha(c.f, dirIni + 12, 12)} cor={TR.tinta} esp={6} baixo={-18} />}
          </span>
        </div>
        {linhas.map((l, i) => {
          const ok = dir ? l.dir !== false : !!l.esq;
          const li = ins[i] + (dir ? 6 : 0);
          const s = mola(c.f, li, 260, 12);
          const risco = !ok ? desenha(c.f, li + 6, 10) : 0;
          return (
            <div key={i} style={{ position: "absolute", left: 22, right: 18, top: topo + i * hL, height: hL - 18, display: "flex", alignItems: "center", gap: 16, opacity: c.f < li ? 0 : 1 }}>
              <Marca ok={ok} s={s} />
              <span style={{ fontFamily: F.pesada, fontSize: l.tam ?? tam, lineHeight: 1.08, color: ok ? TR.tinta : TR.cinza, textTransform: "uppercase", transform: `translateX(${(1 - s) * 24}px)`, textDecorationLine: risco > 0 ? "line-through" : "none", textDecorationThickness: 4, textDecorationColor: `rgba(17,17,17,${risco})` }}>
                {l.t}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {coluna("esq")}
      {coluna("dir")}
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {linhas.map((_, i) => {
          const y = topo + i * hL + (hL - 18) / 2;
          return <Traco key={i} d={`M${cw + 10} ${y}L${cw + gap - 10} ${y + (i % 2 ? 3 : -3)}`} p={desenha(c.f, ins[i] + 2, 8)} cor={TR.linha} esp={3} />;
        })}
        <Traco d={quad(a, k, z)} p={pArco} cor={TR.laranja} esp={6} />
        {pArco >= 1 && <path d={ponta(k, z, 26)} fill="none" stroke={TR.laranja} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
        <circle cx={a[0]} cy={a[1]} r={9} fill={TR.fundo} stroke={TR.tinta} strokeWidth={3} opacity={pArco > 0 ? 1 : 0} />
      </svg>
      {b.rotuloArco && pArco > 0.5 && (
        <div style={{ position: "absolute", left: w / 2, top: -132, transform: "translate(-50%, -50%)", opacity: (pArco - 0.5) * 2 }}>
          <PilulaFonte texto={b.rotuloArco} tam={24} />
        </div>
      )}
      <div style={{ position: "absolute", left: w / 2 - 50, top: hCab / 2 - 50, width: 100, height: 100, borderRadius: 50, background: TR.tinta, border: `4px solid ${TR.fundo}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.pesada, fontSize: 36, color: "#FFF", transform: `scale(${mVs}) rotate(${(1 - mVs) * -30}deg)`, zIndex: 3 }}>
        VS
      </div>
    </div>
  );
};

/* conexoes: emblema X-GO no centro, traço desenhado até cada nó (ícone + rótulo), pulso laranja correndo no fio.
   itens[{t icone em destaque}] tam rx ry giro icone cracha w h */
const Conexoes: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const W = b.w ?? 1000;
  const H = b.h ?? 1080;
  const cx = W / 2;
  const cy = H / 2;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  const n = Math.max(1, itens.length);
  const rx = b.rx ?? 360;
  const ry = b.ry ?? 390;
  const tamE = b.tam ?? 230;
  const nr = b.raioNo ?? 64;
  const mE = mola(c.f, c.ini, 200, 13);
  const nos = itens.map((it, i) => {
    const ang = ((b.giro ?? -90) + (i * 360) / n) * (Math.PI / 180);
    const p: Pt = [cx + rx * Math.cos(ang), cy + ry * Math.sin(ang)];
    const u: Pt = [Math.cos(ang), Math.sin(ang)];
    const a: Pt = [cx + u[0] * (tamE / 2 + 34), cy + u[1] * (tamE / 2 + 34)];
    const z: Pt = [p[0] - u[0] * (nr + 10), p[1] - u[1] * (nr + 10)];
    const k = ctrl(a, z, i % 2 ? 46 : -46);
    const li = fr(it.em, c.ini + 12 + i * 8);
    return { it, p, a, z, k, li };
  });
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={TR.claro} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" opacity={Math.min(1, mE)} />
        {nos.map(({ a, z, k, li }, i) => {
          const p = desenha(c.f, li, 14);
          const t = ((c.f - li - 14 + i * 9) % 44) / 44;
          const pc = bez(a, k, z, t);
          return (
            <React.Fragment key={i}>
              <Traco d={quad(a, k, z)} p={p} esp={4} />
              {p >= 1 && (
                <>
                  <circle cx={pc[0]} cy={pc[1]} r={16} fill={TR.laranja} opacity={0.22} />
                  <circle cx={pc[0]} cy={pc[1]} r={7} fill={TR.laranja} />
                </>
              )}
              {p > 0 && <circle cx={a[0]} cy={a[1]} r={7} fill={TR.tinta} />}
            </React.Fragment>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: cx - tamE / 2, top: cy - tamE / 2, transform: `scale(${mE})` }}>
        <Emblema tam={tamE} f={c.f} icone={b.icone ?? "robo"} cracha={b.cracha ?? "X-GO"} anel={false} />
      </div>
      {nos.map(({ it, p, li }, i) => {
        const m = mola(c.f, li + 12, 230, 12);
        const chegou = c.f - li - 14;
        const onda = chegou > 0 && chegou < 14 ? chegou / 14 : 0;
        return (
          <div key={i} style={{ position: "absolute", left: p[0], top: p[1], opacity: c.f < li + 12 ? 0 : 1 }}>
            {onda > 0 && <div style={{ position: "absolute", left: -nr - onda * 40, top: -nr - onda * 40, width: (nr + onda * 40) * 2, height: (nr + onda * 40) * 2, borderRadius: "50%", border: `4px solid ${TR.laranja}`, opacity: 1 - onda }} />}
            <div style={{ position: "absolute", left: -nr, top: -nr, width: nr * 2, height: nr * 2, borderRadius: nr, background: it.destaque ? GRAD : "#FFF", border: `3px solid ${TR.tinta}`, boxShadow: `5px 5px 0 ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${m})` }}>
              <Icone nome={it.icone} tam={nr * 1.05} espessura={1.7} />
            </div>
            {it.t && (
              <div style={{ position: "absolute", left: 0, top: nr + 16, transform: `translateX(-50%) translateY(${(1 - m) * 10}px)`, opacity: Math.min(1, m), background: TR.fundo, padding: "2px 8px" }}>
                <Rotulo texto={it.t} tam={b.tamRotulo ?? 25} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* marcas: chips de texto (sem logo) entrando em zigue-zague, ligados por traço à mão, sublinhado degradê sob o nome.
   titulo itens[{t sub em escuro}] tam gap desloc w */
const Marcas: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  const gapY = b.gap ?? 190;
  const hC = 128;
  const tam = b.tam ?? 64;
  const off = itens.length > 1 ? b.desloc ?? 90 : 0;
  const W = b.w ?? 900;
  const topoT = b.titulo ? 96 : 0;
  const H = topoT + Math.max(0, itens.length - 1) * gapY + hC;
  const pos = itens.map((_, i): Pt => [W / 2 + (i % 2 ? off : -off), topoT + hC / 2 + i * gapY]);
  const ins = itens.map((it, i) => fr(it.em, c.ini + 10 + i * 14));
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      {b.titulo && (
        <div style={{ position: "absolute", left: W / 2, top: 20, transform: "translateX(-50%)" }}>
          <Rotulo texto={b.titulo} tam={30} p={prog(c.f, c.ini, 10)} />
        </div>
      )}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {pos.map((p, i) => {
          if (i === 0) {
            if (!b.titulo) return null;
            const a: Pt = [W / 2, 74];
            const z: Pt = [p[0], p[1] - hC / 2 - 8];
            return <Traco key={i} d={quad(a, [a[0], z[1]], z)} p={desenha(c.f, ins[0] - 10, 10)} esp={3.5} />;
          }
          const a: Pt = [pos[i - 1][0], pos[i - 1][1] + hC / 2 + 8];
          const z: Pt = [p[0], p[1] - hC / 2 - 8];
          const k: Pt = [a[0], z[1]];
          const pt = desenha(c.f, ins[i] - 10, 12);
          return (
            <React.Fragment key={i}>
              <Traco d={quad(a, k, z)} p={pt} esp={3.5} />
              {pt > 0 && <circle cx={a[0]} cy={a[1]} r={7} fill={TR.tinta} />}
              {pt >= 1 && <circle cx={z[0]} cy={z[1]} r={7} fill={TR.fundo} stroke={TR.tinta} strokeWidth={3} />}
            </React.Fragment>
          );
        })}
      </svg>
      {itens.map((it, i) => {
        const m = mola(c.f, ins[i], 210, 13);
        const esc = !!it.escuro;
        return (
          <div key={i} style={{ position: "absolute", left: pos[i][0], top: pos[i][1], transform: `translate(-50%, -50%) translateX(${(1 - m) * (i % 2 ? 140 : -140)}px) scale(${0.85 + 0.15 * m})`, opacity: c.f < ins[i] ? 0 : Math.min(1, m * 2) }}>
            <div style={{ height: hC, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 48px", background: esc ? TR.tinta : "#FFF", border: `3.5px solid ${TR.tinta}`, borderRadius: 30, boxShadow: `8px 8px 0 ${esc ? TR.laranja : TR.tinta}`, whiteSpace: "nowrap" }}>
              <span style={{ position: "relative", fontFamily: F.pesada, fontSize: it.tam ?? tam, lineHeight: 1, color: esc ? "#FFF" : TR.tinta, textTransform: "uppercase" }}>
                {it.t}
                <SublinhadoMao p={desenha(c.f, ins[i] + 8, 12)} esp={8} forma="reta" baixo={-14} />
              </span>
              {it.sub && <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 22, letterSpacing: 2, color: esc ? "#CFCFCA" : TR.cinza, textTransform: "uppercase", marginTop: 16 }}>{it.sub}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* perguntas: balões com "?" empilhando (alternam esquerda/direita); os antigos ficam, o novo ganha sombra chapada.
   itens[{t em}] w tam espera rabisco:false */
const Perguntas: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [];
  const W = b.w ?? 900;
  const tam = b.tam ?? 46;
  const ins = itens.map((it, i) => fr(it.em, c.ini + 6 + i * 16));
  const ultimo = ins.reduce((acc, ini, i) => (c.f >= ini ? i : acc), -1);
  const pR = desenha(c.f, c.ini, 22);
  return (
    <div style={{ position: "relative", width: W, display: "flex", flexDirection: "column", gap: 40 }}>
      {b.rabisco !== false && (
        <svg width={150} height={230} viewBox="0 0 100 150" style={{ position: "absolute", right: -40, top: -150, overflow: "visible" }}>
          <Traco d="M22 42C20 8 80 4 82 40C84 66 52 70 50 98L50 110" p={pR} cor={TR.laranja} esp={9} />
          {pR >= 1 && <circle cx={50} cy={134} r={7} fill={TR.laranja} />}
        </svg>
      )}
      {itens.map((it, i) => {
        const m = mola(c.f, ins[i], 220, 13);
        const esq = i % 2 === 0;
        const digitando = c.f - ins[i] < (b.espera ?? 7);
        const novo = i === ultimo;
        return (
          <div key={i} style={{ alignSelf: esq ? "flex-start" : "flex-end", position: "relative", opacity: c.f < ins[i] ? 0 : Math.min(1, m * 2), transform: `translateY(${(1 - m) * 60}px) scale(${0.8 + 0.2 * m}) rotate(${esq ? -1.5 : 1.5}deg)`, transformOrigin: esq ? "0% 100%" : "100% 100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#FFF", border: `3px solid ${TR.tinta}`, borderRadius: 34, padding: "20px 36px 20px 20px", maxWidth: W - 60, boxShadow: novo ? `9px 9px 0 ${TR.tinta}` : `5px 5px 0 ${TR.claro}` }}>
              <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 36, background: novo ? GRAD : TR.fundo, border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.pesada, fontSize: 44, color: TR.tinta }}>?</div>
              <div style={{ fontFamily: F.pesada, fontSize: it.tam ?? tam, lineHeight: 1.08, color: TR.tinta, textTransform: "uppercase" }}>
                {digitando ? (
                  <span style={{ letterSpacing: 6, fontFamily: F.mono }}>
                    {[0, 1, 2].map((j) => (
                      <span key={j} style={{ opacity: 0.3 + 0.7 * Math.max(0, Math.sin(c.f * 0.4 - j)) }}>●</span>
                    ))}
                  </span>
                ) : (
                  it.t
                )}
              </div>
            </div>
            <svg width={40} height={30} style={{ position: "absolute", bottom: -24, [esq ? "left" : "right"]: 52, overflow: "visible" }}>
              <path d={esq ? "M0 0 L6 26 L28 0" : "M12 0 L34 26 L40 0"} fill="#FFFFFF" stroke={TR.tinta} strokeWidth={3} strokeLinejoin="round" />
              <path d={esq ? "M2 -2 H26" : "M14 -2 H38"} stroke="#FFFFFF" strokeWidth={5} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

/* transformacao: de (cartão cinza) → seta à mão laranja → para (cartão degradê, sombra chapada, sublinhado).
   de para iconeDe iconePara subDe subPara rotulo setaEm paraEm riscar w */
const Transformacao: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const W = b.w ?? 840;
  const hDe = 150;
  const hPara = 190;
  const vao = b.vao ?? 250;
  const H = hDe + vao + hPara;
  const mDe = mola(c.f, c.ini, 210, 14);
  const sEm = fr(b.setaEm, c.ini + 12);
  const pS = desenha(c.f, sEm, 18);
  const pEm = fr(b.paraEm, sEm + 16);
  const mPa = mola(c.f, pEm, 210, 12);
  const a: Pt = [W / 2 - 40, hDe + 26];
  const z: Pt = [W / 2 + 6, hDe + vao - 26];
  const k: Pt = [W / 2 + 190, hDe + vao * 0.42];
  const cartao = (dePara: "de" | "para") => {
    const para = dePara === "para";
    const m = para ? mPa : mDe;
    const ini = para ? pEm : c.ini;
    return (
      <div style={{ position: "absolute", left: "50%", top: para ? hDe + vao : 0, height: para ? hPara : hDe, minWidth: para ? W * 0.86 : W * 0.66, transform: `translateX(-50%) scale(${(para ? 0.7 : 0.85) + (para ? 0.3 : 0.15) * m})`, opacity: c.f < ini ? 0 : Math.min(1, m * 2), display: "flex", alignItems: "center", gap: 24, padding: "0 44px 0 24px", background: para ? GRAD : TR.fundo, border: `${para ? 3.5 : 3}px solid ${TR.tinta}`, borderRadius: 32, boxShadow: para ? `10px 10px 0 ${TR.tinta}` : `5px 5px 0 ${TR.claro}`, whiteSpace: "nowrap" }}>
        <div style={{ width: para ? 116 : 92, height: para ? 116 : 92, flexShrink: 0, borderRadius: "50%", background: "#FFF", border: `3px solid ${TR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome={para ? b.iconePara ?? "ferramentas" : b.iconeDe ?? "chat"} tam={para ? 68 : 54} espessura={1.7} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ position: "relative", alignSelf: "flex-start", fontFamily: F.pesada, fontSize: para ? b.tamPara ?? 80 : b.tamDe ?? 56, lineHeight: 1, color: para ? TR.tinta : TR.cinza, textTransform: "uppercase" }}>
            {para ? b.para ?? "trabalho" : b.de ?? "consulta"}
            {para && <SublinhadoMao p={desenha(c.f, pEm + 10, 12)} cor={TR.tinta} esp={7} baixo={-20} />}
            {!para && b.riscar && <span style={{ position: "absolute", left: -6, top: "46%", height: 5, width: `calc(${desenha(c.f, pEm, 10) * 100}% + 12px)`, background: TR.tinta, borderRadius: 3, transform: "rotate(-4deg)" }} />}
          </span>
          {(para ? b.subPara : b.subDe) && <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 24, letterSpacing: 2, color: para ? TR.tinta : TR.cinza, textTransform: "uppercase", marginTop: para ? 10 : 0 }}>{para ? b.subPara : b.subDe}</span>}
        </div>
      </div>
    );
  };
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      {cartao("de")}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Traco d={quad(a, k, z)} p={pS} cor={TR.laranja} esp={8} />
        {pS >= 1 && <path d={ponta(k, z, 30)} fill="none" stroke={TR.laranja} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {b.rotulo && pS > 0.4 && (
        <div style={{ position: "absolute", left: W / 2 + 150, top: hDe + vao * 0.42, transform: "translateY(-50%)", opacity: Math.min(1, (pS - 0.4) * 2.5) }}>
          <Rotulo texto={b.rotulo} tam={26} />
        </div>
      )}
      {cartao("para")}
    </div>
  );
};

/* seta: seta à mão avulsa (aponta pra algo da cena). w curva(-1..1) rot cor:"laranja"|"tinta" esp texto dur */
const Seta: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 260;
  const h = w * 0.6;
  const a: Pt = [16, h / 2];
  const z: Pt = [w - 16, h / 2];
  const k: Pt = [w / 2, h / 2 - (b.curva ?? 0.35) * w];
  const p = desenha(c.f, c.ini, b.dur ?? 14);
  const cor = corDe(b.cor ?? "laranja");
  const esp = b.esp ?? 7;
  return (
    <div style={{ position: "relative", width: w, height: h, transform: `rotate(${b.rot ?? 0}deg)` }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Traco d={quad(a, k, z)} p={p} cor={cor} esp={esp} />
        {p >= 1 && <path d={ponta(k, z, esp * 3.6)} fill="none" stroke={cor} strokeWidth={esp} strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {b.texto && (
        <div style={{ position: "absolute", left: a[0], top: a[1] + 22, transform: `translateX(-50%) rotate(${-(b.rot ?? 0)}deg)`, opacity: prog(c.f, c.ini, 8) }}>
          <Rotulo texto={b.texto} tam={b.tam ?? 26} />
        </div>
      )}
    </div>
  );
};

/* sublinhado: traço à mão avulso pra pôr sob/ao redor de um título. w h forma:onda|reta|dupla|circulo cor esp dur */
const Sublinhado: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const w = b.w ?? 520;
  const forma = b.forma ?? "onda";
  const h = forma === "circulo" ? b.h ?? 180 : 30;
  const p = desenha(c.f, c.ini, b.dur ?? 14);
  const cor = corDe(b.cor ?? "laranja");
  const esp = b.esp ?? 7;
  const d =
    forma === "circulo"
      ? `M${w * 0.62} ${h * 0.06}C${w * 0.18} ${-h * 0.02} ${-w * 0.02} ${h * 0.32} ${w * 0.04} ${h * 0.6}C${w * 0.1} ${h * 0.96} ${w * 0.78} ${h * 1.02} ${w * 0.95} ${h * 0.64}C${w * 1.04} ${h * 0.36} ${w * 0.84} ${h * 0.02} ${w * 0.44} ${h * 0.1}`
      : forma === "reta"
      ? `M4 ${h * 0.6}C${w * 0.3} ${h * 0.4} ${w * 0.64} ${h * 0.7} ${w - 4} ${h * 0.36}`
      : forma === "dupla"
      ? `M4 ${h * 0.4}C${w * 0.3} ${h * 0.25} ${w * 0.64} ${h * 0.5} ${w - 4} ${h * 0.25}M${w * 0.06} ${h * 0.85}C${w * 0.36} ${h * 0.7} ${w * 0.66} ${h * 0.95} ${w * 0.94} ${h * 0.75}`
      : `M4 ${h * 0.6}C${w * 0.12} ${h * 0.15} ${w * 0.22} ${h * 0.95} ${w * 0.36} ${h * 0.5}S${w * 0.62} ${h * 0.1} ${w * 0.76} ${h * 0.5} ${w * 0.92} ${h * 0.8} ${w - 4} ${h * 0.4}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <Traco d={d} p={p} cor={cor} esp={esp} />
    </svg>
  );
};

/* selos: dois (ou mais) carimbos lado a lado, ligados por traço com pílula no meio.
   itens[{linhas[] sub em branco}] r gap meio tam */
const Selos: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itens: any[] = b.itens ?? [{ linhas: ["grátis"] }, { linhas: ["pago", "pelo", "uso"] }];
  const r = b.r ?? 165;
  const gap = b.gap ?? 120;
  const W = itens.length * 2 * r + (itens.length - 1) * gap;
  const temSub = itens.some((it) => it.sub);
  const H = 2 * r + (temSub ? 80 : 0);
  const ins = itens.map((it, i) => fr(it.em, c.ini + i * 18));
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {itens.slice(1).map((_, i) => {
          const x0 = (i + 1) * 2 * r + i * gap - 6;
          const x1 = x0 + gap + 12;
          return <Traco key={i} d={`M${x0} ${r}C${x0 + gap * 0.3} ${r - 22} ${x1 - gap * 0.3} ${r + 22} ${x1} ${r}`} p={desenha(c.f, ins[i + 1] - 8, 10)} esp={4} />;
        })}
      </svg>
      {b.meio &&
        itens.slice(1).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: (i + 1) * 2 * r + i * gap + gap / 2, top: r, transform: "translate(-50%, -50%)", opacity: prog(c.f, ins[i + 1] - 2, 6), background: TR.tinta, color: "#FFF", fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 2, padding: "6px 16px", borderRadius: 20, textTransform: "uppercase", whiteSpace: "nowrap", zIndex: 2 }}>
            {b.meio}
          </div>
        ))}
      {itens.map((it, i) => {
        const m = mola(c.f, ins[i], 260, 12);
        const linhas: string[] = it.linhas ?? [it.t ?? ""];
        const branco = it.branco ?? i > 0;
        const maior = Math.max(...linhas.map((l) => l.length), 1);
        const tam = Math.min(it.tam ?? b.tam ?? 64, (2 * r * 0.68) / (maior * 0.74), (2 * r * 0.6) / (linhas.length * 1.05));
        const rot = (i % 2 ? 8 : -10) + (1 - m) * 20;
        return (
          <div key={i} style={{ position: "absolute", left: i * (2 * r + gap), top: 0, width: 2 * r }}>
            <div style={{ position: "relative", width: 2 * r, height: 2 * r, transform: `scale(${1.6 - 0.6 * m}) rotate(${rot}deg)`, opacity: c.f < ins[i] ? 0 : Math.min(1, m * 2) }}>
              <svg width={2 * r} height={2 * r} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <circle cx={r} cy={r} r={r - 4} fill="none" stroke={TR.tinta} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" transform={`rotate(${c.f * 0.8} ${r} ${r})`} />
              </svg>
              <div style={{ position: "absolute", inset: r * 0.12, borderRadius: "50%", background: branco ? "#FFF" : GRAD, border: `3px solid ${TR.tinta}`, boxShadow: `6px 6px 0 ${TR.tinta}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                {linhas.map((l, j) => (
                  <div key={j} style={{ fontFamily: F.pesada, fontSize: tam, lineHeight: 1.04, color: TR.tinta, textTransform: "uppercase" }}>{l}</div>
                ))}
              </div>
            </div>
            {it.sub && (
              <div style={{ marginTop: 26, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: TR.cinza, textTransform: "uppercase", opacity: prog(c.f, ins[i] + 10, 8), whiteSpace: "nowrap" }}>{it.sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* mensagem: balão de chat sobreposto (ao lado/por cima do celular). audio:true = play + onda tocando + tempo.
   texto vel cauda:"esq"(recebida, branca)|"dir"(enviada, degradê) audio tempo toca(seg) hora w tam rotulo */
const Mensagem: React.FC<{ b: BlocoTr; c: Ctx }> = ({ b, c }) => {
  const m = mola(c.f, c.ini, 220, 13);
  const env = b.cauda !== "esq";
  const t = c.f - c.ini;
  const w = b.w ?? (b.audio ? 560 : undefined);
  const tam = b.tam ?? 34;
  const texto: string = b.texto ?? "";
  const nLetras = Math.floor(Math.max(0, t - 4) * (b.vel ?? 1.6));
  const toca = seg(b.toca ?? 2.4);
  const pT = interpolate(t, [8, 8 + toca], [0, 1], clamp);
  const N = 30;
  return (
    <div style={{ position: "relative", transform: `scale(${m}) rotate(${env ? 2 : -2}deg)`, transformOrigin: env ? "100% 100%" : "0% 100%", opacity: Math.min(1, m * 2) }}>
      {b.rotulo && (
        <div style={{ position: "absolute", bottom: "100%", [env ? "right" : "left"]: 8, marginBottom: 16 }}>
          <Rotulo texto={b.rotulo} tam={24} p={prog(c.f, c.ini + 4, 8)} />
        </div>
      )}
      <div style={{ width: w, maxWidth: 760, background: env ? GRAD : "#FFF", border: `3px solid ${TR.tinta}`, borderRadius: 34, [env ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 8, padding: b.audio ? "18px 26px 14px 18px" : "20px 30px 14px", boxShadow: `8px 8px 0 ${TR.tinta}` }}>
        {b.audio ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 36, background: TR.tinta, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="#FFF">
                <path d={pT > 0 && pT < 1 ? "M6 4h4v16H6zM14 4h4v16h-4z" : "M7 4l13 8-13 8z"} />
              </svg>
            </div>
            <div style={{ flex: 1, height: 64, display: "flex", alignItems: "center", gap: 5 }}>
              {Array.from({ length: N }, (_, i) => {
                const base = 0.25 + 0.75 * random(`onda-${i}`);
                const vivo = pT > 0 && pT < 1 ? 0.75 + 0.25 * Math.sin(c.f * 0.6 + i) : 1;
                const feito = i / N < pT;
                return <div key={i} style={{ flex: 1, height: `${base * vivo * 100}%`, borderRadius: 4, background: TR.tinta, opacity: feito ? 1 : 0.3 }} />;
              })}
            </div>
            <Icone nome="microfone" tam={40} espessura={1.8} />
          </div>
        ) : (
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: tam, lineHeight: 1.25, color: TR.tinta }}>
            <span>{texto.slice(0, nLetras)}</span>
            <span style={{ opacity: 0 }}>{texto.slice(nLetras)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontFamily: F.mono, fontWeight: 500, fontSize: 20, color: TR.tinta, opacity: 0.75 }}>
          <span>{b.audio ? b.tempo ?? "0:12" : ""}</span>
          <span>
            {b.hora ?? "09:41"} {env && <span style={{ color: TR.tinta, fontWeight: 700 }}>✓✓</span>}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ registro, sons */

const BLOCOS: Record<string, React.FC<{ b: BlocoTr; c: Ctx }>> = {
  celular: Celular,
  lobo: Lobo,
  hermes: Hermes,
  servidor: Servidor,
  torre: Torre,
  relevo: Relevo,
  terreno: Terreno,
  circulos: Circulos,
  particulas: Particulas,
  icone: IconeBloco,
  rotulo: RotuloBloco,
  pilula: PilulaBloco,
  titulo: Titulo,
  numero: Numero,
  lista: Lista,
  chip: ChipBloco,
  selo: Selo,
  balao: Balao,
  terminal: Terminal,
  passos: Passos,
  orbita: Orbita,
  conexao: Conexao,
  ajustes: Ajustes,
  cta: Cta,
  pergunta: Pergunta,
  emblema: EmblemaBloco,
  grafico: Grafico,
  dado: Dado,
  cards: Cards,
  equacao: Equacao,
  comparacao: Comparacao,
  versus: Versus,
  conexoes: Conexoes,
  marcas: Marcas,
  perguntas: Perguntas,
  transformacao: Transformacao,
  seta: Seta,
  sublinhado: Sublinhado,
  selos: Selos,
  mensagem: Mensagem,
};
const TELA_CHEIA = new Set(["conexao", "particulas"]); // desenham em coordenadas da tela inteira

const SFX: Record<string, string> = { whoosh: "whoosh.wav", pop: "pop.wav", click: "click.wav", tick: "tick.wav", carimbo: "carimbo.wav", notificacao: "notificacao.mp3", cine: "whoosh-cine.mp3", impacto: "impacto.mp3", moedas: "moedas.mp3" };

function sonsDoBloco(b: BlocoTr, ini: number): [number, string, number][] {
  const s: [number, string, number][] = [];
  const ponto = (k: { em?: number }, pad: number, nome: string, vol: number) => s.push([fr(k.em, pad), nome, vol]);
  if (b.tipo === "celular" && !b.silencio) s.push([ini, "whoosh", 0.22]);
  if (b.tipo === "celular" && b.toque) s.push([fr(b.toque.em, ini + 30), "click", 0.6]);
  if (b.tipo === "numero") s.push([ini, "tick", 0.5]);
  if (b.tipo === "selo") s.push([ini, "carimbo", 0.55]);
  if (b.tipo === "passos") s.push([ini, "click", 0.45]);
  if (b.tipo === "chip" || b.tipo === "balao") s.push([ini, "pop", 0.35]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "orbita" || b.tipo === "lista") (b.itens ?? []).forEach((it: any, i: number) => ponto(it, ini + 8 + i * 6, "pop", 0.3));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "terminal") (b.linhas ?? []).forEach((l: any, i: number) => ponto(typeof l === "string" ? {} : l, ini + 6 + i * 12, "click", 0.3));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "conexao") (b.icones ?? []).forEach((it: any, i: number) => s.push([fr(it.em, ini + 10 + i * 8) + (it.dur ?? 16), "pop", 0.3]));
  if (b.tipo === "ajustes" && b.conectarEm !== undefined) {
    s.push([seg(b.conectarEm), "click", 0.6]);
    s.push([seg(b.conectarEm) + 10, "notificacao", 0.4]);
  }
  if (b.tipo === "cta") s.push([fr(b.perfilEm, ini + 30), "pop", 0.5]);
  if (b.tipo === "pergunta") s.push([ini, "pop", 0.4], [ini + (b.espera ?? 8), "click", 0.3]);
  if (b.tipo === "emblema") s.push([ini, "pop", 0.4]);
  if (b.som) s.push([fr(b.somEm, ini), b.som, b.somVol ?? 0.7]); // som avulso em qualquer bloco
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "grafico") (b.pontos ?? []).forEach((p: any, i: number) => ponto(p, ini + 10 + i * 18, "tick", 0.45));
  if (b.tipo === "dado") s.push([ini, "pop", 0.35], [fr(b.contaEm, ini + 8), "tick", 0.5]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "cards") (b.itens ?? []).forEach((it: any, i: number) => ponto(it, ini + 8 + i * 9, "pop", 0.3));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "passos" && Array.isArray(b.itens)) b.itens.slice(1).forEach((it: any, i: number) => ponto(it, ini + 8 + (i + 1) * 14, "click", 0.4));
  if (b.tipo === "equacao") {
    const ig = fr(b.igualEm, ini + 14);
    s.push([ig, "whoosh", 0.25]);
    for (let i = 0; i < (b.n ?? 5); i++) s.push([fr(b.pessoasEm, ig + 8) + i * (b.passo ?? 6), "pop", 0.3]);
  }
  // 18/11: blocos de traço
  if (b.tipo === "versus") {
    const d = fr(b.dirEm, ini + 10);
    s.push([d, "whoosh", 0.25]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b.linhas ?? [0, 1, 2]).forEach((l: any, i: number) => s.push([fr(l?.em, d + 14 + i * 14) + 6, "click", 0.35]));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "conexoes") (b.itens ?? []).forEach((it: any, i: number) => s.push([fr(it.em, ini + 12 + i * 8) + 12, "pop", 0.3]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "marcas") (b.itens ?? []).forEach((it: any, i: number) => ponto(it, ini + 10 + i * 14, "pop", 0.35));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "perguntas") (b.itens ?? []).forEach((it: any, i: number) => ponto(it, ini + 6 + i * 16, "pop", 0.35));
  if (b.tipo === "transformacao") s.push([fr(b.setaEm, ini + 12), "whoosh", 0.3], [fr(b.paraEm, fr(b.setaEm, ini + 12) + 16), "pop", 0.45]);
  if (b.tipo === "seta") s.push([ini, "whoosh", 0.2]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (b.tipo === "selos") (b.itens ?? [0, 1]).forEach((it: any, i: number) => s.push([fr(it?.em, ini + i * 18), "carimbo", 0.5]));
  if (b.tipo === "mensagem") s.push([ini, "notificacao", 0.35]);
  if (b.tipo === "comparacao") s.push([fr(b.totalEm, ini + 20), "tick", 0.5], [fr(b.dirEm, fr(b.totalEm, ini + 20) + 24), "pop", 0.4]);
  return s;
}

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

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; janelas: { inicio: number; fim: number; pos: CenaTr["legenda"]; neg?: boolean }[] }> = ({ palavras, destaques, janelas }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const grupos = React.useMemo(() => agrupar(palavras, janelas.map((j) => j.inicio)), [palavras, janelas]);
  // destaques de várias palavras ("vinte e três") acendem cada palavra (menos as de 1–2 letras)
  const dest = React.useMemo(() => new Set(destaques.flatMap((d) => d.split(" ").map(norm)).filter((w) => w.length > 2)), [destaques]);
  const gi = grupos.findIndex((g, i) => {
    const ini = palavras[g[0]].start - 0.05;
    const prox = grupos[i + 1] ? palavras[grupos[i + 1][0]].start - 0.05 : palavras[g[g.length - 1]].end + 0.6;
    return t >= ini && t < Math.min(prox, palavras[g[g.length - 1]].end + 0.6);
  });
  if (gi < 0) return null;
  const g = grupos[gi];
  const jan = janelas.find((j) => palavras[g[0]].start >= j.inicio - 0.05 && palavras[g[0]].start < j.fim) ?? janelas[0];
  if (jan.pos === "nao") return null;
  const top = jan.pos === "topo" ? 170 : 1575;
  const tinta = jan.neg ? "#FFFFFF" : TR.tinta;
  const halo = jan.neg ? "#111111" : TR.fundo;
  return (
    <div style={{ position: "absolute", top, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 24px" }}>
      {g.map((i) => {
        const w = palavras[i];
        const p = interpolate(f, [seg(w.start) - 2, seg(w.start) + 3], [0, 1], clamp);
        const n = norm(w.word);
        const ac = dest.has(n) || /\d/.test(w.word) || [...dest].some((d) => d.length >= 4 && n.startsWith(d));
        return (
          <span
            key={i}
            style={{
              fontFamily: F.pesada,
              fontSize: 76,
              lineHeight: 1.15,
              textTransform: "uppercase",
              color: ac ? TR.acento : tinta,
              ...(MODO.mono && ac ? { ...ACENTO, fontSize: Math.round(96 * ACENTO_ESC), color: tinta } : {}),
              opacity: p,
              transform: `translateY(${(1 - p) * 12}px)`,
              display: "inline-block",
              textShadow: `0 0 14px ${halo}, 0 0 6px ${halo}, 0 0 2px ${halo}`,
            }}
          >
            {w.word.replace(/[.,!?;:…]+$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ fundo: papel gelo + linha pontilhada contínua (a "trilha" da câmera) */

// mono: malha de pontos fina e sutil (ref. 79) que rola com a câmera; sem a trilha pontilhada
const FundoMono: React.FC<{ desloc: number }> = ({ desloc }) => (
  <AbsoluteFill style={{ background: TR.fundo }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="trMalha" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(20 ${(-desloc * 0.6) % 40})`}>
          <circle cx={0} cy={0} r={1.6} fill={TR.linha} />
          <circle cx={40} cy={0} r={1.6} fill={TR.linha} />
          <circle cx={0} cy={40} r={1.6} fill={TR.linha} />
          <circle cx={40} cy={40} r={1.6} fill={TR.linha} />
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#trMalha)" opacity={0.75} />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 65% at 50% 46%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.05) 100%)" }} />
  </AbsoluteFill>
);

const Fundo: React.FC<{ desloc: number }> = ({ desloc }) => {
  if (MODO.mono) return <FundoMono desloc={desloc} />;
  const passo = 24;
  const k0 = Math.floor(desloc / passo) - 1;
  const pontos: React.ReactNode[] = [];
  for (let k = k0; k < k0 + 1920 / passo + 3; k++) {
    const yw = k * passo;
    const x = 540 + 330 * Math.sin(yw / 560) + 110 * Math.sin(yw / 210 + 1);
    pontos.push(<circle key={k} cx={x} cy={yw - desloc} r={3.2} fill="#C9C9C3" />);
  }
  return (
    <AbsoluteFill style={{ background: TR.fundo }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>{pontos}</svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 62% at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.11) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ cena e vídeo */

// negativo: inverte claro/escuro da cena inteira (tinta, traços, cartões, cores fixas) e devolve a cor original
// a fotos, vídeos, mascotes e a tudo que for laranja/amarelo (inverter duas vezes = cor original).
const NEG_FILTRO = "invert(1) hue-rotate(180deg)";
const NEG_LARANJA = ["#EE7E31", "#E8711F", "#FBE74D", "#F07A2A", "#F49A3C", "#E8A33A"];
const rgb = (hex: string) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
const NEG_CSS =
  [
    ".tr-neg img", ".tr-neg video", '.tr-neg [data-bloco="lobo"]', '.tr-neg [data-bloco="hermes"]', '.tr-neg [style*="linear-gradient(100deg"]',
    ...NEG_LARANJA.flatMap((c) => [`.tr-neg [style*="${rgb(c)}"]`, `.tr-neg [fill="${c}" i]`, `.tr-neg [stroke="${c}" i]`]),
  ].join(",") + `{filter:${NEG_FILTRO}}`;

/* ------------------------------------------------------------ FORJA: o bloco é desenhado na tela (ref. 79) */
// Linha do tempo (quadros a partir de t0 = âncora − FORJA_LEAD): guia tracejada 0–6 · contorno fino com cursor-mira 4–16
// (pontos surgem ao passar) · conteúdo revela da esquerda p/ direita 12–22 · contorno some 22–34 e ficam marcas de canto.
const FORJA_LEAD = 16;
const SEM_MOLDURA = new Set(["conexao", "particulas", "relevo", "terreno", "circulos", "seta", "sublinhado", "lobo", "hermes", "orbita"]);
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: suave });

const Mira: React.FC<{ x: number; y: number; op?: number }> = ({ x, y, op = 1 }) =>
  op <= 0.01 ? null : (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} opacity={op}>
      <circle r={16} fill="none" stroke={TR.tinta} strokeWidth={1.3} />
      <path d="M-26 0H-19M19 0H26M0 -26V-19M0 19V26" stroke={TR.tinta} strokeWidth={1.3} />
      <circle r={6.5} fill={TR.tinta} />
    </g>
  );

// ponto a s px do canto sup.-esq. no perímetro do retângulo w×h (sentido horário)
const noRet = (w: number, h: number, s: number): Pt => {
  let r = Math.max(0, Math.min(2 * (w + h), s));
  if (r <= w) return [r, 0];
  r -= w;
  if (r <= h) return [w, r];
  r -= h;
  if (r <= w) return [w - r, h];
  r -= w;
  return [0, h - r];
};

const Forja: React.FC<{ f: number; t0: number; tipo: string; children: React.ReactNode }> = ({ f, t0, tipo, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [tam, setTam] = React.useState<[number, number]>([0, 0]);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (Math.abs(w - tam[0]) > 1 || Math.abs(h - tam[1]) > 1) setTam([w, h]);
  });
  const [w0, h0] = tam;
  const temCaixa = w0 > 8 && h0 > 8;
  const moldura = temCaixa && !SEM_MOLDURA.has(tipo);
  const pad = 18;
  const w = w0 + 2 * pad;
  const h = h0 + 2 * pad;
  const L = 2 * (w + h);
  const pg = ease(f, t0, t0 + 6);
  const pc = ease(f, t0 + 4, t0 + 16);
  const pr = moldura ? ease(f, t0 + 12, t0 + 22) : ease(f, t0 + 2, t0 + 16);
  const sai = ease(f, t0 + 22, t0 + 34);
  const guia = 150;
  // cursor: corre a guia, depois o contorno; sem moldura, anda na frente da revelação
  let cur: Pt = [0, 0];
  let opCur = 0;
  if (moldura) {
    cur = pc <= 0 ? [-guia + guia * pg, 0] : noRet(w, h, pc * L);
    opCur = Math.min(ease(f, t0 - 2, t0 + 2), 1 - ease(f, t0 + 16, t0 + 21));
  } else if (temCaixa) {
    cur = [pad + Math.min(w0, Math.max(0, w0 * (1.6 - 2.2 * (1 - pr)))), pad + h0 / 2];
    opCur = Math.min(ease(f, t0, t0 + 3), 1 - ease(f, t0 + 14, t0 + 18));
  }
  const clip = temCaixa && pr < 1 ? `inset(-60% ${(-60 + 220 * (1 - pr)).toFixed(1)}% -60% -60%)` : undefined;
  const pontos = moldura ? Array.from({ length: 12 }, (_, i) => (i * L) / 12) : [];
  const canto = 16;
  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ clipPath: clip, opacity: temCaixa ? Math.min(1, pr * 3) : pr }}>
        {children}
      </div>
      {temCaixa && (
        <svg width={w} height={h} style={{ position: "absolute", left: -pad, top: -pad, overflow: "visible", pointerEvents: "none" }}>
          {moldura && (
            <>
              {/* guia tracejada que chega ao canto antes do objeto */}
              <line x1={-guia} y1={0} x2={-guia + guia * pg} y2={0} stroke={TR.cinza} strokeWidth={1.3} strokeDasharray="5 7" opacity={1 - 0.6 * sai} />
              <circle cx={-guia} cy={0} r={3} fill={TR.cinza} opacity={pg > 0 ? 1 - 0.6 * sai : 0} />
              {/* contorno fino desenhado */}
              <rect x={0} y={0} width={w} height={h} fill="none" stroke={TR.tinta} strokeWidth={1.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pc} opacity={(pc > 0 ? 1 : 0) * (1 - sai)} />
              {/* pontos que surgem em sequência ao longo do traço */}
              {pontos.map((sp, i) => {
                const [px, py] = noRet(w, h, sp);
                const op = interpolate(pc * L - sp, [0, 30], [0, 1], clamp);
                return <circle key={i} cx={px} cy={py} r={i % 3 === 0 ? 4 : 2.6} fill={TR.tinta} opacity={op * (1 - sai)} />;
              })}
              {/* marcas de canto que ficam (desenho técnico) */}
              <path
                d={`M0 ${canto}V0H${canto}M${w - canto} 0H${w}V${canto}M${w} ${h - canto}V${h}H${w - canto}M${canto} ${h}H0V${h - canto}`}
                fill="none"
                stroke={TR.cinza}
                strokeWidth={1.3}
                opacity={sai * 0.8}
              />
            </>
          )}
          <Mira x={cur[0]} y={cur[1]} op={opCur} />
        </svg>
      )}
    </div>
  );
};

// linha guia tracejada ligando o bloco anterior ao novo (só o trecho do meio, para não cruzar o conteúdo)
const GuiaLiga: React.FC<{ a: Pt; z: Pt; f: number; t0: number }> = ({ a, z, f, t0 }) => {
  const p = ease(f, t0, t0 + 8);
  if (p <= 0) return null;
  const ini: Pt = [a[0] + (z[0] - a[0]) * 0.32, a[1] + (z[1] - a[1]) * 0.32];
  const fimT = 0.32 + 0.36 * p;
  const fim: Pt = [a[0] + (z[0] - a[0]) * fimT, a[1] + (z[1] - a[1]) * fimT];
  return (
    <g>
      <line x1={ini[0]} y1={ini[1]} x2={fim[0]} y2={fim[1]} stroke={TR.linha} strokeWidth={1.5} strokeDasharray="4 9" strokeLinecap="round" />
      <circle cx={ini[0]} cy={ini[1]} r={3.2} fill={TR.cinza} />
      {p >= 1 && <circle cx={fim[0]} cy={fim[1]} r={3.2} fill={TR.cinza} />}
    </g>
  );
};

// mono: linha fina em tudo (bordas 2 px, traços 2 px, sem sombra chapada) e qualquer laranja literal vira cinza
const MONO_CSS = (() => {
  const blocos = '.tr-mono [data-bloco]:not([data-bloco="lobo"]):not([data-bloco="hermes"])';
  const esp = ["2.2", "2.4", "2.5", "2.6", "2.8", "3", "3.2", "3.5", "4", "4.5", "5", "5.5", "6", "7", "8"].map((e) => `[stroke-width="${e}"]`).join(",");
  const laranja = NEG_LARANJA.flatMap((c) => [`[style*="${rgb(c)}"]`, `[fill="${c}" i]`, `[stroke="${c}" i]`, `[stop-color="${c}" i]`]).join(",");
  return [
    `${blocos} [style*="box-shadow: rgb("]{box-shadow:none!important}`,
    `${blocos} [style*="solid"]{border-width:2px!important}`,
    `${blocos} :is(${esp}){stroke-width:2px}`,
    `.tr-mono :is(${laranja}){filter:grayscale(1)}`,
    `.tr-mono [data-bloco="lobo"],.tr-mono [data-bloco="hermes"]{filter:grayscale(1) contrast(1.05)}`,
  ].join("\n");
})();

const val = (v: Valor | undefined, t: number, padrao: number) => (Array.isArray(v) ? v[0] + (v[1] - v[0]) * t : v ?? padrao);

const Cena: React.FC<{ cena: CenaTr; dur: number; base: string; entraPan: boolean; saiPan: boolean }> = ({ cena, dur, base, entraPan, saiPan }) => {
  const f = useCurrentFrame();
  const ent = entraPan ? interpolate(f, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const sai = saiPan ? interpolate(f, [dur - 6, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) }) : 0;
  const t = interpolate(f, [0, dur], [0, 1], { ...clamp, easing: suave });
  const mascote = React.useContext(MascoteCtx);
  const cam = cena.camera ?? {};
  const z = val(cam.zoom, t, 1 + 0.035 * t);
  const cx = val(cam.x, t, 0);
  const cy = val(cam.y, t, 0);
  return (
    <AbsoluteFill style={{ transform: `translateY(${(1 - ent) * 420 - sai * 420}px)`, opacity: Math.min(1, 0.2 + ent) * (1 - sai * 0.8) }}>
      {cena.negativo && <AbsoluteFill style={{ background: "#111111" }} />}
      {cena.negativo && <style>{NEG_CSS}</style>}
      <AbsoluteFill className={cena.negativo ? "tr-neg" : undefined} style={{ transform: `translate(${-cx * z}px, ${-cy * z}px) scale(${z})`, transformOrigin: "540px 880px", filter: cena.negativo ? NEG_FILTRO : undefined }}>
        {MODO.forja && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 0, pointerEvents: "none" }}>
            {cena.blocos.map((b, i) => {
              const ant = cena.blocos.slice(0, i).reverse().find((x) => !TELA_CHEIA.has(x.tipo));
              if (!ant || TELA_CHEIA.has(b.tipo)) return null;
              const fimAnt = ant.ate !== undefined ? seg(ant.ate) : dur + 10;
              const t0 = Math.max(0, fr(b.em, 2 + i * 4) - FORJA_LEAD);
              const a: Pt = [ant.x ?? 540, ant.y ?? 880];
              const z: Pt = [b.x ?? 540, b.y ?? 880];
              if (f > fimAnt || Math.hypot(z[0] - a[0], z[1] - a[1]) < 160) return null;
              return <GuiaLiga key={i} a={a} z={z} f={f} t0={t0} />;
            })}
          </svg>
        )}
        {cena.blocos.map((b, i) => {
          const iniAncora = fr(b.em, 2 + i * 4);
          const t0 = MODO.forja ? Math.max(0, iniAncora - FORJA_LEAD) : iniAncora;
          // na forja o bloco "anda" por baixo do desenho: as entradas internas terminam enquanto o contorno é traçado
          const ini = MODO.forja ? t0 + 6 : iniAncora;
          const fim = b.ate !== undefined ? seg(b.ate) : dur + 10;
          if (f > fim) return null;
          const saida = b.ate !== undefined ? interpolate(f, [fim - 5, fim], [1, 0], clamp) : 1;
          const Comp = BLOCOS[b.tipo];
          if (!Comp || f < t0 - 1) return null;
          if (!mascote && (b.tipo === "lobo" || b.tipo === "hermes")) return null;
          const cheia = TELA_CHEIA.has(b.tipo);
          return (
            <div
              key={i}
              data-bloco={b.tipo}
              style={{
                position: "absolute",
                left: cheia ? 0 : b.x ?? 540,
                top: cheia ? 0 : b.y ?? 880,
                transform: cheia ? undefined : "translate(-50%, -50%)",
                zIndex: b.z ?? 1 + i,
                opacity: saida,
              }}
            >
              {MODO.forja ? (
                <Forja f={f} t0={t0} tipo={b.tipo}>
                  <Comp b={b} c={{ f, ini, fim, base }} />
                </Forja>
              ) : (
                <Comp b={b} c={{ f, ini, fim, base }} />
              )}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const VideoTraco: React.FC<RoteiroTr> = (r) => {
  const f = useCurrentFrame();
  // paleta e entrada valem para o vídeo inteiro: trocadas antes de qualquer bloco renderizar (vídeos 13–16 seguem iguais)
  MODO.mono = r.paleta === "mono";
  MODO.forja = r.entrada === "forja" || (MODO.mono && r.entrada !== "normal");
  Object.assign(TR, MODO.mono ? TR_MONO : TR_PADRAO);
  GRAD = MODO.mono ? "#FFFFFF" : GRAD_PADRAO;
  ACENTO = r.fonteAcento === "industrial" ? ACENTO_INDUSTRIAL : ACENTO_SERIFA;
  ACENTO_ESC = r.fonteAcento === "industrial" ? 1.3 : 1;
  let cursor = 0;
  const janelas = r.cenas.map((c) => {
    const frames = Math.round(c.duracao * FPS);
    const j = { inicio: cursor / FPS, fim: (cursor + frames) / FPS, frames, from: cursor, pos: c.legenda ?? "base", neg: !!c.negativo };
    cursor += frames;
    return j;
  });
  const total = Math.max(1, cursor);
  const pan = r.cenas.map((c, i) => i > 0 && c.transicao !== "corte");
  // a linha pontilhada do fundo rola uma "página" a cada transição: a câmera desce pela trilha
  let desloc = 0;
  pan.forEach((ok, i) => {
    if (ok) desloc += 1500 * interpolate(f, [janelas[i].from - 6, janelas[i].from + 10], [0, 1], { ...clamp, easing: suave });
  });
  const sons: { frame: number; nome: string; vol: number }[] = [{ frame: 0, nome: "cine", vol: 0.45 }];
  r.cenas.forEach((c, i) => {
    if (pan[i]) sons.push({ frame: janelas[i].from - 3, nome: "whoosh", vol: 0.26 });
    c.blocos.forEach((b, k) => {
      const ini = fr(b.em, 2 + k * 4);
      sonsDoBloco(b, ini).forEach(([d, nome, vol]) => sons.push({ frame: janelas[i].from + Math.round(d), nome, vol }));
    });
  });

  return (
    <AbsoluteFill style={{ background: TR.fundo }} className={MODO.mono ? "tr-mono" : undefined}>
      {MODO.mono && <style>{MONO_CSS}</style>}
      <MascoteCtx.Provider value={r.mascote !== false}>
      <Fundo desloc={desloc} />
      {r.cenas.map((c, i) => (
        <Sequence key={i} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <FalaCtx.Provider value={{ palavras: r.palavras ?? [], from: janelas[i].from }}>
            <Cena cena={c} dur={janelas[i].frames} base={r.base} entraPan={pan[i]} saiPan={!!pan[i + 1]} />
          </FalaCtx.Provider>
        </Sequence>
      ))}
      </MascoteCtx.Provider>
      <Legenda palavras={r.palavras ?? []} destaques={r.destaques ?? []} janelas={janelas} />
      <div style={{ position: "absolute", left: 0, top: 0, height: MODO.mono ? 3 : 8, width: `${(f / total) * 100}%`, background: MODO.mono ? TR.tinta : GRAD }} />
      {r.narracao && <Audio src={staticFile(r.narracao)} />}
      {r.trilha && <Audio src={staticFile(r.trilha)} volume={r.volumeTrilha ?? 0.08} loop />}
      {sons.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, s.frame)} durationInFrames={FPS * 2}>
          <Audio src={staticFile(`sfx/${SFX[s.nome] ?? `${s.nome}.wav`}`)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadadosTraco: CalculateMetadataFunction<RoteiroTr> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
