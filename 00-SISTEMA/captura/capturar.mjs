/**
 * Captura telas reais de sites em alta resolução para usar nos vídeos.
 *
 *   node capturar.mjs <plano.json> <pasta-saida>
 *
 * plano.json: [{ "nome": "n8n", "url": "...", "largura": 1200, "altura": 900,
 *               "rolarAte": "texto ou seletor CSS (opcional)", "seletor": "elemento a recortar (opcional)",
 *               "esconder": ["seletores a ocultar"], "espera": 1500 }]
 */
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = resolve(
  AQUI,
  "../../FERRAMENTAS/Remotion/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe",
);

const [, , planoArq, saida] = process.argv;
if (!planoArq || !saida) {
  console.error("uso: node capturar.mjs <plano.json> <pasta-saida>");
  process.exit(1);
}
const plano = JSON.parse(readFileSync(planoArq, "utf-8"));
mkdirSync(saida, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });

for (const p of plano) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: p.largura ?? 1200, height: p.altura ?? 900, deviceScaleFactor: 2 });
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: p.tema ?? "light" }]);
    await page.goto(p.url, { waitUntil: p.carrega ?? "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, p.espera ?? 1500));

    for (const sel of p.esconder ?? []) {
      await page.evaluate((s) => document.querySelectorAll(s).forEach((e) => (e.style.display = "none")), sel);
    }

    if (p.rolarAte) {
      await page.evaluate((alvo) => {
        let el = null;
        try { el = document.querySelector(alvo); } catch {}
        if (!el) {
          el = [...document.querySelectorAll("h1,h2,h3,h4,p,div,span,a")]
            .find((e) => e.childElementCount < 3 && e.textContent.trim().toLowerCase().startsWith(alvo.toLowerCase()));
        }
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
      }, p.rolarAte);
      await new Promise((r) => setTimeout(r, 900));
    }

    const arq = join(saida, `${p.nome}.png`);
    if (p.seletor) {
      const el = await page.$(p.seletor);
      if (!el) throw new Error(`seletor não achado: ${p.seletor}`);
      await el.screenshot({ path: arq });
    } else {
      await page.screenshot({ path: arq });
    }
    console.log("ok ", p.nome);
  } catch (e) {
    console.log("ERRO", p.nome, e.message);
  } finally {
    await page.close();
  }
}
await browser.close();
