// Estilo Leonida — blocos (vibe GTA VI: pôr do sol de Vice City, neon, HUD de jogo).
// Todos os desenhos (mapa, minimapa, prédio, ícones, radar, celular) são originais e aproximados:
// nada traçado de arte da Rockstar. Todo bloco aceita `x y z em ate centro`; campos *Em aceitam âncora @palavra.
import React from "react";
import { Easing, Img, interpolate, random, spring, staticFile } from "remotion";
import { FPS, clamp, fmtBR, seg } from "../editorial/movimento";
import { alfa, fr, norm } from "../cronica/blocos";

export { fr, norm, alfa };

export const LE = {
  rosa: "#FF4F9A", laranja: "#FF9F43", roxo: "#2B1240", noite: "#14081F", ciano: "#2EC4B6",
  amarelo: "#FFD23F", branco: "#FFFFFF", tinta: "#0B0410", cinza: "#B9A9C9", lilas: "#A98BFF", verde: "#46D18C", vermelho: "#FF3355",
};
export const FL = { display: "Anton, Impact, sans-serif", script: "Yellowtail, cursive", ui: "Inter, sans-serif" };
export type BlocoLe = { tipo: string; x?: number; y?: number; z?: number; em?: number; ate?: number; [k: string]: any };
export type CtxLe = { f: number; ini: number; base: string; dur: number };
type P = { b: BlocoLe; c: CtxLe };
type Qq = any;

export const corL = (v?: string, padrao: string = LE.rosa): string => (v && (LE as Qq)[v]) || v || padrao;
/** contorno grosso por sombras (não depende de paint-order) */
export const borda = (r: number, cor: string = LE.tinta) => {
  const s: string[] = [];
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2;
    s.push(`${(Math.cos(t) * r).toFixed(1)}px ${(Math.sin(t) * r).toFixed(1)}px 0 ${cor}`);
  }
  return s.join(",");
};
export const neon = (cor: string, k = 1) => `0 0 ${14 * k}px ${alfa(cor, 0.9)}, 0 0 ${40 * k}px ${alfa(cor, 0.55)}`;
const ease = Easing.out(Easing.cubic);
export const pr = (f: number, ini: number, d = 10) => interpolate(f, [ini, ini + d], [0, 1], { ...clamp, easing: ease });
/** "soco": mola com passada (entra grande e assenta) */
export const soco = (f: number, ini: number) => (f < ini ? 0 : spring({ frame: f - ini, fps: FPS, config: { damping: 10, stiffness: 210, mass: 0.7 } }));
const fmt = (v: number, casas = 0) => fmtBR(v, casas);

/* ------------------------------------------------------------ peças pequenas */

export const Fonte: React.FC<{ texto: string; p: number }> = ({ texto, p }) => (
  <div style={{ display: "inline-block", fontFamily: FL.ui, fontWeight: 600, fontSize: 20, color: "rgba(255,255,255,0.85)", background: "rgba(16,5,26,0.66)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "5px 14px", opacity: p * 0.9, transform: `translateY(${(1 - p) * 8}px)` }}>
    Fonte: {texto}
  </div>
);

export const Selo: React.FC<{ texto: string; p: number; cor?: string; rot?: number; tam?: number }> = ({ texto, p, cor = LE.amarelo, rot = -3, tam = 30 }) => (
  <div style={{ display: "inline-block", fontFamily: FL.display, fontSize: tam, letterSpacing: 1.5, color: LE.tinta, background: cor, padding: "5px 14px 3px", borderRadius: 6, transform: `rotate(${rot}deg) scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 1.6), boxShadow: `0 0 24px ${alfa(cor, 0.55)}` }}>
    {texto}
  </div>
);

const Rodape: React.FC<{ b: BlocoLe; c: CtxLe; alinhar?: string }> = ({ b, c, alinhar = "center" }) => {
  if (!b.fonte && !b.selo) return null;
  const pf = pr(c.f, fr(b.fonteEm, c.ini + 10), 10);
  const ps = soco(c.f, fr(b.seloEm, c.ini + 6));
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: alinhar === "center" ? "center" : "flex-start", marginTop: 18, flexWrap: "wrap" }}>
      {b.selo && <Selo texto={b.selo} p={ps} cor={corL(b.corSelo, LE.amarelo)} />}
      {b.fonte && <Fonte texto={b.fonte} p={pf} />}
    </div>
  );
};

/* ------------------------------------------------------------ geografia inventada (Leonida estilizada) */

const pts = (s: string) => s.trim().split(/\s+/).map((p) => p.split(",").map(Number) as [number, number]);
const caminho = (ps: [number, number][]) => "M" + ps.map(([x, y]) => `${x} ${y}`).join(" L") + " Z";
const area = (ps: [number, number][]) => Math.abs(ps.reduce((s, [x, y], i) => { const [x2, y2] = ps[(i + 1) % ps.length]; return s + x * y2 - x2 * y; }, 0)) / 2;
const oval = (cx: number, cy: number, rx: number, ry: number): [number, number][] =>
  Array.from({ length: 12 }, (_, i) => [cx + Math.cos((i / 12) * Math.PI * 2) * rx, cy + Math.sin((i / 12) * Math.PI * 2) * ry] as [number, number]);

type Regiao = { nome: string; partes: [number, number][][]; lx: number; ly: number; cor: string };
export const REGIOES: Regiao[] = [
  { nome: "Port Gellhorn", cor: LE.laranja, lx: 128, ly: 172, partes: [pts("20,150 60,120 120,128 170,110 230,118 250,150 255,215 200,225 140,212 90,222 40,205 18,180")] },
  { nome: "Ambrosia", cor: LE.amarelo, lx: 325, ly: 162, partes: [pts("230,118 290,96 350,100 395,92 410,150 400,215 330,225 255,215 250,150")] },
  { nome: "Mount Kalaga", cor: LE.lilas, lx: 478, ly: 160, partes: [pts("395,92 450,70 510,84 548,120 560,180 540,240 470,250 400,215 410,150")] },
  { nome: "Grassrivers", cor: LE.verde, lx: 405, ly: 335, partes: [pts("255,215 330,225 400,215 470,250 540,240 535,300 520,380 470,450 380,460 320,430 290,350 270,280")] },
  { nome: "Vice City", cor: LE.rosa, lx: 448, ly: 560, partes: [pts("380,460 470,450 520,380 530,470 510,560 470,640 420,690 380,660 360,580 350,500")] },
  { nome: "Leonida Keys", cor: LE.ciano, lx: 225, ly: 700, partes: [oval(352, 722, 26, 13), oval(296, 744, 30, 12), oval(236, 758, 28, 11), oval(178, 764, 24, 10), oval(124, 762, 20, 9)] },
];
const AREA_LEONIDA = REGIOES.reduce((s, r) => s + r.partes.reduce((a, p) => a + area(p), 0), 0);
// ilha genérica (silhueta aproximada do mapa do GTA 5, desenhada à mão)
const GTA5 = pts("120,40 175,22 230,40 262,90 250,150 282,200 268,262 236,318 214,382 176,420 128,428 92,392 70,330 92,270 66,206 84,140 98,84");
const ESCALA_GTA5 = Math.sqrt(AREA_LEONIDA / 2 / area(GTA5)); // área exatamente a metade de Leonida
const ROTA = pts("40,170 140,170 240,165 320,190 380,260 430,330 455,420 470,520 450,610");
const ESTRADAS = [pts("40,170 240,165 400,180 520,200"), pts("320,190 300,320 360,450 430,560 440,650"), pts("470,250 500,380 500,520")];

const Terra: React.FC<{ acesas?: number[]; brilho?: number[]; base?: string; contorno?: string }> = ({ acesas, brilho, base = "#3B1D57", contorno = alfa(LE.rosa, 0.7) }) => (
  <g>
    {REGIOES.map((r, i) => {
      const a = acesas ? acesas[i] : 0;
      return r.partes.map((p, k) => (
        <path key={`${i}-${k}`} d={caminho(p)} fill={a > 0 ? r.cor : base} fillOpacity={a > 0 ? 0.35 + 0.55 * a : 1} stroke={a > 0 ? r.cor : contorno} strokeWidth={a > 0 ? 4 : 2.5} strokeLinejoin="round"
          style={brilho && brilho[i] > 0 ? { filter: `drop-shadow(0 0 ${14 * brilho[i]}px ${r.cor})` } : undefined} />
      ));
    })}
  </g>
);

const ponto = (rota: [number, number][], t: number) => {
  const seg2 = rota.slice(1).map((p, i) => Math.hypot(p[0] - rota[i][0], p[1] - rota[i][1]));
  const tot = seg2.reduce((a, b) => a + b, 0);
  let alvo = t * tot;
  for (let i = 0; i < seg2.length; i++) {
    if (alvo <= seg2[i] || i === seg2.length - 1) {
      const k = seg2[i] ? Math.min(1, alvo / seg2[i]) : 0;
      const [a, b] = [rota[i], rota[i + 1]];
      return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), feito: [...rota.slice(0, i + 1), [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] as [number, number]] };
    }
    alvo -= seg2[i];
  }
  return { x: rota[0][0], y: rota[0][1], ang: 0, feito: [rota[0]] };
};

/* ------------------------------------------------------------ ícones desenhados */

export const Icone: React.FC<{ tipo: string; s?: number; cor: string; f?: number }> = ({ tipo, s = 120, cor, f = 0 }) => {
  if (tipo === "pe") {
    const k = Math.sin(f * 0.55);
    return (
      <svg width={s} height={s} viewBox="0 0 120 120">
        <g stroke={cor} strokeWidth={11} strokeLinecap="round" fill="none">
          <line x1={60} y1={36} x2={56} y2={70} />
          <line x1={58} y1={44} x2={58 - 18 * k} y2={62} />
          <line x1={58} y1={44} x2={58 + 18 * k} y2={60} />
          <line x1={56} y1={70} x2={56 - 16 * k} y2={104} />
          <line x1={56} y1={70} x2={56 + 16 * k} y2={104} />
        </g>
        <circle cx={62} cy={20} r={12} fill={cor} />
      </svg>
    );
  }
  if (tipo === "rosto")
    return (
      <svg width={s} height={s} viewBox="0 0 120 120">
        <ellipse cx={60} cy={58} rx={32} ry={40} fill={cor} />
        <circle cx={47} cy={52} r={5} fill={LE.noite} />
        <circle cx={73} cy={52} r={5} fill={LE.noite} />
        <path d="M46 76 Q60 88 74 76" stroke={LE.noite} strokeWidth={5} fill="none" strokeLinecap="round" />
      </svg>
    );
  if (tipo === "roupa")
    return (
      <svg width={s} height={s} viewBox="0 0 120 120">
        <path d="M42 14 L8 36 L22 58 L34 50 L34 108 L86 108 L86 50 L98 58 L112 36 L78 14 Q60 30 42 14 Z" fill={cor} />
      </svg>
    );
  if (tipo === "carro")
    return (
      <svg width={s} height={s} viewBox="0 0 120 120">
        <path d="M8 80 L20 56 Q26 44 40 44 L80 44 Q92 44 100 56 L112 70 Q118 72 118 80 L118 88 L8 88 Z" fill={cor} />
        <path d="M30 58 L38 50 L58 50 L58 60 Z M64 50 L82 50 L92 60 L64 60 Z" fill={LE.noite} opacity={0.75} />
        <circle cx={34} cy={90} r={13} fill={LE.tinta} stroke={cor} strokeWidth={5} />
        <circle cx={92} cy={90} r={13} fill={LE.tinta} stroke={cor} strokeWidth={5} />
      </svg>
    );
  return (
    <svg width={s} height={s} viewBox="0 0 120 120">
      <g transform="rotate(90 60 60)">
        <path d="M60 6 Q67 6 67 18 L67 46 L112 70 L112 80 L67 67 L67 94 L80 104 L80 112 L60 106 L40 112 L40 104 L53 94 L53 67 L8 80 L8 70 L53 46 L53 18 Q53 6 60 6 Z" fill={cor} />
      </g>
    </svg>
  );
};

const Pessoa: React.FC<{ s: number; cor: string }> = ({ s, cor }) => (
  <svg width={s} height={s * 1.2} viewBox="0 0 40 48">
    <circle cx={20} cy={11} r={9} fill={cor} />
    <path d="M5 46 Q5 23 20 23 Q35 23 35 46 Z" fill={cor} />
  </svg>
);

/* ------------------------------------------------------------ titulo */

const Titulo: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const tam = b.tamanho ?? 130;
  const ac = new Set<string>((b.acento ?? []).map(norm));
  const am = new Set<string>((b.amarelo ?? []).map(norm));
  const al = b.alinhar ?? "center";
  const pk = pr(f, ini, 12);
  const ck = corL(b.corKicker, LE.ciano);
  return (
    <div style={{ width: b.w ?? 940, textAlign: al }}>
      {b.kicker && (
        <div style={{ fontFamily: FL.script, fontSize: b.tamKicker ?? 78, color: ck, textShadow: `${neon(ck)}, ${borda(3)}`, transform: `rotate(-4deg) translateY(${(1 - pk) * 20}px)`, opacity: pk, lineHeight: 1.15, marginBottom: 2 }}>{b.kicker}</div>
      )}
      {(b.linhas ?? []).map((l: string, i: number) => {
        const s = soco(f, ini + 3 + i * 4);
        return (
          <div key={i} style={{ fontFamily: FL.display, fontSize: tam, lineHeight: 1.04, textTransform: "uppercase", transform: `scale(${0.3 + 0.7 * s}) rotate(${(1 - s) * -6}deg)`, opacity: Math.min(1, s * 2), transformOrigin: al === "center" ? "50% 60%" : "0% 60%", textShadow: `${borda(Math.max(5, tam / 18))}, 0 12px 30px rgba(0,0,0,0.6)` }}>
            {l.split(" ").map((p, k) => {
              const n = norm(p);
              return <span key={k} style={{ color: ac.has(n) ? LE.rosa : am.has(n) ? LE.amarelo : LE.branco }}>{p}{" "}</span>;
            })}
          </div>
        );
      })}
      <Rodape b={b} c={c} alinhar={al} />
    </div>
  );
};

/* ------------------------------------------------------------ numero */

const Numero: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const s = soco(f, ini);
  const ce = fr(b.contarEm, ini);
  const t = b.contar === 0 ? 1 : interpolate(f, [ce, ce + seg(b.contar ?? 1.1)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const v = typeof b.valor === "number" ? (b.de ?? 0) + (b.valor - (b.de ?? 0)) * t : 0;
  const texto = typeof b.valor === "number" ? `${b.prefixo ?? ""}${fmt(v, b.casas ?? 0)}${b.sufixo ?? ""}` : b.texto;
  const cor = corL(b.cor, LE.amarelo);
  const tam = b.tamanho ?? 230;
  const al = b.alinhar ?? "center";
  const pk = pr(f, ini, 8);
  return (
    <div style={{ width: b.w ?? 940, textAlign: al }}>
      {b.kicker && (
        <div style={{ display: "inline-block", fontFamily: FL.display, fontSize: b.tamKicker ?? 50, letterSpacing: 2, color: LE.branco, background: alfa(LE.roxo, 0.85), border: `3px solid ${corL(b.corKicker, LE.ciano)}`, boxShadow: neon(corL(b.corKicker, LE.ciano), 0.6), borderRadius: 10, padding: "4px 18px 2px", opacity: pk, transform: `translateY(${(1 - pk) * 14}px)`, textTransform: "uppercase" }}>{b.kicker}</div>
      )}
      <div style={{ fontFamily: FL.display, fontSize: tam, lineHeight: 1.0, color: cor, transform: `scale(${0.35 + 0.65 * s})`, transformOrigin: al === "center" ? "50% 60%" : "0% 60%", opacity: Math.min(1, s * 2), textShadow: `${borda(tam / 22)}, ${neon(cor, 1.1)}`, marginTop: 6, whiteSpace: "nowrap" }}>
        {texto}
      </div>
      {b.unidade && (
        <div style={{ fontFamily: FL.display, fontSize: b.tamUnidade ?? 70, color: LE.branco, textTransform: "uppercase", letterSpacing: 1, opacity: pr(f, ini + 4, 8), textShadow: borda(5), marginTop: -4 }}>{b.unidade}</div>
      )}
      <Rodape b={b} c={c} alinhar={al} />
    </div>
  );
};

/* ------------------------------------------------------------ carimbo / selo / fonte soltos */

const Carimbo: React.FC<P> = ({ b, c }) => {
  const s = soco(c.f, c.ini);
  const cor = corL(b.cor, LE.rosa);
  const tam = b.tamanho ?? 120;
  return (
    <div style={{ display: "inline-block", transform: `rotate(${b.rot ?? -8}deg) scale(${interpolate(s, [0, 1], [2.4, 1])})`, opacity: Math.min(1, s * 3), border: `9px solid ${cor}`, borderRadius: 18, padding: `${tam * 0.06}px ${tam * 0.26}px 0`, color: cor, fontFamily: FL.display, fontSize: tam, lineHeight: 1.08, textShadow: neon(cor, 0.7), boxShadow: `0 0 30px ${alfa(cor, 0.6)}, inset 0 0 24px ${alfa(cor, 0.35)}`, background: alfa(LE.noite, b.fundo ?? 0.6), textAlign: "center", textTransform: "uppercase" }}>
      {b.texto}
      {b.sub && <div style={{ fontSize: tam * 0.3, letterSpacing: 3, paddingBottom: tam * 0.1, color: LE.branco }}>{b.sub}</div>}
    </div>
  );
};

const SeloB: React.FC<P> = ({ b, c }) => <Selo texto={b.texto} p={soco(c.f, c.ini)} cor={corL(b.cor, LE.amarelo)} rot={b.rot ?? -3} tam={b.tamanho ?? 40} />;
const FonteB: React.FC<P> = ({ b, c }) => <Fonte texto={b.texto} p={pr(c.f, c.ini, 10)} />;

/* ------------------------------------------------------------ minimapa (HUD) */

const Minimapa: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const D = b.tamanho ?? 720;
  const p0 = soco(f, ini);
  const andar = fr(b.andarEm, ini + 6);
  const t = interpolate(f, [andar, andar + seg(b.dur ?? 4.5)], [0, 1], clamp);
  const tc = interpolate(f, [andar, andar + seg(b.dur ?? 4.5)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const pos = ponto(ROTA, t);
  const zoom = b.zoom ?? 1.75;
  const min = Math.round((b.minutos ?? 178) * tc);
  const hh = 6 + Math.floor(min / 60), mm = min % 60;
  const vel = Math.round(1 + tc * 59);
  return (
    <div style={{ width: D, transform: `scale(${0.4 + 0.6 * p0})`, opacity: Math.min(1, p0 * 2), position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: FL.display, fontSize: 66, color: LE.branco, background: alfa(LE.tinta, 0.8), border: `3px solid ${LE.amarelo}`, borderRadius: 12, padding: "2px 22px 0", textShadow: neon(LE.amarelo, 0.4), boxShadow: neon(LE.amarelo, 0.5) }}>
          {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}
        </div>
        <div style={{ alignSelf: "center", fontFamily: FL.display, fontSize: 38, color: LE.tinta, background: LE.amarelo, borderRadius: 8, padding: "4px 12px 0" }}>{vel}× ▶▶</div>
      </div>
      <div style={{ width: D, height: D, borderRadius: "50%", border: `12px solid ${LE.tinta}`, boxShadow: `0 0 0 5px ${LE.rosa}, 0 0 40px ${alfa(LE.rosa, 0.7)}, 0 20px 50px rgba(0,0,0,0.6)`, overflow: "hidden", position: "relative", background: "radial-gradient(circle at 50% 40%, #1f4f86 0%, #163563 55%, #0f2147 100%)" }}>
        <svg width={D - 24} height={D - 24} viewBox={`${pos.x - 300 / zoom * 1.0} ${pos.y - 300 / zoom * 1.0} ${600 / zoom} ${600 / zoom}`} style={{ position: "absolute", inset: 0 }}>
          <Terra base="#4A2A66" contorno={alfa(LE.laranja, 0.9)} />
          {ESTRADAS.map((e, i) => <polyline key={i} points={e.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />)}
          <polyline points={ROTA.map((p) => p.join(",")).join(" ")} fill="none" stroke={alfa(LE.amarelo, 0.55)} strokeWidth={5} strokeDasharray="10 9" strokeLinecap="round" />
          <polyline points={pos.feito.map((p) => p.join(",")).join(" ")} fill="none" stroke={LE.rosa} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${LE.rosa})` }} />
          <circle cx={ROTA[ROTA.length - 1][0]} cy={ROTA[ROTA.length - 1][1]} r={10} fill={LE.amarelo} stroke={LE.tinta} strokeWidth={3} />
          <circle cx={pos.x} cy={pos.y} r={14 + 6 * Math.abs(Math.sin(f * 0.25))} fill={alfa(LE.branco, 0.25)} />
          <g transform={`translate(${pos.x} ${pos.y}) rotate(${(pos.ang * 180) / Math.PI + 90})`}>
            <path d="M0 -15 L11 12 L0 6 L-11 12 Z" fill={LE.branco} stroke={LE.tinta} strokeWidth={3} strokeLinejoin="round" />
          </g>
        </svg>
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", fontFamily: FL.display, fontSize: 34, color: LE.branco, textShadow: borda(3) }}>N</div>
        <div style={{ position: "absolute", left: "50%", bottom: 34, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 10, background: alfa(LE.tinta, 0.75), borderRadius: 999, padding: "6px 22px 6px 10px" }}>
          <Icone tipo="pe" s={62} cor={LE.branco} f={f} />
          <span style={{ fontFamily: FL.display, fontSize: 38, color: LE.branco, letterSpacing: 1 }}>{b.rotulo ?? "ATRAVESSANDO LEONIDA"}</span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ placas de transporte */

const Placas: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const itens: Qq[] = b.itens ?? [];
  const W = b.w ?? 940;
  return (
    <div style={{ width: W, position: "relative" }}>
      {b.titulo && <div style={{ fontFamily: FL.display, fontSize: 64, color: LE.branco, textShadow: borda(5), textAlign: "center", marginBottom: 18, opacity: pr(f, ini, 8) }}>{b.titulo}</div>}
      {itens.map((it, i) => {
        const e = fr(it.em, ini + i * 12);
        const s = soco(f, e);
        const cor = corL(it.cor, [LE.ciano, LE.laranja, LE.rosa][i % 3]);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, height: 200, marginBottom: 22, padding: "0 34px", borderRadius: 28, background: `linear-gradient(100deg, ${alfa(LE.roxo, 0.95)}, ${alfa(LE.noite, 0.92)})`, border: `5px solid ${cor}`, boxShadow: `0 0 30px ${alfa(cor, 0.55)}, 0 18px 40px rgba(0,0,0,0.5)`, transform: `translateX(${(1 - s) * 500}px) rotate(${(1 - s) * 4}deg)`, opacity: Math.min(1, s * 2) }}>
            <div style={{ width: 150, height: 150, borderRadius: 24, background: alfa(cor, 0.16), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icone tipo={it.icone} s={124} cor={cor} f={f} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FL.display, fontSize: 46, color: LE.cinza, letterSpacing: 2, textTransform: "uppercase" }}>{it.rotulo}</div>
              <div style={{ fontFamily: FL.display, fontSize: 112, lineHeight: 1, color: LE.branco, textShadow: neon(cor, 0.6) }}>{it.valor}</div>
            </div>
          </div>
        );
      })}
      <Rodape b={b} c={c} />
    </div>
  );
};

/* ------------------------------------------------------------ mapa: comparação e regiões */

const Mapa: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  if (b.modo === "regioes") {
    const W = b.w ?? 960, k = W / 600;
    const lista: Qq[] = b.regioes ?? REGIOES.map((r, i) => ({ nome: r.nome, em: undefined, i }));
    const acesas = REGIOES.map((r) => {
      const it = lista.find((x) => norm(x.nome) === norm(r.nome));
      return it ? pr(f, fr(it.em, ini), 8) : 0;
    });
    const p0 = pr(f, ini - 4, 8);
    return (
      <div style={{ width: W, opacity: p0 }}>
        <svg width={W} height={800 * k} viewBox="0 0 600 800" style={{ overflow: "visible" }}>
          <Terra acesas={acesas} brilho={acesas} base={alfa(LE.roxo, 0.92)} />
          {REGIOES.map((r, i) => {
            const it = lista.find((x) => norm(x.nome) === norm(r.nome));
            const s = it ? soco(f, fr(it.em, ini)) : 0;
            if (s <= 0) return null;
            return (
              <text key={i} x={r.lx} y={r.ly} textAnchor="middle" fontFamily="Anton" fontSize={i === 4 ? 40 : 30} fill={LE.branco} stroke={LE.tinta} strokeWidth={7} paintOrder="stroke" strokeLinejoin="round"
                transform={`translate(${r.lx} ${r.ly}) scale(${0.3 + 0.7 * s}) translate(${-r.lx} ${-r.ly})`} opacity={Math.min(1, s * 2)}>
                {r.nome.toUpperCase()}
              </text>
            );
          })}
        </svg>
        <Rodape b={b} c={c} />
      </div>
    );
  }
  // comparação: ilha do GTA 5 ao lado de Leonida (área 2×)
  const W = b.w ?? 1000, H = b.h ?? 900;
  const e5 = fr(b.gta5Em, ini), eL = fr(b.leonidaEm, ini + 15), eX = fr(b.vezesEm, ini + 30);
  const p5 = pr(f, e5, 12), sL = soco(f, eL), sX = soco(f, eX);
  const maxY5 = Math.max(...GTA5.map((p) => p[1]));
  const kL = 0.95;
  const s5 = ESCALA_GTA5 * kL;
  const by = H - 120;
  return (
    <div style={{ width: W, position: "relative" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <g transform={`translate(18 ${by - maxY5 * s5}) scale(${s5})`} opacity={p5}>
          <path d={caminho(GTA5)} fill={alfa(LE.ciano, 0.3)} stroke={LE.ciano} strokeWidth={4 / s5} strokeLinejoin="round" strokeDasharray={3000} strokeDashoffset={3000 * (1 - p5)} />
        </g>
        <text x={18 + 170 * s5} y={by + 70} textAnchor="middle" fontFamily="Anton" fontSize={56} fill={LE.ciano} stroke={LE.tinta} strokeWidth={8} paintOrder="stroke" opacity={p5}>GTA 5</text>
        <g transform={`translate(${W - 600 * kL - 10} ${by - 780 * kL}) translate(${300 * kL} ${400 * kL}) scale(${kL * (0.4 + 0.6 * sL)}) translate(-300 -400)`} opacity={Math.min(1, sL * 2)} style={{ filter: `drop-shadow(0 0 18px ${alfa(LE.rosa, 0.7)})` }}>
          <Terra acesas={REGIOES.map(() => 0.6)} />
        </g>
        <text x={W - 300 * kL - 10} y={by + 70} textAnchor="middle" fontFamily="Anton" fontSize={56} fill={LE.rosa} stroke={LE.tinta} strokeWidth={8} paintOrder="stroke" opacity={Math.min(1, sL * 2)}>LEONIDA · GTA 6</text>
      </svg>
      {sX > 0 && (
        <div style={{ position: "absolute", left: W * 0.2, top: H * 0.06, transform: `rotate(-8deg) scale(${interpolate(sX, [0, 1], [2.2, 1])})`, opacity: Math.min(1, sX * 3), fontFamily: FL.display, fontSize: 190, lineHeight: 1, color: LE.amarelo, textShadow: `${borda(9)}, ${neon(LE.amarelo, 1.2)}` }}>≈ 2×</div>
      )}
      <Rodape b={b} c={c} />
    </div>
  );
};

/* ------------------------------------------------------------ barras (dinheiro: verticais; horas: horizontais) */

const Burj: React.FC<{ h: number; cor: string }> = ({ h, cor }) => {
  // silhueta escalonada genérica de arranha-céu em agulha (desenho próprio)
  const w = h * 0.26;
  const deg = [1, 0.8, 0.62, 0.46, 0.33, 0.22, 0.13];
  const corpo = h * 0.78;
  const partes = deg.map((d, i) => {
    const y0 = corpo * (i / deg.length), y1 = corpo * ((i + 1) / deg.length);
    return `M${(w * (1 - d)) / 2} ${h - y0} L${(w * (1 + d)) / 2} ${h - y0} L${(w * (1 + d)) / 2} ${h - y1} L${(w * (1 - d)) / 2} ${h - y1} Z`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <path d={partes} fill={alfa(cor, 0.9)} />
      <path d={`M${w / 2 - 5} ${h - corpo} L${w / 2 + 5} ${h - corpo} L${w / 2 + 1.5} 0 L${w / 2 - 1.5} 0 Z`} fill={cor} />
      {Array.from({ length: 14 }, (_, i) => <line key={i} x1={w * 0.42} x2={w * 0.58} y1={h - corpo * (i / 14) - 8} y2={h - corpo * (i / 14) - 8} stroke={LE.noite} strokeWidth={2} opacity={0.5} />)}
    </svg>
  );
};

const BarrasH: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const itens: Qq[] = b.itens ?? [];
  const max = b.max ?? Math.max(...itens.map((i) => i.valor));
  const W = b.w ?? 940, LR = 200, maxW = W - LR - 210;
  return (
    <div style={{ width: W }}>
      {b.titulo && <div style={{ fontFamily: FL.display, fontSize: b.tamTitulo ?? 62, color: LE.branco, textShadow: borda(5), marginBottom: 26, textAlign: "center", opacity: pr(f, ini, 8) }}>{b.titulo}</div>}
      {itens.map((it, i) => {
        const e = it.pronto ? -99 : fr(it.em, ini + i * 10);
        const t = interpolate(f, [e, e + seg(0.8)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const cor = corL(it.cor, [LE.cinza, LE.ciano, LE.rosa][i % 3]);
        const v = it.valor * t;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", height: b.altura ?? 150, marginBottom: 26, opacity: Math.min(1, t * 3) }}>
            <div style={{ width: LR, fontFamily: FL.display, fontSize: 64, color: LE.branco, textShadow: borda(5) }}>{it.rotulo}</div>
            <div style={{ height: (b.altura ?? 150) * 0.7, width: Math.max(8, (maxW * v) / max), borderRadius: 14, background: `linear-gradient(90deg, ${alfa(cor, 0.7)}, ${cor})`, boxShadow: neon(cor, 0.7) }} />
            <div style={{ marginLeft: 20, fontFamily: FL.display, fontSize: 84, color: it.destaque ? LE.amarelo : LE.branco, textShadow: borda(6) }}>{fmt(v, 0)}{it.sufixo ?? b.sufixo ?? ""}</div>
          </div>
        );
      })}
      <Rodape b={b} c={c} />
    </div>
  );
};

const Barras: React.FC<P> = ({ b, c }) => {
  if (b.orientacao === "horizontal") return <BarrasH b={b} c={c} />;
  const { f, ini } = c;
  const itens: Qq[] = b.itens ?? [];
  const max = b.max ?? Math.max(...itens.map((i) => i.valor));
  const W = b.w ?? 940, H = b.h ?? 760, larg = b.largura ?? 230, topo = H - 280; // sobra em cima para valor + selo
  const pre = b.predio;
  return (
    <div style={{ width: W }}>
      {b.titulo && <div style={{ fontFamily: FL.display, fontSize: b.tamTitulo ?? 56, color: LE.branco, textShadow: borda(5), textAlign: "center", marginBottom: 10, opacity: pr(f, ini, 8) }}>{b.titulo}</div>}
      <div style={{ height: H, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 54, position: "relative" }}>
        {itens.map((it, i) => {
          const e = it.pronto ? -99 : fr(it.em, ini + i * 12);
          const t = interpolate(f, [e, e + seg(it.dur ?? 1)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const cor = corL(it.cor, i === 0 ? LE.ciano : LE.rosa);
          const h = (topo * it.valor) / max * t;
          const hFaixa = it.faixaDe ? (topo * it.faixaDe) / max * t : h;
          const sv = soco(f, e + seg(it.dur ?? 1) * 0.6);
          return (
            <div key={i} style={{ width: larg, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, t * 4) }}>
              {it.selo && <div style={{ marginBottom: 8 }}><Selo texto={it.selo} p={soco(f, fr(it.seloEm, e + 10))} cor={LE.amarelo} tam={30} /></div>}
              <div style={{ fontFamily: FL.display, fontSize: it.tamTexto ?? 66, color: LE.branco, textShadow: `${borda(6)}, ${neon(cor, 0.5)}`, whiteSpace: "nowrap", transform: `scale(${0.5 + 0.5 * sv})`, opacity: sv, marginBottom: 12 }}>{it.texto ?? fmt(it.valor * t)}</div>
              <div style={{ width: larg, height: h, position: "relative", borderRadius: "16px 16px 4px 4px", background: `linear-gradient(0deg, ${alfa(cor, 0.85)}, ${cor})`, boxShadow: neon(cor, 0.8), overflow: "hidden" }}>
                {it.faixaDe && <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: Math.max(0, h - hFaixa), background: `repeating-linear-gradient(135deg, ${alfa(LE.branco, 0.35)} 0 12px, transparent 12px 26px)` }} />}
              </div>
              <div style={{ fontFamily: FL.display, fontSize: 58, color: LE.branco, textShadow: borda(5), marginTop: 12 }}>{it.rotulo}</div>
            </div>
          );
        })}
        {pre && (() => {
          const e = fr(pre.em, ini);
          const t = interpolate(f, [e, e + seg(0.9)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const hb = (topo * (pre.valor ?? max)) / max * 1.08;
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, t * 3) }}>
              <div style={{ height: hb, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                <div style={{ transform: `translateY(${(1 - t) * hb}px)` }}><Burj h={hb} cor={LE.amarelo} /></div>
              </div>
              <div style={{ fontFamily: FL.display, fontSize: 40, color: LE.amarelo, textShadow: borda(4), marginTop: 12, textAlign: "center", lineHeight: 1.05, whiteSpace: "pre-line" }}>{pre.rotulo ?? "BURJ KHALIFA"}</div>
            </div>
          );
        })()}
      </div>
      <Rodape b={b} c={c} />
    </div>
  );
};

/* ------------------------------------------------------------ pessoas multiplicando */

const Pessoas: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const total = b.icones ?? 48, cols = b.colunas ?? 8;
  const de = b.de ?? 2441, para = b.para ?? 4711;
  const n0 = Math.round((total * de) / para);
  const ce = fr(b.contarEm, ini + 30);
  const t = interpolate(f, [ce, ce + seg(1.2)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const v = de + (para - de) * t;
  const sz = b.tam ?? 96;
  const pn = soco(f, ini);
  return (
    <div style={{ width: b.w ?? 940, textAlign: "center" }}>
      <div style={{ fontFamily: FL.display, fontSize: 190, lineHeight: 1, color: t > 0 ? LE.amarelo : LE.ciano, textShadow: `${borda(9)}, ${neon(t > 0 ? LE.amarelo : LE.ciano)}`, transform: `scale(${(0.4 + 0.6 * pn) * (1 + 0.08 * Math.sin(Math.PI * t))})`, opacity: Math.min(1, pn * 2) }}>{fmt(v)}</div>
      <div style={{ fontFamily: FL.display, fontSize: 62, color: LE.branco, textShadow: borda(5), marginBottom: 22, opacity: pr(f, ini + 4, 8) }}>{b.rotulo ?? "FUNCIONÁRIOS"}</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${sz}px)`, justifyContent: "center", gap: 10 }}>
        {Array.from({ length: total }, (_, i) => {
          const novo = i >= n0;
          const e = novo ? ce + (i - n0) * 1 : ini + 4 + i * 0.6;
          const s = soco(f, e);
          return <div key={i} style={{ transform: `scale(${s})`, opacity: Math.min(1, s * 2), display: "flex", justifyContent: "center" }}><Pessoa s={sz * 0.8} cor={novo ? LE.rosa : LE.ciano} /></div>;
        })}
      </div>
      <Rodape b={b} c={c} />
    </div>
  );
};

/* ------------------------------------------------------------ cronômetro HUD */

const Cronometro: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const D = b.tamanho ?? 560;
  const s = soco(f, ini);
  const dt = Math.max(0, f - ini);
  const total = Math.min(b.maxSeg ?? 287999, Math.round(dt * dt * (b.ritmo ?? 38)));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sg = total % 60;
  const ang = dt * 26;
  return (
    <div style={{ width: D, textAlign: "center", transform: `scale(${0.4 + 0.6 * s})`, opacity: Math.min(1, s * 2) }}>
      <div style={{ width: D, height: D, borderRadius: "50%", position: "relative", background: `conic-gradient(from 0deg, ${LE.rosa} 0deg, ${LE.laranja} ${(ang % 360)}deg, ${alfa(LE.roxo, 0.9)} ${(ang % 360)}deg)`, boxShadow: `0 0 50px ${alfa(LE.rosa, 0.6)}` }}>
        <div style={{ position: "absolute", inset: 22, borderRadius: "50%", background: `radial-gradient(circle, ${LE.roxo} 0%, ${LE.noite} 100%)`, border: `4px solid ${LE.tinta}` }} />
        <svg width={D} height={D} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * Math.PI * 2, r1 = D / 2 - 40, r2 = D / 2 - (i % 5 ? 56 : 74);
            return <line key={i} x1={D / 2 + Math.cos(a) * r1} y1={D / 2 + Math.sin(a) * r1} x2={D / 2 + Math.cos(a) * r2} y2={D / 2 + Math.sin(a) * r2} stroke={i % 5 ? alfa(LE.branco, 0.4) : LE.branco} strokeWidth={i % 5 ? 3 : 6} />;
          })}
          <line x1={D / 2} y1={D / 2} x2={D / 2 + Math.cos(((ang - 90) * Math.PI) / 180) * (D / 2 - 90)} y2={D / 2 + Math.sin(((ang - 90) * Math.PI) / 180) * (D / 2 - 90)} stroke={LE.amarelo} strokeWidth={9} strokeLinecap="round" />
          <circle cx={D / 2} cy={D / 2} r={14} fill={LE.amarelo} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: D * 0.6, fontFamily: FL.display, fontSize: D * 0.15, color: LE.branco, textShadow: `${borda(5)}, ${neon(LE.rosa, 0.6)}` }}>
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(sg).padStart(2, "0")}
        </div>
      </div>
      {b.rotulo && <div style={{ fontFamily: FL.display, fontSize: 60, color: LE.branco, marginTop: 22, textShadow: borda(5) }}>{b.rotulo}</div>}
    </div>
  );
};

/* ------------------------------------------------------------ radar de furacão */

const espiral = (a0: number, n = 26) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1), r = 14 + 120 * t, a = a0 + t * Math.PI * 1.5;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");

const Radar: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const D = b.tamanho ?? 620;
  const s = soco(f, ini);
  const fe = fr(b.furacaoEm, ini + 15);
  const pf = soco(f, fe);
  const varre = (f * 7) % 360;
  const pisca = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{ width: D, textAlign: "center", transform: `scale(${0.4 + 0.6 * s})`, opacity: Math.min(1, s * 2) }}>
      <div style={{ width: D, height: D, borderRadius: "50%", position: "relative", overflow: "hidden", background: "radial-gradient(circle, #0f3b3f 0%, #08201f 70%, #04110f 100%)", border: `10px solid ${LE.tinta}`, boxShadow: `0 0 0 4px ${LE.ciano}, 0 0 40px ${alfa(LE.ciano, 0.6)}` }}>
        <div style={{ position: "absolute", inset: 0, background: `conic-gradient(from ${varre}deg, ${alfa(LE.ciano, 0.55)} 0deg, transparent 60deg, transparent 360deg)` }} />
        <svg width={D - 20} height={D - 20} viewBox="-310 -310 620 620" style={{ position: "absolute", inset: 0 }}>
          {[90, 170, 250].map((r) => <circle key={r} r={r} fill="none" stroke={alfa(LE.ciano, 0.35)} strokeWidth={2} />)}
          <line x1={-300} x2={300} y1={0} y2={0} stroke={alfa(LE.ciano, 0.25)} strokeWidth={2} />
          <line y1={-300} y2={300} x1={0} x2={0} stroke={alfa(LE.ciano, 0.25)} strokeWidth={2} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = random(`ra${i}`) * Math.PI * 2, r = 60 + random(`rr${i}`) * 220;
            return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={6} fill={LE.verde} opacity={0.3 + 0.7 * Math.abs(Math.sin(f * 0.1 + i))} />;
          })}
          {pf > 0 && (
            <g transform={`translate(70 -40) rotate(${-f * 9}) scale(${pf})`} style={{ filter: `drop-shadow(0 0 12px ${LE.rosa})` }}>
              {[0, 2.094, 4.189].map((a0, i) => <polyline key={i} points={espiral(a0)} fill="none" stroke={i === 1 ? LE.laranja : LE.rosa} strokeWidth={20} strokeLinecap="round" opacity={0.9} />)}
              <circle r={16} fill={LE.amarelo} />
            </g>
          )}
        </svg>
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, fontFamily: FL.ui, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: alfa(LE.ciano, 0.9) }}>RADAR · LEONIDA</div>
      </div>
      {pf > 0 && <div style={{ marginTop: -36, position: "relative", opacity: pisca ? 1 : 0.75 }}><Selo texto={b.alerta ?? "ALERTA DE FURACÃO"} p={pf} cor={LE.vermelho} tam={46} rot={-2} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------ post viral (boato) */

const Post: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const s = soco(f, ini);
  const W = b.w ?? 860;
  return (
    <div style={{ width: W, borderRadius: 30, background: "#F4F1F7", boxShadow: "0 30px 60px rgba(0,0,0,0.55)", transform: `rotate(${b.rot ?? -3}deg) scale(${0.5 + 0.5 * s})`, opacity: Math.min(1, s * 2), overflow: "hidden", filter: b.apagar ? `grayscale(${pr(f, fr(b.apagar, ini + 40), 12) * 0.85})` : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 30px 16px" }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#bbb,#888)" }} />
        <div>
          <div style={{ width: 240, height: 22, borderRadius: 11, background: "#cfc8d6", filter: "blur(2px)" }} />
          <div style={{ width: 150, height: 16, borderRadius: 8, background: "#ddd6e3", marginTop: 10, filter: "blur(2px)" }} />
        </div>
        <div style={{ marginLeft: "auto", fontFamily: FL.ui, fontWeight: 800, fontSize: 22, color: "#8a7f96" }}>{b.marca ?? "post viral"}</div>
      </div>
      <div style={{ padding: "4px 30px 22px", fontFamily: FL.ui, fontWeight: 900, fontSize: b.tamanho ?? 64, lineHeight: 1.08, color: "#1a1020" }}>{b.texto}</div>
      <div style={{ height: 260, background: "linear-gradient(180deg,#38c6e0 0%,#1879b8 100%)", position: "relative", overflow: "hidden" }}>
        <svg width={W} height={260} style={{ position: "absolute", inset: 0 }}>
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M0 ${70 + k * 55} ${Array.from({ length: 12 }, (_, i) => `Q ${i * 80 + 40} ${50 + k * 55 + Math.sin(f * 0.15 + k) * 14} ${(i + 1) * 80} ${70 + k * 55}`).join(" ")}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={6} />
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 30, padding: "18px 30px", fontFamily: FL.ui, fontWeight: 800, fontSize: 28, color: "#6d6278" }}>
        <span style={{ color: LE.vermelho }}>♥ {b.curtidas ?? "muitas curtidas"}</span>
        <span>compartilhado sem fonte</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ celular do jogo (notificações) */

const Celular: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const W = b.w ?? 560, H = b.h ?? 1080;
  const s = soco(f, ini);
  const itens: Qq[] = b.itens ?? [];
  const ultimo = itens.reduce((m, it, i) => (f >= fr(it.em, ini + 6 + i * 8) ? fr(it.em, ini + 6 + i * 8) : m), -99);
  const vib = f - ultimo < 8 ? Math.sin((f - ultimo) * 2.4) * 6 : 0;
  return (
    <div style={{ width: W, height: H, borderRadius: 74, background: LE.tinta, padding: 16, boxShadow: `0 0 0 4px ${LE.rosa}, 0 0 50px ${alfa(LE.rosa, 0.6)}, 0 30px 60px rgba(0,0,0,0.6)`, transform: `translateY(${(1 - s) * 400}px) rotate(${vib * 0.4}deg) translateX(${vib}px)`, opacity: Math.min(1, s * 2) }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", position: "relative", background: `linear-gradient(180deg, ${LE.roxo} 0%, #7a1f6e 45%, ${LE.rosa} 70%, ${LE.laranja} 100%)` }}>
        <div style={{ position: "absolute", left: "50%", top: 18, width: 150, height: 36, borderRadius: 20, background: LE.tinta, transform: "translateX(-50%)" }} />
        <div style={{ position: "absolute", left: "50%", bottom: -120, width: 420, height: 420, borderRadius: "50%", transform: "translateX(-50%)", background: `linear-gradient(180deg, ${LE.amarelo}, ${LE.laranja})`, opacity: 0.85, WebkitMaskImage: "repeating-linear-gradient(180deg, #000 0 26px, transparent 26px 36px)" }} />
        <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", fontFamily: FL.display, fontSize: 150, color: LE.branco, lineHeight: 1, textShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>{b.hora ?? "19:11"}</div>
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: FL.ui, fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,0.9)" }}>{b.data ?? "Leonida"}</div>
        <div style={{ position: "absolute", top: 310, left: 22, right: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {itens.map((it, i) => {
            const e = fr(it.em, ini + 6 + i * 8);
            const sn = soco(f, e);
            if (sn <= 0) return null;
            const cor = corL(it.cor, [LE.rosa, LE.ciano, LE.laranja, LE.lilas][i % 4]);
            return (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", background: "rgba(255,255,255,0.9)", borderRadius: 26, padding: "16px 18px", transform: `translateY(${(1 - sn) * -60}px) scale(${0.7 + 0.3 * sn})`, opacity: Math.min(1, sn * 2), boxShadow: "0 8px 20px rgba(0,0,0,0.25)" }}>
                <div style={{ width: 62, height: 62, borderRadius: 16, background: cor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FL.display, fontSize: 36, color: LE.branco }}>{(it.app ?? "?")[0]}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FL.ui, fontWeight: 800, fontSize: 24, color: "#1a1020" }}>{it.app}</div>
                  <div style={{ fontFamily: FL.ui, fontWeight: 600, fontSize: 24, color: "#3d3346", lineHeight: 1.2 }}>{it.texto}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ versus (pergunta do fecho) */

const Versus: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const ops: Qq[] = b.opcoes ?? [];
  const so = soco(f, fr(b.ouEm, ini + 12));
  return (
    <div style={{ width: b.w ?? 940, textAlign: "center" }}>
      {ops.map((o, i) => {
        const s = soco(f, fr(o.em, ini + i * 14));
        const cor = corL(o.cor, i ? LE.rosa : LE.ciano);
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ fontFamily: FL.script, fontSize: 90, color: LE.amarelo, textShadow: `${neon(LE.amarelo)}, ${borda(3)}`, transform: `scale(${so})`, margin: "4px 0" }}>ou</div>}
            <div style={{ display: "inline-block", padding: "16px 40px 8px", borderRadius: 24, border: `6px solid ${cor}`, background: alfa(LE.noite, 0.78), boxShadow: `0 0 34px ${alfa(cor, 0.6)}`, transform: `scale(${0.4 + 0.6 * s}) rotate(${i ? 2 : -2}deg)`, opacity: Math.min(1, s * 2) }}>
              <div style={{ fontFamily: FL.display, fontSize: o.tamanho ?? 100, lineHeight: 1, color: LE.branco, textShadow: neon(cor, 0.5) }}>{o.texto}</div>
              {o.sub && <div style={{ fontFamily: FL.script, fontSize: 64, color: cor, textShadow: borda(3) }}>{o.sub}</div>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------ CTA seguir + comentário digitado */

const Cta: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const s = soco(f, ini);
  const seguiu = f >= fr(b.seguirEm, ini + 40);
  const ce = fr(b.comentarioEm, ini + 10);
  const txt: string = b.comentario ?? "";
  const n = Math.max(0, Math.min(txt.length, Math.floor(((f - ce) / FPS) * (b.cps ?? 20))));
  const caret = Math.floor(f / 8) % 2 === 0 && n < txt.length + 1 && f >= ce;
  const toque = f - fr(b.seguirEm, ini + 40);
  const W = b.w ?? 940;
  return (
    <div style={{ width: W, transform: `translateY(${(1 - s) * 300}px)`, opacity: Math.min(1, s * 2) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28, padding: 32, borderRadius: 36, background: alfa(LE.noite, 0.88), border: `4px solid ${LE.rosa}`, boxShadow: `0 0 40px ${alfa(LE.rosa, 0.55)}` }}>
        <div style={{ width: 160, height: 160, borderRadius: "50%", padding: 7, background: `linear-gradient(135deg, ${LE.amarelo}, ${LE.rosa}, ${LE.laranja})`, flexShrink: 0 }}>
          {b.avatar && <Img src={staticFile(`${c.base}/assets/${b.avatar}`)} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `5px solid ${LE.noite}` }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FL.ui, fontWeight: 800, fontSize: 44, color: LE.branco }}>{b.nome ?? "Well Machado"}</div>
          <div style={{ fontFamily: FL.ui, fontWeight: 600, fontSize: 36, color: LE.cinza }}>{b.usuario ?? "@well.free"}</div>
        </div>
        <div style={{ position: "relative", fontFamily: FL.display, fontSize: 46, padding: "14px 30px 8px", borderRadius: 18, color: seguiu ? LE.branco : LE.tinta, background: seguiu ? "transparent" : LE.rosa, border: `4px solid ${seguiu ? LE.cinza : LE.rosa}`, transform: `scale(${toque >= 0 && toque < 6 ? 0.9 : 1})` }}>
          {seguiu ? "SEGUINDO ✓" : "SEGUIR"}
          {toque >= 0 && toque < 14 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 40 + toque * 14, height: 40 + toque * 14, borderRadius: "50%", border: `5px solid ${LE.amarelo}`, transform: "translate(-50%,-50%)", opacity: 1 - toque / 14 }} />}
        </div>
      </div>
      {txt && f >= ce - 6 && (
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18, padding: "22px 28px", borderRadius: 999, background: "rgba(255,255,255,0.94)", boxShadow: "0 14px 34px rgba(0,0,0,0.45)", opacity: pr(f, ce - 6, 6) }}>
          <div style={{ fontFamily: FL.display, fontSize: 40, color: LE.rosa, flexShrink: 0 }}>COMENTA:</div>
          <div style={{ fontFamily: FL.ui, fontWeight: 700, fontSize: 38, color: "#1a1020", flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
            {txt.slice(0, n)}<span style={{ opacity: caret ? 1 : 0, color: LE.rosa }}>|</span>
          </div>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: n >= txt.length ? LE.rosa : "#d8d0de", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FL.display, fontSize: 36, color: LE.branco }}>➤</div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ registro + sons */

export const BLOCOS: Record<string, React.FC<P>> = {
  titulo: Titulo, numero: Numero, carimbo: Carimbo, selo: SeloB, fonte: FonteB, minimapa: Minimapa, placas: Placas,
  mapa: Mapa, barras: Barras, pessoas: Pessoas, cronometro: Cronometro, radar: Radar, post: Post, celular: Celular,
  versus: Versus, cta: Cta,
};

/** [frame dentro da cena, nome do sfx, volume]. `som:"nome"` troca o som de entrada; `som:false` cala o bloco. */
export function sonsDoBloco(b: BlocoLe, ini: number): [number, string, number][] {
  const s: [number, string, number][] = [];
  const entrada: Record<string, [string, number]> = {
    numero: ["pop", 0.35], carimbo: ["carimbo", 0.55], selo: ["pop", 0.3], minimapa: ["pop", 0.35], mapa: ["pop", 0.3],
    post: ["pop", 0.35], celular: ["whoosh", 0.3], cronometro: ["tick", 0.5], radar: ["pop", 0.3], pessoas: ["pop", 0.3], cta: ["whoosh", 0.3],
  };
  if (b.som === false) return s;
  if (typeof b.som === "string") s.push([ini, b.som, b.somVol ?? 0.4]);
  else if (entrada[b.tipo]) s.push([ini, ...entrada[b.tipo]]);
  const sub = (v: Qq, padrao: number) => fr(v, padrao);
  if (b.tipo === "placas") (b.itens ?? []).forEach((it: Qq, i: number) => s.push([sub(it.em, ini + i * 12), "pop", 0.4]));
  if (b.tipo === "celular") (b.itens ?? []).forEach((it: Qq, i: number) => s.push([sub(it.em, ini + 6 + i * 8), "notificacao", 0.4]));
  if (b.tipo === "barras") (b.itens ?? []).forEach((it: Qq, i: number) => !it.pronto && s.push([sub(it.em, ini + i * 12), b.somItem ?? "moeda-game", 0.35]));
  if (b.tipo === "mapa" && b.modo === "regioes") (b.regioes ?? []).forEach((it: Qq) => s.push([sub(it.em, ini), "tick", 0.45]));
  if (b.tipo === "mapa" && b.modo !== "regioes") { s.push([sub(b.leonidaEm, ini + 15), "whoosh-cine", 0.35]); s.push([sub(b.vezesEm, ini + 30), "carimbo", 0.5]); }
  if (b.tipo === "barras" && b.predio) s.push([sub(b.predio.em, ini), "whoosh-cine", 0.35]);
  if (b.tipo === "pessoas") s.push([sub(b.contarEm, ini + 30), "moedas", 0.25]);
  if (b.tipo === "radar") s.push([sub(b.furacaoEm, ini + 15), "sirene", 0.22]);
  if (b.tipo === "cta") { s.push([sub(b.seguirEm, ini + 40), "click", 0.6]); }
  if (b.tipo === "versus") (b.opcoes ?? []).forEach((o: Qq, i: number) => s.push([sub(o.em, ini + i * 14), "pop", 0.4]));
  return s;
}
