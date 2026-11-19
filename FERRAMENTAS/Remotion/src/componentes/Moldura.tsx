import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";
import { FONTES, FORMATO, PAINEL, Paleta } from "../dna";

const BRAQUETE = 44;
const ESPESSURA = 3;

const Canto: React.FC<{ cor: string; x: "l" | "r"; y: "t" | "b" }> = ({ cor, x, y }) => {
  const pos = {
    [x === "l" ? "left" : "right"]: PAINEL.lateral,
    [y === "t" ? "top" : "bottom"]: y === "t" ? PAINEL.topo : FORMATO.altura - PAINEL.base,
  };
  const h: React.CSSProperties = { position: "absolute", background: cor, width: BRAQUETE, height: ESPESSURA, ...pos };
  const v: React.CSSProperties = { position: "absolute", background: cor, width: ESPESSURA, height: BRAQUETE, ...pos };
  return (
    <>
      <div style={h} />
      <div style={v} />
    </>
  );
};

/** Grão de filme: ruído estático leve. Impede o preto de parecer chapado. */
const Grao: React.FC<{ opacidade?: number }> = ({ opacidade = 0.03 }) => {
  const frame = useCurrentFrame();
  const semente = Math.floor(frame / 2);
  const pontos = React.useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < 900; i++) {
      out.push({
        x: random(`gx${semente}${i}`) * 1080,
        y: random(`gy${semente}${i}`) * 1920,
      });
    }
    return out;
  }, [semente]);

  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", opacity: opacidade, pointerEvents: "none" }}
    >
      {pontos.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={2} height={2} fill="#fff" />
      ))}
    </svg>
  );
};

export const Moldura: React.FC<{
  paleta: Paleta;
  perfil?: string;
  badge?: string;
  rotulo?: string;
  numero?: string;
  escuro: boolean;
}> = ({ paleta, perfil, badge, rotulo, numero, escuro }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* vinheta */}
    <AbsoluteFill
      style={{
        background: escuro
          ? "radial-gradient(ellipse 95% 70% at 50% 42%, transparent 55%, rgba(0,0,0,0.45) 100%)"
          : "radial-gradient(ellipse 75% 60% at 50% 42%, transparent 0%, rgba(0,0,0,0.10) 100%)",
      }}
    />
    {escuro && <Grao />}

    <Canto cor={paleta.acento} x="l" y="t" />
    <Canto cor={paleta.acento} x="r" y="t" />
    <Canto cor={paleta.acento} x="l" y="b" />
    <Canto cor={paleta.acento} x="r" y="b" />

    {perfil && (
      <div
        style={{
          position: "absolute",
          left: PAINEL.lateral,
          top: PAINEL.topo - 62,
          fontFamily: FONTES.mono,
          fontSize: 20,
          letterSpacing: "0.08em",
          color: paleta.medio,
        }}
      >
        {perfil}
      </div>
    )}

    {badge && (
      <div
        style={{
          position: "absolute",
          right: PAINEL.lateral,
          top: PAINEL.topo - 70,
          fontFamily: FONTES.mono,
          fontSize: 17,
          letterSpacing: "0.1em",
          color: paleta.medio,
          border: `1px solid ${paleta.borda}`,
          borderRadius: 999,
          padding: "7px 16px",
          background: escuro ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        }}
      >
        {badge}
      </div>
    )}

    {rotulo && (
      <div
        style={{
          position: "absolute",
          left: PAINEL.lateral + PAINEL.respiro,
          top: PAINEL.topo + 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {numero && (
          <div
            style={{
              fontFamily: FONTES.mono,
              fontSize: 16,
              fontWeight: 700,
              color: escuro ? "#0A0A0A" : "#FFFFFF",
              background: paleta.acento,
              borderRadius: 4,
              padding: "3px 7px",
            }}
          >
            {numero}
          </div>
        )}
        <div
          style={{
            fontFamily: FONTES.mono,
            fontSize: 19,
            letterSpacing: "0.14em",
            color: paleta.medio,
            textTransform: "uppercase",
          }}
        >
          {rotulo}
        </div>
      </div>
    )}
  </AbsoluteFill>
);
