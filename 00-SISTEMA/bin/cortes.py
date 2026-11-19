"""Cortes: vídeo longo do YouTube -> material para um Reel (base fiel, roteiro reescrito).

Junta o que os melhores projetos abertos fazem (pesquisa 15/11/2026, REFERÊNCIAS/CORTES.md):
  openshorts (8,4k*), FunClip (6,5k*), AI-Youtube-Shorts-Generator (6,1k*), PySceneDetect (5,5k*).
  - transcrição com tempo (legenda do YouTube quando existe; senão faster-whisper)    [todos]
  - cortes de cena (PySceneDetect) para nunca cortar no meio de uma tomada              [openshorts]
  - pontuação de momentos 0-100 por gancho/emoção/revelação/número, sem sobreposição  [AI-YT-Shorts]
  - enquadramento 9:16 por tomada: foco (recorte), geral (fundo desfocado), track (rosto) [openshorts]
  Diferença nossa: o vídeo inteiro só é baixado em 360p (análise). Em alta só baixamos
  os segundos usados, direto do YouTube (ffmpeg lê o trecho) -> rápido e leve.

  python 00-SISTEMA/bin/cortes.py analisar <url> [--whisper]
      -> cache/youtube/<id>/: TRANSCRICAO.md (blocos de 20 s, 🔥 = pico de energia, ✂ = corte de cena),
         _CENAS.jpg (mosaico com o tempo de cada quadro), cenas.json
  python 00-SISTEMA/bin/cortes.py cortar <slug>
      -> lê PROJETOS/<slug>/cortes.json e grava assets/stock/<nome>.mp4 (1080x1920, sem som)
  python 00-SISTEMA/bin/cortes.py recortar <slug>
      -> lê PROJETOS/<slug>/recortes.json [{"nome","t","desc"}] e grava assets/recortes/<nome>.png (sem fundo, rembg)
  python 00-SISTEMA/bin/cortes.py limpar <id>    -> apaga o cache do vídeo (proxy + quadros)

cortes.json: {"fonte": "<url>", "cortes": [{"nome": "yt01", "ini": "3:21.5", "fim": "3:27",
              "modo": "foco", "foco": 50, "zoom": 1.0}]}
  modo: "inteiro" (16:9 completo 1280x720, para janelas do Trajeto), "foco" (recorte 9:16 no ponto foco%), "geral" (quadro inteiro sobre fundo desfocado),
        "track" (segue o rosto; YuNet do OpenCV).
"""
import json
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pastas

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RAIZ = Path(__file__).resolve().parents[2]
CACHE = RAIZ / "00-SISTEMA" / "cache" / "youtube"
PROJ = RAIZ / "PROJETOS"
MODELOS = RAIZ / "00-SISTEMA" / "assets" / "modelos"
W, H, FPS = 1080, 1920, 30


def vid_id(url: str) -> str:
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{11})", url)
    return m.group(1) if m else re.sub(r"\W", "_", url)[-20:]


def seg(t) -> float:
    if isinstance(t, (int, float)):
        return float(t)
    p = [float(x) for x in str(t).split(":")]
    return sum(v * 60 ** i for i, v in enumerate(reversed(p)))


def mmss(s: float) -> str:
    return f"{int(s // 60):02d}:{int(s % 60):02d}"


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", **kw)
    if r.returncode != 0:
        sys.exit(f"falhou: {' '.join(map(str, cmd[:4]))}...\n{r.stderr[-1500:]}")
    return r.stdout


# ------------------------------------------------------------------ analisar
def _legenda_yt(pasta: Path) -> list[dict] | None:
    for arq in sorted(pasta.glob("legenda*.json3")):
        ev = json.loads(arq.read_text("utf8")).get("events", [])
        out = []
        for e in ev:
            txt = "".join(s.get("utf8", "") for s in e.get("segs", []) or []).strip()
            if txt and txt != "\n":
                ini = e["tStartMs"] / 1000
                out.append({"ini": ini, "fim": ini + e.get("dDurationMs", 0) / 1000, "texto": txt.replace("\n", " ")})
        if out:
            return out
    return None


def _whisper(audio) -> list[dict]:
    from faster_whisper import WhisperModel
    m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=8)
    segs, _ = m.transcribe(audio, language="pt", vad_filter=True, beam_size=1)
    return [{"ini": s.start, "fim": s.end, "texto": s.text.strip()} for s in segs]


def _cenas(proxy: Path) -> list[float]:
    from scenedetect import ContentDetector, open_video, SceneManager
    v = open_video(str(proxy))
    sm = SceneManager()
    sm.auto_downscale = False
    sm.downscale = 2  # o proxy já é 360p; 180p basta para achar corte
    sm.add_detector(ContentDetector(threshold=27))
    sm.detect_scenes(v, frame_skip=1)  # 26 min: ~5 min -> ~1,5 min
    return [round(a.seconds, 2) for a, _ in sm.get_scene_list()]


def _mosaico(proxy: Path, pasta: Path, dur: float, n=60):
    from PIL import Image, ImageDraw, ImageFont
    passo = dur / n
    qd = pasta / "_q"
    qd.mkdir(exist_ok=True)

    def um(i):
        t = passo * (i + 0.5)
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(proxy), "-frames:v", "1",
             "-vf", "scale=256:-2", str(qd / f"{i:03d}.jpg")])
        return t
    with ThreadPoolExecutor(8) as ex:
        tempos = list(ex.map(um, range(n)))
    cols = 10
    tw, th = 256, 144
    img = Image.new("RGB", (cols * tw, (n + cols - 1) // cols * (th + 22)), "#111")
    try:
        fonte = ImageFont.truetype("arialbd.ttf", 18)
    except OSError:
        fonte = ImageFont.load_default()
    d = ImageDraw.Draw(img)
    for i, t in enumerate(tempos):
        x, y = i % cols * tw, i // cols * (th + 22)
        img.paste(Image.open(qd / f"{i:03d}.jpg").resize((tw, th)), (x, y + 22))
        d.text((x + 4, y + 2), mmss(t), fill="#ffd400", font=fonte)
    img.save(pasta / "_CENAS.jpg", quality=80)
    shutil.rmtree(qd)


def analisar(url: str, forcar_whisper=False):
    vid = vid_id(url)
    pasta = CACHE / vid
    pasta.mkdir(parents=True, exist_ok=True)
    proxy = pasta / "proxy.mp4"
    if not proxy.exists():
        print("baixando proxy 360p + legenda do YouTube...")
        run(["yt-dlp", "--no-warnings", "-f", "bv*[height<=360][ext=mp4]+ba[ext=m4a]/b[height<=360]", "--merge-output-format", "mp4",
             "-o", str(proxy), "--write-info-json", "-o", f"infojson:{pasta / 'info'}", url])
        # legenda é bônus (o YouTube às vezes devolve 429): falhou -> Whisper
        subprocess.run(["yt-dlp", "--no-warnings", "--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "pt-orig,pt-BR,pt",
                        "--sub-format", "json3", "-o", f"subtitle:{pasta / 'legenda'}", url], capture_output=True)
    info_arq = pasta / "info.info.json"
    info = json.loads(info_arq.read_text("utf8")) if info_arq.exists() else {}
    if info_arq.exists():  # guarda só o essencial
        info = {k: info.get(k) for k in ("id", "title", "channel", "duration", "view_count", "like_count", "upload_date", "webpage_url", "chapters")}
        (pasta / "info.json").write_text(json.dumps(info, ensure_ascii=False, indent=1), "utf8")
        info_arq.unlink()
    info = info or json.loads((pasta / "info.json").read_text("utf8"))
    dur = float(info.get("duration") or 0)

    import numpy as np
    sys.path.insert(0, str(Path(__file__).parent))
    from legendar import carregar_audio
    audio = carregar_audio(proxy)

    trans_arq = pasta / "transcricao.json"
    if trans_arq.exists() and not forcar_whisper:
        trans = json.loads(trans_arq.read_text("utf8"))
    else:
        trans = None if forcar_whisper else _legenda_yt(pasta)
        fonte = "legenda do YouTube"
        if not trans:
            print("transcrevendo com Whisper small (CPU)...")
            trans, fonte = _whisper(audio), "whisper"
        trans_arq.write_text(json.dumps({"fonte": fonte, "segmentos": trans}, ensure_ascii=False), "utf8")
        trans = json.loads(trans_arq.read_text("utf8"))
        for j in pasta.glob("*.json3"):  # fonte já virou transcricao.json
            j.unlink()

    cenas_arq = pasta / "cenas.json"
    if not cenas_arq.exists():
        print("detectando cortes de cena (PySceneDetect)...")
        cenas_arq.write_text(json.dumps(_cenas(proxy)), "utf8")
    cenas = json.loads(cenas_arq.read_text("utf8"))
    if not (pasta / "_CENAS.jpg").exists():
        _mosaico(proxy, pasta, dur)

    # energia por bloco de 20 s (RMS da voz): os 15% mais altos ganham 🔥
    taxa, bloco = 16000, 20
    nb = max(1, int(dur // bloco) + 1)
    rms = [float(np.sqrt(np.mean(audio[i * bloco * taxa:(i + 1) * bloco * taxa] ** 2) + 1e-9)) for i in range(nb)]
    corte_fogo = sorted(rms)[int(len(rms) * 0.85)] if len(rms) > 3 else 9
    textos = [""] * nb
    for s in trans["segmentos"]:
        textos[min(nb - 1, int(s["ini"] // bloco))] += " " + s["texto"]
    linhas = [f"# {info.get('title')}", f"{info.get('channel')} · {mmss(dur)} · {info.get('view_count')} views · {info.get('upload_date')} · {info.get('webpage_url')}",
              f"Transcrição: {trans['fonte']} · {len(cenas)} cortes de cena · 🔥 = pico de energia · ✂ n = cortes de cena no bloco", ""]
    for c in info.get("chapters") or []:
        linhas.append(f"- capítulo {mmss(c['start_time'])} {c['title']}")
    for i in range(nb):
        t = " ".join(textos[i].split())
        if not t:
            continue
        nc = sum(1 for c in cenas if i * bloco <= c < (i + 1) * bloco)
        linhas.append(f"[{mmss(i * bloco)}] {'🔥 ' if rms[i] >= corte_fogo else ''}{f'✂{nc} ' if nc else ''}{t}")
    (pasta / "TRANSCRICAO.md").write_text("\n".join(linhas), "utf8")
    print(f"OK {vid}: {info.get('title')} ({mmss(dur)})")
    print(f"  {pasta / 'TRANSCRICAO.md'}\n  {pasta / '_CENAS.jpg'}\n  {len(trans['segmentos'])} trechos de fala ({trans['fonte']}), {len(cenas)} cortes de cena")


# ------------------------------------------------------------------ cortar
def _url_alta(url: str) -> str:
    return run(["yt-dlp", "--no-warnings", "-f", "bv*[height<=1440][vcodec^=avc1]/bv*[height<=1440]", "-g", url]).strip().splitlines()[0]


def _ajuste_cena(ini: float, fim: float, cenas: list[float]) -> tuple[float, float]:
    """Se um corte de cena cai a <0,4 s da borda, empurra a borda para dentro (sem tomada de 3 quadros)."""
    for c in cenas:
        if ini < c < ini + 0.4:
            ini = c + 0.05
        if fim - 0.4 < c < fim:
            fim = c - 0.05
    return ini, fim


def _track_xs(proxy: Path, ini: float, fim: float) -> list[tuple[float, float]]:
    """Centro x (0-1) do maior rosto, 5x/s, suavizado (EMA). YuNet do OpenCV."""
    import cv2
    modelo = MODELOS / "face_detection_yunet_2023mar.onnx"
    if not modelo.exists():
        import urllib.request
        MODELOS.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve("https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx", modelo)
    cap = cv2.VideoCapture(str(proxy))
    det, pts, x_ema, t = None, [], 0.5, ini
    while t < fim:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, fr = cap.read()
        if not ok:
            break
        h, w = fr.shape[:2]
        if det is None:
            det = cv2.FaceDetectorYN.create(str(modelo), "", (w, h), 0.7)
        _, faces = det.detect(fr)
        if faces is not None and len(faces):
            f = max(faces, key=lambda r: r[2] * r[3])
            x_ema = 0.75 * x_ema + 0.25 * ((f[0] + f[2] / 2) / w)
        pts.append((t - ini, x_ema))
        t += 0.2
    return pts


def cortar(slug: str):
    pasta = next(reversed(pastas.ordenar(p for p in PROJ.glob(f"*{slug}") if p.is_dir())), None) or sys.exit(f"projeto {slug} não achado")
    plano = json.loads((pasta / "cortes.json").read_text("utf8"))
    url, vid = plano["fonte"], vid_id(plano["fonte"])
    cache = CACHE / vid
    cenas = json.loads((cache / "cenas.json").read_text("utf8")) if (cache / "cenas.json").exists() else []
    saida = pasta / "assets" / "stock"
    saida.mkdir(parents=True, exist_ok=True)
    feitos = json.loads((saida / "_cortes.json").read_text("utf8")) if (saida / "_cortes.json").exists() else {}
    falta = [c for c in plano["cortes"] if feitos.get(c["nome"]) != c or not (saida / f"{c['nome']}.mp4").exists()]
    if not falta:
        print(f"todos os {len(plano['cortes'])} cortes já existem (cache)")
        return
    alta = _url_alta(url)
    print(f"cortando {len(falta)} trechos em alta, direto do YouTube...")

    def um(c):
        ini, fim = _ajuste_cena(seg(c["ini"]), seg(c["fim"]), cenas)
        modo, z = c.get("modo", "foco"), float(c.get("zoom", 1.0))
        if modo == "inteiro":  # 16:9 completo, para janelas (Trajeto): nada cortado
            k = 1 - float(plano.get("tarja", 0))  # "tarja": fração do topo a esconder (selo do criador), mantém 16:9
            vf = f"[0:v]crop=iw*{k}:ih*{k}:(iw-ow)/2:ih-oh,scale=1280:720:flags=lanczos,fps={FPS},setsar=1[v]"
        elif modo == "geral":
            vf = (f"[0:v]split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:2,eq=brightness=-0.12[f];"
                  f"[b]scale={int(W * z)}:-2,crop='min(iw,{W})':ih[p];[f][p]overlay=(W-w)/2:(H-h)/2,fps={FPS},setsar=1[v]")
        else:
            cw = f"ih*9/16/{z}"
            x = f"(iw-{cw})*{float(c.get('foco', 50)) / 100}"
            cmds = ""
            if modo == "track" and (cache / "proxy.mp4").exists():
                pts = _track_xs(cache / "proxy.mp4", ini, fim)
                cmd_arq = cache / f"_track_{c['nome']}.txt"
                cmd_arq.write_text("".join(f"{t:.2f} crop x iw*{xc:.4f}-ow/2;\n" for t, xc in pts), "utf8")
                x = f"iw*{pts[0][1]:.4f}-ow/2" if pts else x  # o crop já prende x dentro do quadro
                cmds = f"sendcmd=f='{cmd_arq.as_posix().replace(':', chr(92) + ':')}',"
            vf = f"[0:v]{cmds}crop={cw}:ih/{z}:{x}:(ih-ih/{z})/2,scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1[v]"
        mp4 = saida / f"{c['nome']}.mp4"
        run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{ini:.3f}", "-i", alta, "-t", f"{fim - ini:.3f}",
             "-filter_complex", vf, "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-g", "15",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4)])
        return c["nome"], fim - ini
    with ThreadPoolExecutor(3) as ex:
        for nome, d in ex.map(um, falta):
            print(f"  ✓ {nome} ({d:.1f}s)")
    for c in falta:
        feitos[c["nome"]] = c
    (saida / "_cortes.json").write_text(json.dumps(feitos, ensure_ascii=False, indent=1), "utf8")
    for t in cache.glob("_track_*.txt"):
        t.unlink()
    print(f"OK: {len(falta)} cortes em {saida}")


def recortar(slug: str):
    """recortes.json [{nome,t,desc}] -> assets/recortes/<nome>.png (fundo removido, rembg isnet) + _RECORTES.jpg."""
    from io import BytesIO
    from PIL import Image
    from rembg import new_session, remove
    pasta = next(reversed(pastas.ordenar(p for p in PROJ.glob(f"*{slug}") if p.is_dir())), None) or sys.exit(f"projeto {slug} não achado")
    itens = json.loads((pasta / "recortes.json").read_text("utf8"))
    saida = pasta / "assets" / "recortes"
    saida.mkdir(parents=True, exist_ok=True)
    falta = [i for i in itens if not (saida / f"{i['nome']}.png").exists()]
    if falta:
        alta = _url_alta(json.loads((pasta / "cortes.json").read_text("utf8"))["fonte"])
        sess = new_session("isnet-general-use")
        for i in falta:
            jpg = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{seg(i['t']):.3f}", "-i", alta, "-frames:v", "1",
                                  "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
            img = remove(Image.open(BytesIO(jpg)), session=sess, post_process_mask=True)
            bbox = img.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
            (img.crop(bbox) if bbox else img).save(saida / f"{i['nome']}.png")
            print(f"  ✓ {i['nome']}")
    # conferência: todos sobre xadrez numa imagem só
    pngs = [Image.open(saida / f"{i['nome']}.png") for i in itens]
    th = 260
    tiles = [p.resize((max(1, int(p.width * th / p.height)), th)) for p in pngs]
    folha = Image.new("RGB", (sum(t.width for t in tiles) + 10 * len(tiles), th), "#d9c9c0")
    x = 0
    for t in tiles:
        folha.paste(t, (x, 0), t)
        x += t.width + 10
    (pasta / "previa").mkdir(exist_ok=True)
    folha.save(pasta / "previa" / "_RECORTES.jpg", quality=80)
    print(f"OK: {len(itens)} recortes em {saida} · conferência: previa/_RECORTES.jpg")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    if a[0] == "analisar":
        analisar(a[1], "--whisper" in a)
    elif a[0] == "cortar":
        cortar(a[1])
    elif a[0] == "recortar":
        recortar(a[1])
    elif a[0] == "limpar":
        shutil.rmtree(CACHE / a[1], ignore_errors=True)
        print("cache apagado")
    else:
        sys.exit(__doc__)
