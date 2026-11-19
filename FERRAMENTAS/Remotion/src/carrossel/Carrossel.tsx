/**
 * CARROSSEL do Instagram: 1080x1350 (4:5). Cada FRAME é um slide (frame i = slide i).
 * Renderizado como JPEG por `produzir.py carrossel <slug>` (motor.mjs modo previa).
 * Temas: "editorial" (papel/vinho, igual aos Reels editoriais) e "impacto" (escuro/lima).
 * Regras (REFERÊNCIAS/AUTOMACAO.md): 1 ideia por slide, slide 1 = gancho de 5–8 palavras,
 * texto legível no celular (mín. 40 px), último slide = CTA (salvar + seguir + comentar PALAVRA).
 */
import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, Img, staticFile, useCurrentFrame } from "remotion";
import { ED, FONTE as FED } from "../editorial/tema";
import { IM, FONTE as FIM } from "../impacto/tema";

export type Slide =
  | { tipo: "capa"; chapeu?: string; titulo: string; destaque?: string[]; sub?: string; img?: string }
  | { tipo: "texto"; numero?: string; titulo: string; corpo?: string; img?: string }
  | { tipo: "lista"; titulo: string; itens: { t: string; ok?: boolean }[] }
  | { tipo: "dado"; numero: string; legenda: string; fonte?: string }
  | { tipo: "imagem"; src: string; titulo?: string; legenda?: string }
  | { tipo: "cta"; titulo?: string; palavra?: string; usuario?: string; avatar?: string };

export type RoteiroCarrossel = { base: string; tema?: "editorial" | "impacto"; usuario?: string; slides: Slide[] };

type Tema = { fundo: string; texto: string; suave: string; acento: string; acento2: string; card: string; titulo: string; corpo: string; mono: string; maiusc: boolean };
const TEMAS: Record<string, Tema> = {
  editorial: { fundo: ED.papel, texto: ED.tinta, suave: ED.cinza, acento: ED.vinho, acento2: ED.amarelo, card: ED.branco, titulo: FED.manchete, corpo: FED.corpo, mono: FED.mono, maiusc: true },
  impacto: { fundo: IM.fundo, texto: IM.branco, suave: IM.cinza, acento: IM.lima, acento2: IM.dor, card: IM.card, titulo: FIM.impacto, corpo: FIM.ui, mono: FIM.mono, maiusc: true },
};

const src = (base: string, s: string) => (s.startsWith("http") ? s : staticFile(s.includes("/") ? s : `${base}/assets/${s}`));

/** Título com palavras de destaque pintadas na cor de acento. */
const Titulo: React.FC<{ t: Tema; txt: string; destaque?: string[]; tam: number; cor?: string }> = ({ t, txt, destaque = [], tam, cor }) => {
  const d = new Set(destaque.map((x) => x.toLowerCase()));
  return (
    <div style={{ fontFamily: t.titulo, fontSize: tam, lineHeight: 1.02, fontWeight: 700, textTransform: t.maiusc ? "uppercase" : "none", color: cor ?? t.texto, letterSpacing: -1 }}>
      {txt.split(" ").map((w, i) => (
        <span key={i} style={{ color: d.has(w.toLowerCase().replace(/[.,!?:;]/g, "")) ? t.acento : undefined }}>{w} </span>
      ))}
    </div>
  );
};

const Fundo: React.FC<{ t: Tema; nome: string }> = ({ t, nome }) =>
  nome === "editorial" ? (
    <AbsoluteFill style={{ background: t.fundo, backgroundImage: `radial-gradient(${ED.ponto} 2px, transparent 2px)`, backgroundSize: "28px 28px" }} />
  ) : (
    <AbsoluteFill style={{ background: t.fundo }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${IM.linha}55 2px, transparent 2px), linear-gradient(90deg, ${IM.linha}55 2px, transparent 2px)`, backgroundSize: "90px 90px", opacity: 0.6 }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 50% at 50% 20%, ${IM.lima}22, transparent 70%)` }} />
    </AbsoluteFill>
  );

const card = (t: Tema, nome: string): React.CSSProperties =>
  nome === "editorial"
    ? { background: t.card, border: `4px solid ${t.texto}`, boxShadow: `12px 12px 0 ${t.texto}`, borderRadius: 6 }
    : { background: t.card, border: `2px solid ${IM.linha}`, borderRadius: 28 };

const Conteudo: React.FC<{ s: Slide; t: Tema; nome: string; base: string; usuario: string }> = ({ s, t, nome, base, usuario }) => {
  const corpo: React.CSSProperties = { fontFamily: t.corpo, fontSize: 44, lineHeight: 1.32, color: t.suave, fontWeight: 600 };
  switch (s.tipo) {
    case "capa":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 36, height: "100%", justifyContent: "center" }}>
          {s.chapeu && <div style={{ fontFamily: t.mono, fontSize: 34, color: t.acento, fontWeight: 700, letterSpacing: 2 }}>{s.chapeu.toUpperCase()}</div>}
          <Titulo t={t} txt={s.titulo} destaque={s.destaque} tam={s.titulo.length > 40 ? 112 : 136} />
          {s.img && <Img src={src(base, s.img)} style={{ width: "100%", maxHeight: 420, objectFit: "cover", ...card(t, nome) }} />}
          {s.sub && <div style={corpo}>{s.sub}</div>}
          <div style={{ fontFamily: t.mono, fontSize: 32, color: t.texto, fontWeight: 700, marginTop: 10 }}>ARRASTA PRO LADO →</div>
        </div>
      );
    case "texto":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 34, height: "100%", justifyContent: "center" }}>
          {s.numero && <div style={{ fontFamily: t.titulo, fontSize: 150, color: t.acento, lineHeight: 0.9, fontWeight: 700 }}>{s.numero}</div>}
          <Titulo t={t} txt={s.titulo} tam={84} />
          {s.corpo && <div style={corpo}>{s.corpo}</div>}
          {s.img && <Img src={src(base, s.img)} style={{ width: "100%", maxHeight: 460, objectFit: "cover", objectPosition: "top", ...card(t, nome) }} />}
        </div>
      );
    case "lista":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40, height: "100%", justifyContent: "center" }}>
          <Titulo t={t} txt={s.titulo} tam={80} />
          <div style={{ ...card(t, nome), padding: "36px 40px", display: "flex", flexDirection: "column", gap: 26 }}>
            {s.itens.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start", fontFamily: t.corpo, fontSize: 42, fontWeight: 700, color: nome === "editorial" ? t.texto : t.texto, lineHeight: 1.25 }}>
                <span style={{ color: it.ok === false ? (nome === "editorial" ? ED.vinhoVivo : IM.dor) : nome === "editorial" ? ED.verde : IM.lima, flexShrink: 0 }}>{it.ok === false ? "✕" : "✓"}</span>
                <span style={{ textDecoration: it.ok === false ? "line-through" : "none", opacity: it.ok === false ? 0.65 : 1 }}>{it.t}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "dado":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 30, height: "100%", justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ fontFamily: t.titulo, fontSize: s.numero.length > 6 ? 200 : 260, color: t.acento, lineHeight: 0.9, fontWeight: 700 }}>{s.numero}</div>
          <Titulo t={t} txt={s.legenda} tam={72} />
          {s.fonte && <div style={{ fontFamily: t.mono, fontSize: 28, color: t.suave }}>Fonte: {s.fonte}</div>}
        </div>
      );
    case "imagem":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 30, height: "100%", justifyContent: "center" }}>
          {s.titulo && <Titulo t={t} txt={s.titulo} tam={72} />}
          <Img src={src(base, s.src)} style={{ width: "100%", maxHeight: 760, objectFit: "cover", objectPosition: "top", ...card(t, nome) }} />
          {s.legenda && <div style={{ ...corpo, fontSize: 38 }}>{s.legenda}</div>}
        </div>
      );
    case "cta":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40, height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          {s.avatar && <Img src={src(base, s.avatar)} style={{ width: 220, height: 220, borderRadius: "50%", border: `8px solid ${t.acento}` }} />}
          <Titulo t={t} txt={s.titulo ?? "Gostou? Salva pra não perder"} tam={78} />
          {s.palavra && (
            <div style={{ ...card(t, nome), padding: "30px 44px", fontFamily: t.corpo, fontSize: 46, fontWeight: 800, color: t.texto }}>
              Comenta <span style={{ color: t.acento }}>{s.palavra.toUpperCase()}</span> que eu te envio
            </div>
          )}
          <div style={{ fontFamily: t.mono, fontSize: 40, fontWeight: 700, color: t.acento }}>Segue {s.usuario ?? usuario}</div>
        </div>
      );
  }
};

export const Carrossel: React.FC<RoteiroCarrossel> = (r) => {
  const f = useCurrentFrame();
  const nome = r.tema ?? "editorial";
  const t = TEMAS[nome];
  const s = r.slides[Math.min(f, r.slides.length - 1)];
  const usuario = r.usuario ?? "@well.free";
  return (
    <AbsoluteFill>
      <Fundo t={t} nome={nome} />
      <div style={{ position: "absolute", left: 80, right: 80, top: 110, bottom: 150 }}>
        <Conteudo s={s} t={t} nome={nome} base={r.base} usuario={usuario} />
      </div>
      {/* rodapé: @ + paginação (o swipe é a retenção do carrossel) */}
      <div style={{ position: "absolute", left: 80, right: 80, bottom: 60, display: "flex", justifyContent: "space-between", fontFamily: t.mono, fontSize: 28, fontWeight: 700, color: t.suave }}>
        <span>{usuario}</span>
        <span>{String(f + 1).padStart(2, "0")}/{String(r.slides.length).padStart(2, "0")}</span>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: `${((f + 1) / r.slides.length) * 100}%`, background: t.acento }} />
    </AbsoluteFill>
  );
};

export const calcularMetadadosCar: CalculateMetadataFunction<RoteiroCarrossel> = ({ props }) => ({
  durationInFrames: Math.max(1, props.slides.length),
});
