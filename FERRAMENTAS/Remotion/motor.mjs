// Motor rápido: empacota o projeto UMA vez (cache por hash do src/) e reaproveita o mesmo navegador.
//   node motor.mjs previa <props.json> <Composicao> <pastaSaida> <f1,f2,...>
//   node motor.mjs render <props.json> <Composicao> <saida.mp4>
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const AQUI = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const CACHE = path.join(AQUI, '.cache');

function hashSrc() {
	const h = createHash('sha1');
	const anda = (d) => {
		for (const n of fs.readdirSync(d).sort()) {
			const p = path.join(d, n);
			const st = fs.statSync(p);
			if (st.isDirectory()) anda(p);
			else h.update(p + st.size + st.mtimeMs);
		}
	};
	anda(path.join(AQUI, 'src'));
	h.update(fs.readFileSync(path.join(AQUI, 'package.json')));
	return h.digest('hex').slice(0, 12);
}

async function pacote() {
	const id = hashSrc();
	const dir = path.join(CACHE, `bundle-${id}`);
	if (!fs.existsSync(path.join(dir, 'index.html'))) {
		const t = Date.now();
		fs.rmSync(CACHE, {recursive: true, force: true});
		// enableCaching:false -> sem o cache do webpack em node_modules/.cache (~260 MB); o bundle já é cacheado aqui
		await bundle({entryPoint: path.join(AQUI, 'src/index.ts'), outDir: dir, publicDir: path.join(AQUI, 'public'), enableCaching: false});
		console.log(`  bundle novo (${((Date.now() - t) / 1000).toFixed(1)}s)`);
	} else {
		// espelha a pasta public (só a mídia do projeto atual) — sem reempacotar e sem acumular projetos antigos
		fs.rmSync(path.join(dir, 'public'), {recursive: true, force: true});
		fs.cpSync(path.join(AQUI, 'public'), path.join(dir, 'public'), {recursive: true, force: true});
		console.log('  bundle reaproveitado do cache');
	}
	return dir;
}

const [modo, propsArq, comp, saida, lista] = process.argv.slice(2);
const inputProps = JSON.parse(fs.readFileSync(propsArq, 'utf8'));
const t0 = Date.now();
const serveUrl = await pacote();
// GL e núcleos ajustáveis por ambiente (benchmark: REFERÊNCIAS/AUTOMACAO.md §8)
const GL = process.env.MOTOR_GL || 'angle'; // GPU: ~23% mais rápido que o padrão (benchmark 11/11)
const browser = await openBrowser('chrome', {chromiumOptions: GL ? {gl: GL} : {}});
const composition = await selectComposition({serveUrl, id: comp, inputProps, puppeteerInstance: browser});

if (modo === 'previa') {
	fs.mkdirSync(saida, {recursive: true});
	const quadros = lista.split(',').map(Number);
	await Promise.all(
		quadros.map((frame, i) =>
			renderStill({composition, serveUrl, inputProps, frame, puppeteerInstance: browser, imageFormat: 'jpeg', jpegQuality: 85,
				output: path.join(saida, `cena${String(i + 1).padStart(2, '0')}.jpg`)}),
		),
	);
	console.log(`  ${quadros.length} prévias em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else {
	let ult = -1;
	await renderMedia({
		composition, serveUrl, inputProps, codec: 'h264', outputLocation: saida, puppeteerInstance: browser,
		crf: 18, pixelFormat: 'yuv420p', colorSpace: 'bt709', x264Preset: 'veryfast', imageFormat: 'jpeg', jpegQuality: 90,
		concurrency: Number(process.env.MOTOR_CONC) || Math.max(1, os.cpus().length - 1),
		frameRange: process.env.MOTOR_FRAMES ? process.env.MOTOR_FRAMES.split('-').map(Number) : null,
		chromiumOptions: GL ? {gl: GL} : {},
		onProgress: ({progress}) => {
			const p = Math.floor(progress * 10);
			if (p !== ult) { ult = p; process.stdout.write(`  ${p * 10}%`); }
		},
	});
	console.log(`\n  render em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close({silent: true});
