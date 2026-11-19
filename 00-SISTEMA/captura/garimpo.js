// Garimpo de Reels virais: rode com javascript_tool numa aba do Instagram LOGADO (Claude in Chrome).
// Testado em 11/11/2026. Não usa API interna: só a página pública de cada post (meta og:description / og:url).
//
// 1) Em cada página de hashtag (instagram.com/explore/tags/<tag>/) rode COLETAR e guarde os códigos.
// 2) Numa aba do instagram.com rode MEDIR com a lista de códigos (4 em paralelo, ~60 posts/min).
// 3) Rode TOP para ver o ranking (score = curtidas + 3×comentários) sem gastar tokens com 300 linhas.
//    Para salvar: JSON.stringify(window.__res) → coleta.json → `garimpar.py ranquear`.

// ---- COLETAR (página de hashtag ou perfil /reels/) ----
const S = new Set();
for (let i = 0; i < 5; i++) {
  document.querySelectorAll('a[href*="/reel/"],a[href*="/p/"]').forEach(a => S.add(a.href.split('/')[4]));
  window.scrollBy(0, 2500); await new Promise(r => setTimeout(r, 1700));
}
[...S].join(',');

// ---- MEDIR (cole os códigos em L) ----
const L = `COD1,COD2`.split(','), Q = [...new Set(L)];
window.__res = []; window.__n = Q.length;
const num = s => { s = s.replace(/,/g, ''); const m = s.match(/([\d.]+)([KM]?)/); return m ? Math.round(parseFloat(m[1]) * ({ K: 1e3, M: 1e6 }[m[2]] || 1)) : 0; };
const dec = t => { const d = document.createElement('textarea'); d.innerHTML = t; return d.value; };
const one = async c => {
  try {
    const h = await fetch('/p/' + c + '/').then(r => r.text());
    const g = k => { const m = h.match(new RegExp('<meta property="og:' + k + '" content="([^"]*)"')); return m ? dec(m[1]) : ''; };
    const d = g('description');
    const lk = d.match(/^([\d.,KM]+) likes?/), cm = d.match(/([\d.,KM]+) comments?/);
    const u = d.match(/comments? - (\S+) (?:on|no) /), dt = d.match(/ (?:on|no) ([A-Z][a-z]+ \d+, \d{4})/);
    window.__res.push([c, lk ? num(lk[1]) : 0, cm ? num(cm[1]) : 0, u ? u[1] : '', g('url').includes('/reel/') ? 1 : 0,
      dt ? dt[1] : '', d.replace(/^.*?: "/, '').replace(/\s+/g, ' ').slice(0, 110)]);
  } catch (e) { window.__res.push([c, 'ERR']); }
};
(async () => { let i = 0; const w = async () => { while (i < Q.length) await one(Q[i++]); }; await Promise.all([w(), w(), w(), w()]); })();

// ---- TOP (acompanhe com window.__res.length + '/' + window.__n) ----
window.__res.filter(r => r[4]).sort((a, b) => (b[1] + 3 * b[2]) - (a[1] + 3 * a[2])).slice(0, 25)
  .map(r => [r[1] + 3 * r[2], r[1], r[2], r[3], r[0], r[5], r[6].slice(0, 70)].join(' | ')).join('\n');
