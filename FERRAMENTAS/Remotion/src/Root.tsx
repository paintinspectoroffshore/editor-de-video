import React from "react";
import { Composition } from "remotion";
import "./fontes";
import { FORMATO } from "./dna";
import { Video, calcularMetadados, Roteiro } from "./Video";
import { VideoEditorial, calcularMetadadosEd, RoteiroEd } from "./editorial/VideoEditorial";
import { VideoImpacto, calcularMetadadosIm, RoteiroIm } from "./impacto/VideoImpacto";
import { VideoDossie, calcularMetadadosDo, RoteiroDo } from "./dossie/VideoDossie";
import { VideoCronica, calcularMetadadosCr, RoteiroCr } from "./cronica/VideoCronica";
import { VideoLeonida, calcularMetadadosLe, RoteiroLe } from "./leonida/VideoLeonida";
import { VideoTrajeto, calcularMetadadosTr } from "./trajeto/VideoTrajeto";
import { VideoGtaReal, calcularMetadadosGr, RoteiroGr } from "./gtareal/VideoGtaReal";
import { VideoTraco, calcularMetadadosTraco, RoteiroTr } from "./traco/VideoTraco";
import { VideoSplitTH, calcularMetadadosSplitTH, RoteiroS } from "./splitth/VideoSplitTH";
import { Carrossel, calcularMetadadosCar, RoteiroCarrossel } from "./carrossel/Carrossel";
import demo from "./demo.json";

const demoCar: RoteiroCarrossel = { base: "", slides: [{ tipo: "capa", titulo: "estilo carrossel" }] };

const demoIm: RoteiroIm = { base: "", cenas: [{ duracao: 2, blocos: [{ tipo: "selo", texto: "estilo impacto" }] }] };

const demoDo: RoteiroDo = { base: "", cenas: [{ duracao: 2, blocos: [{ tipo: "manchete", linhas: ["estilo dossiê"] }] }] };

const demoCr: RoteiroCr = { base: "", cenas: [{ duracao: 2, blocos: [{ tipo: "manchete", kicker: "arquivo", linhas: ["estilo crônica"] }] }] };

const demoLe: RoteiroLe = { base: "", cenas: [{ duracao: 2, capitulo: "A · MAPA", blocos: [{ tipo: "titulo", kicker: "Vice City", linhas: ["estilo leonida"] }] }] };

const demoTr: RoteiroGr = { base: "", cenas: [{ duracao: 2, fundo: { videos: [] }, fonte: "exemplo", blocos: [{ tipo: "rotulo", linhas: ["estilo trajeto"], acento: ["trajeto"] }] }] };
const demoGr: RoteiroGr = { base: "", cenas: [{ duracao: 2, fundo: { videos: [] }, fonte: "exemplo", blocos: [{ tipo: "rotulo", linhas: ["estilo gta real"], acento: ["real"] }] }] };

const demoTraco: RoteiroTr = { base: "", cenas: [{ duracao: 2, blocos: [{ tipo: "rotulo", texto: "estilo traço" }] }] };

const demoSp: RoteiroS = { base: "", cenas: [{ duracao: 2, rotulo: "// 01 · split th", status: "DEMO", blocos: [{ tipo: "titulo", linhas: ["estilo split"], acento: ["split"] }] }] };

const demoEd: RoteiroEd = { base: "", cenas: [{ duracao: 2, blocos: [{ tipo: "etiqueta", texto: "estilo editorial" }] }] };

export const RemotionRoot: React.FC = () => (
  <>
    {/* Estilo Dark Tech  */}
    <Composition
      id="Reel"
      component={Video}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={300}
      defaultProps={demo as unknown as Roteiro}
      calculateMetadata={calcularMetadados}
    />
    {/* Estilo Editorial (ref07: papel, vinho, sombra dura) */}
    <Composition
      id="Editorial"
      component={VideoEditorial}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoEd}
      calculateMetadata={calcularMetadadosEd}
    />
    {/* Estilo Impacto (escuro + B-roll real + legenda cinética + cor do produto) */}
    <Composition
      id="Impacto"
      component={VideoImpacto}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoIm}
      calculateMetadata={calcularMetadadosIm}
    />
    {/* Estilo Dossiê (refs 05/07: investigação escura, número + fonte, ficha creme) */}
    <Composition
      id="Dossie"
      component={VideoDossie}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoDo}
      calculateMetadata={calcularMetadadosDo}
    />
    {/* Estilo Crônica (documentário de arquivo vivo: mesa, recortes, gráficos que se desenham, película) */}
    <Composition
      id="Cronica"
      component={VideoCronica}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoCr}
      calculateMetadata={calcularMetadadosCr}
    />
    {/* Estilo Leonida (vibe GTA VI: pôr do sol de Vice City, neon, HUD, clipes com soco + flash) */}
    <Composition
      id="Leonida"
      component={VideoLeonida}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoLe}
      calculateMetadata={calcularMetadadosLe}
    />
    {/* Estilo GTA Real (vídeo do jogo exposto, cores originais, informação leve no topo, fonte no canto) */}
    <Composition
      id="GtaReal"
      component={VideoGtaReal}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoGr}
      calculateMetadata={calcularMetadadosGr}
    />
    {/* Estilo Trajeto (prancheta creme-pessego, linha vertical continua, videos em janelinhas) */}
    <Composition
      id="Trajeto"
      component={VideoTrajeto}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoTr}
      calculateMetadata={calcularMetadadosTr}
    />
    {/* Estilo Traço (esboço técnico: traço preto fino no branco-gelo, celulares flutuando, trajetos pontilhados, acento degradê do app) */}
    <Composition
      id="Traco"
      component={VideoTraco}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoTraco}
      calculateMetadata={calcularMetadadosTraco}
    />
    {/* Estilo SplitTH (ref. 54): painel de papel milimetrado em cima (40%) + gravação do rosto embaixo, legenda na emenda */}
    <Composition
      id="SplitTH"
      component={VideoSplitTH}
      width={FORMATO.largura}
      height={FORMATO.altura}
      fps={FORMATO.fps}
      durationInFrames={60}
      defaultProps={demoSp}
      calculateMetadata={calcularMetadadosSplitTH}
    />
    {/* Carrossel do Instagram 4:5 — cada frame é um slide (renderizado como JPEG) */}
    <Composition
      id="Carrossel"
      component={Carrossel}
      width={1080}
      height={1350}
      fps={1}
      durationInFrames={1}
      defaultProps={demoCar}
      calculateMetadata={calcularMetadadosCar}
    />
  </>
);
