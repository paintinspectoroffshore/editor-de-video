"""Talking head: prepara a gravação de uma pessoa falando para o estilo SplitTH.

    python rosto.py preparar <slug> <video> [--ini S] [--fim S] [--pausa 0.12] [--limiar -30]
                                           [--marca 1.1,11.2,...]

Faz, de uma vez e sem gastar crédito:
  1. corta as pausas (silêncio > --pausa vira --pausa; vídeo e áudio cortados juntos = jump cut);
  2. limpa o áudio (passa-alta 80 Hz, redução de ruído FFT, passa-baixa, fades de 6 ms em cada corte);
  3. escala o quadro todo para 1080x1920 (a janela de 1080x1152 que aparece é movida pela composição, `rosto.janelas`;
     legenda queimada e selo de usuário do original ficam fora da janela se y <= 310);
  grava  PROJETOS/<slug>/assets/rosto.mp4 (mudo, 1080x1920, 30 fps) e audio/narracao.wav (48 kHz mono)
  e audio/_cortes.json (mapa tempo original -> tempo novo). --marca converte instantes do original.
Depois: escreva roteiro.json (composicao "SplitTH"), rode `produzir.py legendas` (use "idioma" no roteiro) e `previa`.
"""
import json
import re
import subprocess
import sys
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[2]


def _arg(nome, padrao, tipo=float):
    if nome in sys.argv:
        return tipo(sys.argv[sys.argv.index(nome) + 1])
    return padrao


def _info(video: Path):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,duration",
                                   "-of", "json", str(video)], capture_output=True, text=True).stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    return int(v["width"]), int(v["height"]), float(v["duration"])


def _silencios(video: Path, limiar: float, minimo: float):
    p = subprocess.run(["ffmpeg", "-nostdin", "-i", str(video), "-vn", "-af", f"silencedetect=n={limiar}dB:d={minimo}",
                        "-f", "null", "-"], capture_output=True, text=True)
    ini, fim, res = None, None, []
    for m in re.finditer(r"silence_(start|end): ([0-9.]+)", p.stderr):
        if m.group(1) == "start":
            ini = float(m.group(2))
        elif ini is not None:
            res.append([ini, float(m.group(2))])
            ini = None
    return res


def preparar(slug: str, video: Path):
    cand = sorted((RAIZ / "PROJETOS").glob(f"*_{slug}"))
    if not cand:
        sys.exit(f"Projeto não encontrado: {slug} (rode produzir.py novo {slug})")
    proj = cand[-1]
    pausa, limiar = _arg("--pausa", 0.12), _arg("--limiar", -30.0)
    w, h, dur = _info(video)
    ini, fim = _arg("--ini", 0.0), _arg("--fim", dur)
    # silêncios -> fundir vizinhos (<0.1 s entre eles) -> cortar o miolo, deixando metade da pausa em cada ponta
    sil = [s for s in _silencios(video, limiar, pausa + 0.04) if s[1] > ini and s[0] < fim]
    fund = []
    for s in sil:
        if fund and s[0] - fund[-1][1] < 0.1:
            fund[-1][1] = s[1]
        else:
            fund.append(list(s))
    cortes = []
    for s0, s1 in fund:
        a, b = max(s0, ini), min(s1, fim)
        if b - a > pausa + 0.04:
            cortes.append((a + pausa / 2, b - pausa / 2))
    manter, cur = [], ini
    for a, b in cortes:
        if a > cur:
            manter.append((cur, a))
        cur = b
    if cur < fim:
        manter.append((cur, fim))
    manter = [(a, b) for a, b in manter if b - a > 0.05]

    # mapa original -> novo
    mapa, t = [], 0.0
    for a, b in manter:
        mapa.append({"de": round(a, 3), "ate": round(b, 3), "novo": round(t, 3)})
        t += b - a
    total = t

    fv, fa = [], []
    for i, (a, b) in enumerate(manter):
        fv.append(f"[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS[v{i}]")
        d = b - a
        fa.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={max(d - 0.006, 0):.3f}:d=0.006[a{i}]")
    n = len(manter)
    filtro = (";".join(fv + fa) + ";" + "".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0,"
              f"scale=1080:1920:flags=lanczos,fps=30,format=yuv420p[vo];"
              + "".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1,"
              "highpass=f=80,afftdn=nr=16:nf=-32:tn=1,lowpass=f=14000,aresample=48000,aformat=channel_layouts=mono[ao]")
    (proj / "assets").mkdir(exist_ok=True)
    (proj / "audio").mkdir(exist_ok=True)
    script = proj / "audio" / "_filtro.txt"
    script.write_text(filtro, encoding="utf-8")
    saida_v, saida_a = proj / "assets" / "rosto.mp4", proj / "audio" / "narracao.wav"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(video), "-/filter_complex", str(script),
                    "-map", "[vo]", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-g", "30", str(saida_v),
                    "-map", "[ao]", "-c:a", "pcm_s16le", str(saida_a)], check=True)
    script.unlink()
    (proj / "audio" / "_cortes.json").write_text(json.dumps(mapa, indent=1), encoding="utf-8")
    print(f"rosto.mp4 + narracao.wav prontos: {total:.2f}s (original {fim - ini:.2f}s, {len(cortes)} pausas cortadas)")

    def novo(t0):
        for m in mapa:
            if m["de"] <= t0 <= m["ate"]:
                return m["novo"] + t0 - m["de"]
        prox = [m for m in mapa if m["de"] > t0]
        return prox[0]["novo"] if prox else total
    if "--marca" in sys.argv:
        marcas = [float(x) for x in sys.argv[sys.argv.index("--marca") + 1].split(",")]
        print("marcas (original -> novo): " + "  ".join(f"{m}->{novo(m):.2f}" for m in marcas))


if __name__ == "__main__":
    if len(sys.argv) < 4 or sys.argv[1] != "preparar":
        sys.exit(__doc__)
    preparar(sys.argv[2], Path(sys.argv[3]))
