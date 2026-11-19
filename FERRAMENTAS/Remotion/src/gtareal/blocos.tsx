// Blocos do estilo GTA REAL: sobreposições LEVES sobre o vídeo do jogo (nada de painel, celular, mapa ou caixa cheia).
// Regra: no máximo 1–2 blocos por cena, sempre na faixa de cima (y ~150–450); o centro do quadro fica livre.
// Legibilidade só por sombra/contorno fino e pílulas pequenas semitransparentes.
import React from "react";
import { Easing, Img, interpolate, spring, staticFile } from "remotion";
import { FPS, clamp, fmtBR, seg } from "../editorial/movimento";
import { FL, Icone, LE, alfa, borda, corL, fr, norm } from "../leonida/blocos";

export { FL, LE, alfa, fr, norm };
export type BlocoGr = { tipo: string; x?: number; y?: number; z?: number; em?: number; ate?: number; [k: string]: any };
export type CtxGr = { f: number; ini: number; base: string; dur: number };
type P = { b: BlocoGr; c: CtxGr };
type Qq = any;

const ease = Easing.out(Easing.cubic);
const pr = (f: number, ini: number, d = 10) => interpolate(f, [ini, ini + d], [0, 1], { ...clamp, easing: ease });
const soco = (f: number, ini: number) => (f < ini ? 0 : spring({ frame: f - ini, fps: FPS, config: { damping: 11, stiffness: 220, mass: 0.6 } }));
const vis = (p: number) => Math.min(1, p * 1.6);

/** sombra de leitura: contorno fino + sombra suave (sem caixa) */
export const SOMBRA = `${borda(3, "rgba(0,0,0,0.85)")}, 0 4px 14px rgba(0,0,0,0.65)`;
const SOMBRA_P = "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)";
const FUNDO_PILULA = "rgba(8,8,12,0.48)";

export const Pilula: React.FC<{ children: React.ReactNode; cor?: string; tam?: number; forte?: boolean }> = ({ children, cor = LE.branco, tam = 30, forte }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: tam * 0.35, padding: `${tam * 0.26}px ${tam * 0.62}px`, borderRadius: 999, background: forte ? alfa(cor, 0.3) : FUNDO_PILULA, border: `${forte ? 3 : 2}px solid ${alfa(cor, 0.9)}`, fontFamily: FL.ui, fontWeight: 800, fontSize: tam, lineHeight: 1.1, color: LE.branco, letterSpacing: 1, textTransform: "uppercase", textShadow: SOMBRA_P, whiteSpace: "nowrap", boxShadow: forte ? `0 0 18px ${alfa(cor, 0.6)}` : undefined }}>
    {children}
  </div>
);

const Marca: React.FC<{ tipo: "x" | "ok"; s: number; cor: string }> = ({ tipo, s, cor }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="11" fill={cor} />
    {tipo === "x" ? <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke={LE.tinta} strokeWidth="3" strokeLinecap="round" /> : <path d="M6.5 12.5l3.6 3.6 7.4-8" stroke={LE.tinta} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const Estrela: React.FC<{ s: number; cor: string }> = ({ s, cor }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <path d="M12 1.8l3 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.3 5.6 21l1.6-7.1L1.8 9.1 9 8.4z" fill={cor} stroke="rgba(0,0,0,0.75)" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------ blocos */

/** título curto (1–2 linhas, Anton ~72px), palavra de `acento` colorida */
const Rotulo: React.FC<P> = ({ b, c }) => {
  const p = soco(c.f, c.ini);
  const ac = new Set<string>((b.acento ?? []).map(norm));
  const cor = corL(b.cor, LE.amarelo);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${0.7 + 0.3 * p})`, opacity: vis(p) }}>
      {(b.linhas ?? [b.texto]).map((l: string, i: number) => (
        <div key={i} style={{ fontFamily: FL.display, fontSize: b.tamanho ?? 74, lineHeight: 1.04, color: LE.branco, textTransform: "uppercase", letterSpacing: 1, textShadow: SOMBRA, whiteSpace: "nowrap" }}>
          {l.split(" ").map((w, k) => (
            <span key={k} style={{ color: ac.has(norm(w)) ? cor : undefined }}>{(k ? " " : "") + w}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

/** número grande + rótulo curto em pílula. `texto` fixo ou `valor` (conta de `de` até `valor` em `contar` s) */
const Numero: React.FC<P> = ({ b, c }) => {
  const p = soco(c.f, c.ini);
  const k = interpolate(c.f, [c.ini, c.ini + seg(b.contar ?? 0.8)], [0, 1], { ...clamp, easing: ease });
  const texto = b.texto ?? `${b.prefixo ?? ""}${fmtBR(Math.round((b.de ?? 0) + (b.valor - (b.de ?? 0)) * k), 0)}${b.sufixo ?? ""}`;
  const cor = corL(b.cor, LE.amarelo);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: `scale(${0.6 + 0.4 * p})`, opacity: vis(p) }}>
      <div style={{ fontFamily: FL.display, fontSize: b.tamanho ?? 150, lineHeight: 1, color: cor, textShadow: SOMBRA, whiteSpace: "nowrap" }}>{texto}</div>
      {b.rotulo && <Pilula cor={cor} tam={b.tamRotulo ?? 28}>{b.rotulo}</Pilula>}
    </div>
  );
};

/** fileira de estrelas de procurado: as `de` primeiras já acesas, as novas entram com soco em `novaEm` */
const Estrelas: React.FC<P> = ({ b, c }) => {
  const total = b.total ?? 6;
  const de = b.de ?? total - 1;
  const s = b.tamanho ?? 64;
  const novaEm = fr(b.novaEm, c.ini + 14);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.7))" }}>
        {Array.from({ length: total }, (_, i) => {
          const nova = i >= de;
          const p = soco(c.f, nova ? novaEm : c.ini + i * 2);
          return (
            <div key={i} style={{ transform: `scale(${nova ? 0.2 + 0.8 * p : 0.6 + 0.4 * p})`, opacity: vis(p), filter: nova && p > 0 ? `drop-shadow(0 0 10px ${alfa(LE.amarelo, 0.9)})` : undefined }}>
              <Estrela s={nova ? s * 1.15 : s} cor={LE.amarelo} />
            </div>
          );
        })}
      </div>
      {b.rotulo && <div style={{ opacity: pr(c.f, fr(b.rotuloEm, c.ini), 8) }}><Pilula tam={b.tamRotulo ?? 26}>{b.rotulo}</Pilula></div>}
    </div>
  );
};

/** pílulas em fila. item: {texto, sub?, cor?, icone? (rosto|roupa|carro), marca? (x|ok), em, pronto?, riscaEm?, brilhaEm?, tag?} */
const Pilulas: React.FC<P> = ({ b, c }) => {
  const tam = b.tamanho ?? 34;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {b.titulo && <div style={{ fontFamily: FL.ui, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: LE.branco, textTransform: "uppercase", textShadow: SOMBRA_P, opacity: pr(c.f, c.ini, 8) }}>{b.titulo}</div>}
      <div style={{ display: "flex", flexDirection: b.vertical ? "column" : "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 14, maxWidth: 980 }}>
        {(b.itens ?? []).map((it: Qq, i: number) => {
          const ini = it.pronto ? -999 : fr(it.em, c.ini + i * 12);
          const p = it.pronto ? 1 : soco(c.f, ini);
          const cor = corL(it.cor, LE.branco);
          const pR = it.riscaEm !== undefined ? pr(c.f, fr(it.riscaEm, 0), 8) : 0;
          const pB = it.brilhaEm !== undefined ? soco(c.f, fr(it.brilhaEm, 0)) : 0;
          const corF = pR > 0 ? LE.vermelho : cor;
          return (
            <div key={i} style={{ position: "relative", transform: `scale(${(0.6 + 0.4 * p) * (1 + 0.1 * Math.min(pB, 1.2))})`, opacity: vis(p) * (1 - 0.3 * pR) }}>
              <Pilula cor={corF} tam={tam} forte={pB > 0.05}>
                {it.icone && <Icone tipo={it.icone} s={tam * 1.25} cor={cor} />}
                {it.marca && <Marca tipo={it.marca} s={tam * 0.95} cor={corF} />}
                <span>{it.texto}</span>
                {it.sub && <span style={{ fontWeight: 600, fontSize: tam * 0.64, opacity: 0.9, textTransform: "none", letterSpacing: 0 }}>{it.sub}</span>}
                {it.tag && pB > 0.05 && <span style={{ background: cor, color: LE.tinta, borderRadius: 999, padding: `2px ${tam * 0.35}px`, fontSize: tam * 0.6, textShadow: "none" }}>{it.tag}</span>}
              </Pilula>
              {pR > 0 && <div style={{ position: "absolute", left: 12, top: "50%", height: 5, width: `calc(${pR * 100}% - 24px)`, background: LE.vermelho, transform: "rotate(-5deg)", borderRadius: 3, boxShadow: "0 0 6px rgba(0,0,0,0.6)" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** barras finas (horizontal), compactas, sem painel. item: {rotulo, valor, texto, cor, em} */
const Barras: React.FC<P> = ({ b, c }) => {
  const w = b.w ?? 640;
  const max = b.max ?? 100;
  return (
    <div style={{ width: w, display: "flex", flexDirection: "column", gap: 14 }}>
      {b.titulo && <div style={{ fontFamily: FL.ui, fontWeight: 800, fontSize: 26, letterSpacing: 3, color: LE.branco, textTransform: "uppercase", textShadow: SOMBRA_P, opacity: pr(c.f, c.ini, 8) }}>{b.titulo}</div>}
      {(b.itens ?? []).map((it: Qq, i: number) => {
        const ini = fr(it.em, c.ini + i * 12);
        const p = pr(c.f, ini, 18);
        const cor = corL(it.cor, LE.branco);
        return (
          <div key={i} style={{ opacity: pr(c.f, ini, 5) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: FL.ui, fontWeight: 800, fontSize: 28, color: LE.branco, textShadow: SOMBRA_P }}>
              <span>{it.rotulo}</span>
              <span style={{ fontFamily: FL.display, fontWeight: 400, fontSize: 46, color: cor, textShadow: SOMBRA }}>{it.texto}</span>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: "rgba(0,0,0,0.35)", marginTop: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(it.valor / max) * 100 * p}%`, background: cor, borderRadius: 6 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** notificação pequena (1 linha) que troca o texto a cada item. {app, cor, itens:[{texto, em}]} */
const Alerta: React.FC<P> = ({ b, c }) => {
  const itens = b.itens ?? [];
  let k = 0;
  itens.forEach((it: Qq, i: number) => { if (c.f >= fr(it.em, c.ini + i * 20)) k = i; });
  const pIn = soco(c.f, c.ini);
  const p = soco(c.f, fr(itens[k]?.em, c.ini));
  const cor = corL(b.cor, LE.ciano);
  return (
    <div style={{ width: b.w ?? 620, display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", borderRadius: 26, background: "rgba(14,14,20,0.5)", border: "1.5px solid rgba(255,255,255,0.28)", transform: `translateY(${(1 - Math.min(pIn, 1)) * -40}px)`, opacity: vis(pIn) }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: cor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FL.display, fontSize: 32, color: LE.tinta, flexShrink: 0 }}>{(b.app ?? "!").slice(0, 1)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FL.ui, fontWeight: 700, fontSize: 20, letterSpacing: 1, color: "rgba(255,255,255,0.8)", textShadow: SOMBRA_P }}>
          <span>{b.app}</span>
          <span>agora</span>
        </div>
        <div style={{ fontFamily: FL.ui, fontWeight: 800, fontSize: 34, color: LE.branco, textShadow: SOMBRA_P, whiteSpace: "nowrap", transform: `translateY(${(1 - Math.min(p, 1)) * 18}px)`, opacity: vis(p) }}>{itens[k]?.texto}</div>
      </div>
    </div>
  );
};

/** carimbo pequeno (entra grande e assenta) */
const Selo: React.FC<P> = ({ b, c }) => {
  const p = soco(c.f, c.ini);
  const cor = corL(b.cor, LE.vermelho);
  const tam = b.tamanho ?? 56;
  return (
    <div style={{ transform: `rotate(${b.rot ?? -6}deg) scale(${1.7 - 0.7 * Math.min(p, 1.15)})`, opacity: Math.min(1, p * 2), fontFamily: FL.display, fontSize: tam, lineHeight: 1.1, color: cor, padding: `${tam * 0.06}px ${tam * 0.3}px`, border: `${Math.max(3, tam * 0.07)}px solid ${cor}`, borderRadius: 10, background: "rgba(0,0,0,0.3)", letterSpacing: 2, textShadow: "0 2px 6px rgba(0,0,0,0.7)", whiteSpace: "nowrap" }}>
      {b.texto}
    </div>
  );
};

/** CTA enxuto: avatar pequeno + @ + botão seguir (vira SEGUINDO em `seguirEm`) */
const Cta: React.FC<P> = ({ b, c }) => {
  const p = soco(c.f, c.ini);
  const pS = soco(c.f, fr(b.seguirEm, c.ini + 30));
  const seguiu = pS > 0.5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 12px 10px 10px", borderRadius: 999, background: "rgba(10,10,14,0.5)", border: "1.5px solid rgba(255,255,255,0.3)", transform: `scale(${0.6 + 0.4 * p})`, opacity: vis(p) }}>
      {b.avatar && <Img src={staticFile(`${c.base}/assets/${b.avatar}`)} style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", border: `3px solid ${LE.rosa}` }} />}
      <div style={{ fontFamily: FL.ui, fontWeight: 800, fontSize: 34, color: LE.branco, textShadow: SOMBRA_P }}>{b.usuario}</div>
      <div style={{ padding: "12px 26px", borderRadius: 999, background: seguiu ? "rgba(255,255,255,0.2)" : LE.rosa, fontFamily: FL.ui, fontWeight: 800, fontSize: 28, color: LE.branco, transform: `scale(${1 + 0.15 * Math.sin(Math.min(pS, 1) * Math.PI)})` }}>{seguiu ? "SEGUINDO" : "SEGUIR"}</div>
    </div>
  );
};

export const BLOCOS: Record<string, React.FC<P>> = {
  rotulo: Rotulo, numero: Numero, estrelas: Estrelas, pilulas: Pilulas, barras: Barras, alerta: Alerta, selo: Selo, cta: Cta,
};

/** [frame dentro da cena, sfx, volume]. `som:"nome"` troca o som de entrada; `som:false` cala o bloco. */
export function sonsDoBloco(b: BlocoGr, ini: number): [number, string, number][] {
  const s: [number, string, number][] = [];
  const entrada: Record<string, [string, number]> = {
    numero: ["pop", 0.35], estrelas: ["pop", 0.3], selo: ["carimbo", 0.5], alerta: ["whoosh", 0.25], cta: ["whoosh", 0.3],
  };
  if (b.som === false) return s;
  if (typeof b.som === "string") s.push([ini, b.som, b.somVol ?? 0.4]);
  else if (entrada[b.tipo]) s.push([ini, ...entrada[b.tipo]]);
  const sub = (v: Qq, padrao: number) => fr(v, padrao);
  if (b.tipo === "estrelas") s.push([sub(b.novaEm, ini + 14), "carimbo", 0.5]);
  if (b.tipo === "pilulas")
    (b.itens ?? []).forEach((it: Qq, i: number) => {
      if (!it.pronto) s.push([sub(it.em, ini + i * 12), "pop", 0.4]);
      if (it.riscaEm !== undefined) s.push([sub(it.riscaEm, ini), "carimbo", 0.45]);
      if (it.brilhaEm !== undefined) s.push([sub(it.brilhaEm, ini), "moeda-game", 0.35]);
    });
  if (b.tipo === "barras") (b.itens ?? []).forEach((it: Qq, i: number) => s.push([sub(it.em, ini + i * 12), b.somItem ?? "tick", 0.4]));
  if (b.tipo === "alerta") (b.itens ?? []).forEach((it: Qq, i: number) => s.push([sub(it.em, ini + i * 20), "notificacao", 0.4]));
  if (b.tipo === "cta") s.push([sub(b.seguirEm, ini + 30), "click", 0.6]);
  return s;
}
