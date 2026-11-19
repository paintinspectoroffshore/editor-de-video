"""Trata uma gravação de voz caseira até o padrão de locução (sem IA, só ffmpeg).

    python tratar.py <entrada> <saida.wav> [--ia] [--cortar 30.36-30.42 ...] [--trecho 0-15.9]

--ia: antes de tudo, a IA MossFormer2 48 kHz (ClearerVoice-Studio, Apache 2.0, CPU, ~1,2 s por s de áudio)
tira ruído, eco e o chiado da compressão do WhatsApp. Resultado guardado em cache (<entrada>.ia.wav).

Cadeia: corta trechos errados (com fade de 10 ms) → tira estouro → corta grave/ronco →
tira ruído de fundo leve → limpa "embolado" (300 Hz) → presença (3,5 kHz) → tira chiado do "s" →
compressor → corta pausas (sobra 0,12 s) → −14 LUFS.
"""
import argparse, subprocess, sys
from pathlib import Path
import numpy as np

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
SR = 48000
CADEIA = ",".join([
    "adeclip",
    "highpass=f=80",
    "equalizer=f=170:t=q:w=1:g=2",          # corpo/calor (tira o som oco)
    "equalizer=f=3000:t=q:w=1.2:g=1.5",
    "equalizer=f=10000:t=h:w=1:g=1.5",
    "deesser=i=0.4",
    "acompressor=threshold=-21dB:ratio=2.5:attack=10:release=120:makeup=1.5",
    "silenceremove=start_periods=1:start_threshold=-42dB:stop_periods=-1:stop_duration=0.15:stop_threshold=-45dB",
    "loudnorm=I=-14:TP=-1.5:LRA=8",
    f"aresample={SR}",
])


AQUI = Path(__file__).resolve().parent
MOTOR = AQUI  # .venv + modelos ficam nesta pasta
RUIDO = "afftdn=nr=10:nf=-50:tn=1"  # só sem --ia (a IA já tira o ruído)


def _ia(entrada: Path) -> Path:
    entrada = entrada.resolve()
    alvo = entrada.with_suffix(".ia.wav")
    if alvo.exists() and alvo.stat().st_mtime > entrada.stat().st_mtime:
        return alvo
    tmp = alvo.with_suffix(".48k.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(entrada), "-ar", "48000", "-ac", "1", str(tmp)], check=True)
    cod = ("from clearvoice import ClearVoice;"
           "cv=ClearVoice(task='speech_enhancement',model_names=['MossFormer2_SE_48K']);"
           f"cv.write(cv(input_path=r'{tmp}',online_write=False),output_path=r'{alvo}')")
    subprocess.run([str(MOTOR / ".venv/Scripts/python"), "-c", cod], cwd=MOTOR / "modelos", check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    tmp.unlink()
    return alvo


def _ler(arq):
    pcm = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(arq), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(pcm, np.float32).copy()


def _cortar(a, ini, fim, fade=0.01):
    i, f, n = int(ini * SR), int(fim * SR), int(fade * SR)
    antes, depois = a[:i], a[f:]
    rampa = np.linspace(1, 0, n, dtype=np.float32)
    meio = antes[-n:] * rampa + depois[:n] * (1 - rampa)
    return np.concatenate([antes[:-n], meio, depois[n:]])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("entrada"); p.add_argument("saida")
    p.add_argument("--cortar", nargs="*", default=[])
    p.add_argument("--trecho")
    p.add_argument("--ia", action="store_true")
    o = p.parse_args()
    a = _ler(_ia(Path(o.entrada)) if o.ia else o.entrada)
    cadeia = CADEIA if o.ia else CADEIA.replace("highpass=f=80,", f"highpass=f=80,{RUIDO},")
    if o.trecho:
        i, f = map(float, o.trecho.split("-"))
        a = a[int(i * SR):int(f * SR)]
    for c in sorted(o.cortar, key=lambda x: -float(x.split("-")[0])):  # do fim para o começo
        a = _cortar(a, *map(float, c.split("-")))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-af", cadeia, "-c:a", "pcm_s16le", o.saida], input=a.tobytes(), check=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o.saida]))
    print(f"{Path(o.saida).name}: {len(a) / SR:.1f}s → {dur:.1f}s")


if __name__ == "__main__":
    main()
