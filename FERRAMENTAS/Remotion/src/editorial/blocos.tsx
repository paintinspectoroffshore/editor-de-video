import React from "react";
import { Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BORDA, ED, FONTE, SOMBRA, ZONA_A, ZONA_L, cardDuro } from "./tema";
import { FPS, clamp, entradaCard, fmtBR, mola, prog, seg } from "./movimento";

/* ------------------------------------------------------------------ tipos */

type Pos = { x?: number; y?: number; w?: number; rot?: number; em?: number; z?: number };

export type BlocoEd = Pos &
  (
    | { tipo: "tela"; src: string; titulo?: string; h?: number; rolar?: number; sombra?: "tinta" | "vinho"; zoom?: number; x0?: number; y0?: number; inicio?: number; vel?: number; foco?: [number, number]; pb?: boolean }
    | { tipo: "codigo"; titulo?: string; tamanho?: number; sombra?: "tinta" | "vinho"; linhas: { t: string | [string, string?][]; riscar?: boolean; em?: number }[] }
    | { tipo: "carimbo"; texto: string; sub?: string; cor?: "vinho" | "verde" | "tinta"; tamanho?: number }
    | { tipo: "etiqueta"; texto: string; cor?: "tinta" | "vinho" | "verde"; tamanho?: number; icone?: string }
    | { tipo: "numero"; valor: number; casas?: number; prefixo?: string; sufixo?: string; rotulo?: string; tag?: string; cor?: "vinho" | "verde" | "tinta"; tamanho?: number }
    | { tipo: "checklist"; titulo?: string; itens: { texto: string; marcado: boolean; destaque?: string; em?: number }[] }
    | { tipo: "fluxo"; entradas: string[]; centro: string; centroSub?: string; saida: string; tempos?: { centro?: number; entradas?: number[]; saida?: number } }
    | { tipo: "antesdepois"; antes: string[]; botao: string; resultado: string }
    | { tipo: "passos"; itens: { titulo: string; texto: string; em?: number }[] }
    | { tipo: "contador"; porMinuto: number; rotulo: string; fonte?: string }
    | { tipo: "citacao"; linhas: string[]; destaque?: string; assinatura?: string }
    | { tipo: "pessoas"; total?: number; colunas?: number; rotulo?: string }
    | { tipo: "seguir"; nome: string; usuario: string; avatar?: string; bio?: string; comentario?: string }
    | { tipo: "seta"; de: [number, number]; para: [number, number]; curva?: number; cor?: "vinho" | "tinta" }
  );

export type Ctx = {
  ini: number; // frame (relativo à cena) em que o bloco entra
  dur: number; // duração da cena em frames
  inicioCena: number; // frame global em que a cena começa
  base: string; // prefixo de mídia em public/
};

const corDe = (c?: string) => (c === "verde" ? ED.verde : c === "tinta" ? ED.tinta : ED.vinho);

/* ------------------------------------------------------------------ tela (print real em card) */

const Tela: React.FC<{ b: Extract<BlocoEd, { tipo: "tela" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const w = b.w ?? ZONA_L;
  const h = b.h ?? 560;
  const desloc = b.rolar ? interpolate(f, [c.ini + 10, c.dur], [0, -b.rolar], { ...clamp }) : 0;
  return (
    <div style={{ ...entradaCard(f, c.ini, b.rot ?? 0), width: w, ...cardDuro(b.sombra === "vinho" ? ED.vinho : ED.tinta) }}>
      <div style={{ height: 46, background: ED.tinta, display: "flex", alignItems: "center", gap: 9, padding: "0 16px" }}>
        {["#E0443E", "#DEA123", "#1AAB29"].map((cor) => (
          <div key={cor} style={{ width: 13, height: 13, borderRadius: 99, background: cor }} />
        ))}
        {b.titulo && (
          <span style={{ fontFamily: FONTE.mono, fontSize: 20, color: "#EDEDED", marginLeft: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
            {b.titulo}
          </span>
        )}
      </div>
      <div style={{ height: h, overflow: "hidden", position: "relative", background: b.src.endsWith(".mp4") ? "#000" : "#fff" }}>
        {b.src.endsWith(".mp4") ? (
          // vídeo dentro do recorte: treino real, gravação do app etc. (sem som; foco = ponto [x%, y%] que fica visível)
          <OffthreadVideo
            src={staticFile(`${c.base}/${b.src}`)}
            muted
            startFrom={seg(b.inicio ?? 0)}
            playbackRate={b.vel ?? 1}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(b.foco ?? [50, 50])[0]}% ${(b.foco ?? [50, 50])[1]}%`, transform: `scale(${b.zoom ?? 1})`, filter: b.pb ? "grayscale(1) contrast(1.1)" : undefined }}
          />
        ) : (
        <Img
          src={staticFile(`${c.base}/${b.src}`)}
          style={{
            width: `${(b.zoom ?? 1) * 100}%`,
            maxWidth: "none",
            display: "block",
            transform: `translate(${-(b.x0 ?? 0)}px, ${desloc - (b.y0 ?? 0)}px)`,
          }}
        />
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ carimbo */

const Carimbo: React.FC<{ b: Extract<BlocoEd, { tipo: "carimbo" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const m = mola(f, c.ini, 260, 13);
  const cor = corDe(b.cor);
  const s = b.tamanho ?? 64;
  return (
    <div
      style={{
        display: "inline-block",
        opacity: interpolate(m, [0, 0.2], [0, 1], clamp),
        transform: `rotate(${b.rot ?? -8}deg) scale(${interpolate(m, [0, 1], [2.1, 1])})`,
        border: `6px solid ${cor}`,
        outline: `2px solid ${cor}`,
        outlineOffset: 5,
        padding: "8px 26px 10px",
        background: "rgba(241,239,234,0.92)",
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: FONTE.corpo, fontWeight: 900, fontSize: s, color: cor, letterSpacing: "0.02em", lineHeight: 1, textTransform: "uppercase" }}>
        {b.texto}
      </div>
      {b.sub && (
        <div style={{ fontFamily: FONTE.mono, fontWeight: 700, fontSize: s * 0.32, color: cor, marginTop: 6, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {b.sub}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ etiqueta */

const Etiqueta: React.FC<{ b: Extract<BlocoEd, { tipo: "etiqueta" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const s = b.tamanho ?? 44;
  return (
    <div
      style={{
        ...entradaCard(f, c.ini, b.rot ?? 0),
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        background: ED.branco,
        border: `4px solid ${ED.tinta}`,
        boxShadow: `8px 8px 0 ${ED.vinho}`,
        padding: `${s * 0.32}px ${s * 0.6}px`,
      }}
    >
      {b.icone && <Img src={staticFile(`${c.base}/${b.icone}`)} style={{ height: s * 1.1 }} />}
      <span style={{ fontFamily: FONTE.corpo, fontWeight: 900, fontSize: s, color: b.cor ? corDe(b.cor) : ED.tinta, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {b.texto}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ número */

const Numero: React.FC<{ b: Extract<BlocoEd, { tipo: "numero" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const p = prog(f, c.ini, 22);
  const s = b.tamanho ?? 280;
  return (
    <div style={{ opacity: prog(f, c.ini, 6) }}>
      <div style={{ fontFamily: FONTE.manchete, fontWeight: 700, fontSize: s, lineHeight: 0.9, color: corDe(b.cor), letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
        {b.prefixo ?? ""}
        {fmtBR(b.valor * p, b.casas ?? 0)}
        {b.sufixo ?? ""}
      </div>
      {(b.tag || b.rotulo) && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, opacity: prog(f, c.ini + 10, 10) }}>
          {b.tag && (
            <span style={{ background: ED.tinta, color: ED.papel, fontFamily: FONTE.corpo, fontWeight: 900, fontSize: 28, padding: "4px 12px", textTransform: "uppercase" }}>
              {b.tag}
            </span>
          )}
          {b.rotulo && (
            <span style={{ fontFamily: FONTE.mono, fontWeight: 500, fontSize: 28, color: ED.tinta, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {b.rotulo}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ checklist */

const Check: React.FC<{ marcado: boolean; ini: number }> = ({ marcado, ini }) => {
  const f = useCurrentFrame();
  const d = prog(f, ini, 8);
  return (
    <div style={{ width: 62, height: 62, border: `5px solid ${ED.tinta}`, flexShrink: 0, background: ED.branco, position: "relative" }}>
      {marcado && (
        <svg viewBox="0 0 62 62" style={{ position: "absolute", inset: -5, width: 62, height: 62 }}>
          <path d="M14 33 L26 45 L50 16" fill="none" stroke={ED.vinho} strokeWidth={7} strokeLinecap="square" strokeDasharray={60} strokeDashoffset={60 * (1 - d)} />
        </svg>
      )}
    </div>
  );
};

const Checklist: React.FC<{ b: Extract<BlocoEd, { tipo: "checklist" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...entradaCard(f, c.ini, b.rot ?? 0), ...cardDuro(), width: b.w ?? ZONA_L, padding: "34px 36px", display: "flex", flexDirection: "column", gap: 30 }}>
      {b.titulo && (
        <div style={{ fontFamily: FONTE.mono, fontSize: 24, color: ED.cinza, letterSpacing: "0.12em", textTransform: "uppercase" }}>{b.titulo}</div>
      )}
      {b.itens.map((it, i) => {
        const ini = it.em !== undefined ? seg(it.em) : c.ini + 8 + i * 12;
        const partes = it.destaque ? it.texto.split(new RegExp(`(${it.destaque})`, "i")) : [it.texto];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, opacity: prog(f, ini - 4, 6), transform: `translateX(${(1 - prog(f, ini - 4, 8)) * -20}px)` }}>
            <Check marcado={it.marcado} ini={ini} />
            <span style={{ fontFamily: FONTE.manchete, fontWeight: 600, fontSize: 68, lineHeight: 1, textTransform: "uppercase", color: ED.tinta }}>
              {partes.map((p, k) => (
                <span key={k} style={{ color: it.destaque && p.toLowerCase() === it.destaque.toLowerCase() ? ED.vinho : undefined }}>
                  {p}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ fluxo (várias entradas → chip central → saída) */

const Seta: React.FC<{ d: string; ini: number; cor?: string; largura?: number }> = ({ d, ini, cor = ED.tinta, largura = 5 }) => {
  const f = useCurrentFrame();
  const p = prog(f, ini, 12);
  return (
    <path d={d} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} markerEnd={p > 0.9 ? "url(#ponta)" : undefined} />
  );
};

const Chip: React.FC<{ texto: string; sub?: string; ini: number }> = ({ texto, sub, ini }) => {
  const f = useCurrentFrame();
  const m = mola(f, ini, 200, 14);
  const pinos = [0, 1, 2, 3, 4];
  return (
    <div style={{ position: "relative", width: 300, height: 300, transform: `scale(${interpolate(m, [0, 1], [0.6, 1])})`, opacity: interpolate(m, [0, 0.3], [0, 1], clamp) }}>
      {pinos.map((i) => (
        <React.Fragment key={i}>
          <div style={{ position: "absolute", left: 50 + i * 50, top: -26, width: 10, height: 26, background: ED.tinta }} />
          <div style={{ position: "absolute", left: 50 + i * 50, bottom: -26, width: 10, height: 26, background: ED.tinta }} />
          <div style={{ position: "absolute", top: 50 + i * 50, left: -26, width: 26, height: 10, background: ED.tinta }} />
          <div style={{ position: "absolute", top: 50 + i * 50, right: -26, width: 26, height: 10, background: ED.tinta }} />
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", inset: 0, background: ED.tinta, display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
        <div style={{ width: "100%", height: "100%", border: `4px solid ${ED.verde}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontFamily: FONTE.manchete, fontWeight: 700, fontSize: 92, color: ED.papel, lineHeight: 1 }}>{texto}</span>
          {sub && <span style={{ fontFamily: FONTE.mono, fontSize: 20, color: ED.cinzaClaro, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>{sub}</span>}
        </div>
      </div>
    </div>
  );
};

const Fluxo: React.FC<{ b: Extract<BlocoEd, { tipo: "fluxo" }>; c: Ctx }> = ({ b, c }) => {
  const W = ZONA_L;
  const n = b.entradas.length;
  const yEnt = 40;
  const yChip = 330;
  const ySai = 880;
  const xs = b.entradas.map((_, i) => (W / (n + 1)) * (i + 1));
  // tempos explícitos (s, relativos à cena) ou cascata padrão a partir de c.ini
  const tEnt = b.entradas.map((_, i) => (b.tempos?.entradas?.[i] !== undefined ? seg(b.tempos.entradas[i]) : c.ini + i * 4));
  const tCentro = b.tempos?.centro !== undefined ? seg(b.tempos.centro) : c.ini + 22;
  const tSaida = b.tempos?.saida !== undefined ? seg(b.tempos.saida) : c.ini + 42;
  return (
    <div style={{ position: "relative", width: W, height: ZONA_A - 20 }}>
      <svg width={W} height={ZONA_A} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <marker id="ponta" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill={ED.tinta} />
          </marker>
        </defs>
        {xs.map((x, i) => (
          <Seta key={i} d={`M ${x} ${yEnt + 80} C ${x} ${yChip - 60}, ${W / 2} ${yChip - 120}, ${W / 2 + (x - W / 2) * 0.25} ${yChip - 40}`} ini={Math.max(tEnt[i], tCentro) + 6} />
        ))}
        <Seta d={`M ${W / 2} ${yChip + 400} L ${W / 2} ${ySai - 30}`} ini={tSaida - 8} cor={ED.vinho} largura={7} />
      </svg>
      {b.entradas.map((e, i) => (
        <div key={i} style={{ position: "absolute", top: yEnt, left: xs[i], transform: "translateX(-50%)" }}>
          <Etiqueta b={{ tipo: "etiqueta", texto: e, tamanho: 40, rot: i % 2 ? 2 : -2 }} c={{ ...c, ini: tEnt[i] }} />
        </div>
      ))}
      <div style={{ position: "absolute", top: yChip, left: W / 2 - 150, transform: "scale(1.25)", transformOrigin: "50% 0%" }}>
        <Chip texto={b.centro} sub={b.centroSub} ini={tCentro} />
      </div>
      <div style={{ position: "absolute", top: ySai, left: W / 2, transform: "translateX(-50%)" }}>
        <Etiqueta b={{ tipo: "etiqueta", texto: b.saida, tamanho: 52, cor: "vinho" }} c={{ ...c, ini: tSaida }} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ cursor */

const Cursor: React.FC<{ x: number; y: number; clicando: number }> = ({ x, y, clicando }) => (
  <svg width={54} height={60} viewBox="0 0 24 26" style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - clicando * 0.15})`, filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.25))", zIndex: 10 }}>
    <path d="M2 1 L2 20 L7 15.5 L10.5 23.5 L14 22 L10.5 14 L17.5 14 Z" fill={ED.branco} stroke={ED.tinta} strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------------------ antes → depois */

const AntesDepois: React.FC<{ b: Extract<BlocoEd, { tipo: "antesdepois" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const W = ZONA_L;
  const iniDepois = c.ini + 16;
  const clique = iniDepois + 30;
  const cx = interpolate(f, [iniDepois + 8, clique], [W - 60, W / 2 + 40], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const cy = interpolate(f, [iniDepois + 8, clique], [1000, 600], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const pressao = interpolate(f, [clique, clique + 3, clique + 7], [0, 1, 0], clamp);
  const feito = f >= clique + 4;
  return (
    <div style={{ position: "relative", width: W, height: ZONA_A - 20 }}>
      {/* ANTES */}
      <div style={{ position: "absolute", top: 0, left: 0, width: W * 0.86, ...entradaCard(f, c.ini, -2) }}>
        <div style={{ fontFamily: FONTE.mono, fontWeight: 700, fontSize: 24, color: ED.vinho, letterSpacing: "0.14em", marginBottom: 10 }}>ANTES</div>
        <div style={{ background: "#121212", border: `${BORDA}px solid ${ED.tinta}`, boxShadow: `${SOMBRA}px ${SOMBRA}px 0 ${ED.vinho}`, padding: "24px 26px" }}>
          {b.antes.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTE.mono, fontSize: 25, lineHeight: 1.55, color: l.startsWith("$") ? "#F2B8B5" : "#9C9C9C", whiteSpace: "nowrap", overflow: "hidden", opacity: prog(f, c.ini + 4 + i * 3, 5) }}>
              {l}
            </div>
          ))}
        </div>
      </div>
      {/* DEPOIS */}
      <div style={{ position: "absolute", top: 480, right: 0, width: W * 0.78, ...entradaCard(f, iniDepois, 1.5) }}>
        <div style={{ fontFamily: FONTE.mono, fontWeight: 700, fontSize: 24, color: ED.verde, letterSpacing: "0.14em", marginBottom: 10 }}>DEPOIS</div>
        <div style={{ ...cardDuro(ED.verde), padding: "40px 34px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: "100%",
              background: feito ? ED.verde : ED.tinta,
              color: ED.papel,
              fontFamily: FONTE.manchete,
              fontWeight: 700,
              fontSize: 70,
              textAlign: "center",
              padding: "18px 0",
              textTransform: "uppercase",
              transform: `scale(${1 - pressao * 0.05})`,
            }}
          >
            {feito ? `${b.resultado} ✓` : b.botao}
          </div>
          <div style={{ fontFamily: FONTE.mono, fontSize: 22, color: ED.cinza, letterSpacing: "0.08em" }}>SEM TERMINAL · SEM CÓDIGO</div>
        </div>
      </div>
      {f >= iniDepois + 8 && <Cursor x={cx} y={cy} clicando={pressao} />}
    </div>
  );
};

/* ------------------------------------------------------------------ passos */

const Passos: React.FC<{ b: Extract<BlocoEd, { tipo: "passos" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34, width: b.w ?? ZONA_L }}>
      {b.itens.map((it, i) => {
        const ini = it.em !== undefined ? seg(it.em) : c.ini + i * 10;
        return (
          <div key={i} style={{ ...entradaCard(f, ini, i % 2 ? 1 : -1), ...cardDuro(i === b.itens.length - 1 ? ED.vinho : ED.tinta), display: "flex", alignItems: "center", gap: 30, padding: "26px 30px" }}>
            <div style={{ width: 136, height: 136, background: ED.vinho, color: ED.papel, fontFamily: FONTE.manchete, fontWeight: 700, fontSize: 90, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div>
              <div style={{ fontFamily: FONTE.manchete, fontWeight: 700, fontSize: 76, lineHeight: 1, textTransform: "uppercase", color: ED.tinta }}>{it.titulo}</div>
              <div style={{ fontFamily: FONTE.mono, fontSize: 28, color: ED.cinza, marginTop: 10 }}>{it.texto}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ contador ao vivo */

const Contador: React.FC<{ b: Extract<BlocoEd, { tipo: "contador" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const globalSeg = (c.inicioCena + f) / FPS;
  const n = Math.floor((globalSeg * b.porMinuto) / 60);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40, width: ZONA_L }}>
      <Numero b={{ tipo: "numero", valor: b.porMinuto, sufixo: "", tamanho: 300, rotulo: "novos projetos por minuto", tag: "+" }} c={c} />
      <div style={{ ...entradaCard(f, c.ini + 14, -1), ...cardDuro(ED.vinho), padding: "28px 32px" }}>
        <div style={{ fontFamily: FONTE.mono, fontSize: 24, color: ED.cinza, letterSpacing: "0.06em", textTransform: "uppercase" }}>{b.rotulo}</div>
        <div style={{ fontFamily: FONTE.manchete, fontWeight: 700, fontSize: 150, color: ED.tinta, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
          {fmtBR(n)}
        </div>
        {b.fonte && <div style={{ fontFamily: FONTE.mono, fontSize: 19, color: ED.cinzaClaro, marginTop: 6 }}>fonte: {b.fonte}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ citação */

const Citacao: React.FC<{ b: Extract<BlocoEd, { tipo: "citacao" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ ...entradaCard(f, c.ini, b.rot ?? -1.5), ...cardDuro(ED.vinho), width: b.w ?? ZONA_L, padding: "50px 46px" }}>
      {b.linhas.map((l, i) => {
        const p = prog(f, c.ini + 6 + i * 10, 10);
        const partes = b.destaque ? l.split(new RegExp(`(${b.destaque})`, "i")) : [l];
        return (
          <div key={i} style={{ fontFamily: FONTE.manchete, fontWeight: 700, fontSize: 128, lineHeight: 1.04, textTransform: "uppercase", color: ED.tinta, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
            {partes.map((s, k) => (
              <span key={k} style={{ color: b.destaque && s.toLowerCase() === b.destaque.toLowerCase() ? ED.vinho : undefined }}>{s}</span>
            ))}
          </div>
        );
      })}
      {b.assinatura && <div style={{ fontFamily: FONTE.mono, fontSize: 24, color: ED.cinza, marginTop: 24, letterSpacing: "0.1em" }}>{b.assinatura}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ pessoas (grade que acende) */

const Pessoa: React.FC<{ cor: string; s: number }> = ({ cor, s }) => (
  <svg width={s} height={s} viewBox="0 0 20 20">
    <circle cx={10} cy={6} r={4} fill={cor} />
    <path d="M3 19 C3 12.5 17 12.5 17 19 Z" fill={cor} />
  </svg>
);

const Pessoas: React.FC<{ b: Extract<BlocoEd, { tipo: "pessoas" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const total = b.total ?? 120;
  const col = b.colunas ?? 10;
  const s = Math.floor((ZONA_L - (col - 1) * 14) / col);
  const acesas = Math.floor(interpolate(f, [c.ini + 6, c.ini + 6 + seg(1.8)], [0, total], clamp));
  return (
    <div style={{ width: ZONA_L }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${col}, ${s}px)`, gap: 14 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ opacity: prog(f, c.ini + Math.floor(i / col), 4) }}>
            <Pessoa cor={i < acesas ? ED.vinho : "#CFCAC0"} s={s} />
          </div>
        ))}
      </div>
      {b.rotulo && (
        <div style={{ marginTop: 26, fontFamily: FONTE.mono, fontWeight: 700, fontSize: 28, letterSpacing: "0.1em", color: ED.tinta, textTransform: "uppercase", opacity: prog(f, c.ini + 20, 8) }}>
          {b.rotulo}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ seguir (CTA) */

const Seguir: React.FC<{ b: Extract<BlocoEd, { tipo: "seguir" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const W = ZONA_L;
  const clique = c.ini + seg(1.3);
  const cx = interpolate(f, [c.ini + 8, clique], [W + 40, W - 250], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const cy = interpolate(f, [c.ini + 8, clique], [820, 445], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const pressao = interpolate(f, [clique, clique + 3, clique + 7], [0, 1, 0], clamp);
  const seguindo = f >= clique + 4;
  const coracao = mola(f, clique + 4, 220, 12);
  const iniComent = clique + seg(1.5);
  const txt = b.comentario ?? "";
  const letras = Math.floor(interpolate(f, [iniComent, iniComent + txt.length * 1.4], [0, txt.length], clamp));
  return (
    <div style={{ position: "relative", width: W, height: ZONA_A - 20 }}>
      <div style={{ ...entradaCard(f, c.ini, -1.5), ...cardDuro(ED.vinho), padding: "38px 36px", position: "absolute", top: 40, left: 0, right: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 180, height: 180, borderRadius: 999, padding: 7, background: "conic-gradient(#F58529, #DD2A7B, #8134AF, #515BD4, #F58529)", flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "#0E1410", border: `5px solid ${ED.branco}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {b.avatar ? (
                <Img src={staticFile(`${c.base}/${b.avatar}`)} style={{ width: "88%" }} />
              ) : (
                <span style={{ fontFamily: FONTE.manchete, color: ED.papel, fontSize: 48 }}>{b.nome.slice(0, 2)}</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONTE.corpo, fontWeight: 800, fontSize: 58, color: ED.tinta }}>{b.nome}</div>
            <div style={{ fontFamily: FONTE.mono, fontSize: 30, color: ED.cinza }}>{b.usuario}</div>
          </div>
        </div>
        {b.bio && <div style={{ fontFamily: FONTE.corpo, fontWeight: 600, fontSize: 36, color: ED.tinta, marginTop: 26, lineHeight: 1.3 }}>{b.bio}</div>}
        <div
          style={{
            marginTop: 30,
            height: 104,
            borderRadius: 14,
            background: seguindo ? "#EFEFEF" : "#0095F6",
            color: seguindo ? ED.tinta : ED.branco,
            fontFamily: FONTE.corpo,
            fontWeight: 800,
            fontSize: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${1 - pressao * 0.04})`,
          }}
        >
          {seguindo ? "Seguindo ✓" : "Seguir"}
        </div>
      </div>
      {seguindo && (
        <div style={{ position: "absolute", top: 260, right: 60, fontSize: 130, color: "#ED4956", transform: `scale(${coracao}) translateY(${(1 - coracao) * 40}px)`, opacity: interpolate(f, [clique + 4, clique + 30, clique + 40], [1, 1, 0], clamp) }}>
          ♥
        </div>
      )}
      {txt && f >= iniComent - 6 && (
        <div style={{ position: "absolute", top: 700, left: 0, right: 0, ...entradaCard(f, iniComent - 6, 1) }}>
          <div style={{ fontFamily: FONTE.mono, fontWeight: 700, fontSize: 24, color: ED.vinho, letterSpacing: "0.14em", marginBottom: 10 }}>COMENTA AQUI</div>
          <div style={{ ...cardDuro(), padding: "30px 34px", fontFamily: FONTE.corpo, fontWeight: 700, fontSize: 48, color: ED.tinta, minHeight: 60 }}>
            {txt.slice(0, letras)}
            <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0, color: ED.vinho }}>|</span>
          </div>
        </div>
      )}
      {f >= c.ini + 8 && <Cursor x={cx} y={cy} clicando={pressao} />}
    </div>
  );
};

/* ------------------------------------------------------------------ seta solta (desenhada) */

const SetaSolta: React.FC<{ b: Extract<BlocoEd, { tipo: "seta" }>; c: Ctx }> = ({ b, c }) => {
  const [x1, y1] = b.de;
  const [x2, y2] = b.para;
  const k = b.curva ?? 80;
  const mx = (x1 + x2) / 2 + k;
  const my = (y1 + y2) / 2;
  const cor = b.cor === "tinta" ? ED.tinta : ED.vinho;
  return (
    <svg width={ZONA_L} height={ZONA_A} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <defs>
        <marker id={`p${x1}${y1}`} markerWidth="7" markerHeight="7" refX="4" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill={cor} />
        </marker>
      </defs>
      <SetaComMarcador d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} ini={c.ini} cor={cor} marker={`url(#p${x1}${y1})`} />
    </svg>
  );
};

const SetaComMarcador: React.FC<{ d: string; ini: number; cor: string; marker: string }> = ({ d, ini, cor, marker }) => {
  const f = useCurrentFrame();
  const p = prog(f, ini, 12);
  return <path d={d} fill="none" stroke={cor} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} markerEnd={p > 0.92 ? marker : undefined} />;
};


/* ------------------------------------------------------------------ código / planilha (card com linhas coloridas) */

const COR_COD: Record<string, string> = { vinho: ED.vinho, verde: ED.verde, amarelo: "#A87A12", cinza: ED.cinzaClaro, tinta: ED.tinta };

const Codigo: React.FC<{ b: Extract<BlocoEd, { tipo: "codigo" }>; c: Ctx }> = ({ b, c }) => {
  const f = useCurrentFrame();
  const t = b.tamanho ?? 50;
  return (
    <div style={{ ...entradaCard(f, c.ini, b.rot ?? 0), width: b.w ?? ZONA_L, ...cardDuro(b.sombra === "tinta" ? ED.tinta : ED.vinho), background: ED.branco, padding: "40px 44px" }}>
      {b.titulo && <div style={{ fontFamily: FONTE.mono, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: "#A87A12", textTransform: "uppercase", marginBottom: 18 }}>{b.titulo}</div>}
      {b.linhas.map((l, i) => {
        const ini = l.em !== undefined ? seg(l.em) : c.ini + 6 + i * 7;
        const p = prog(f, ini, 9);
        const risco = l.riscar ? prog(f, ini + 10, 10) : 0;
        const partes: [string, string?][] = typeof l.t === "string" ? [[l.t]] : l.t;
        return (
          <div key={i} style={{ position: "relative", fontFamily: FONTE.mono, fontWeight: 700, fontSize: t, lineHeight: 1.55, whiteSpace: "pre", clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, opacity: l.riscar ? 1 - 0.55 * risco : 1 }}>
            {partes.map(([txt, cor], k) => (
              <span key={k} style={{ color: COR_COD[cor ?? "tinta"] ?? cor }}>{txt}</span>
            ))}
            {l.riscar && <div style={{ position: "absolute", left: 0, top: "52%", height: 5, width: `${risco * 100}%`, background: ED.tinta }} />}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ roteador */

export const BlocoEditorial: React.FC<{ b: BlocoEd; c: Ctx }> = ({ b, c }) => {
  switch (b.tipo) {
    case "tela": return <Tela b={b} c={c} />;
    case "codigo": return <Codigo b={b} c={c} />;
    case "carimbo": return <Carimbo b={b} c={c} />;
    case "etiqueta": return <Etiqueta b={b} c={c} />;
    case "numero": return <Numero b={b} c={c} />;
    case "checklist": return <Checklist b={b} c={c} />;
    case "fluxo": return <Fluxo b={b} c={c} />;
    case "antesdepois": return <AntesDepois b={b} c={c} />;
    case "passos": return <Passos b={b} c={c} />;
    case "contador": return <Contador b={b} c={c} />;
    case "citacao": return <Citacao b={b} c={c} />;
    case "pessoas": return <Pessoas b={b} c={c} />;
    case "seguir": return <Seguir b={b} c={c} />;
    case "seta": return <SetaSolta b={b} c={c} />;
  }
};

/** Que efeito sonoro acompanha cada tipo de bloco ao entrar. */
export const SFX_DO_BLOCO: Partial<Record<BlocoEd["tipo"], string>> = {
  tela: "whoosh",
  carimbo: "carimbo",
  etiqueta: "pop",
  numero: "tick",
  citacao: "whoosh",
  passos: "pop",
  fluxo: "pop",
  antesdepois: "whoosh",
  seguir: "whoosh",
  checklist: "pop",
  codigo: "pop",
};
