// Captura as telas do demo do openGym em pt-BR (tema escuro, iPhone 1170x2532).
// uso: node opengym_demo.mjs <pasta-saida>
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const AQUI = dirname(fileURLToPath(import.meta.url));
const CH = resolve(AQUI, "../../FERRAMENTAS/Remotion/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe");
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CH, headless: true, args: ["--hide-scrollbars"] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await p.goto("https://opengym.ch/demo/", { waitUntil: "networkidle2", timeout: 60000 });
await espera(1500);
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("gym_state_v1"));
  s.lang = "pt-BR"; s.langAuto = false;
  localStorage.setItem("gym_state_v1", JSON.stringify(s));
});
await p.reload({ waitUntil: "networkidle2" });
await espera(2500);
const clicar = async (txt) => {
  const ok = await p.evaluate((t) => {
    const el = [...document.querySelectorAll("button, a, [role=button]")].find((e) => (e.innerText || e.getAttribute("aria-label") || "").trim().startsWith(t));
    if (el) { el.click(); return true; } return false;
  }, txt);
  await espera(2000);
  return ok;
};
const foto = async (nome) => {
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: `${OUT}/${nome}.png` });
  await p.screenshot({ path: `${OUT}/${nome}_longa.png`, fullPage: true });
  textos[nome] = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 400);
};
const textos = {};
// [nome, cliques em sequência]
const roteiro = [
  ["inicio", ["Início"]],
  ["plano", ["Plano"]],
  ["exercicios", ["Exercícios"]],
  ["estatisticas", ["Estatísticas"]],
  ["comecar", ["Começar"]],
  ["checkin", ["Começar Pull Day"]],
  ["treino", ["Iniciar sem se pesar"]],
];
for (const [nome, cliques] of roteiro) {
  for (const c of cliques) if (!(await clicar(c))) console.log("não achei:", c);
  await foto(nome);
}
writeFileSync(`${OUT}/textos.json`, JSON.stringify(textos, null, 1));
for (const [k, v] of Object.entries(textos)) console.log(k, ":", v.slice(0, 200));
await b.close();
