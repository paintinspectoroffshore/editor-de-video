// Blocos do estilo SPLITTH (ref. 54): painel de papel milimetrado em cima, esboço técnico em traço fino.
// Cada bloco recebe b (props do roteiro, tempos já em segundos da cena) e c (quadro local da cena, base, largura).
import React from "react";
import { Easing, Img, interpolate, spring, staticFile } from "remotion";
import { FPS, clamp } from "../editorial/movimento";

export const P = {
  papel: "#EBEAE5",
  tinta: "#1A1A1A",
  azul: "#1F3FA8",
  verm: "#C8372D",
  cinza: "#77756F",
  cartao: "#FBFAF7",
  creme: "#F5E3D3",
  amarelo: "#F2C230",
  roxo: "#7B3FE4",
};
export const F = { ui: "Inter, sans-serif", mono: '"JetBrains Mono", monospace' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlocoS = { tipo: string; x?: number; y?: number; z?: number; em?: number; ate?: number; [k: string]: any };
export type Ctx = { f: number; base: string; W: number; dur: number };

const suave = Easing.bezier(0.22, 1, 0.36, 1);
export const fr = (s: number | undefined, padrao = 0) => Math.round((typeof s === "number" ? s : padrao) * FPS);
export const pr = (f: number, ini: number, dur = 12) => interpolate(f, [ini, ini + dur], [0, 1], { ...clamp, easing: suave });
export const mola = (f: number, ini: number, k = 170, d = 15) =>
  spring({ frame: f - ini, fps: FPS, config: { stiffness: k, damping: d, mass: 0.9 } });
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");
const LARG = 960; // área útil: 60 px de margem de cada lado

// ---------- ícones (viewBox 64, traço que se desenha; preenchimento só no acento) ----------
type Def = (a: string) => { l: React.ReactElement[]; f?: React.ReactElement[] };
const ICONES: Record<string, Def> = {
  mente: (a) => ({
    l: [
      <path d="M22 57V47C14 43 10 35 12 26C14 15 23 8 34 8C46 8 54 17 53 28L57 36L52 38V45C52 49 49 51 45 51H40V57" />,
      <circle cx="32" cy="27" r="8" />,
      <path d="M32 15V18M32 36V39M20 27H23M41 27H44M23.5 18.5L25.6 20.6M38.4 33.4L40.5 35.5M23.5 35.5L25.6 33.4M38.4 20.6L40.5 18.5" />,
    ],
    f: [<circle cx="32" cy="27" r="3.6" fill={a} stroke="none" />],
  }),
  mano: (a) => ({
    l: [
      <path d="M20 58V40L13 29C11 25 16 21 20 25L24 31V14C24 9 30 9 30 14V29V10C30 5 36 5 36 10V29V13C36 8 42 8 42 13V31V20C42 15 48 15 48 20V42C48 51 42 58 33 58Z" />,
      <path d="M53 10C56 13 57 17 56 21M57 5C61 10 62 17 60 23" />,
    ],
    f: [<circle cx="35" cy="44" r="4" fill={a} stroke="none" />],
  }),
  pie: (a) => ({
    l: [
      <path d="M24 58C16 58 13 51 15 43C17 35 17 30 20 26C24 21 33 22 35 29C37 36 33 41 33 48C33 54 30 58 24 58Z" />,
      <circle cx="29" cy="15" r="2.8" />,
      <circle cx="35.5" cy="16" r="2.4" />,
      <circle cx="40.5" cy="19.5" r="2" />,
      <circle cx="44" cy="24.5" r="1.7" />,
    ],
    f: [<circle cx="21.5" cy="15" r="4.2" fill={a} stroke="none" />],
  }),
  medico: (a) => ({
    l: [
      <circle cx="32" cy="17" r="9" />,
      <path d="M11 58C11 44 20 35 32 35C44 35 53 44 53 58" />,
      <path d="M23 37V45C23 50 31 50 31 45V41" />,
    ],
    f: [<path d="M41 42H45V46H49V50H45V54H41V50H37V46H41Z" fill={a} stroke="none" />],
  }),
  pin: (a) => ({
    l: [<path d="M32 58C32 58 13 39 13 26A19 19 0 0 1 51 26C51 39 32 58 32 58Z" />],
    f: [<circle cx="32" cy="26" r="7" fill={a} stroke="none" />],
  }),
  calendario: (a) => ({
    l: [
      <rect x="9" y="13" width="46" height="44" rx="5" />,
      <path d="M9 25H55M21 7V18M43 7V18" />,
      <path d="M18 35H22M28 35H32M42 35H46M18 46H22M28 46H32" />,
    ],
    f: [<rect x="37" y="41" width="10" height="10" rx="2" fill={a} stroke="none" />],
  }),
  recibo: (a) => ({
    l: [
      <path d="M16 6H48V58L43 54L38 58L32 54L26 58L21 54L16 58Z" />,
      <path d="M23 16H41M23 24H41M23 32H34" />,
    ],
    f: [<rect x="23" y="40" width="18" height="6" rx="2" fill={a} stroke="none" />],
  }),
  escudo: (a) => ({
    l: [<path d="M32 6L52 14V30C52 44 43 53 32 58C21 53 12 44 12 30V14Z" />],
    f: [<path d="M28.5 19H35.5V27.5H44V34.5H35.5V43H28.5V34.5H20V27.5H28.5Z" fill={a} stroke="none" />],
  }),
  euro: (a) => ({
    l: [
      <circle cx="32" cy="32" r="25" />,
      <path d="M41 22C38.5 19.5 35.5 18 32 18C25 18 21 25 21 32C21 39 25 46 32 46C35.5 46 38.5 44.5 41 42" />,
      <path d="M16 29H33M16 35H32" />,
    ],
    f: [<circle cx="32" cy="32" r="25" fill={a} opacity={0.14} stroke="none" />],
  }),
  estrela: (a) => ({
    l: [<path d="M32 7L39 23L56 24L43 35L47 52L32 43L17 52L21 35L8 24L25 23Z" />],
    f: [<path d="M32 7L39 23L56 24L43 35L47 52L32 43L17 52L21 35L8 24L25 23Z" fill={a} opacity={0.85} stroke="none" />],
  }),
  coracao: (a) => ({
    l: [<path d="M32 55C20 46 9 37 9 24C9 16 15 10 22 10C27 10 30 13 32 16C34 13 37 10 42 10C49 10 55 16 55 24C55 37 44 46 32 55Z" />],
    f: [<path d="M32 55C20 46 9 37 9 24C9 16 15 10 22 10C27 10 30 13 32 16C34 13 37 10 42 10C49 10 55 16 55 24C55 37 44 46 32 55Z" fill={a} opacity={0.85} stroke="none" />],
  }),
  cheque: (a) => ({
    l: [<circle cx="32" cy="32" r="25" />, <path d="M20 33L28 41L45 23" />],
    f: [<circle cx="32" cy="32" r="25" fill={a} opacity={0.14} stroke="none" />],
  }),
};

export const Icone: React.FC<{ nome?: string; tam?: number; p?: number; acento?: string; traco?: string }> = ({ nome, tam = 64, p = 1, acento = P.azul, traco = P.tinta }) => {
  const def = ICONES[nome ?? ""] ?? ICONES.estrela;
  const { l, f = [] } = def(acento);
  return (
    <svg viewBox="0 0 64 64" width={tam} height={tam} fill="none" stroke={traco} strokeWidth={(2.9 * 64) / tam} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: "visible", flexShrink: 0 }}>
      <g opacity={interpolate(p, [0.55, 1], [0, 1], clamp)}>{f.map((el, i) => React.cloneElement(el, { key: `f${i}` }))}</g>
      {l.map((el, i) => React.cloneElement(el as React.ReactElement<React.SVGProps<SVGElement>>, { key: i, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p }))}
    </svg>
  );
};

// Bandeira da Espanha desenhada (vermelho-amarelo-vermelho, 1:2:1), com leve ondulação na entrada
const BanderaES: React.FC<{ w: number; f: number; ini: number }> = ({ w, f, ini }) => {
  const m = mola(f, ini, 140, 11);
  const h = (w * 2) / 3;
  return (
    <svg width={w} height={h} viewBox="0 0 90 60" style={{ transform: `scale(${m}) rotate(${(1 - m) * -14}deg)`, transformOrigin: "left center", flexShrink: 0 }}>
      <rect x="0" y="0" width="90" height="60" rx="5" fill="#C60B1E" />
      <rect x="0" y="15" width="90" height="30" fill="#FFC400" />
      <rect x="1.2" y="1.2" width="87.6" height="57.6" rx="4.5" fill="none" stroke={P.tinta} strokeWidth="2.4" />
    </svg>
  );
};

// ---------- titulo ----------
export const Titulo: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const ini = fr(b.em);
  const linhas: string[] = b.linhas ?? [];
  const acento = new Set<string>((b.acento ?? []).map(norm));
  const tam0: number = b.tamanho ?? 132;
  const flag = b.bandera === "es";
  // largura estimada (Inter 800 ≈ 0,57 em/caractere): reduz o corpo para nunca encostar na margem de 60 px
  const est = Math.max(...linhas.map((l, i) => l.length * 0.57 * tam0 + (flag && i === linhas.length - 1 ? 150 : 0)), 1);
  const tam = Math.min(tam0, (tam0 * LARG) / est);
  return (
    <div style={{ width: LARG, textAlign: b.alinhar ?? "left" }}>
      {linhas.map((l, i) => {
        const p = pr(c.f, ini + i * 4, 14);
        const ultima = i === linhas.length - 1;
        return (
          <div key={i} style={{ overflow: "hidden", padding: "0.1em 0 0.06em", margin: "-0.1em 0 -0.06em" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 26, justifyContent: b.alinhar === "center" ? "center" : "flex-start", transform: `translateY(${(1 - p) * 110}%)` }}>
              <span style={{ fontFamily: F.ui, fontWeight: 800, fontSize: tam, lineHeight: 1.02, letterSpacing: "-0.035em", color: P.tinta, whiteSpace: "nowrap" }}>
                {l.split(" ").map((w, k) => (
                  <span key={k} style={{ color: acento.has(norm(w)) ? P.verm : P.tinta }}>
                    {k > 0 ? " " : ""}
                    {w}
                  </span>
                ))}
              </span>
              {flag && ultima && <BanderaES w={120} f={c.f} ini={ini + linhas.length * 4 + 4} />}
            </div>
          </div>
        );
      })}
      {b.sub && (
        <div style={{ marginTop: 18, fontFamily: F.mono, fontWeight: 500, fontSize: 30, color: P.cinza, opacity: pr(c.f, ini + 10, 10) }}>{b.sub}</div>
      )}
    </div>
  );
};

// ---------- chips ----------
export const Chips: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const itens: { texto: string; icone?: string; em?: number }[] = b.itens ?? [];
  const tIni = fr(b.tituloEm ?? b.em);
  return (
    <div style={{ width: LARG, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {b.titulo && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, opacity: pr(c.f, tIni, 8), fontFamily: F.mono, fontWeight: 500, fontSize: 28, color: P.azul, letterSpacing: "0.04em" }}>
          <div style={{ width: 60 * pr(c.f, tIni, 12), height: 2, background: P.azul }} />
          {b.titulo}
          <div style={{ width: 60 * pr(c.f, tIni, 12), height: 2, background: P.azul }} />
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {itens.map((it, i) => {
          const ini = fr(it.em ?? b.em, (b.em ?? 0) + i * 0.3);
          const m = mola(c.f, ini, 190, 13);
          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 28px 12px 16px", background: P.cartao,
                border: `2.5px solid ${P.tinta}`, borderRadius: 999, boxShadow: "0 6px 0 rgba(26,26,26,0.08)",
                opacity: interpolate(m, [0, 0.3], [0, 1], clamp), transform: `translateY(${(1 - m) * 40}px) scale(${0.7 + 0.3 * m})`,
              }}
            >
              <Icone nome={it.icone} tam={46} p={pr(c.f, ini + 2, 16)} />
              <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 36, color: P.tinta, letterSpacing: "-0.01em" }}>{it.texto}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- fluxo ----------
const Seta: React.FC<{ p: number; w: number; cor: string }> = ({ p, w, cor }) => (
  <svg width={w} height={40} viewBox={`0 0 ${w} 40`} fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={`M6 20H${w - 10}`} strokeDasharray="5 7" opacity={p > 0 ? 1 : 0} style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }} />
    <path d={`M${w - 20} 11L${w - 8} 20L${w - 20} 29`} opacity={interpolate(p, [0.8, 1], [0, 1], clamp)} />
  </svg>
);

export const Fluxo: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const nos: { texto: string; icone?: string; cor?: string; em?: number }[] = b.nos ?? [];
  const seta = 74;
  const w = (LARG - (nos.length - 1) * seta) / Math.max(1, nos.length);
  const inis = nos.map((n, i) => fr(n.em ?? b.em, (b.em ?? 0) + i * 0.6));
  return (
    <div style={{ width: LARG, display: "flex", alignItems: "center" }}>
      {nos.map((n, i) => {
        const verm = n.cor === "vermelho";
        const m = mola(c.f, inis[i], 180, 14);
        return (
          <React.Fragment key={i}>
            {i > 0 && <Seta p={pr(c.f, inis[i] - 8, 10)} w={seta} cor={P.tinta} />}
            <div
              style={{
                width: w, boxSizing: "border-box", padding: "30px 14px 26px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
                background: verm ? "#FFF6F1" : P.cartao, border: `${verm ? 3.5 : 2.5}px solid ${verm ? P.verm : P.tinta}`, borderRadius: 22,
                boxShadow: "0 8px 0 rgba(26,26,26,0.07)", opacity: interpolate(m, [0, 0.3], [0, 1], clamp),
                transform: `translateY(${(1 - m) * 50}px) scale(${0.85 + 0.15 * m})`,
              }}
            >
              <Icone nome={n.icone} tam={96} p={pr(c.f, inis[i] + 2, 18)} acento={verm ? P.verm : P.azul} />
              <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 34, lineHeight: 1.08, textAlign: "center", color: verm ? P.verm : P.tinta, letterSpacing: "-0.015em" }}>{n.texto}</div>
              <div style={{ fontFamily: F.mono, fontSize: 22, color: P.cinza }}>{String(i + 1).padStart(2, "0")}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- dupla ----------
export const Dupla: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const itens: { rotulo: string; sub?: string; icone?: string; cor?: string; em?: number }[] = (b.itens ?? []).slice(0, 2);
  const gap = 64;
  const w = (LARG - gap) / 2;
  const inis = itens.map((it, i) => fr(it.em ?? b.em, (b.em ?? 0) + i * 0.5));
  const meio = pr(c.f, inis[1] ?? 0, 10);
  return (
    <div style={{ width: LARG, display: "flex", alignItems: "stretch", gap, position: "relative" }}>
      {itens.map((it, i) => {
        const verm = it.cor === "vermelho";
        const m = mola(c.f, inis[i], 170, 14);
        return (
          <div
            key={i}
            style={{
              width: w, boxSizing: "border-box", padding: "34px 24px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              background: verm ? "#FFF6F1" : P.cartao, border: `${verm ? 3.5 : 2.5}px solid ${verm ? P.verm : P.tinta}`, borderRadius: 26,
              boxShadow: "0 8px 0 rgba(26,26,26,0.07)", opacity: interpolate(m, [0, 0.3], [0, 1], clamp),
              transform: `translateY(${(1 - m) * 60}px) rotate(${(1 - m) * (i ? 4 : -4)}deg)`,
            }}
          >
            <Icone nome={it.icone} tam={112} p={pr(c.f, inis[i] + 2, 18)} acento={verm ? P.verm : P.azul} />
            <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 46, lineHeight: 1.05, textAlign: "center", color: verm ? P.verm : P.tinta, letterSpacing: "-0.025em" }}>{it.rotulo}</div>
            {it.sub && <div style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 26, color: P.cinza, textTransform: "uppercase", letterSpacing: "0.06em" }}>{it.sub}</div>}
          </div>
        );
      })}
      {itens.length === 2 && (
        <div
          style={{
            position: "absolute", left: LARG / 2 - 26, top: "50%", width: 52, height: 52, marginTop: -26, borderRadius: 26, background: P.papel,
            border: `2px solid ${P.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontWeight: 700,
            fontSize: 30, color: P.tinta, opacity: meio, transform: `scale(${0.5 + 0.5 * meio})`,
          }}
        >
          +
        </div>
      )}
    </div>
  );
};

// ---------- selo (carimbo) ----------
export const Selo: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const ini = fr(b.em);
  const m = mola(c.f, ini, 260, 13);
  const cor = b.cor === "azul" ? P.azul : P.verm;
  return (
    <div style={{ display: "flex", justifyContent: "center", width: LARG }}>
      <div
        style={{
          padding: 6, border: `5px solid ${cor}`, borderRadius: 10, transform: `rotate(${b.rotacao ?? -3}deg) scale(${interpolate(m, [0, 1], [1.7, 1])})`,
          opacity: interpolate(m, [0, 0.25], [0, 1], clamp),
        }}
      >
        <div style={{ border: `2px solid ${cor}`, borderRadius: 5, padding: "16px 34px", fontFamily: F.mono, fontWeight: 700, fontSize: b.tamanho ?? 44, letterSpacing: "0.1em", color: cor, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {b.texto}
        </div>
      </div>
    </div>
  );
};

// ---------- numero (conta) ----------
export const Numero: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const ini = fr(b.em);
  const casas: number = b.casas ?? 0;
  const de: number = b.de ?? 0;
  // a contagem sempre termina antes do fim da cena (âncora tardia não deixa o número pela metade)
  const conta = Math.max(5, Math.min(b.duracaoConta ? fr(b.duracaoConta) : 20, c.dur - ini - 4));
  const p = pr(c.f, ini, conta);
  const v = de + (Number(b.valor ?? 0) - de) * p;
  const txt = v.toLocaleString("es-ES", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const cor = b.cor === "vermelho" ? P.verm : b.cor === "azul" ? P.azul : P.tinta;
  const m = mola(c.f, ini, 200, 13);
  const tam: number = b.tamanho ?? 260;
  const linha = pr(c.f, ini + Math.min(12, Math.round(conta * 0.6)), Math.min(14, conta));
  return (
    <div style={{ width: LARG, display: "flex", flexDirection: "column", alignItems: "center", opacity: interpolate(m, [0, 0.3], [0, 1], clamp) }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, transform: `scale(${0.8 + 0.2 * m})` }}>
        <span style={{ fontFamily: F.ui, fontWeight: 800, fontSize: tam, lineHeight: 0.92, letterSpacing: "-0.05em", color: cor, fontVariantNumeric: "tabular-nums" }}>
          {b.prefixo && <span style={{ fontSize: tam * 0.5 }}>{b.prefixo}</span>}
          {txt}
          {b.sufixo && <span style={{ fontSize: tam * 0.5 }}>{b.sufixo}</span>}
        </span>
        {b.unidade && <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 64, color: P.tinta, textTransform: "uppercase", letterSpacing: "0.04em" }}>{b.unidade}</span>}
      </div>
      {b.rotulo && (
        <div style={{ marginTop: 26, position: "relative", fontFamily: F.ui, fontWeight: 800, fontSize: 60, letterSpacing: "-0.02em", color: P.tinta, opacity: linha }}>
          {b.rotulo}
          <svg width="100%" height="22" viewBox="0 0 300 22" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -18 }}>
            <path d="M4 14C70 6 150 18 296 8" fill="none" stroke={P.verm} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - linha} />
          </svg>
        </div>
      )}
    </div>
  );
};

// ---------- passos ----------
export const Passos: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const itens: { n?: number; texto: string; sub?: string; destaque?: boolean; em?: number }[] = b.itens ?? [];
  const inis = itens.map((it, i) => fr(it.em ?? b.em, (b.em ?? 0) + i * 0.8));
  return (
    <div style={{ width: LARG, display: "flex", flexDirection: "column", gap: 20 }}>
      {itens.map((it, i) => {
        const m = mola(c.f, inis[i], 170, 15);
        const ok = inis[i + 1] ?? inis[i] + 27;
        const pOk = pr(c.f, ok, 10);
        const d = !!it.destaque;
        return (
          <div
            key={i}
            style={{
              height: 136, boxSizing: "border-box", padding: "0 30px 0 24px", display: "flex", alignItems: "center", gap: 26,
              background: d ? P.creme : P.cartao, border: `${d ? 3.5 : 2.5}px solid ${d ? P.verm : P.tinta}`, borderRadius: 22,
              boxShadow: "0 7px 0 rgba(26,26,26,0.07)", opacity: interpolate(m, [0, 0.3], [0, 1], clamp), transform: `translateX(${(1 - m) * 120}px)`,
            }}
          >
            <div style={{ width: 78, height: 78, borderRadius: 39, flexShrink: 0, border: `2.5px solid ${d ? P.verm : P.tinta}`, background: d ? P.verm : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontWeight: 800, fontSize: 40, color: d ? "#fff" : P.tinta }}>
              {it.n ?? i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 800, fontSize: 40, lineHeight: 1.08, letterSpacing: "-0.02em", color: d ? P.verm : P.tinta }}>{it.texto}</div>
              {it.sub && <div style={{ marginTop: 6, fontFamily: F.mono, fontWeight: 500, fontSize: 25, color: P.cinza, textTransform: "uppercase", letterSpacing: "0.05em" }}>{it.sub}</div>}
            </div>
            <svg width={58} height={58} viewBox="0 0 58 58" style={{ flexShrink: 0, opacity: pOk, transform: `scale(${0.6 + 0.4 * pOk})` }}>
              <circle cx="29" cy="29" r="27" fill={P.azul} />
              <path d="M17 30L25 38L41 21" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pOk} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

// ---------- foto (imagem com etiqueta vermelha) ----------
export const Foto: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const ini = fr(b.em);
  const m = mola(c.f, ini, 170, 15);
  const w: number = b.largura ?? 520;
  const h: number = b.altura ?? 340;
  return (
    <div style={{ width: w, opacity: interpolate(m, [0, 0.3], [0, 1], clamp), transform: `translateY(${(1 - m) * 40}px)` }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: 18, overflow: "hidden", border: `2.5px solid ${P.tinta}` }}>
        {b.src && <Img src={staticFile(`${c.base}/${b.src}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {b.etiqueta && (
          <div style={{ position: "absolute", left: 16, top: 16, display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: P.verm, color: "#fff", fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", opacity: pr(c.f, ini + 8, 6) }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "#fff" }} />
            {b.etiqueta}
          </div>
        )}
      </div>
      {b.rotulo && <div style={{ marginTop: 12, fontFamily: F.mono, fontSize: 24, color: P.cinza }}>{b.rotulo}</div>}
    </div>
  );
};

// ---------- cta (seguir) ----------
export const Cta: React.FC<{ b: BlocoS; c: Ctx }> = ({ b, c }) => {
  const ini = fr(b.em);
  const clique = fr(b.seguirEm, (b.em ?? 0) + 1.3);
  const m = mola(c.f, ini, 150, 15);
  const aperto = c.f >= clique - 3 && c.f < clique + 8 ? interpolate(c.f, [clique - 3, clique, clique + 8], [1, 0.9, 1], clamp) : 1;
  const seguido = c.f >= clique;
  const troca = pr(c.f, clique, 8);
  const nome: string = b.nome ?? "";
  return (
    <div style={{ width: 860, display: "flex", justifyContent: "center", opacity: interpolate(m, [0, 0.3], [0, 1], clamp), transform: `translateY(${(1 - m) * 120}px) scale(${0.9 + 0.1 * m})` }}>
      <div style={{ width: 860, boxSizing: "border-box", padding: "64px 56px 56px", borderRadius: 48, background: "rgba(251,250,247,0.97)", boxShadow: "0 30px 80px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        <div style={{ width: 252, height: 252, borderRadius: 126, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 126, background: `conic-gradient(from ${c.f * 3}deg, ${P.azul}, ${P.roxo}, #C13AA0, ${P.azul})` }} />
          <div style={{ position: "absolute", inset: 8, borderRadius: 118, background: P.cartao }} />
          {b.avatar && <Img src={staticFile(`${c.base}/${b.avatar}`)} style={{ position: "relative", width: 220, height: 220, borderRadius: 110, objectFit: "cover" }} />}
        </div>
        <div style={{ marginTop: 34, fontFamily: F.ui, fontWeight: 700, fontSize: nome.length > 26 ? 40 : 46, color: P.tinta, textAlign: "center", letterSpacing: "-0.01em" }}>{nome}</div>
        {b.usuario && <div style={{ marginTop: 10, fontFamily: F.mono, fontWeight: 500, fontSize: 32, color: P.cinza }}>@{String(b.usuario).replace(/^@/, "")}</div>}
        <div
          style={{
            marginTop: 44, width: 560, height: 112, borderRadius: 56, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box",
            background: seguido ? "#EEF1FA" : P.azul, border: seguido ? `3px solid ${P.azul}` : "none", transform: `scale(${aperto})`,
            fontFamily: F.ui, fontWeight: 800, fontSize: 46, color: seguido ? P.azul : "#fff", boxShadow: seguido ? "none" : "0 10px 24px rgba(31,63,168,0.35)",
          }}
        >
          <span style={{ opacity: seguido ? troca : 1 }}>{seguido ? b.textoSeguido ?? "✓ Siguiendo" : b.texto ?? "Seguir"}</span>
        </div>
        {[0, 1, 2].map((k) => {
          const t = c.f - clique - k * 5;
          if (t < 0 || t > 40) return null;
          const q = t / 40;
          return (
            <div key={k} style={{ position: "absolute", right: 130 + k * 70, bottom: 120 + q * 220, opacity: 1 - q, transform: `scale(${0.6 + q * 0.6}) rotate(${(k - 1) * 14}deg)` }}>
              <Icone nome="coracao" tam={56} acento={k === 1 ? P.roxo : P.verm} traco={k === 1 ? P.roxo : P.verm} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BLOCOS: Record<string, React.FC<{ b: BlocoS; c: Ctx }>> = {
  titulo: Titulo,
  chips: Chips,
  fluxo: Fluxo,
  dupla: Dupla,
  selo: Selo,
  numero: Numero,
  passos: Passos,
  foto: Foto,
  cta: Cta,
};

/** Sons de entrada de cada bloco: [segundo da cena, arquivo em public/sfx, volume]. */
export const sonsDoBloco = (b: BlocoS): [number, string, number][] => {
  const s: [number, string, number][] = [];
  const em = typeof b.em === "number" ? b.em : 0;
  if (b.tipo === "selo") s.push([em, "carimbo.wav", 0.3]);
  else if (b.tipo === "cta") {
    s.push([em, "pop.wav", 0.25]);
    s.push([typeof b.seguirEm === "number" ? b.seguirEm : em + 1.3, "click.wav", 0.35]);
  } else if (b.tipo === "numero") s.push([em, "tick.wav", 0.28]);
  const subs = (b.itens ?? b.nos ?? []) as { em?: number }[];
  if (subs.length && ["chips", "fluxo", "dupla", "passos"].includes(b.tipo)) subs.forEach((it, i) => s.push([typeof it.em === "number" ? it.em : em + i * 0.5, "pop.wav", 0.22]));
  else if (["titulo", "foto"].includes(b.tipo)) s.push([em, "pop.wav", 0.2]);
  return s;
};
