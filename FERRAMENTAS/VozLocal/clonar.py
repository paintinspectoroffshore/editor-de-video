"""Narra um texto com a voz clonada do usuário (Qwen3-TTS 0.6B Base, CPU), sem erro de fala.

    .venv/Scripts/python clonar.py texto.txt saida/gta_minha_voz.wav

- Referência: 00-SISTEMA/assets/voz/minha/referencia.wav + referencia.txt (feitas por tratar.py).
  O "molde" da voz é calculado uma vez e guardado em cache (molde.pt).
- Uma frase por linha do texto; todas são geradas juntas (lote = mais rápido na CPU).
- O Whisper confere cada frase; a que errar é gerada de novo (até 2 vezes) e fica a melhor.
- Junta com respiro de 0,12 s e aplica a cadeia de limpeza (pausas, presença, −14 LUFS).
"""
import difflib, os, re, subprocess, sys, time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
MOTOR = AQUI  # .venv + modelos ficam nesta pasta
os.environ.setdefault("HF_HOME", str(MOTOR / "modelos"))
os.environ.setdefault("HF_HUB_OFFLINE", "1")
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
import numpy as np, soundfile as sf, torch

torch.set_num_threads(os.cpu_count() or 8)
MINHA = AQUI.parents[1] / "00-SISTEMA" / "assets" / "voz" / "minha"
TOMADAS = 2  # gera até 2 versões do texto inteiro e fica com a de maior acerto
NUM = {"1": "um", "2": "dois", "3": "três", "5": "cinco", "6": "seis", "7": "sete", "35": "trinta e cinco"}


def _modelo(repo):
    snap = sorted((MOTOR / "modelos/hub" / f"models--{repo.replace('/', '--')}" / "snapshots").glob("*"))
    return str(snap[-1]) if snap else repo


def _palavras(t):
    t = re.sub(r"\d+", lambda m: f" {NUM.get(m.group(), m.group())} ", t.lower())
    return re.findall(r"[a-zà-ú0-9]+", t)


def main(txt: Path, saida: Path):
    from qwen_tts import Qwen3TTSModel
    from faster_whisper import WhisperModel
    frases = [l.strip() for l in txt.read_text(encoding="utf-8").splitlines() if l.strip()]
    t0 = time.time()
    m = Qwen3TTSModel.from_pretrained(_modelo("Qwen/Qwen3-TTS-12Hz-0.6B-Base"), device_map="cpu", dtype=torch.float32)
    cache = MINHA / "molde.pt"
    if cache.exists() and cache.stat().st_mtime > (MINHA / "referencia.wav").stat().st_mtime:
        molde = torch.load(cache, weights_only=False)
    else:
        molde = m.create_voice_clone_prompt(ref_audio=str(MINHA / "referencia.wav"),
                                            ref_text=(MINHA / "referencia.txt").read_text(encoding="utf-8").strip())
        torch.save(molde, cache)
    # mesmo Whisper dos outros scripts (cache global), sem cópia de 464 MB aqui dentro
    glob_ = sorted((Path.home() / ".cache" / "huggingface" / "hub" / "models--Systran--faster-whisper-small" / "snapshots").glob("*"))
    w = WhisperModel(str(glob_[-1]) if glob_ else "small", device="cpu", compute_type="int8")
    print(f"carregado em {time.time() - t0:.0f}s", flush=True)

    texto = " ".join(frases)  # tudo numa chamada: entonação contínua, sem emenda entre frases
    tomadas = []
    for n in range(TOMADAS):
        t = time.time()
        wavs, sr = m.generate_voice_clone(text=texto, language="Portuguese", voice_clone_prompt=molde,
                                          temperature=0.8, top_p=0.9, repetition_penalty=1.05)
        a = wavs[0]
        a16 = np.interp(np.arange(0, len(a), sr / 16000), np.arange(len(a)), a).astype(np.float32)
        ouvido = " ".join(s.text for s in w.transcribe(a16, language="pt", beam_size=5)[0])
        nota = difflib.SequenceMatcher(None, _palavras(texto), _palavras(ouvido)).ratio()
        tomadas.append((nota, a))
        print(f"tomada {n + 1}: {len(a) / sr:.1f}s em {time.time() - t:.0f}s  acerto {nota:.0%}", flush=True)
        if nota >= 0.99:
            break
    nota, a = max(tomadas, key=lambda x: x[0])
    bruto = saida.with_name(saida.stem + "_bruto.wav")
    sf.write(bruto, a, sr)
    # IA tira fundo/artefato do clone; depois só o tratamento de locução (com calor, sem som oco)
    trat = AQUI / "tratar.py"
    subprocess.run(["python", str(trat), str(bruto), str(saida), "--ia"], check=True)
    for x in (bruto, bruto.with_suffix(".ia.wav")):
        x.unlink(missing_ok=True)
    print(f"PRONTO {saida.name}  acerto {nota:.0%}  tempo total {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
