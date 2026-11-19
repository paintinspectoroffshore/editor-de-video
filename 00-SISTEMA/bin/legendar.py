#!/usr/bin/env python3
"""
Transcreve audio/video e gera legenda palavra-a-palavra.

    python legendar.py <arquivo> [--modelo small] [--idioma pt] [--saida pasta]

Gera, ao lado do arquivo de saida:
    <nome>.words.json  -> [{word, start, end}]  consumido pelo Remotion
    <nome>.srt         -> legenda convencional
    <nome>.txt         -> transcricao corrida

Le o audio via FFmpeg (evita o decoder interno do faster-whisper, que quebra
com PyAV >= 16).
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

TAXA = 16000


def carregar_audio(caminho: Path) -> np.ndarray:
    proc = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(caminho),
         "-f", "f32le", "-ac", "1", "-ar", str(TAXA), "-"],
        capture_output=True,
    )
    if proc.returncode != 0:
        sys.exit(f"FFmpeg falhou: {proc.stderr.decode(errors='replace')}")
    return np.frombuffer(proc.stdout, dtype=np.float32)


def ts(segundos: float) -> str:
    ms = int(round(segundos * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("arquivo")
    ap.add_argument("--modelo", default="small")
    ap.add_argument("--idioma", default="pt")
    ap.add_argument("--saida", default=None)
    args = ap.parse_args()

    entrada = Path(args.arquivo).resolve()
    if not entrada.exists():
        sys.exit(f"Nao encontrei: {entrada}")
    destino = Path(args.saida).resolve() if args.saida else entrada.parent
    destino.mkdir(parents=True, exist_ok=True)

    print(f"[1/3] lendo audio de {entrada.name}")
    audio = carregar_audio(entrada)

    print(f"[2/3] transcrevendo (modelo {args.modelo})")
    modelo = WhisperModel(args.modelo, device="cpu", compute_type="int8")
    segmentos, _ = modelo.transcribe(
        audio, language=args.idioma, word_timestamps=True, vad_filter=True
    )

    palavras, linhas_srt, texto = [], [], []
    for i, seg in enumerate(segmentos, 1):
        texto.append(seg.text.strip())
        linhas_srt.append(f"{i}\n{ts(seg.start)} --> {ts(seg.end)}\n{seg.text.strip()}\n")
        for w in seg.words or []:
            palavras.append(
                {"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)}
            )

    base = destino / entrada.stem
    base.with_suffix(".words.json").write_text(
        json.dumps(palavras, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    base.with_suffix(".srt").write_text("\n".join(linhas_srt), encoding="utf-8")
    base.with_suffix(".txt").write_text(" ".join(texto), encoding="utf-8")

    dur = palavras[-1]["end"] if palavras else 0
    ppm = len(palavras) / dur * 60 if dur else 0
    print(f"[3/3] {len(palavras)} palavras | {dur:.1f}s | {ppm:.0f} palavras/min")
    print(f"      -> {base.with_suffix('.words.json').name}")


if __name__ == "__main__":
    main()
