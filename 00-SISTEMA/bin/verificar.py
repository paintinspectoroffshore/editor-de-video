"""Confere se a máquina tem tudo para o Editor de Vídeo funcionar igual ao original.

    python verificar.py          # relatório completo (✅/❌ por item)
    python verificar.py --hook   # silencioso se estiver tudo certo; se faltar algo, imprime a ordem para o Claude

Obrigatórios: Python 3.10+, FFmpeg, yt-dlp, Node, bibliotecas Python, node_modules do Remotion e da captura.
Opcionais (avisa, não bloqueia): cloudflared, modelo Whisper em cache, chaves de API.
Conserto: `./instalar.ps1` na raiz do projeto (Windows). Em Mac/Linux: veja README.md, seção "Sem Windows".
"""
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SEG = RAIZ / "00-SISTEMA" / "segredos"
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def _winget_ffmpeg():
    base = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages"
    for exe in base.glob("Gyan.FFmpeg*/**/bin/ffmpeg.exe"):
        return exe
    return None


def _ver(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        return (r.stdout or r.stderr).strip().splitlines()[0][:60]
    except Exception:
        return None


def checar():
    obrig, opc = [], []   # (nome, ok, detalhe)
    py = sys.version_info
    obrig.append(("Python 3.10+", py >= (3, 10), f"{py.major}.{py.minor}.{py.micro}"))
    ff = shutil.which("ffmpeg") or _winget_ffmpeg()
    obrig.append(("FFmpeg", bool(ff), _ver([str(ff), "-version"]) if ff else "não encontrado (winget install Gyan.FFmpeg)"))
    ytp = shutil.which("yt-dlp")
    ytv = _ver([ytp, "--version"]) if ytp else _ver([sys.executable, "-m", "yt_dlp", "--version"])
    obrig.append(("yt-dlp", bool(ytv), ytv or "não encontrado (python -m pip install yt-dlp)"))
    nd = shutil.which("node")
    obrig.append(("Node.js", bool(nd), _ver(["node", "--version"]) if nd else "não encontrado (winget install OpenJS.NodeJS.LTS)"))
    for mod, pip in (("faster_whisper", "faster-whisper"), ("numpy", "numpy"), ("PIL", "pillow"), ("cv2", "opencv-python"),
                     ("edge_tts", "edge-tts"), ("soundfile", "soundfile")):
        ok = importlib.util.find_spec(mod) is not None
        obrig.append((f"Python: {pip}", ok, "ok" if ok else f"python -m pip install {pip}"))
    for nome, pasta in (("Remotion (node_modules)", RAIZ / "FERRAMENTAS" / "Remotion" / "node_modules"),
                        ("Captura (node_modules)", RAIZ / "00-SISTEMA" / "captura" / "node_modules")):
        obrig.append((nome, pasta.is_dir(), "ok" if pasta.is_dir() else f"npm install em {pasta.parent.relative_to(RAIZ)}"))
    for d in ("PROJETOS", "CARROSSEIS", "PESQUISA", "VIDEOS PRONTOS", "VIDEO BRUTO/_inbox", "00-SISTEMA/cache"):
        (RAIZ / d).mkdir(parents=True, exist_ok=True)   # pasta de trabalho: criar é seguro

    exe = RAIZ / "00-SISTEMA" / "ferramentas" / "cloudflared.exe"
    opc.append(("cloudflared (piloto automático)", exe.exists() or bool(shutil.which("cloudflared")), "baixe via instalar.ps1"))
    hf = Path.home() / ".cache" / "huggingface" / "hub"
    whisper = any(hf.glob("models--Systran--faster-whisper-small*")) if hf.exists() else False
    opc.append(("Modelo Whisper small (baixa sozinho no 1º uso, ~460 MB)", whisper, "será baixado na primeira legenda"))

    def tem(arq):
        p = SEG / arq
        return p.exists() and "COLE_AQUI" not in p.read_text(encoding="utf-8", errors="ignore") and "TOKEN_" not in p.read_text(encoding="utf-8", errors="ignore")
    opc.append(("Chave ElevenLabs (senão usa edge-tts grátis)", tem("elevenlabs.key"), "00-SISTEMA/segredos/elevenlabs.key"))
    opc.append(("API do Instagram (senão publica manual/Metricool)", tem("instagram.json"), "00-SISTEMA/segredos/instagram.json"))
    opc.append(("Telegram do piloto (senão aprova no chat)", tem("telegram.key"), "00-SISTEMA/segredos/telegram.key"))
    return obrig, opc


def main():
    obrig, opc = checar()
    falta = [n for n, ok, _ in obrig if not ok]
    if "--hook" in sys.argv:
        if falta:
            print("AMBIENTE INCOMPLETO — faltam: " + "; ".join(falta) + ". ANTES de produzir qualquer coisa: "
                  "rode `powershell -ExecutionPolicy Bypass -File ./instalar.ps1` na raiz do projeto (Windows), "
                  "depois `python 00-SISTEMA/bin/verificar.py`. Se o instalador acabou de instalar FFmpeg/Node/Python, "
                  "peça ao usuário para fechar e abrir o terminal/Claude Code e rode de novo. "
                  "Avise o usuário em português simples o que está faltando e o que você vai instalar.")
        return 1 if falta else 0
    print("OBRIGATÓRIO")
    for n, ok, d in obrig:
        print(f"  {'✅' if ok else '❌'} {n}: {d}")
    print("OPCIONAL")
    for n, ok, d in opc:
        print(f"  {'✅' if ok else '⚠️ '} {n}" + ("" if ok else f" → {d}"))
    print("\nRESULTADO: " + ("TUDO PRONTO ✅" if not falta else f"FALTA {len(falta)} item(ns) ❌ → rode ./instalar.ps1"))
    return 1 if falta else 0


if __name__ == "__main__":
    sys.exit(main())
