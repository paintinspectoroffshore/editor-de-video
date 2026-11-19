#!/usr/bin/env python3
"""
Garimpo de Reels virais: ranking, download, transcrição e mosaico.
A coleta é feita no Instagram logado do Chrome com 00-SISTEMA/captura/garimpo.js (ver skill `piloto`/REFERÊNCIAS/AUTOMACAO.md §7).

    python -I garimpar.py ranquear <coleta.json> <pasta>   # coleta → RANKING.md (score = curtidas + 3×comentários)
    python -I garimpar.py baixar   <pasta> <cod1> <cod2> ...   # NN-VIDEO.mp4 + NN-ROTEIRO.txt + NN-QUADROS.jpg
    python -I garimpar.py ganchos  <pasta> <cod1> <cod2> ...   # 15 primeiros segundos (8 quadros + fala): GANCHOS_n.jpg + GANCHOS.json (apaga os mp4)

Por que assim:
- Curtidas/comentários vêm da meta tag pública da página do post (sem API interna).
- Envios (shares) de terceiros NÃO são públicos em lugar nenhum (nem na API oficial).
- Transcrição local (faster-whisper, CPU): 0 tokens, 0 créditos.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding="utf-8", errors="replace")

BIN = Path(__file__).resolve().parent


def score(r):
    return r["curtidas"] + 3 * r["comentarios"]


def ranquear(coleta: Path, pasta: Path):
    dados = json.loads(coleta.read_text(encoding="utf-8"))
    linhas = [dict(zip(["cod", "curtidas", "comentarios", "perfil", "video", "data", "legenda"], d))
              for d in dados if len(d) >= 7]
    linhas.sort(key=score, reverse=True)
    pasta.mkdir(parents=True, exist_ok=True)
    out = ["# Ranking do garimpo", "", f"{len(linhas)} posts. Score = curtidas + 3×comentários. 🎬 = Reel.", "",
           "| # | Score | Curtidas | Coment. | Tipo | Data | Início da legenda | Link |", "|---|---|---|---|---|---|---|---|"]
    for i, r in enumerate(linhas[:40], 1):
        tipo = "🎬" if r["video"] else "🖼️"
        url = f"https://www.instagram.com/{'reel' if r['video'] else 'p'}/{r['cod']}/"
        leg = r["legenda"].replace("|", "/")[:70]
        out.append(f"| {i} | {score(r):,} | {r['curtidas']:,} | {r['comentarios']:,} | {tipo} | {r['data']} | {leg} | {url} |")
    (pasta / "RANKING.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"RANKING: {pasta / 'RANKING.md'}  (top 5 Reels abaixo)")
    for r in [x for x in linhas if x["video"]][:5]:
        print(f"  {score(r):>9,}  {r['cod']}  {r['legenda'][:50]}")


def _transcrever(video: Path) -> tuple[str, float]:
    sys.path.insert(0, str(BIN))
    from legendar import carregar_audio  # noqa: E402
    from faster_whisper import WhisperModel
    audio = carregar_audio(video)
    modelo = WhisperModel("small", device="cpu", compute_type="int8")
    segs, info = modelo.transcribe(audio, language="pt", vad_filter=True)
    linhas = [f"[{int(s.start // 60):02d}:{s.start % 60:04.1f}] {s.text.strip()}" for s in segs]
    return "\n".join(linhas), info.duration


def _quadros(video: Path, saida: Path, n=8):
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)],
                               capture_output=True, text=True).stdout.strip() or 0)
    fps = max(n / max(dur, 1), 0.05)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(video), "-vf",
                    f"fps={fps:.4f},scale=270:-2,tile={n // 2}x2:padding=6:color=black", "-frames:v", "1", "-q:v", "4", str(saida)])


def baixar(pasta: Path, codigos: list[str]):
    pasta.mkdir(parents=True, exist_ok=True)
    for i, cod in enumerate(codigos, 1):
        nn = f"{i:02d}"
        mp4 = pasta / f"{nn}-VIDEO.mp4"
        info = pasta / f"_{nn}.info.json"
        if not mp4.exists():
            subprocess.run(["yt-dlp", f"https://www.instagram.com/reel/{cod}/", "-q", "--no-warnings",
                            "-f", "b[ext=mp4]/bv*+ba/b", "--merge-output-format", "mp4",
                            "-o", str(mp4), "--write-info-json", "-o", f"infojson:{pasta / ('_' + nn)}"], check=False)
        if not mp4.exists():
            print(f"✗ {nn} {cod}: download falhou"); continue
        meta = json.loads(info.read_text(encoding="utf-8")) if info.exists() else {}
        texto, dur = _transcrever(mp4)
        _quadros(mp4, pasta / f"{nn}-QUADROS.jpg")
        cab = [f"{nn}-ROTEIRO  (transcrição da fala, extraída do {nn}-VIDEO.mp4)",
               f"Link: https://www.instagram.com/reel/{cod}/",
               f"Duração: {dur:.0f}s",
               f"Curtidas: {meta.get('like_count')}   Comentários: {meta.get('comment_count')}   Views: {meta.get('view_count')}",
               "", "LEGENDA DO POST:", (meta.get("description") or "").strip(), "", "FALA (com tempo):", texto or "(sem fala, vídeo só com música/texto na tela)"]
        (pasta / f"{nn}-ROTEIRO.txt").write_text("\n".join(cab) + "\n", encoding="utf-8")
        info.unlink(missing_ok=True)   # projeto limpo: o essencial já está no ROTEIRO
        print(f"✓ {nn} {cod}  {dur:.0f}s  → {nn}-VIDEO.mp4 / {nn}-ROTEIRO.txt / {nn}-QUADROS.jpg")


QUADROS_S = (0.0, 1.0, 2.0, 3.0, 5.0, 8.0, 11.0, 14.0)  # gancho (0–3 s) + desenvolvimento (até 15 s)


def ganchos(pasta: Path, codigos: list[str]):
    """Análise de gancho + contexto: 8 quadros dos 15 primeiros segundos (0,1,2,3,5,8,11,14 s) + fala dos 15 s.
    Saída: GANCHOS_1.jpg, GANCHOS_2.jpg... (10 vídeos por imagem, 1 linha cada) e GANCHOS.json. Os mp4 são apagados."""
    from PIL import Image, ImageDraw, ImageFont
    sys.path.insert(0, str(BIN))
    from legendar import carregar_audio  # noqa: E402
    from faster_whisper import WhisperModel
    pasta.mkdir(parents=True, exist_ok=True)
    tmp = pasta / "_tmp"
    tmp.mkdir(exist_ok=True)
    modelo = WhisperModel("small", device="cpu", compute_type="int8")
    dados, linhas = [], []
    fonte = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 26)
    for i, cod in enumerate(codigos, 1):
        mp4 = tmp / f"{cod}.mp4"
        if not mp4.exists():
            subprocess.run(["yt-dlp", f"https://www.instagram.com/reel/{cod}/", "-q", "--no-warnings", "-f", "b[ext=mp4]/b",
                            "-o", str(mp4)], check=False)
        if not mp4.exists():
            print(f"✗ {cod}: download falhou"); continue
        quadros = []
        for k, s in enumerate(QUADROS_S):
            q = tmp / f"{cod}_{k}.jpg"
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(s), "-i", str(mp4), "-frames:v", "1",
                            "-vf", "scale=180:-2", str(q)])
            if q.exists():
                quadros.append(Image.open(q).convert("RGB"))
        audio = carregar_audio(mp4)[: 16000 * 15]
        segs, _ = modelo.transcribe(audio, language="pt", vad_filter=True)
        fala = " ".join(s.text.strip() for s in segs)
        dados.append({"n": i, "cod": cod, "fala_15s": fala})
        if quadros:
            h = max(q.height for q in quadros)
            linha = Image.new("RGB", (60 + len(QUADROS_S) * 186, h + 6), "black")
            ImageDraw.Draw(linha).text((8, h // 2 - 14), f"{i:02d}", fill="yellow", font=fonte)
            for k, q in enumerate(quadros):
                linha.paste(q, (60 + k * 186, 3))
            linhas.append(linha)
        mp4.unlink(missing_ok=True)
        for q in tmp.glob(f"{cod}_*.jpg"):
            q.unlink()
        print(f"✓ {i:02d} {cod}: {fala[:70]}")
    for b in range(0, len(linhas), 8):
        bloco = linhas[b:b + 8]
        img = Image.new("RGB", (max(l.width for l in bloco), sum(l.height for l in bloco)), "black")
        y = 0
        for l in bloco:
            img.paste(l, (0, y)); y += l.height
        img.save(pasta / f"GANCHOS_{b // 8 + 1}.jpg", quality=80)
    (pasta / "GANCHOS.json").write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"GANCHOS: {len(dados)} vídeos → {pasta}/GANCHOS_*.jpg + GANCHOS.json")


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) >= 3 and a[0] == "ranquear":
        ranquear(Path(a[1]), Path(a[2]))
    elif len(a) >= 3 and a[0] == "ganchos":
        ganchos(Path(a[1]), a[2:])
    elif len(a) >= 3 and a[0] == "baixar":
        baixar(Path(a[1]), a[2:])
    else:
        print(__doc__)
