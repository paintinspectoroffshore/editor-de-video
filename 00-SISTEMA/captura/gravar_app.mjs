// Grava VÍDEOS reais de uso de um web app (tela de celular) — ex.: demo do openGym em pt-BR.
// uso: node gravar_app.mjs <plano.json> <pasta-saida>
// plano.json: { "url": "...", "preparar": "js opcional rodado antes do reload (ex.: trocar idioma)",
//   "clipes": [ { "nome": "inicio", "passos": [ ["clicar","Início"], ["esperar",800], ["rolar",1400,3000], ["clicar","Começar"] ] } ] }
// Cada clipe vira <nome>.mp4 (1170x2532 @30fps). Usa o screencast do Chrome: grava só o que muda, sem custo extra.
import puppeteer from "puppeteer-core";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CH = resolve(AQUI, "../../FERRAMENTAS/Remotion/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe");
const [, , planoArq, OUT] = process.argv;
const plano = JSON.parse(readFileSync(planoArq, "utf-8"));
mkdirSync(OUT, { recursive: true });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CH, headless: true, args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: plano.tema ?? "dark" }]);
await p.goto(plano.url, { waitUntil: "networkidle2", timeout: 60000 });
await espera(1500);
if (plano.preparar) {
  await p.evaluate(plano.preparar);
  await p.reload({ waitUntil: "networkidle2" });
  await espera(2500);
}

const clicar = (txt) =>
  p.evaluate((t) => {
    const el = [...document.querySelectorAll("button, a, [role=button]")].find((e) => (e.innerText || e.getAttribute("aria-label") || "").trim().startsWith(t));
    if (el) { el.click(); return true; }
    return false;
  }, txt);

const rolar = (ate, ms) =>
  p.evaluate(
    (ate, ms) =>
      new Promise((ok) => {
        const de = window.scrollY, t0 = performance.now();
        const passo = (agora) => {
          const k = Math.min(1, (agora - t0) / ms);
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          window.scrollTo(0, de + (ate - de) * e);
          k < 1 ? requestAnimationFrame(passo) : ok();
        };
        requestAnimationFrame(passo);
      }),
    ate,
    ms,
  );

const cdp = await p.createCDPSession();
for (const clip of plano.clipes) {
  for (const [acao, ...a] of clip.antes ?? []) {
    if (acao === "clicar") await clicar(a[0]);
    if (acao === "topo") await p.evaluate(() => window.scrollTo(0, 0));
    await espera(1200);
  }
  const quadros = [];
  const pasta = join(OUT, `_q_${clip.nome}`);
  mkdirSync(pasta, { recursive: true });
  const recebe = async (ev) => {
    quadros.push({ t: ev.metadata.timestamp, d: ev.data });
    await cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(() => {});
  };
  cdp.on("Page.screencastFrame", recebe);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1170, maxHeight: 2532, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  await espera(300);
  for (const [acao, ...a] of clip.passos) {
    if (acao === "clicar") { if (!(await clicar(a[0]))) console.log(`  [${clip.nome}] não achei: ${a[0]}`); await espera(a[1] ?? 900); }
    if (acao === "esperar") await espera(a[0]);
    if (acao === "rolar") await rolar(a[0], a[1] ?? 2500);
    if (acao === "topo") await p.evaluate(() => window.scrollTo(0, 0));
  }
  await espera(400);
  await cdp.send("Page.stopScreencast");
  cdp.off("Page.screencastFrame", recebe);
  const t1 = Date.now() / 1000;
  if (!quadros.length) { console.log(`  [${clip.nome}] sem quadros`); continue; }
  // concat do ffmpeg com a duração real de cada quadro -> 30 fps constantes
  let lista = "";
  quadros.forEach((q, i) => {
    const arq = `q${String(i).padStart(5, "0")}.jpg`;
    writeFileSync(join(pasta, arq), Buffer.from(q.d, "base64"));
    const prox = quadros[i + 1] ? quadros[i + 1].t : Math.max(q.t + 0.05, t1 - t0 + quadros[0].t);
    lista += `file '${arq}'\nduration ${Math.max(0.001, prox - q.t).toFixed(4)}\n`;
  });
  lista += `file 'q${String(quadros.length - 1).padStart(5, "0")}.jpg'\n`;
  writeFileSync(join(pasta, "lista.txt"), lista);
  const saida = resolve(OUT, `${clip.nome}.mp4`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "lista.txt", "-vf", "fps=30,scale=1170:-2,format=yuv420p",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-g", "15", saida], { cwd: pasta });
  rmSync(pasta, { recursive: true, force: true });
  console.log(`${clip.nome}.mp4: ${quadros.length} quadros, ${(t1 - t0).toFixed(1)} s`);
}
await b.close();
