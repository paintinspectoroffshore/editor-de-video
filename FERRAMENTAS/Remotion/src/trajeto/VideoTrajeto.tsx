// Estilo TRAJETO (catálogo 61) — prancheta técnica creme-pêssego, grade de "+", UMA linha vertical rosa-laranja
// contínua que liga todas as cenas, vídeos do jogo em janelinhas com rótulo mono, números grandes no alto à direita,
// legenda em caixa creme. 1ª e última cena: vídeo em tela cheia + título gigante. Mesmos campos de roteiro do GtaReal.
// Âncoras "@palavra", sons por bloco e música com ducking vêm do mesmo motor do GtaReal (src/gtareal).
import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Img, Loop, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { FPS, clamp, seg } from "../editorial/movimento";
import { fr, sonsDoBloco } from "../gtareal/blocos";
import type { RoteiroGr, CenaGr } from "../gtareal/VideoGtaReal";

export type RoteiroTr = RoteiroGr;
type Rec = { zoom: number; origem?: string };
type Bl = { tipo: string; em?: any; ate?: any; [k: string]: any };
type Ctx = { f: number; ini: number; base: string; dur: number; lx?: number; g?: boolean };
type Janela = { x: number; y: number; w: number; h: number };

const T = { c1: "#F0E4D7", c2: "#F3DAD4", tinta: "#16120F", cinza: "#6E655D", ac: "#EA5A5A", ac2: "#F58A5C", papel: "#F8F1E8", realce: "#FF8A63" };
const F = { d: "Anton, Impact, sans-serif", m: "'JetBrains Mono', monospace" };
const ease = Easing.out(Easing.cubic);
const pr = (f: number, ini: number, d = 10) => interpolate(f, [ini, ini + d], [0, 1], { ...clamp, easing: ease });
const pop = (f: number, ini: number) => (f < ini ? 0 : spring({ frame: f - ini, fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.6 } }));
const n = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const SOMBRA = "0 4px 22px rgba(0,0,0,0.65)";

const MP3 = new Set(["whoosh-cine", "impacto-trailer", "moedas", "moeda-game", "notificacao", "sirene", "impacto"]);
const sfx = (nome: string) => staticFile(`sfx/${nome}.${MP3.has(nome) ? "mp3" : "wav"}`);

const Mono: React.FC<{ children: React.ReactNode; s?: number; cor?: string; peso?: number; st?: React.CSSProperties }> = ({ children, s = 22, cor = T.tinta, peso = 500, st }) => (
  <div style={{ fontFamily: F.m, fontSize: s, color: cor, fontWeight: peso, letterSpacing: 0.5, textTransform: "lowercase", ...st }}>{children}</div>
);

/* ------------------------------------------------------------ fundo: prancheta + grade de "+" */
const Prancheta: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(172deg, ${T.c1} 0%, ${T.c1} 45%, ${T.c2} 100%)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="mais" width={110} height={110} patternUnits="userSpaceOnUse" x={28} y={(f * 0.45) % 110}>
            <path d="M55 47v16M47 55h16" stroke="rgba(60,40,30,0.30)" strokeWidth={1.6} fill="none" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="url(#mais)" />
      </svg>
    </AbsoluteFill>
  );
};

/* "linha de chão" embaixo (some nas cenas em tela cheia) */
const Chao: React.FC = () => (
  <div style={{ position: "absolute", left: 70, right: 70, top: 1700, height: 0 }}>
    <div style={{ borderTop: `2px solid ${T.tinta}` }} />
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: -9 }}>
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ width: 2, height: 16, background: T.tinta }} />)}
    </div>
    <Mono s={20} cor={T.cinza} st={{ marginTop: 14 }}>solo · vice city · gta 6</Mono>
  </div>
);

/* ------------------------------------------------------------ vídeos */
// `inteiro` (modo janelas "grande", v4): mostra o 16:9 inteiro (contain), sem zoom nem recorte forçado.
const Clipe: React.FC<{ src: string; dur: number; inicio: number; rec?: Rec; inteiro?: boolean }> = ({ src, dur, inicio, rec, inteiro }) => {
  const f = useCurrentFrame();
  const z = inteiro ? 1 : interpolate(f, [0, dur], [1.0, 1.07], clamp) * (rec?.zoom ?? 1);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo src={src} muted startFrom={seg(inicio)} style={{ width: "100%", height: "100%", objectFit: inteiro ? "contain" : "cover", transform: `scale(${z})`, transformOrigin: rec?.origem ?? "50% 50%" }} />
    </AbsoluteFill>
  );
};

// `lens` (roteiro.duracaoVideos, s): se o trecho passa do fim do arquivo, o vídeo volta ao início (Loop) em vez de congelar.
type Lens = Record<string, number>;
const Tomadas: React.FC<{ videos: string[]; troca: number; dur: number; base: string; recortes: Record<string, Rec>; desloca?: number; inicio?: number; inteiro?: boolean; lens?: Lens }> = ({ videos, troca, dur, base, recortes, desloca = 0, inicio = 0, inteiro, lens = {} }) => {
  const tr = seg(troca);
  const k = Math.max(1, Math.round(dur / tr));
  const usos: Record<string, number> = {};
  return (
    <AbsoluteFill>
      {Array.from({ length: k }, (_, i) => {
        const [v, ofs] = videos[i % videos.length].split("@");
        const u = (usos[v] = (usos[v] ?? -1) + 1);
        const d = i === k - 1 ? dur - i * tr : tr;
        const len = lens[v];
        let ini = (ofs !== undefined ? Number(ofs) : inicio + (u % 2) * 0.9) + desloca;
        if (len && ini > len - 0.6) ini = 0;
        const clipe = <Clipe src={staticFile(`${base}/assets/stock/${v}.mp4`)} dur={d} inicio={ini} rec={recortes[v]} inteiro={inteiro} />;
        const volta = len ? Math.max(6, seg(len - ini) - 2) : 0;
        return (
          <Sequence key={i} from={i * tr} durationInFrames={Math.max(1, d)}>
            {volta && volta < d ? <Loop durationInFrames={volta}>{clipe}</Loop> : clipe}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const JanelaV: React.FC<{ r: Janela; rotulo: string; ini: number; children: React.ReactNode }> = ({ r, rotulo, ini, children }) => {
  const f = useCurrentFrame();
  const p = pr(f, ini, 9);
  return (
    <>
      <div style={{ position: "absolute", left: r.x, top: r.y - 34, opacity: p }}><Mono s={19} cor={T.cinza}>{rotulo}</Mono></div>
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, border: `2px solid ${T.tinta}`, background: T.tinta, boxShadow: `8px 8px 0 rgba(22,18,15,0.12)`, opacity: Math.min(1, p * 2), transform: `scale(${0.96 + 0.04 * p})` }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>{children}</div>
      </div>
    </>
  );
};

const LAYOUTS: { a: Janela; b: Janela }[] = [
  { a: { x: 90, y: 700, w: 900, h: 506 }, b: { x: 610, y: 1060, w: 380, h: 214 } },
  { a: { x: 90, y: 700, w: 600, h: 560 }, b: { x: 650, y: 790, w: 340, h: 420 } },
  { a: { x: 180, y: 700, w: 810, h: 456 }, b: { x: 90, y: 1010, w: 400, h: 225 } },
];

// Modo "grande" (roteiro.janelas = "grande", v4 de 15/11): janela principal 16:9 com 90% da largura e a
// segunda janela 16:9 pousada na linha de chão, do lado oposto ao da linha vermelha. `fundo.b: false` tira a 2ª.
const GRANDES: { a: Janela; b: Janela }[] = [
  { a: { x: 54, y: 620, w: 972, h: 547 }, b: { x: 70, y: 1450, w: 440, h: 248 } },
  { a: { x: 54, y: 620, w: 972, h: 547 }, b: { x: 570, y: 1450, w: 440, h: 248 } },
  { a: { x: 54, y: 620, w: 972, h: 547 }, b: { x: 600, y: 1450, w: 410, h: 231 } },
];

const JanelasCena: React.FC<{ cena: CenaGr; dur: number; idx: number; cheia: boolean; base: string; recortes: Record<string, Rec>; grande?: boolean; lens?: Lens }> = ({ cena, dur, idx, cheia, base, recortes, grande, lens }) => {
  const f = useCurrentFrame();
  const vids = cena.fundo.videos;
  const troca = cena.fundo.troca ?? 2.2;
  const nome = (v: string) => `tomada ${v.split("@")[0].replace("yt", "")}`;
  const flash = interpolate(f, [0, 4], [0.4, 0], clamp);
  if (grande) {
    const G = GRANDES[idx % 3];
    const comB = (cena.fundo as any).b !== false;
    if (cheia)
      return (
        <AbsoluteFill style={{ background: T.tinta }}>
          {/* fundo: o mesmo vídeo desfocado (renderizado pequeno e ampliado, barato) */}
          <div style={{ position: "absolute", left: 0, top: 0, width: 270, height: 480, transform: "scale(4)", transformOrigin: "0 0", filter: "blur(5px) brightness(0.5) saturate(1.2)" }}>
            <Tomadas videos={vids} troca={troca} dur={dur} base={base} recortes={{}} inicio={cena.fundo.inicio ?? 0} lens={lens} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 650, width: 1080, height: 608, boxShadow: "0 20px 60px rgba(0,0,0,0.55)" }}>
            <Tomadas videos={vids} troca={troca} dur={dur} base={base} recortes={recortes} inicio={cena.fundo.inicio ?? 0} inteiro lens={lens} />
          </div>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,6,4,0.55) 0%, rgba(10,6,4,0) 32%)" }} />
          <AbsoluteFill style={{ background: `rgba(248,241,232,${flash})` }} />
        </AbsoluteFill>
      );
    const rev = [...vids].reverse();
    return (
      <AbsoluteFill>
        <JanelaV r={G.a} rotulo={`gta 6 · ${nome(vids[0])}`} ini={0}>
          <Tomadas videos={vids} troca={troca} dur={dur} base={base} recortes={recortes} inicio={cena.fundo.inicio ?? 0} inteiro lens={lens} />
        </JanelaV>
        {comB && (
          <JanelaV r={G.b} rotulo={`ao vivo · ${nome(rev[0])}`} ini={9}>
            <Tomadas videos={rev} troca={troca * 1.3} dur={dur} base={base} recortes={recortes} desloca={0.5} inteiro lens={lens} />
          </JanelaV>
        )}
        <AbsoluteFill style={{ background: `rgba(248,241,232,${flash})` }} />
      </AbsoluteFill>
    );
  }
  const L = LAYOUTS[idx % 3];
  if (cheia)
    return (
      <AbsoluteFill>
        <Tomadas videos={vids} troca={troca} dur={dur} base={base} recortes={recortes} inicio={cena.fundo.inicio ?? 0} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,6,4,0.72) 0%, rgba(10,6,4,0.25) 38%, rgba(10,6,4,0) 55%, rgba(10,6,4,0.35) 100%)" }} />
        <AbsoluteFill style={{ background: `rgba(248,241,232,${flash})` }} />
      </AbsoluteFill>
    );
  const rev = [...vids].reverse();
  return (
    <AbsoluteFill>
      <JanelaV r={L.a} rotulo={`gta 6 · ${nome(vids[0])}`} ini={0}>
        <Tomadas videos={vids} troca={troca} dur={dur} base={base} recortes={recortes} inicio={cena.fundo.inicio ?? 0} />
      </JanelaV>
      <JanelaV r={L.b} rotulo={`ao vivo · ${nome(rev[0])}`} ini={9}>
        <Tomadas videos={rev} troca={troca * 1.3} dur={dur} base={base} recortes={recortes} desloca={1.7} />
      </JanelaV>
      <AbsoluteFill style={{ background: `rgba(248,241,232,${flash})` }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ linha vertical contínua (o "trajeto") */
const PX = [950, 130, 540];
const Linha: React.FC<{ janelas: { from: number; frames: number; cheia: boolean }[] }> = ({ janelas }) => {
  const f = useCurrentFrame();
  const i = Math.max(0, janelas.findIndex((j) => f >= j.from && f < j.from + j.frames));
  const xi = PX[i % 3];
  const xa = i > 0 ? PX[(i - 1) % 3] : xi;
  const x = interpolate(f, [janelas[i].from, janelas[i].from + 14], [xa, xi], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const alvo = janelas[i].cheia ? 1000 : 1700;
  const y = interpolate(f, [janelas[i].from, janelas[i].from + 38], [0, alvo], { ...clamp, easing: ease });
  return (
    <>
      <div style={{ position: "absolute", left: x - 1.5, top: 0, width: 3, height: 1920, background: `linear-gradient(180deg, ${T.ac} 0%, ${T.ac2} 100%)` }} />
      <div style={{ position: "absolute", left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 13, background: T.ac, border: `4px solid ${T.papel}`, boxShadow: "0 0 0 2px " + T.ac }} />
    </>
  );
};

/* ------------------------------------------------------------ blocos */
const quebrar = (t: string, max = 12) => {
  const ls: string[] = [];
  let a = "";
  t.split(/\s+/).forEach((w) => {
    if (a && (a + " " + w).length > max) { ls.push(a); a = w; } else a = a ? a + " " + w : w;
  });
  if (a) ls.push(a);
  return ls;
};

const Titulo: React.FC<{ texto: string; acento?: string[]; f: number; ini: number; cheia?: boolean; top?: number; tam?: number }> = ({ texto, acento = [], f, ini, cheia, top = 150, tam }) => {
  const ls = quebrar(texto.toUpperCase());
  const s = tam ?? (cheia ? 176 : ls.length >= 3 ? 128 : 150);
  const ac = new Set(acento.map(n));
  return (
    <div style={{ position: "absolute", left: 70, top }}>
      {ls.map((l, i) => {
        const p = pr(f, ini + i * 3, 9);
        return (
          <div key={i} style={{ height: s * 0.98, overflow: "hidden" }}>
            <div style={{ transform: `translateY(${(1 - p) * 105}%)`, fontFamily: F.d, fontSize: s, lineHeight: 0.98, color: cheia ? T.papel : T.tinta, textShadow: cheia ? SOMBRA : undefined, whiteSpace: "nowrap" }}>
              {l.split(" ").map((w, k) => <span key={k} style={{ color: ac.has(n(w)) ? (cheia ? T.realce : T.ac) : undefined }}>{w}{" "}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Sub: React.FC<{ t: string; f: number; ini: number; cheia?: boolean; top?: number }> = ({ t, f, ini, cheia, top = 128 }) => (
  <div style={{ position: "absolute", left: 70, top, opacity: pr(f, ini, 8) }}>
    <div style={{ fontFamily: F.d, fontSize: 62, color: cheia ? T.papel : T.tinta, textShadow: cheia ? SOMBRA : undefined, textTransform: "uppercase", lineHeight: 1 }}>{t}</div>
  </div>
);

type P = { b: Bl; c: Ctx; cheia: boolean };

const Rotulo: React.FC<P> = ({ b, c, cheia }) => {
  const txt = (b.linhas ?? [b.texto ?? ""]).join(" ");
  if (cheia) return <div style={{ position: "absolute", left: 70, top: 110, opacity: pr(c.f, c.ini, 8) }}><Mono s={30} cor={T.papel} st={{ textShadow: SOMBRA }}>{txt.toLowerCase()}</Mono></div>;
  return <Titulo texto={txt} acento={b.acento} f={c.f} ini={c.ini} />;
};

const Selo: React.FC<P> = ({ b, c, cheia }) => {
  const p = pop(c.f, c.ini);
  const txt: string = b.texto ?? "";
  if (cheia) {
    // ponto:false tira o "." final; riscaEm risca o título (mito desmentido)
    const tt = b.ponto === false ? txt : `${txt.replace(/\.$/, "")}.`;
    const rk = b.riscaEm !== undefined ? pr(c.f, fr(b.riscaEm, 0), 7) : 0;
    return (
      <>
        <Titulo texto={tt} f={c.f} ini={c.ini} cheia top={165} tam={190} acento={[txt.split(" ")[0]]} />
        {rk > 0 && <div style={{ position: "absolute", left: 56, top: 165 + 190 * 0.4, height: 20, width: (Math.min(12, tt.length) * 190 * 0.47 + 30) * rk, background: T.ac, transform: "rotate(-4deg)", transformOrigin: "0 50%", boxShadow: SOMBRA }} />}
      </>
    );
  }
  const curto = txt.length <= 8;
  return (
    <div style={{ position: "absolute", left: 70, top: c.g ? (curto ? 455 : 490) : curto ? 485 : 520, transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: "0 0", opacity: Math.min(1, p * 2), border: `3px solid ${T.ac}`, background: T.papel, padding: curto ? "2px 24px 0" : "10px 20px", boxShadow: `6px 6px 0 ${T.ac}` }}>
      {curto ? <div style={{ fontFamily: F.d, fontSize: 88, color: T.ac, lineHeight: 1.1 }}>{txt}</div> : <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 30, color: T.ac, textTransform: "uppercase" }}>{txt}</div>}
    </div>
  );
};

const Numero: React.FC<P> = ({ b, c, cheia }) => {
  const { f, ini } = c;
  const p = pr(f, ini, 8);
  const v = b.valor !== undefined ? Math.round(b.valor * ease(Math.min(1, Math.max(0, (f - ini) / seg(b.contar ?? 0.8))))) : null;
  const txt = v !== null ? `${b.prefixo ?? ""}${v}${b.sufixo ?? ""}` : b.texto ?? "";
  const cor = b.cor === "rosa" ? T.ac : cheia ? T.papel : T.tinta;
  return (
    <div style={{ position: "absolute", right: 70, top: 130, textAlign: "right" }}>
      <div style={{ marginLeft: "auto", width: 90 * p, height: 4, background: T.ac, marginBottom: 14 }} />
      <div style={{ overflow: "hidden", height: 230 }}>
        <div style={{ transform: `translateY(${(1 - p) * 100}%)`, fontFamily: F.d, fontSize: 230, lineHeight: 1, color: cor, whiteSpace: "nowrap" }}>{txt}</div>
      </div>
      {b.rotulo && <Mono s={26} cor={cheia ? T.papel : T.tinta} st={{ opacity: p, marginTop: 6 }}>{b.rotulo}</Mono>}
    </div>
  );
};

const Estrela: React.FC<{ s: number; cheia: boolean; cor: string }> = ({ s, cheia, cor }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z" fill={cheia ? cor : "none"} stroke={T.tinta} strokeWidth={0.9} strokeLinejoin="round" /></svg>
);

const Estrelas: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const total = b.total ?? 6, de = b.de ?? 0;
  const nova = fr(b.novaEm, ini + 14);
  return (
    <>
      <Titulo texto={`${total} estrelas`} acento={["estrelas"]} f={f} ini={ini} />
      <div style={{ position: "absolute", left: 70, top: 330, display: "flex", gap: 22 }}>
        {Array.from({ length: total }, (_, i) => {
          const novaE = i >= de;
          const p = novaE ? pop(f, nova) : pr(f, ini + i * 3, 8);
          return <div key={i} style={{ transform: `scale(${novaE && f >= nova ? 0.8 + 0.4 * p : 1})`, opacity: novaE && f < nova ? 0.35 : 1 }}><Estrela s={118} cheia={!novaE || f >= nova} cor={novaE ? T.ac : T.tinta} /></div>;
        })}
      </div>
      {b.rotulo && <div style={{ position: "absolute", left: 70, top: 478, opacity: pr(f, fr(b.rotuloEm, ini + 10), 8) }}><Mono s={26}>{b.rotulo}</Mono></div>}
    </>
  );
};

const Marca: React.FC<{ t: string }> = ({ t }) => (
  <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={t === "x" ? T.ac : T.tinta} strokeWidth={3} strokeLinecap="round">{t === "x" ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 13l5 5L20 6" />}</svg>
);

const Pilulas: React.FC<P> = ({ b, c, cheia }) => {
  const { f, ini } = c;
  const its: Bl[] = b.itens ?? [];
  const alt = 100;
  return (
    <>
      {cheia ? <Titulo texto={`${b.titulo ?? ""}.`} f={f} ini={ini} cheia top={165} /> : <Sub t={b.titulo ?? ""} f={f} ini={ini} />}
      <div style={{ position: "absolute", left: 70, width: 940, top: cheia ? 400 : 226, background: cheia ? "rgba(248,241,232,0.94)" : undefined, padding: cheia ? "6px 24px" : 0, boxSizing: "border-box" }}>
        {its.map((it, i) => {
          const em = it.pronto ? ini : fr(it.em, ini + i * 12);
          const p = pr(f, em, 8);
          const risca = it.riscaEm !== undefined ? pr(f, fr(it.riscaEm, ini), 8) : 0;
          const brilha = it.brilhaEm !== undefined && f >= fr(it.brilhaEm, ini);
          return (
            <div key={i} style={{ height: alt, borderTop: `2px solid ${T.tinta}`, display: "flex", alignItems: "center", gap: 26, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <Mono s={24} cor={T.cinza}>{String(i + 1).padStart(2, "0")}</Mono>
              <div style={{ position: "relative", fontFamily: F.d, fontSize: 74, color: risca > 0.5 ? T.cinza : brilha ? T.ac : T.tinta, lineHeight: 1 }}>
                {it.texto}
                {risca > 0 && <div style={{ position: "absolute", left: 0, top: "52%", height: 6, width: `${risca * 100}%`, background: T.ac }} />}
              </div>
              {it.marca && <Marca t={it.marca} />}
              {it.sub && <Mono s={24} cor={T.cinza} st={{ marginLeft: "auto" }}>{it.sub}</Mono>}
              {it.tag && brilha && <div style={{ marginLeft: "auto", border: `3px solid ${T.ac}`, padding: "4px 14px", fontFamily: F.m, fontWeight: 700, fontSize: 26, color: T.ac, textTransform: "uppercase" }}>{it.tag}</div>}
            </div>
          );
        })}
        <div style={{ borderTop: `2px solid ${T.tinta}`, opacity: pr(f, ini + 6, 8) }} />
      </div>
    </>
  );
};

const Barras: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const its: Bl[] = b.itens ?? [];
  const W = 560;
  return (
    <>
      <Sub t={b.titulo ?? ""} f={f} ini={ini} />
      <div style={{ position: "absolute", left: 70, top: 226, width: 940 }}>
        {its.map((it, i) => {
          const em = fr(it.em, ini + i * 12);
          const p = pr(f, em, 22);
          return (
            <div key={i} style={{ height: 124, borderTop: `2px solid ${T.tinta}`, paddingTop: 12, opacity: f >= em ? 1 : 0 }}>
              <Mono s={24} cor={T.cinza}>{it.rotulo}</Mono>
              <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 6 }}>
                <div style={{ width: W, height: 16, border: `2px solid ${T.tinta}`, boxSizing: "border-box" }}>
                  <div style={{ width: `${(it.valor / (b.max ?? 100)) * 100 * p}%`, height: "100%", background: i === 0 ? T.ac : T.tinta }} />
                </div>
                <div style={{ fontFamily: F.d, fontSize: 66, color: i === 0 ? T.ac : T.tinta, lineHeight: 1, opacity: p }}>{it.texto}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Alerta: React.FC<P> = ({ b, c }) => {
  const { f, ini } = c;
  const its: Bl[] = b.itens ?? [];
  return (
    <>
      <div style={{ position: "absolute", left: 70, top: 128, display: "flex", alignItems: "baseline", gap: 18, opacity: pr(f, ini, 8) }}>
        <div style={{ fontFamily: F.d, fontSize: 96, color: T.tinta, lineHeight: 1 }}>{b.app}</div>
        <Mono s={26} cor={T.ac} peso={700}>app no celular</Mono>
      </div>
      <div style={{ position: "absolute", left: 70, top: 262, width: 940 }}>
        {its.map((it, i) => {
          const em = fr(it.em, ini + i * 20);
          const p = pr(f, em, 8);
          return (
            <div key={i} style={{ height: 78, borderTop: `2px solid ${T.tinta}`, display: "flex", alignItems: "center", gap: 22, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <div style={{ width: 30, height: 30, border: `3px solid ${T.tinta}`, background: T.ac, boxSizing: "border-box" }} />
              <div style={{ fontFamily: F.d, fontSize: 54, color: T.tinta, lineHeight: 1 }}>{it.texto}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const Cta: React.FC<P> = ({ b, c }) => {
  const { f, ini, base } = c;
  const p = pop(f, ini);
  const seg2 = f >= fr(b.seguirEm, ini + 30);
  return (
    <div style={{ position: "absolute", left: 70, width: 940, top: 400, boxSizing: "border-box", background: "rgba(248,241,232,0.95)", border: `3px solid ${T.tinta}`, padding: 22, display: "flex", alignItems: "center", gap: 26, transform: `scale(${0.9 + 0.1 * p})`, transformOrigin: "0 0", opacity: Math.min(1, p * 2) }}>
      <Img src={staticFile(`${base}/assets/${b.avatar}`)} style={{ width: 120, height: 120, borderRadius: 60, border: `3px solid ${T.ac}`, objectFit: "cover" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.d, fontSize: 70, lineHeight: 1, color: T.tinta }}>{b.usuario}</div>
        <Mono s={22} cor={T.cinza}>x-go store · motion gráfico</Mono>
      </div>
      <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 30, padding: "14px 26px", textTransform: "uppercase", background: seg2 ? "transparent" : T.ac, color: seg2 ? T.tinta : T.papel, border: `3px solid ${seg2 ? T.tinta : T.ac}` }}>{seg2 ? "seguindo" : "seguir"}</div>
    </div>
  );
};

/* recorte: objeto solto em PNG (carro, arma, personagem) com contorno branco fino de adesivo + sombra suave.
   Campos: src ("pistolas" → assets/recortes/pistolas.png), x y (canto sup. esq.), largura, rot, entrada
   ("pop" | "slide" | "desenho"), flutua (true), borda (3 px), rotulo (texto mono ligado à linha vermelha
   por uma linha-guia), ry (altura da guia, padrão y+50), cor ("rosa" na guia). */
const Recorte: React.FC<P> = ({ b, c, cheia }) => {
  const { f, ini, base, lx = 540 } = c;
  const w: number = b.largura ?? b.w ?? 420;
  const x: number = b.x ?? 70;
  const y: number = b.y ?? 1380;
  const ent = b.entrada ?? "pop";
  const p = pr(f, ini, 14);
  const sp = pop(f, ini);
  const t = (f - ini) / FPS;
  const fl = b.flutua === false ? 0 : Math.sin(t * 1.7 + x * 0.01) * 7;
  const rr = (b.rot ?? 0) + (b.flutua === false ? 0 : Math.sin(t * 1.1 + y * 0.01) * 0.9);
  let mov = "";
  let clip: string | undefined;
  let op = 1;
  if (ent === "slide") { mov = `translateX(${(1 - p) * (x + w / 2 < 540 ? -1 : 1) * 460}px)`; op = Math.min(1, p * 1.6); }
  else if (ent === "desenho") clip = `inset(${(1 - p) * 100}% -40px -40px -40px)`;
  else { mov = `scale(${0.55 + 0.45 * sp})`; op = Math.min(1, sp * 2); }
  const bd = b.borda ?? 3;
  const filtro = `drop-shadow(${bd}px 0 0 #fff) drop-shadow(-${bd}px 0 0 #fff) drop-shadow(0 ${bd}px 0 #fff) drop-shadow(0 -${bd}px 0 #fff) drop-shadow(0 16px 18px rgba(22,18,15,0.40))`;
  const src: string = b.src.endsWith(".png") ? b.src : `${b.src}.png`;
  // linha-guia: sai da borda do objeto mais perto da linha vermelha e termina nela
  const gy: number = b.ry ?? y + 50;
  const dir = lx >= x + w / 2 ? 1 : -1;
  const x0 = dir > 0 ? x + w * 0.82 : x + w * 0.18;
  const pg = pr(f, ini + 8, 12);
  const x1 = x0 + (lx - x0) * pg;
  const corG = b.cor === "rosa" ? T.ac : cheia ? T.papel : T.tinta;
  const temGuia = b.rotulo && Math.abs(lx - x0) > 60;
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: w, transform: `translateY(${fl}px) ${mov} rotate(${rr}deg)`, transformOrigin: "50% 80%", opacity: op, clipPath: clip, filter: filtro }}>
        <Img src={staticFile(`${base}/assets/recortes/${src}`)} style={{ width: "100%", display: "block" }} />
      </div>
      {b.rotulo && (
        <>
          {temGuia && (
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: pg > 0 ? 1 : 0 }}>
              <line x1={x0} y1={gy} x2={x1} y2={gy} stroke={corG} strokeWidth={2} strokeDasharray="7 5" />
              <circle cx={x0} cy={gy} r={6} fill={T.papel} stroke={corG} strokeWidth={2.5} />
              {pg > 0.98 && <circle cx={lx} cy={gy} r={7} fill={T.ac} stroke={T.papel} strokeWidth={2.5} />}
            </svg>
          )}
          <div style={{ position: "absolute", top: gy - 44, ...(temGuia ? (dir > 0 ? { left: Math.min(x0 + 14, lx - 20), maxWidth: Math.max(160, lx - x0 - 28) } : { right: 1080 - Math.max(x0 - 14, lx + 20), maxWidth: Math.max(160, x0 - lx - 28) }) : { left: x, maxWidth: w }), opacity: pr(f, ini + 14, 8), display: "flex", justifyContent: temGuia && dir < 0 ? "flex-end" : "flex-start" }}>
            <Mono s={21} peso={700} st={{ background: T.papel, border: `1.5px solid ${T.tinta}`, padding: "2px 9px", whiteSpace: "nowrap" }}>{b.rotulo}</Mono>
          </div>
        </>
      )}
    </>
  );
};

const BL: Record<string, React.FC<P>> = { rotulo: Rotulo, selo: Selo, numero: Numero, estrelas: Estrelas, pilulas: Pilulas, barras: Barras, alerta: Alerta, cta: Cta, recorte: Recorte };

const BlocosCena: React.FC<{ cena: CenaGr; dur: number; cheia: boolean; base: string; lx?: number; g?: boolean }> = ({ cena, dur, cheia, base, lx, g }) => {
  const f = useCurrentFrame();
  const cor = cheia ? T.papel : T.tinta;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 70, top: 62, display: "flex", gap: 12, alignItems: "center", textShadow: cheia ? SOMBRA : undefined }}>
        <div style={{ width: 14, height: 14, background: T.ac }} />
        <Mono s={22} cor={cor} peso={700}>{(cena.capitulo ?? "gta 6").toLowerCase()}</Mono>
      </div>
      {(cena.blocos as Bl[]).map((b, i) => {
        const ini = fr(b.em, 2 + i * 5);
        const fim = b.ate !== undefined ? seg(b.ate) : dur + 10;
        const Comp = BL[b.tipo];
        if (!Comp || f > fim || f < ini - 1) return null;
        const saida = b.ate !== undefined ? interpolate(f, [fim - 6, fim], [1, 0], clamp) : 1;
        return <div key={i} style={{ position: "absolute", inset: 0, opacity: saida }}><Comp b={b} c={{ f, ini, base, dur, lx, g }} cheia={cheia} /></div>;
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ crédito, legenda, rodapé */
const Creditos: React.FC<{ texto: string; cheia: boolean }> = ({ texto, cheia }) => (
  <div style={{ position: "absolute", right: 70, top: 58, maxWidth: 520, textAlign: "right", textShadow: cheia ? SOMBRA : undefined }}>
    <Mono s={17} cor={cheia ? T.papel : T.cinza}>{texto}</Mono>
  </div>
);

const Rodape: React.FC<{ cheia: boolean }> = ({ cheia }) => (
  <div style={{ position: "absolute", left: 70, right: 70, top: 1856, display: "flex", justifyContent: "space-between", textShadow: cheia ? SOMBRA : undefined }}>
    <Mono s={20} cor={cheia ? T.papel : T.tinta} peso={700}>x-go store</Mono>
    <Mono s={20} cor={cheia ? T.papel : T.tinta} peso={700}>@well.free</Mono>
  </div>
);

type Palavra = { word: string; start: number; end: number };
const NUMS = new Set("duas dois tres quatro cinco seis sete oito nove dez treze dezenove vinte trinta quarenta setenta oitenta noventa cento duzentos quatrocentos setecentos mil milhoes bilhao bilhoes virgula".split(" "));

function agrupar(p: Palavra[], cortes: number[]): number[][] {
  const g: number[][] = [];
  let a: number[] = [];
  p.forEach((w, i) => {
    const ant = p[i - 1];
    const corte = ant && cortes.some((c) => ant.start < c && w.start >= c - 0.05);
    const longo = a.reduce((s, k) => s + p[k].word.length, 0) + w.word.length > 16;
    if (a.length && (a.length >= 3 || longo || /[.!?:;,…]$/.test(ant.word) || w.start - ant.end > 0.3 || corte)) { g.push(a); a = []; }
    a.push(i);
  });
  if (a.length) g.push(a);
  return g;
}

const Legenda: React.FC<{ palavras: Palavra[]; destaques: string[]; cortes: number[] }> = ({ palavras, destaques, cortes }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const grupos = React.useMemo(() => agrupar(palavras, cortes), [palavras, cortes]);
  const dset = React.useMemo(() => new Set(destaques.map(n)), [destaques]);
  let gi = -1;
  grupos.forEach((g, i) => { if (t >= palavras[g[0]].start - 0.04) gi = i; });
  if (gi < 0) return null;
  const g = grupos[gi];
  const ultimo = palavras[g[g.length - 1]];
  const prox = grupos[gi + 1] ? palavras[grupos[gi + 1][0]].start : Infinity;
  if (t > Math.min(prox, ultimo.end + 0.45)) return null;
  const p = pop(f, Math.round(palavras[g[0]].start * FPS) - 1);
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 1344, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
      <div style={{ background: T.papel, border: `3px solid ${T.tinta}`, padding: "8px 30px 4px", boxShadow: `7px 7px 0 ${T.tinta}`, transform: `scale(${0.93 + 0.07 * Math.min(1, p)})`, display: "flex", gap: 22, fontFamily: F.d, fontSize: 90, lineHeight: 1.15, textTransform: "uppercase" }}>
        {g.map((k) => {
          const w = palavras[k];
          const chave = dset.has(n(w.word)) || NUMS.has(n(w.word));
          return (
            <span key={k} style={{ opacity: t >= w.start - 0.02 ? 1 : 0.22, color: chave ? T.cinza : T.tinta, borderBottom: chave ? `9px solid ${T.ac}` : "9px solid transparent" }}>{w.word.replace(/[.,!?:;…]+$/, "")}</span>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ composição */
export const VideoTrajeto: React.FC<RoteiroTr> = (r) => {
  const f = useCurrentFrame();
  let cursor = 0;
  const N = r.cenas.length;
  const janelas = r.cenas.map((c, i) => {
    const frames = Math.round(c.duracao * FPS);
    const j = { inicio: cursor / FPS, fim: (cursor + frames) / FPS, frames, from: cursor, cheia: i === 0 || i === N - 1 };
    cursor += frames;
    return j;
  });
  const total = Math.max(1, cursor);
  const atual = Math.max(0, janelas.findIndex((j) => f >= j.from && f < j.from + j.frames));
  const aberturas = r.cenas.map((c, i) => i === 0 || c.capitulo !== r.cenas[i - 1].capitulo);
  const recortes = (r.recortes ?? {}) as Record<string, Rec>;
  const grande = (r as any).janelas === "grande";
  const lens = ((r as any).duracaoVideos ?? {}) as Lens;
  const cheiaAtual = janelas[atual]?.cheia ?? false;
  const cortes = React.useMemo(() => janelas.map((j) => j.inicio), [r.cenas]);

  const sons: { frame: number; nome: string; vol: number; dur: number }[] = [];
  r.cenas.forEach((c, i) => {
    if (aberturas[i]) sons.push({ frame: janelas[i].from, nome: "impacto-trailer", vol: 0.3, dur: 3 * FPS });
    else if ((c.transicao ?? "soco") !== "corte") sons.push({ frame: janelas[i].from, nome: "whoosh-cine", vol: 0.26, dur: FPS + 10 });
    (c.blocos as Bl[]).forEach((b, k) => {
      const ini = fr(b.em, 2 + k * 5);
      sonsDoBloco(b as any, ini).forEach(([d, nome, vol]) => sons.push({ frame: janelas[i].from + Math.round(d), nome, vol, dur: MP3.has(nome) ? 2 * FPS : FPS }));
    });
  });

  const palavras = (r.palavras ?? []) as Palavra[];
  const fala = React.useMemo(() => {
    const a = new Float32Array(total + 1);
    palavras.forEach((w) => { for (let k = Math.max(0, seg(w.start - 0.15)); k <= Math.min(total, seg(w.end + 0.25)); k++) a[k] = 1; });
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

  const credito = atual === 0 ? r.credito ?? "imagens: rockstar games" : r.cenas[atual]?.fonte ? `fonte: ${r.cenas[atual].fonte}` : "imagens: rockstar games";

  return (
    <AbsoluteFill style={{ background: T.c1 }}>
      <Prancheta />
      {!cheiaAtual && <Chao />}
      {r.cenas.map((c, i) => (
        <Sequence key={`j${i}`} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <JanelasCena cena={c} dur={janelas[i].frames} idx={i} cheia={janelas[i].cheia} base={r.base} recortes={recortes} grande={grande} lens={lens} />
        </Sequence>
      ))}
      <Linha janelas={janelas} />
      {r.cenas.map((c, i) => (
        <Sequence key={`b${i}`} from={janelas[i].from} durationInFrames={janelas[i].frames}>
          <BlocosCena cena={c} dur={janelas[i].frames} cheia={janelas[i].cheia} base={r.base} lx={PX[i % 3]} g={grande} />
        </Sequence>
      ))}
      <Creditos texto={credito.toLowerCase()} cheia={cheiaAtual} />
      <Rodape cheia={cheiaAtual} />
      <Legenda palavras={palavras} destaques={r.destaques ?? []} cortes={cortes} />
      <div style={{ position: "absolute", left: 0, top: 0, height: 5, width: `${(f / total) * 100}%`, background: `linear-gradient(90deg, ${T.ac}, ${T.ac2})` }} />
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

export const calcularMetadadosTr: CalculateMetadataFunction<RoteiroTr> = ({ props }) => ({
  durationInFrames: Math.max(1, props.cenas.reduce((s, c) => s + Math.round(c.duracao * FPS), 0)),
});
