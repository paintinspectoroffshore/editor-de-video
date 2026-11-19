import React from "react";
import { useCurrentFrame } from "remotion";
import { FONTES, Paleta } from "../dna";
import { contar, crescer, entrada, fmt } from "../anim";

export type Bloco =
  | { tipo: "headline"; texto: string; destaque?: string }
  | { tipo: "numero"; valor: number; casas?: number; prefixo?: string; sufixo?: string; rotulo?: string; cor?: "acento" | "positivo" | "negativo" }
  | { tipo: "ranking"; itens: { nome: string; valor: number; sufixo?: string; nota?: string; lider?: boolean }[]; fonte?: string }
  | { tipo: "card"; titulo?: string; linhas: string[]; fonte?: string }
  | { tipo: "checklist"; itens: { texto: string; marcado: boolean }[] }
  | { tipo: "terminal"; titulo?: string; linhas: string[] }
  | { tipo: "pilulas"; itens: string[] };

type Props = { bloco: Bloco; paleta: Paleta; ordem: number; escuro: boolean };

const Headline: React.FC<{ b: Extract<Bloco, { tipo: "headline" }>; p: Paleta; o: number }> = ({ b, p, o }) => {
  const frame = useCurrentFrame();
  const partes = b.destaque ? b.texto.split(new RegExp(`(${b.destaque})`, "i")) : [b.texto];
  return (
    <div
      style={{
        ...entrada(frame, o),
        fontFamily: FONTES.display,
        fontSize: 86,
        lineHeight: 0.98,
        letterSpacing: "-0.02em",
        color: p.forte,
        textTransform: "uppercase",
      }}
    >
      {partes.map((s, i) =>
        b.destaque && s.toLowerCase() === b.destaque.toLowerCase() ? (
          <span key={i} style={{ color: p.acento }}>{s}</span>
        ) : (
          <span key={i}>{s}</span>
        ),
      )}
    </div>
  );
};

const Numero: React.FC<{ b: Extract<Bloco, { tipo: "numero" }>; p: Paleta; o: number }> = ({ b, p, o }) => {
  const frame = useCurrentFrame();
  const cor = b.cor === "positivo" ? p.positivo : b.cor === "negativo" ? p.negativo : p.acento;
  return (
    <div style={entrada(frame, o)}>
      <div
        style={{
          fontFamily: FONTES.display,
          fontSize: 170,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: cor,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {b.prefixo ?? ""}
        {fmt(contar(frame, b.valor, o), b.casas ?? 0)}
        {b.sufixo ?? ""}
      </div>
      {b.rotulo && (
        <div
          style={{
            fontFamily: FONTES.mono,
            fontSize: 20,
            letterSpacing: "0.12em",
            color: p.medio,
            textTransform: "uppercase",
            marginTop: 10,
          }}
        >
          {b.rotulo}
        </div>
      )}
    </div>
  );
};

const Ranking: React.FC<{ b: Extract<Bloco, { tipo: "ranking" }>; p: Paleta; o: number; escuro: boolean }> = ({ b, p, o, escuro }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...b.itens.map((i) => i.valor));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      {b.itens.map((it, i) => {
        const g = crescer(frame, o + i);
        const cor = it.lider ? p.acento : escuro ? "#3F3F46" : "#C9C5BD";
        return (
          <div key={i} style={entrada(frame, o + i)}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: FONTES.corpo, fontWeight: 700, fontSize: 32, color: it.lider ? p.acento : p.forte }}>
                {it.nome}
              </span>
              {it.nota && (
                <span style={{ fontFamily: FONTES.mono, fontSize: 17, color: p.fraco }}>{it.nota}</span>
              )}
            </div>
            <div style={{ position: "relative", height: 46, background: escuro ? "#1C1C1C" : "#E6E2DA", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, width: `${(it.valor / max) * 100 * g}%`, background: cor, borderRadius: 6 }} />
              <div
                style={{
                  position: "absolute",
                  right: 14,
                  top: 0,
                  height: 46,
                  display: "flex",
                  alignItems: "center",
                  fontFamily: FONTES.display,
                  fontSize: 30,
                  color: p.forte,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(contar(frame, it.valor, o + i), 1)}
                {it.sufixo ?? "%"}
              </div>
            </div>
          </div>
        );
      })}
      {b.fonte && (
        <div style={{ ...entrada(frame, o + b.itens.length), fontFamily: FONTES.mono, fontSize: 16, color: p.fraco, letterSpacing: "0.06em" }}>
          fonte: {b.fonte}
        </div>
      )}
    </div>
  );
};

const Card: React.FC<{ b: Extract<Bloco, { tipo: "card" }>; p: Paleta; o: number; escuro: boolean }> = ({ b, p, o, escuro }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        ...entrada(frame, o),
        background: p.card,
        border: `${escuro ? 1 : 2}px solid ${p.borda}`,
        borderRadius: escuro ? 14 : 4,
        boxShadow: escuro ? "none" : `6px 6px 0 ${p.borda}`,
        padding: 30,
        width: "100%",
      }}
    >
      {b.titulo && (
        <div style={{ fontFamily: FONTES.mono, fontSize: 18, letterSpacing: "0.12em", color: p.fraco, textTransform: "uppercase", marginBottom: 18 }}>
          {b.titulo}
        </div>
      )}
      {b.linhas.map((l, i) => (
        <div key={i} style={{ ...entrada(frame, o + i + 1), fontFamily: FONTES.corpo, fontWeight: 600, fontSize: 34, color: p.forte, marginBottom: 10 }}>
          {l}
        </div>
      ))}
      {b.fonte && (
        <div style={{ fontFamily: FONTES.mono, fontSize: 15, color: p.fraco, marginTop: 14 }}>fonte: {b.fonte}</div>
      )}
    </div>
  );
};

const Checklist: React.FC<{ b: Extract<Bloco, { tipo: "checklist" }>; p: Paleta; o: number; escuro: boolean }> = ({ b, p, o, escuro }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
      {b.itens.map((it, i) => (
        <div key={i} style={{ ...entrada(frame, o + i), display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 42,
              height: 42,
              border: `2px solid ${it.marcado ? p.acento : p.borda}`,
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: p.acento,
              fontSize: 28,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {it.marcado ? "✓" : ""}
          </div>
          <span style={{ fontFamily: FONTES.corpo, fontWeight: 700, fontSize: 34, color: p.forte, textTransform: "uppercase" }}>
            {it.texto}
          </span>
        </div>
      ))}
    </div>
  );
};

const Terminal: React.FC<{ b: Extract<Bloco, { tipo: "terminal" }>; p: Paleta; o: number }> = ({ b, p, o }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...entrada(frame, o), background: "#0D0D0D", border: `1px solid ${p.borda}`, borderRadius: 12, width: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: `1px solid ${p.borda}` }}>
        {["#FF5F56", "#FFBD2E", "#27C93F"].map((c) => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: 999, background: c }} />
        ))}
        {b.titulo && (
          <span style={{ fontFamily: FONTES.mono, fontSize: 17, color: p.fraco, marginLeft: 12 }}>{b.titulo}</span>
        )}
      </div>
      <div style={{ padding: 22 }}>
        {b.linhas.map((l, i) => (
          <div key={i} style={{ ...entrada(frame, o + i + 1), fontFamily: FONTES.mono, fontSize: 24, color: l.startsWith("$") ? p.acento : p.medio, marginBottom: 8 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

const Pilulas: React.FC<{ b: Extract<Bloco, { tipo: "pilulas" }>; p: Paleta; o: number }> = ({ b, p, o }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
      {b.itens.map((it, i) => (
        <div
          key={i}
          style={{
            ...entrada(frame, o + i),
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: `1px solid ${p.borda}`,
            background: p.card,
            borderRadius: 10,
            padding: "12px 20px",
            fontFamily: FONTES.corpo,
            fontWeight: 700,
            fontSize: 30,
            color: p.forte,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: p.positivo }} />
          {it}
        </div>
      ))}
    </div>
  );
};

export const RenderBloco: React.FC<Props> = ({ bloco, paleta, ordem, escuro }) => {
  switch (bloco.tipo) {
    case "headline":
      return <Headline b={bloco} p={paleta} o={ordem} />;
    case "numero":
      return <Numero b={bloco} p={paleta} o={ordem} />;
    case "ranking":
      return <Ranking b={bloco} p={paleta} o={ordem} escuro={escuro} />;
    case "card":
      return <Card b={bloco} p={paleta} o={ordem} escuro={escuro} />;
    case "checklist":
      return <Checklist b={bloco} p={paleta} o={ordem} escuro={escuro} />;
    case "terminal":
      return <Terminal b={bloco} p={paleta} o={ordem} />;
    case "pilulas":
      return <Pilulas b={bloco} p={paleta} o={ordem} />;
  }
};
