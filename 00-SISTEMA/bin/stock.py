"""Banco de vídeos grátis (Mixkit: licença livre, inclusive comercial, sem atribuição).

  python 00-SISTEMA/bin/stock.py buscar gym weightlifting      -> baixa prévias 360p + _STOCK.jpg (mosaico numerado)
  python 00-SISTEMA/bin/stock.py pegar <projeto> 52112 52094 ... -> baixa 1080p para PROJETOS/<projeto>/assets/stock/<id>.mp4

Cache leve (00-SISTEMA/cache/stock): só miniaturas 320px + índice. Os MP4 brutos são apagados após o uso
(o clipe do projeto é re-baixável a qualquer momento com `pegar <projeto> <ids>`).
"""
import re, sys, json, subprocess, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pastas

RAIZ = Path(__file__).resolve().parents[2]
CACHE = RAIZ / "00-SISTEMA" / "cache" / "stock"
UA = {"User-Agent": "Mozilla/5.0"}


def _get(url, destino=None):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        dados = r.read()
    if destino:
        Path(destino).write_bytes(dados)
    return dados


def buscar(termos):
    CACHE.mkdir(parents=True, exist_ok=True)
    idx_arq = CACHE / "indice.json"
    idx = json.loads(idx_arq.read_text("utf8")) if idx_arq.exists() else {}
    achados = []
    for t in termos:
        h = _get(f"https://mixkit.co/free-stock-video/{t}/").decode("utf8", "ignore")
        com_video = set(re.findall(r"videos/(\d+)/\1-360\.mp4", h))
        for slug, i in re.findall(r"/free-stock-video/([a-z0-9-]+)-(\d+)/", h):
            if i in com_video and i not in achados:
                achados.append(i)
                idx[i] = slug
    idx_arq.write_text(json.dumps(idx, indent=0), "utf8")

    def baixa(i):
        p = CACHE / f"{i}-360.mp4"
        if not p.exists():
            _get(f"https://assets.mixkit.co/videos/{i}/{i}-360.mp4", p)
        j = CACHE / f"{i}.jpg"
        if not j.exists():
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "2", "-i", str(p), "-frames:v", "1", "-vf", "scale=320:-2", str(j)])
        p.unlink(missing_ok=True)  # limpeza: a prévia 360p só serve para gerar a miniatura
        return i

    with ThreadPoolExecutor(8) as ex:
        list(ex.map(baixa, achados))
    from PIL import Image, ImageDraw
    cols, w, hh = 6, 320, 180
    ok = [i for i in achados if (CACHE / f"{i}.jpg").exists()]
    sheet = Image.new("RGB", (cols * w, ((len(ok) + cols - 1) // cols) * hh), "black")
    d = ImageDraw.Draw(sheet)
    for n, i in enumerate(ok):
        im = Image.open(CACHE / f"{i}.jpg").convert("RGB")
        im.thumbnail((w, hh))
        x, y = (n % cols) * w, (n // cols) * hh
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 70, y + 22], fill="black")
        d.text((x + 4, y + 4), i, fill="yellow")
    sheet.save(CACHE / "_STOCK.jpg", quality=80)
    for i in ok:
        print(i, idx.get(i, "")[:70])
    print("mosaico:", CACHE / "_STOCK.jpg")


def pegar(projeto, ids):
    proj = pastas.ordenar((RAIZ / "PROJETOS").glob(f"*{projeto}*"))[-1]
    dest = proj / "assets" / "stock"
    dest.mkdir(parents=True, exist_ok=True)

    def baixa(i):
        out = dest / f"{i}.mp4"
        if out.exists():
            return i, out.stat().st_size // 1024
        c = CACHE / f"{i}-1080.mp4"
        try:
            _get(f"https://assets.mixkit.co/videos/{i}/{i}-1080.mp4", c)
        except Exception:
            _get(f"https://assets.mixkit.co/videos/{i}/{i}-720.mp4", c)
        # versão leve para o render: sem áudio, 1080 de altura máx, keyframes frequentes (seek rápido)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(c), "-an", "-vf", "scale=-2:'min(1080,ih)'",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-g", "15", "-pix_fmt", "yuv420p", str(out)])
        c.unlink(missing_ok=True)  # limpeza: o original 1080p não fica guardado (re-baixável pelo id)
        return i, out.stat().st_size // 1024

    with ThreadPoolExecutor(6) as ex:
        for i, kb in ex.map(baixa, ids):
            print(f"{i}: {kb} KB")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "buscar":
        buscar(a[1:] or ["gym"])
    elif a and a[0] == "pegar":
        pegar(a[1], a[2:])
    else:
        print(__doc__)
