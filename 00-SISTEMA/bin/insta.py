"""Instagram pela API OFICIAL da Meta (Graph API, "Instagram API with Facebook Login"). Só biblioteca padrão.

Configuração (uma vez): 00-SISTEMA/segredos/instagram.json  ->  ver `python insta.py ajuda`
  {"token": "<token de usuário/página>", "app_id": "...", "app_secret": "...", "ig_user_id": "...", "page_id": "...", "versao": "v24.0"}

Comandos:
  conferir                         token, conta, cota de publicação (100 posts/24h)
  descobrir                        acha ig_user_id/page_id da conta ligada à página e salva
  token-longo                      troca o token curto por um de ~60 dias (e o de página, que não expira)
  reel <mp4> <legenda.txt> [--teste MANUAL|SS_PERFORMANCE] [--capa-ms N] [--sem-feed]
  carrossel <pasta_jpg> <legenda.txt>   (sobe as imagens por um túnel público temporário)
  pesquisa [nicho.json]            concorrentes (business_discovery) + hashtags (top_media) -> ranking compacto
  desempenho [n]                   métricas dos meus últimos n posts (views, alcance, likes, comentários, envios, salvos)

Fatos validados (REFERÊNCIAS/AUTOMACAO.md): Trial Reels = `trial_params` (doc Meta, dez/2025); vídeo sobe por
upload resumable em rupload.facebook.com (sem hospedar); imagem exige URL pública; máx. 5 hashtags por post.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

for _s in (sys.stdout, sys.stderr):  # console do Windows (cp1252) não derruba os ✓/✗
    _s.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parents[2]
SEG = RAIZ / "00-SISTEMA" / "segredos" / "instagram.json"
CACHE = RAIZ / "00-SISTEMA" / "cache" / "insta"
NICHO = RAIZ / "00-SISTEMA" / "nicho.json"
CACHE.mkdir(parents=True, exist_ok=True)


def cfg() -> dict:
    if not SEG.exists():
        sys.exit("✗ Falta 00-SISTEMA/segredos/instagram.json (veja REFERÊNCIAS/AUTOMACAO.md → Configuração única).")
    return json.loads(SEG.read_text(encoding="utf-8"))


def salvar_cfg(c: dict) -> None:
    SEG.write_text(json.dumps(c, indent=2, ensure_ascii=False), encoding="utf-8")


def base(c: dict) -> str:
    return f"https://graph.facebook.com/{c.get('versao', 'v24.0')}"


def api(metodo: str, caminho: str, c: dict | None = None, **p) -> dict:
    """Chama a Graph API. Nunca imprime o token."""
    c = c or cfg()
    p.setdefault("access_token", c["token"])
    for k, v in list(p.items()):
        if isinstance(v, (dict, list)):
            p[k] = json.dumps(v)
    url = caminho if caminho.startswith("http") else f"{base(c)}/{caminho.lstrip('/')}"
    dados = urllib.parse.urlencode(p).encode()
    req = urllib.request.Request(url + ("?" + dados.decode() if metodo == "GET" else ""), data=None if metodo == "GET" else dados, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        corpo = e.read().decode(errors="replace")
        try:
            err = json.loads(corpo).get("error", {})
            raise RuntimeError(f"API {e.code}: {err.get('message')} (code {err.get('code')}/{err.get('error_subcode')})") from None
        except json.JSONDecodeError:
            raise RuntimeError(f"API {e.code}: {corpo[:300]}") from None


# ---------------------------------------------------------------- configuração

def conferir() -> None:
    c = cfg()
    eu = api("GET", "me", c, fields="id,name")
    print(f"✓ token válido ({eu.get('name')})")
    if not c.get("ig_user_id"):
        print("  ⚠ sem ig_user_id: rode `insta.py descobrir`")
        return
    conta = api("GET", c["ig_user_id"], c, fields="username,followers_count,media_count")
    print(f"✓ @{conta['username']}: {conta.get('followers_count')} seguidores, {conta.get('media_count')} posts")
    try:
        lim = api("GET", f"{c['ig_user_id']}/content_publishing_limit", c, fields="quota_usage,config")
        d = (lim.get("data") or [{}])[0]
        print(f"✓ cota: {d.get('quota_usage')} de {d.get('config', {}).get('quota_total')} posts nas últimas 24h")
    except RuntimeError as e:
        print(f"  ⚠ cota indisponível: {e}")
    try:
        dbg = api("GET", "debug_token", c, input_token=c["token"])["data"]
        exp = dbg.get("expires_at") or 0
        print(f"✓ permissões: {', '.join(dbg.get('scopes', []))}")
        print("✓ token não expira" if exp == 0 else f"⚠ token expira em {(exp - time.time()) / 86400:.0f} dias")
    except RuntimeError:
        pass


def descobrir() -> None:
    c = cfg()
    pags = api("GET", "me/accounts", c, fields="id,name,access_token,instagram_business_account{id,username}").get("data", [])
    for p in pags:
        ig = p.get("instagram_business_account")
        print(f"  página {p['name']} ({p['id']}) -> {('@' + ig['username']) if ig else 'sem Instagram'}")
        if ig and (not c.get("usuario") or ig["username"] == c.get("usuario")):
            c.update(ig_user_id=ig["id"], page_id=p["id"], usuario=ig["username"])
            if p.get("access_token"):
                c["token_pagina"] = p["access_token"]
    salvar_cfg(c)
    print(f"✓ salvo: @{c.get('usuario')} ig_user_id={c.get('ig_user_id')}")


def token_longo() -> None:
    c = cfg()
    r = api("GET", "oauth/access_token", c, grant_type="fb_exchange_token", client_id=c["app_id"], client_secret=c["app_secret"], fb_exchange_token=c["token"])
    c["token"] = r["access_token"]
    salvar_cfg(c)
    print(f"✓ token de usuário trocado (expira em ~{int(r.get('expires_in', 5184000)) // 86400} dias)")
    descobrir()  # o token de PÁGINA gerado a partir de um token longo não expira
    c = cfg()
    if c.get("token_pagina"):
        c["token_usuario"], c["token"] = c["token"], c.pop("token_pagina")
        salvar_cfg(c)
        print("✓ usando o token de página (sem validade) para publicar")


# ---------------------------------------------------------------- publicação

def _esperar(c: dict, cid: str, maximo: int = 600) -> None:
    t0 = time.time()
    while True:
        st = api("GET", cid, c, fields="status_code,status").get("status_code")
        if st == "FINISHED":
            return
        if st in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"container {st}: {api('GET', cid, c, fields='status').get('status')}")
        if time.time() - t0 > maximo:
            raise RuntimeError("tempo esgotado esperando o Instagram processar")
        time.sleep(10)


def _publicar(c: dict, cid: str) -> str:
    mid = api("POST", f"{c['ig_user_id']}/media_publish", c, creation_id=cid)["id"]
    link = api("GET", mid, c, fields="permalink").get("permalink", "")
    with (CACHE / "publicados.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps({"data": time.strftime("%Y-%m-%d %H:%M"), "id": mid, "link": link}) + "\n")
    return f"{mid} {link}"


def _legenda(arq: str) -> str:
    txt = Path(arq).read_text(encoding="utf-8").strip()
    n = len(re.findall(r"(?<!\w)#\w+", txt))
    if n > 5:
        sys.exit(f"✗ {n} hashtags na legenda: o Instagram aceita no máximo 5 (dez/2025).")
    if len(txt) > 2200:
        sys.exit(f"✗ legenda com {len(txt)} caracteres (máx. 2200).")
    return txt


def reel(mp4: str, legenda: str, teste: str | None = None, capa_ms: int | None = None, feed: bool = True) -> None:
    c = cfg()
    arq = Path(mp4)
    p = dict(media_type="REELS", upload_type="resumable", caption=_legenda(legenda), share_to_feed="true" if feed else "false")
    if teste:
        p["trial_params"] = {"graduation_strategy": teste}
    if capa_ms is not None:
        p["thumb_offset"] = str(capa_ms)
    r = api("POST", f"{c['ig_user_id']}/media", c, **p)
    cid, uri = r["id"], r["uri"]
    dados = arq.read_bytes()
    req = urllib.request.Request(uri, data=dados, method="POST", headers={"Authorization": f"OAuth {c['token']}", "offset": "0", "file_size": str(len(dados))})
    with urllib.request.urlopen(req, timeout=600) as resp:
        if not json.loads(resp.read()).get("success"):
            raise RuntimeError("upload resumable falhou")
    print(f"  enviado {len(dados) / 1e6:.1f} MB, processando…")
    _esperar(c, cid)
    print(f"✓ Reel {'de TESTE (' + teste + ') ' if teste else ''}publicado: {_publicar(c, cid)}")


class _Tunel:
    """Servidor HTTP local + túnel público temporário do cloudflared (sem conta). Fecha ao sair."""

    def __init__(self, pasta: Path):
        self.pasta = pasta

    def __enter__(self) -> str:
        self.srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(self.pasta)))
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        exe = RAIZ / "00-SISTEMA" / "ferramentas" / "cloudflared.exe"
        if not exe.exists():
            sys.exit("✗ Falta 00-SISTEMA/ferramentas/cloudflared.exe (ver AUTOMACAO.md).")
        self.proc = subprocess.Popen([str(exe), "tunnel", "--no-autoupdate", "--url", f"http://127.0.0.1:{self.srv.server_port}"], stderr=subprocess.PIPE, text=True)
        t0 = time.time()
        for linha in self.proc.stderr:
            m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", linha)
            if m:
                time.sleep(4)
                return m.group(0)
            if time.time() - t0 > 60:
                break
        raise RuntimeError("túnel não subiu")

    def __exit__(self, *a):
        self.proc.terminate()
        self.srv.shutdown()


def carrossel(pasta: str, legenda: str) -> None:
    c = cfg()
    imgs = sorted(Path(pasta).glob("*.jpg"))
    if not 2 <= len(imgs) <= 10:
        sys.exit(f"✗ {len(imgs)} imagens: use de 2 a 10 JPG (4:5, 1080x1350).")
    cap = _legenda(legenda)
    with _Tunel(Path(pasta)) as url:
        filhos = []
        for im in imgs:
            filhos.append(api("POST", f"{c['ig_user_id']}/media", c, image_url=f"{url}/{urllib.parse.quote(im.name)}", is_carousel_item="true")["id"])
            print(f"  slide {len(filhos)}/{len(imgs)} ok")
        cid = api("POST", f"{c['ig_user_id']}/media", c, media_type="CAROUSEL", children=",".join(filhos), caption=cap)["id"]
        _esperar(c, cid, 300)
        print(f"✓ Carrossel publicado: {_publicar(c, cid)}")


# ---------------------------------------------------------------- pesquisa e desempenho

CAMPOS = "caption,like_count,comments_count,permalink,timestamp,media_type,media_product_type"


def _resumo(t: str | None, n: int = 110) -> str:
    return re.sub(r"\s+", " ", (t or "")).strip()[:n]


def pesquisa(arq: str | None = None) -> None:
    """Ranking do nicho por engajamento. Saída compacta (economia de tokens): PROJETOS/_pesquisa/DD-MM-AAAA.md"""
    c = cfg()
    n = json.loads(Path(arq or NICHO).read_text(encoding="utf-8"))
    linhas = []
    for u in n.get("concorrentes", []):
        try:
            bd = api("GET", c["ig_user_id"], c, fields=f"business_discovery.username({u}){{followers_count,media.limit(25){{{CAMPOS}}}}}")["business_discovery"]
        except RuntimeError as e:
            print(f"  ⚠ @{u}: {e}")
            continue
        seg = max(1, bd.get("followers_count") or 1)
        for m in bd.get("media", {}).get("data", []):
            eng = (m.get("like_count") or 0) + 3 * (m.get("comments_count") or 0)
            linhas.append((eng / seg * 100, f"@{u}", m))
    usadas = json.loads((CACHE / "hashtags.json").read_text()) if (CACHE / "hashtags.json").exists() else {}
    for h in n.get("hashtags", [])[:10]:  # limite Meta: 30 hashtags únicas por 7 dias
        try:
            hid = usadas.get(h) or api("GET", "ig_hashtag_search", c, user_id=c["ig_user_id"], q=h)["data"][0]["id"]
            usadas[h] = hid
            for m in api("GET", f"{hid}/top_media", c, user_id=c["ig_user_id"], fields=CAMPOS, limit=25).get("data", []):
                eng = (m.get("like_count") or 0) + 3 * (m.get("comments_count") or 0)
                linhas.append((eng / 1000, f"#{h}", m))  # sem seguidores: escala absoluta
        except RuntimeError as e:
            print(f"  ⚠ #{h}: {e}")
    (CACHE / "hashtags.json").write_text(json.dumps(usadas))
    linhas.sort(key=lambda x: -x[0])
    out = RAIZ / "PROJETOS" / "_pesquisa" / f"{date.today().strftime('%d-%m-%Y')}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    txt = [f"# Pesquisa do nicho {date.today().strftime("%d-%m-%Y")} (engaj. = likes + 3×comentários; % sobre seguidores p/ concorrentes)", "", "| # | fonte | tipo | likes | coment. | engaj. | legenda | link |", "|---|---|---|---|---|---|---|---|"]
    for i, (e, fonte, m) in enumerate(linhas[: n.get("top", 20)], 1):
        txt.append(f"| {i} | {fonte} | {m.get('media_product_type') or m.get('media_type')} | {m.get('like_count')} | {m.get('comments_count')} | {e:.2f} | {_resumo(m.get('caption'))} | {m.get('permalink')} |")
    out.write_text("\n".join(txt), encoding="utf-8")
    print(f"✓ {len(linhas)} posts analisados -> {out.relative_to(RAIZ)} (top {n.get('top', 20)})")


METRICAS = ["views", "reach", "likes", "comments", "shares", "saved", "ig_reels_avg_watch_time"]


def desempenho(n: int = 12) -> None:
    c = cfg()
    posts = api("GET", f"{c['ig_user_id']}/media", c, fields="id,caption,media_product_type,timestamp,permalink", limit=n).get("data", [])
    print("| data | tipo | " + " | ".join(METRICAS) + " | legenda |")
    for p in posts:
        vals = {}
        for m in METRICAS:  # uma por vez: métricas inválidas para o tipo de mídia não derrubam as outras
            try:
                vals[m] = api("GET", f"{p['id']}/insights", c, metric=m)["data"][0]["values"][0]["value"]
            except (RuntimeError, KeyError, IndexError):
                vals[m] = "-"
        print(f"| {p['timestamp'][:10]} | {p.get('media_product_type')} | " + " | ".join(str(vals[m]) for m in METRICAS) + f" | {_resumo(p.get('caption'), 50)} |")


def main() -> None:
    a = sys.argv[1:]
    if not a or a[0] in ("ajuda", "-h"):
        print(__doc__)
        return
    cmd = a[0]
    try:
        if cmd == "conferir":
            conferir()
        elif cmd == "descobrir":
            descobrir()
        elif cmd == "token-longo":
            token_longo()
        elif cmd == "reel":
            teste = a[a.index("--teste") + 1] if "--teste" in a else None
            capa = int(a[a.index("--capa-ms") + 1]) if "--capa-ms" in a else None
            reel(a[1], a[2], teste, capa, "--sem-feed" not in a)
        elif cmd == "carrossel":
            carrossel(a[1], a[2])
        elif cmd == "pesquisa":
            pesquisa(a[1] if len(a) > 1 else None)
        elif cmd == "desempenho":
            desempenho(int(a[1]) if len(a) > 1 else 12)
        else:
            print(__doc__)
    except RuntimeError as e:
        sys.exit(f"✗ {e}")


if __name__ == "__main__":
    main()
