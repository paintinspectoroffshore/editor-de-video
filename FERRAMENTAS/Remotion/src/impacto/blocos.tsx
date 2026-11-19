import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FONTE, IM } from "./tema";
import { clamp, fmtBR, mola, prog, seg } from "../editorial/movimento";

/* ============================================================ tipos */

type Base = { em?: number; x?: number; y?: number; rot?: number; z?: number };

export type BlocoIm = Base &
  (
    | { tipo: "titulo"; linhas: string[]; destaque?: string[]; tamanho?: number; cor?: string }
    | {
        tipo: "celular";
        src: string;
        w?: number;
        rolar?: number; // px na imagem original (1170 de largura) até onde a tela rola
        rolarDe?: number;
        rolarEm?: number | string; // segundos (ou "@palavra") em que a tela começa a rolar
        foco?: { y: number; h: number; rotulo?: string; em?: number };
        saida?: boolean;
      }
    | { tipo: "numero"; valor: number; casas?: number; prefixo?: string; sufixo?: string; rotulo?: string; fonte?: string; tamanho?: number }
    | { tipo: "github"; repo: string; desc?: string; estrelas: number; forks?: number; downloads?: number; linguagem?: string; fonte?: string }
    | { tipo: "lista"; titulo?: string; itens: { texto: string; ok?: boolean; em?: number }[] }
    | { tipo: "selo"; texto: string; sub?: string; cor?: "lima" | "dor" | "branco"; tamanho?: number }
    | { tipo: "apk"; nome: string; arquivo: string; sub?: string; vel?: number }
    | {
        tipo: "seguir";
        usuario: string;
        nome: string;
        avatar: string;
        posts?: string;
        seguidores: string;
        seguindo?: string;
        bio?: string[];
        comentario?: string;
      }
  );

export type Ctx = { ini: number; dur: number; base: string };

const src = (c: Ctx, s: string) => staticFile(`${c.base}/${s}`);

/* ============================================================ ícones (SVG próprio) */

const Estrela: React.FC<{ s?: number; cor?: string }> = ({ s = 40, cor = "#E3B341" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path fill={cor} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z" /></svg>
);
const Garfo: React.FC<{ s?: number }> = ({ s = 40 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#9AA3B2" strokeWidth={2.2} strokeLinecap="round">
    <circle cx="6" cy="5" r="2.2" /><circle cx="18" cy="5" r="2.2" /><circle cx="12" cy="19" r="2.2" />
    <path d="M6 7.2v1.6a3 3 0 003 3h6a3 3 0 003-3V7.2M12 11.8v4.9" />
  </svg>
);
const Baixar: React.FC<{ s?: number; cor?: string }> = ({ s = 40, cor = "#9AA3B2" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M6.5 10l5.5 5.5 5.5-5.5M4 20h16" />
  </svg>
);
export const Check: React.FC<{ s?: number; cor?: string }> = ({ s = 40, cor = "#000" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const Xis: React.FC<{ s?: number; cor?: string }> = ({ s = 40, cor = "#fff" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={3.4} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const Halter: React.FC<{ s?: number; cor?: string }> = ({ s = 80, cor = IM.lima }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={cor}>
    <rect x="2" y="8.5" width="2.2" height="7" rx="0.8" /><rect x="4.8" y="6.5" width="2.6" height="11" rx="0.9" />
    <rect x="16.6" y="6.5" width="2.6" height="11" rx="0.9" /><rect x="19.8" y="8.5" width="2.2" height="7" rx="0.8" />
    <rect x="7.4" y="10.8" width="9.2" height="2.4" />
  </svg>
);
const Coracao: React.FC<{ s?: number; cheio?: boolean }> = ({ s = 36, cheio }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={cheio ? "#FF3040" : "none"} stroke={cheio ? "#FF3040" : "#9AA3B2"} strokeWidth={2}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
  </svg>
);

/** Indicador de toque (dedo): círculo branco que pousa, aperta e solta uma onda. */
const Toque: React.FC<{ x: number; y: number; chega: number; aperta: number; f: number; de?: [number, number] }> = ({ x, y, chega, aperta, f, de = [x + 260, y + 420] }) => {
  const p = prog(f, chega, aperta - chega);
  const cx = interpolate(p, [0, 1], [de[0], x]);
  const cy = interpolate(p, [0, 1], [de[1], y]);
  const press = interpolate(f, [aperta, aperta + 3, aperta + 8], [1, 0.75, 1], clamp);
  const onda = prog(f, aperta, 14);
  const vis = interpolate(f, [chega, chega + 4, aperta + 18, aperta + 24], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: cx - 45, top: cy - 45, width: 90, height: 90, opacity: vis, pointerEvents: "none", zIndex: 50 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 99, background: "rgba(255,255,255,0.85)", transform: `scale(${press})`, boxShadow: "0 6px 30px rgba(0,0,0,0.5)" }} />
      <div style={{ position: "absolute", inset: -10, borderRadius: 99, border: "5px solid rgba(255,255,255,0.9)", transform: `scale(${1 + onda * 1.2})`, opacity: onda > 0 ? 1 - onda : 0 }} />
    </div>
  );
};

/* ============================================================ título cinético */

const Titulo: React.FC<{ b: Extract<BlocoIm, { tipo: "titulo" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const t = b.tamanho ?? 120;
  const dest = new Set((b.destaque ?? []).map((s) => s.toLowerCase()));
  return (
    <div style={{ width: 1080, padding: "0 70px", textAlign: "center" }}>
      {b.linhas.map((l, i) => {
        const p = mola(f, c.ini + i * 4, 200, 18);
        return (
          <div key={i} style={{ overflow: "hidden", paddingBottom: 6 }}>
            <div
              style={{
                transform: `translateY(${(1 - p) * 110}%)`,
                fontFamily: FONTE.impacto,
                fontSize: t,
                lineHeight: 1.0,
                letterSpacing: -2,
                textTransform: "uppercase",
                color: b.cor ?? IM.branco,
                textShadow: "0 8px 40px rgba(0,0,0,0.6)",
              }}
            >
              {l.split(" ").map((w, k) => (
                <span key={k} style={{ color: dest.has(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")) ? IM.lima : undefined }}>
                  {w}{" "}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================ celular com print real */

const PROP = 2532 / 1170;

const Celular: React.FC<{ b: Extract<BlocoIm, { tipo: "celular" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const w = b.w ?? 600;
  const borda = 16;
  const tw = w - borda * 2;
  const th = Math.round(tw * PROP);
  const k = tw / 1170;
  const m = mola(f, c.ini, 120, 15);
  const sai = b.saida ? interpolate(f, [c.dur - 8, c.dur], [0, 1], { ...clamp, easing: (t) => t * t }) : 0;
  const r0 = typeof b.rolarEm === "number" ? seg(b.rolarEm) : c.ini + 18;
  const rola = interpolate(f, [r0, Math.max(r0 + 10, c.dur - 4)], [b.rolarDe ?? 0, b.rolar ?? 0], { ...clamp, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) });
  const flutua = Math.sin(f / 22) * 1.2;
  const fo = b.foco;
  const pf = fo ? mola(f, c.ini + (fo.em !== undefined ? seg(fo.em) : 22), 200, 16) : 0;
  return (
    <div style={{ width: 1080, display: "flex", justifyContent: "center", perspective: 2200 }}>
      <div
        style={{
          width: w,
          transform: `translateY(${(1 - m) * 1100 + sai * 1200}px) rotateX(${(1 - m) * 28}deg) rotate(${(b.rot ?? 0) + flutua}deg)`,
          transformOrigin: "50% 100%",
          borderRadius: w * 0.15,
          padding: borda,
          background: "linear-gradient(145deg,#3B4048,#14161A 40%,#2A2E35)",
          boxShadow: `0 60px 120px rgba(0,0,0,0.75), 0 0 140px ${IM.lima}22`,
          position: "relative",
        }}
      >
        <div style={{ width: tw, height: th, borderRadius: w * 0.125, overflow: "hidden", position: "relative", background: "#000" }}>
          <Img src={src(c, b.src)} style={{ width: tw, transform: `translateY(${-rola * k}px)`, display: "block" }} />
          {/* ilha */}
          <div style={{ position: "absolute", top: tw * 0.03, left: "50%", width: tw * 0.3, height: tw * 0.085, marginLeft: -tw * 0.15, background: "#000", borderRadius: 99 }} />
          {fo && (
            <div
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                top: (fo.y - rola) * k,
                height: fo.h * k,
                borderRadius: 26,
                border: `6px solid ${IM.lima}`,
                boxShadow: `0 0 0 2000px rgba(0,0,0,${0.45 * pf}), 0 0 40px ${IM.lima}`,
                opacity: pf,
                transform: `scale(${1.15 - 0.15 * pf})`,
              }}
            />
          )}
        </div>
        {fo?.rotulo && (
          <div
            style={{
              position: "absolute",
              right: -60,
              top: borda + (fo.y - rola) * k - 70,
              background: IM.lima,
              color: "#000",
              fontFamily: FONTE.impacto,
              fontSize: 44,
              padding: "12px 26px",
              borderRadius: 18,
              transform: `scale(${pf * interpolate(fo.y - rola, [-fo.h, 0], [0, 1], clamp)}) rotate(4deg)`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {fo.rotulo}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================ número gigante */

const Numero: React.FC<{ b: Extract<BlocoIm, { tipo: "numero" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const p = prog(f, c.ini, 26);
  const m = mola(f, c.ini, 220, 13);
  const v = b.valor * p;
  const t = b.tamanho ?? 230;
  return (
    <div style={{ width: 1080, textAlign: "center", transform: `scale(${0.6 + 0.4 * m})`, opacity: Math.min(1, m * 2) }}>
      <div style={{ fontFamily: FONTE.impacto, fontSize: t, lineHeight: 0.95, color: IM.lima, letterSpacing: -4, textShadow: `0 0 60px ${IM.lima}55, 0 10px 40px rgba(0,0,0,0.7)` }}>
        {b.prefixo ?? ""}
        {fmtBR(v, b.casas ?? 0)}
        {b.sufixo ?? ""}
      </div>
      {b.rotulo && (
        <div style={{ fontFamily: FONTE.impacto, fontSize: 64, color: IM.branco, textTransform: "uppercase", marginTop: 14, textShadow: "0 6px 30px rgba(0,0,0,0.8)" }}>{b.rotulo}</div>
      )}
      {b.fonte && <div style={{ fontFamily: FONTE.mono, fontSize: 28, color: IM.cinza, marginTop: 18 }}>fonte: {b.fonte}</div>}
    </div>
  );
};

/* ============================================================ card do GitHub */

const Github: React.FC<{ b: Extract<BlocoIm, { tipo: "github" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const m = mola(f, c.ini, 150, 16);
  const pe = prog(f, c.ini + 8, 32);
  const clique = c.ini + 34;
  const marcou = f >= clique + 2;
  const brilho = mola(f, clique + 2, 260, 10);
  const linha = (i: number) => ({ opacity: prog(f, c.ini + 12 + i * 5, 10), transform: `translateX(${(1 - prog(f, c.ini + 12 + i * 5, 10)) * 40}px)` });
  const [dono, nome] = b.repo.split("/");
  return (
    <div style={{ width: 1080, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 940,
          background: "#0D1117",
          border: "3px solid #30363D",
          borderRadius: 34,
          padding: "48px 52px",
          transform: `translateY(${(1 - m) * 500}px) scale(${0.9 + 0.1 * m})`,
          boxShadow: "0 50px 120px rgba(0,0,0,0.7)",
          fontFamily: FONTE.ui,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 46 }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#9AA3B2"><path d="M4 3.5A1.5 1.5 0 015.5 2H19v17H6.5a1 1 0 000 2H19v1H6.5A2.5 2.5 0 014 19.5zM6 4v13.1c.2-.1.3-.1.5-.1H17V4z" /></svg>
          <span style={{ color: "#58A6FF" }}>{dono}</span>
          <span style={{ color: "#9AA3B2" }}>/</span>
          <span style={{ color: "#58A6FF", fontWeight: 800 }}>{nome}</span>
          <span style={{ fontSize: 26, color: "#9AA3B2", border: "2px solid #30363D", borderRadius: 99, padding: "4px 16px", marginLeft: 8 }}>Public</span>
        </div>
        {b.desc && <div style={{ ...linha(0), color: "#C9D1D9", fontSize: 36, lineHeight: 1.35, marginTop: 26 }}>{b.desc}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 40 }}>
          <span style={{ flexShrink: 0, display: "flex" }}><Estrela s={96} /></span>
          <span style={{ fontFamily: FONTE.impacto, fontSize: 140, color: IM.branco, letterSpacing: -4, lineHeight: 1 }}>{fmtBR(b.estrelas * pe)}</span>
            {/* botão Star que é "clicado" */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 28px",
            borderRadius: 16,
            border: "2px solid #30363D",
            background: marcou ? "#21262D" : "#161B22",
            color: IM.branco,
            fontSize: 34,
            fontWeight: 700,
            transform: `scale(${marcou ? 1 + 0.12 * (1 - brilho) : 1})`,
          }}
        >
          <Estrela s={38} cor={marcou ? "#E3B341" : "#9AA3B2"} />
          {marcou ? "Starred" : "Star"}
        </div>
        </div>
        <div style={{ ...linha(1), color: "#9AA3B2", fontSize: 34, marginTop: 4, marginLeft: 6 }}>estrelas no GitHub</div>
        <div style={{ display: "flex", gap: 48, marginTop: 34, fontSize: 40, color: IM.branco, fontWeight: 700 }}>
          {b.forks !== undefined && (
            <div style={{ ...linha(2), display: "flex", alignItems: "center", gap: 12 }}><Garfo s={42} />{fmtBR(b.forks)} <span style={{ color: "#9AA3B2", fontWeight: 500 }}>forks</span></div>
          )}
          {b.downloads !== undefined && (
            <div style={{ ...linha(3), display: "flex", alignItems: "center", gap: 12 }}><Baixar s={42} />{fmtBR(b.downloads)} <span style={{ color: "#9AA3B2", fontWeight: 500 }}>downloads</span></div>
          )}
        </div>
        {b.linguagem && (
          <div style={{ ...linha(4), display: "flex", alignItems: "center", gap: 14, marginTop: 26, fontSize: 32, color: "#9AA3B2" }}>
            <span style={{ width: 24, height: 24, borderRadius: 99, background: "#F1E05A", display: "inline-block" }} />
            {b.linguagem}
          </div>
        )}
        <Toque f={f} x={790} y={350} chega={c.ini + 16} aperta={clique} />
        {b.fonte && <div style={{ position: "absolute", bottom: -54, left: 6, fontFamily: FONTE.mono, fontSize: 26, color: IM.cinza }}>fonte: {b.fonte}</div>}
      </div>
    </div>
  );
};

/* ============================================================ lista dor/solução */

const Lista: React.FC<{ b: Extract<BlocoIm, { tipo: "lista" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: 1080, padding: "0 80px", display: "flex", flexDirection: "column", gap: 26 }}>
      {b.titulo && (
        <div style={{ fontFamily: FONTE.impacto, fontSize: 64, color: IM.branco, textTransform: "uppercase", opacity: prog(f, c.ini, 8), marginBottom: 8 }}>{b.titulo}</div>
      )}
      {b.itens.map((it, i) => {
        const ini = it.em !== undefined ? seg(it.em) : c.ini + 4 + i * 9;
        const m = mola(f, ini, 220, 16);
        const risco = it.ok ? 0 : prog(f, ini + 10, 8);
        const cor = it.ok ? IM.lima : IM.dor;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "28px 36px",
              borderRadius: 30,
              background: "rgba(20,23,28,0.88)",
              border: `3px solid ${it.ok ? IM.lima + "66" : IM.linha}`,
              transform: `translateX(${(1 - m) * -700}px)`,
              opacity: Math.min(1, m * 3),
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ width: 76, height: 76, borderRadius: 99, background: cor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {it.ok ? <Check s={50} /> : <Xis s={46} />}
            </div>
            <div style={{ position: "relative", fontFamily: FONTE.ui, fontWeight: 800, fontSize: 56, color: it.ok ? IM.branco : "#C9CED6", lineHeight: 1.1 }}>
              {it.texto}
              {!it.ok && <div style={{ position: "absolute", left: -6, top: "52%", height: 7, width: `${risco * 104}%`, background: IM.dor, borderRadius: 9 }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================ selo (adesivo que bate na tela) */

const Selo: React.FC<{ b: Extract<BlocoIm, { tipo: "selo" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const m = mola(f, c.ini, 260, 13);
  const fundo = b.cor === "dor" ? IM.dor : b.cor === "branco" ? IM.branco : IM.lima;
  const texto = b.cor === "dor" ? "#fff" : "#000";
  const posLivre = b.x !== undefined;
  return (
    <div style={{ width: posLivre ? undefined : 1080, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${2.2 - 1.2 * m}) rotate(${b.rot ?? -4}deg)`,
          opacity: Math.min(1, m * 2.5),
          background: fundo,
          color: texto,
          padding: "22px 44px",
          borderRadius: 26,
          fontFamily: FONTE.impacto,
          fontSize: b.tamanho ?? 84,
          lineHeight: 1,
          textTransform: "uppercase",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {b.texto}
        {b.sub && <div style={{ fontFamily: FONTE.ui, fontWeight: 800, fontSize: (b.tamanho ?? 84) * 0.36, marginTop: 10, textTransform: "none" }}>{b.sub}</div>}
      </div>
    </div>
  );
};

/* ============================================================ APK: baixar → instalar → pronto */

const Apk: React.FC<{ b: Extract<BlocoIm, { tipo: "apk" }>; c: Ctx }> = ({ b, c }) => {
  const f0 = useCurrentFrame();
  const v = b.vel ?? 1;
  const f = c.ini + (f0 - c.ini) * v; // relógio interno acelerável
  const t = (n: number) => c.ini + n;
  const m = mola(f, t(0), 150, 16);
  const baixando = prog(f, t(24), 34);
  const fase = f < t(24) ? 0 : f < t(60) ? 1 : f < t(78) ? 2 : f < t(96) ? 3 : 4;
  const giro = (f - t(78)) * 14;
  const pronto = mola(f, t(96), 240, 12);
  const btn = ["Baixar APK", `Baixando ${Math.round(baixando * 100)}%`, "Instalar", "Instalando…", "Abrir"][fase];
  const corBtn = fase === 4 ? IM.lima : fase === 2 || fase === 0 ? IM.lima : IM.card2;
  return (
    <div style={{ width: 1080, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "54px 56px 60px",
          borderRadius: 48,
          background: "rgba(20,23,28,0.95)",
          border: `3px solid ${IM.linha}`,
          transform: `translateY(${(1 - m) * 700}px)`,
          boxShadow: `0 60px 140px rgba(0,0,0,0.75), 0 0 120px ${IM.lima}18`,
          position: "relative",
          fontFamily: FONTE.ui,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div style={{ width: 190, height: 190, borderRadius: 48, background: "#111317", border: `3px solid ${IM.linha}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Halter s={130} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 76, color: IM.branco, letterSpacing: -1 }}>{b.nome}</div>
            {b.sub && <div style={{ fontWeight: 600, fontSize: 36, color: IM.cinza, marginTop: 6 }}>{b.sub}</div>}
            <div style={{ display: "inline-block", fontFamily: FONTE.mono, fontSize: 28, color: IM.lima, background: "#0B0D10", border: `2px solid ${IM.linha}`, borderRadius: 12, padding: "6px 14px", marginTop: 16 }}>
              {b.arquivo}
            </div>
          </div>
        </div>
        {/* barra de progresso */}
        <div style={{ height: 16, borderRadius: 99, background: "#0B0D10", marginTop: 46, overflow: "hidden", opacity: fase >= 1 ? 1 : 0.35 }}>
          <div style={{ height: "100%", width: `${(fase >= 2 ? 1 : baixando) * 100}%`, background: IM.lima, borderRadius: 99, boxShadow: `0 0 20px ${IM.lima}` }} />
        </div>
        <div
          style={{
            marginTop: 40,
            height: 130,
            borderRadius: 30,
            background: corBtn,
            color: fase === 1 || fase === 3 ? IM.branco : "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            fontWeight: 900,
            fontSize: 56,
            transform: `scale(${interpolate(f, [t(22), t(24), t(28), t(74), t(76), t(80)], [1, 0.94, 1, 1, 0.94, 1], clamp)})`,
          }}
        >
          {fase === 0 && <Baixar s={58} cor="#000" />}
          {fase === 3 && <div style={{ width: 48, height: 48, borderRadius: 99, border: "7px solid #444", borderTopColor: IM.lima, transform: `rotate(${giro}deg)` }} />}
          {fase === 4 && <Check s={60} />}
          {btn}
        </div>
        {/* selo "instalado" */}
        <div
          style={{
            position: "absolute",
            right: -30,
            top: -60,
            transform: `scale(${pronto}) rotate(6deg)`,
            background: IM.lima,
            color: "#000",
            fontFamily: FONTE.impacto,
            fontSize: 54,
            padding: "16px 30px",
            borderRadius: 22,
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          INSTALADO!
        </div>
        <Toque f={f} x={450} y={415} chega={t(6)} aperta={t(22)} de={[800, 900]} />
        <Toque f={f} x={450} y={415} chega={t(62)} aperta={t(74)} de={[760, 880]} />
      </div>
    </div>
  );
};

/* ============================================================ seguir (perfil real) + comentário "eu quero" */

const Seguir: React.FC<{ b: Extract<BlocoIm, { tipo: "seguir" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const m = mola(f, c.ini, 150, 16);
  const clique = c.ini + seg(1.1);
  const seguindo = f >= clique + 2;
  const pulso = mola(f, clique + 2, 260, 11);
  const iniCom = clique + seg(1.0);
  const mc = mola(f, iniCom, 150, 16);
  const txt = b.comentario ?? "";
  const letras = Math.floor(interpolate(f, [iniCom + 10, iniCom + 10 + txt.length * 2.2], [0, txt.length], clamp));
  const enviado = iniCom + 14 + txt.length * 2.2;
  const postou = f >= enviado + 4;
  const curtiu = f >= enviado + 22;
  const mp = mola(f, enviado + 4, 200, 15);
  const cur = Math.floor(f / 8) % 2 === 0;
  const Stat = ({ n, r }: { n: string; r: string }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 46, color: IM.branco }}>{n}</div>
      <div style={{ fontSize: 32, color: IM.branco }}>{r}</div>
    </div>
  );
  return (
    <div style={{ width: 1080, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONTE.ui }}>
      <div
        style={{
          width: 940,
          borderRadius: 44,
          background: "#000",
          border: "3px solid #262626",
          padding: "50px 50px 46px",
          transform: `translateY(${(1 - m) * 800}px)`,
          boxShadow: `0 50px 120px rgba(0,0,0,0.8), 0 0 120px ${IM.lima}14`,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          <div style={{ width: 210, height: 210, borderRadius: 999, padding: 7, background: "linear-gradient(45deg,#F9CE34,#EE2A7B,#6228D7)", flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 999, padding: 6, background: "#000" }}>
              <Img src={src(c, b.avatar)} style={{ width: "100%", height: "100%", borderRadius: 999, objectFit: "cover" }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 52, color: IM.branco, marginBottom: 22 }}>{b.usuario}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {b.posts && <Stat n={b.posts} r="posts" />}
              <Stat n={b.seguidores} r="seguidores" />
              {b.seguindo && <Stat n={b.seguindo} r="seguindo" />}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 30, fontWeight: 700, fontSize: 38, color: IM.branco }}>{b.nome}</div>
        {(b.bio ?? []).map((l, i) => (
          <div key={i} style={{ fontSize: 34, color: "#E0E0E0", marginTop: 6 }}>{l}</div>
        ))}
        <div style={{ display: "flex", gap: 18, marginTop: 34 }}>
          <div
            style={{
              flex: 1,
              height: 96,
              borderRadius: 20,
              background: seguindo ? "#262626" : IM.azulIG,
              color: IM.branco,
              fontWeight: 800,
              fontSize: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              transform: `scale(${seguindo ? 1 + 0.08 * (1 - pulso) : interpolate(f, [clique - 3, clique], [1, 0.95], clamp)})`,
            }}
          >
            {seguindo ? "Seguindo" : "Seguir"}
            {seguindo && <Check s={40} cor="#fff" />}
          </div>
          <div style={{ flex: 1, height: 96, borderRadius: 20, background: "#262626", color: IM.branco, fontWeight: 800, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            Mensagem
          </div>
        </div>
        <Toque f={f} x={260} y={b.bio && b.bio.length ? 560 + b.bio.length * 44 : 560} chega={c.ini + 10} aperta={clique} de={[700, 1100]} />
      </div>

      {/* caixa de comentário */}
      <div
        style={{
          width: 940,
          marginTop: 36,
          borderRadius: 40,
          background: "#121212",
          border: "3px solid #262626",
          padding: "34px 40px",
          transform: `translateY(${(1 - mc) * 900}px)`,
          opacity: Math.min(1, mc * 3),
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 34, color: IM.branco, textAlign: "center", marginBottom: 26 }}>Comentários</div>
        {postou && (
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 26, transform: `translateY(${(1 - mp) * 40}px)`, opacity: mp }}>
            <div style={{ width: 76, height: 76, borderRadius: 99, background: "linear-gradient(135deg,#555,#222)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, color: IM.cinza, fontWeight: 600 }}>você · agora</div>
              <div style={{ fontSize: 46, color: IM.branco, fontWeight: 800 }}>{txt}</div>
              {curtiu && <div style={{ fontSize: 26, color: IM.cinza, marginTop: 4 }}>Curtido pelo autor</div>}
            </div>
            <div style={{ transform: `scale(${curtiu ? 1 + 0.4 * (1 - mola(f, enviado + 22, 300, 10)) : 1})` }}>
              <Coracao s={50} cheio={curtiu} />
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 20, height: 100, borderRadius: 99, border: "3px solid #333", padding: "0 18px 0 34px" }}>
          <div style={{ flex: 1, fontSize: 44, fontWeight: 700, color: letras > 0 && !postou ? IM.branco : "#777" }}>
            {postou ? "Adicione um comentário…" : letras > 0 ? txt.slice(0, letras) : "Adicione um comentário…"}
            {!postou && letras > 0 && cur && <span style={{ color: IM.azulIG }}>|</span>}
          </div>
          <div style={{ width: 120, height: 70, borderRadius: 99, background: letras >= txt.length && !postou ? IM.azulIG : "#1E3A55", color: "#fff", fontWeight: 800, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            Enviar
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================ despachante */

export const BlocoImpacto: React.FC<{ b: BlocoIm; c: Ctx }> = ({ b, c }) => {
  switch (b.tipo) {
    case "titulo": return <Titulo b={b} c={c} />;
    case "celular": return <Celular b={b} c={c} />;
    case "numero": return <Numero b={b} c={c} />;
    case "github": return <Github b={b} c={c} />;
    case "lista": return <Lista b={b} c={c} />;
    case "selo": return <Selo b={b} c={c} />;
    case "apk": return <Apk b={b} c={c} />;
    case "seguir": return <Seguir b={b} c={c} />;
  }
};

/** Posição vertical padrão de cada bloco (topo do bloco), quando o roteiro não diz `y`. */
export const Y_PADRAO: Record<BlocoIm["tipo"], number> = {
  titulo: 230,
  celular: 330,
  numero: 560,
  github: 420,
  lista: 420,
  selo: 900,
  apk: 560,
  seguir: 240,
};

/** Efeitos sonoros por bloco: [quadro relativo ao início do bloco, nome, volume]. */
export function sonsDoBloco(b: BlocoIm): [number, string, number][] {
  switch (b.tipo) {
    case "titulo": return [[0, "whoosh", 0.3]];
    case "celular": return [[0, "whoosh", 0.4]];
    case "numero": return [[0, "pop", 0.5]];
    case "github": return [[0, "whoosh", 0.35], [34, "click", 0.6]];
    case "lista": return b.itens.map((_, i) => [4 + i * 9, "pop", 0.45] as [number, string, number]);
    case "selo": return [[0, "carimbo", 0.55]];
    case "apk": {
      const v = b.vel ?? 1;
      return [[0, "whoosh", 0.35], [22 / v, "click", 0.6], [74 / v, "click", 0.6], [96 / v, "pop", 0.7]];
    }
    case "seguir": return [[0, "whoosh", 0.35], [seg(1.1), "click", 0.7], [seg(2.1), "pop", 0.4]];
  }
}
