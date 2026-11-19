"""Catálogo de estilos — automatiza o estudo de referências (economiza tokens: Claude olha 1 imagem por lote).

Uso:
  python catalogar.py baixar  <pasta> <link> [link...]   # yt-dlp (reels, posts, carrosséis)
  python catalogar.py revisar <pasta>                     # faixas de 8 frames + _revisao.jpg + _dna_auto.json
  python catalogar.py salvar  <pasta> <escolhas.txt>      # cada escolhido vira CATALOGO/NN_nome-do-estilo/ + _FRAMES + folha nova
  python catalogar.py nova    <NN|auto> <nome-do-estilo> <tipo> <link> [arquivos...]  # referência avulsa (ex.: viral do garimpo)

escolhas.txt: uma linha por modelo  ->  NN|arquivo_sem_ext|fração(0-1)|nome-do-estilo   (NN = auto; nome único)
Regra: NUNCA nome de perfil (pasta, REF.md, DNA, índice, link). Tipos: visual | base do DNA | viral.
"""
import json, re, subprocess, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CAT = RAIZ / "REFERÊNCIAS" / "CATALOGO"
PONTOS = [0.03, 0.15, 0.28, 0.41, 0.54, 0.67, 0.80, 0.93]


def sh(*a, **k):
    return subprocess.run(list(a), capture_output=True, text=True, encoding="utf-8", errors="ignore", **k)


def duracao(v: Path) -> float:
    return float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(v)).stdout.strip() or 0)


def frame(v: Path, t: float, saida: Path, largura=None):
    vf = ["-vf", f"scale={largura}:-2"] if largura else []
    sh("ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(v), "-frames:v", "1", *vf, "-q:v", "2", str(saida))


def cortes(v: Path) -> list[float]:
    """Instantes de corte duro (detector de cena do ffmpeg)."""
    r = sh("ffmpeg", "-v", "info", "-i", str(v), "-vf", "select='gt(scene,0.32)',showinfo", "-an", "-f", "null", "-")
    return [round(float(x), 2) for x in re.findall(r"pts_time:([\d.]+)", r.stderr)]


def paleta(imgs: list[Path], n=7) -> list[str]:
    from PIL import Image
    tela = Image.new("RGB", (120 * len(imgs), 214))
    for i, p in enumerate(imgs):
        tela.paste(Image.open(p).convert("RGB").resize((120, 214)), (120 * i, 0))
    q = tela.quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: n * 3]
    cont = sorted(q.getcolors(), reverse=True)
    return ["#%02X%02X%02X" % tuple(pal[i * 3 : i * 3 + 3]) for _, i in cont]


def baixar(pasta: Path, links: list[str]):
    pasta.mkdir(parents=True, exist_ok=True)
    for l in links:
        cod = re.search(r"/(?:reel|p|tv)/([^/?]+)", l)
        url = f"https://www.instagram.com/p/{cod.group(1)}/" if cod else l
        r = sh("yt-dlp", url, "-o", str(pasta / "%(id)s.%(ext)s"), "--write-info-json",
               "-f", "best[ext=mp4]/best", "--no-progress", "-q", "--no-warnings")
        print(("ok  " if r.returncode == 0 else "ERRO") + " " + url + (" " + r.stderr[:160] if r.returncode else ""))


def revisar(pasta: Path):
    from PIL import Image, ImageDraw, ImageFont
    tir = pasta / "_tiras"; tir.mkdir(exist_ok=True)
    fonte = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
    vids = sorted(pasta.glob("*.mp4"))
    dna, linhas = {}, []
    for i, v in enumerate(vids, 1):
        d = duracao(v)
        fs = []
        for k, p in enumerate(PONTOS):
            f = tir / f"{v.stem}_{k}.jpg"; frame(v, d * p, f, 160); fs.append(f)
        info = {}
        j = v.with_suffix(".info.json")
        if j.exists():
            ij = json.loads(j.read_text(encoding="utf-8"))
            info = {"link": ij.get("webpage_url"),
                    "legenda_post": (ij.get("description") or "")[:200]}
        c = cortes(v)
        dna[v.stem] = {"n": i, **info, "duracao_s": round(d, 1), "cortes": len(c),
                       "seg_por_corte": round(d / (len(c) + 1), 1), "paleta_dominante": paleta(fs)}
        linha = Image.new("RGB", (150 + 164 * 8, 290), "black")
        dr = ImageDraw.Draw(linha)
        dr.text((6, 110), str(i), font=fonte, fill="yellow")
        dr.text((6, 140), v.stem[-11:], font=fonte, fill="white")
        dr.text((6, 170), f"{d:.0f}s {len(c)}cut", font=fonte, fill="#aaa")
        for k, f in enumerate(fs):
            linha.paste(Image.open(f).resize((160, 284)), (150 + 164 * k, 3))
        for k, h in enumerate(dna[v.stem]["paleta_dominante"]):
            dr.rectangle([6 + 20 * k, 210, 24 + 20 * k, 228], fill=h)
        linhas.append(linha)
    # folhas de até 8 vídeos
    for g in range(0, len(linhas), 8):
        bloco = linhas[g : g + 8]
        folha = Image.new("RGB", (bloco[0].width, 290 * len(bloco)))
        for k, l in enumerate(bloco):
            folha.paste(l, (0, 290 * k))
        folha.save(pasta / f"_revisao_{g // 8}.jpg", quality=80)
    (pasta / "_dna_auto.json").write_text(json.dumps(dna, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(vids)} vídeos -> {pasta}/_revisao_*.jpg e _dna_auto.json")
    for k, v in dna.items():
        print(v["n"], k, v["duracao_s"], "s", v["cortes"], "cortes", " ".join(v["paleta_dominante"][:5]))


def proximo() -> int:
    return max([int(d.name[:2]) for d in CAT.iterdir() if d.is_dir() and d.name[:2].isdigit()] + [0]) + 1


def quadros(v: Path, saida: Path):
    d = duracao(v) or 1
    sh("ffmpeg", "-v", "error", "-y", "-i", str(v), "-vf", f"fps=8/{d:.2f},scale=240:-2,tile=8x1", "-frames:v", "1", "-q:v", "4", str(saida))


def ficha(pasta: Path, n, nome, desc, tipo, link, extra=""):
    """REF.md + linha no INDICE + imagem rápida em _FRAMES (link do mesmo arquivo). Nunca grava perfil."""
    import os
    link = re.sub(r"instagram\.com/[A-Za-z0-9_.]+/(reel|p)/", r"instagram.com/\1/", link)
    arqs = ", ".join(sorted(x.name for x in pasta.iterdir() if x.name != "REF.md"))
    txt = (f"# {n} · {nome}\n\n**{desc}**\n\n- **Nome do estilo (use este para pedir/achar):** `{nome}`\n- **Tipo:** {tipo}\n"
           f"- **Link:** {link}\n" + (f"{extra.strip()}\n" if extra else "") + f"- **Arquivos:** {arqs}\n"
           f"- **Imagem rápida:** `CATALOGO/_FRAMES/{n}_{nome}.jpg`\n"
           "\n> Estudo, não cópia: pegue a gramática (ritmo, layout, cor), nunca arte, texto ou personagem.\n")
    (pasta / "REF.md").write_text(txt, encoding="utf-8")
    fr = CAT / "_FRAMES" / f"{n}_{nome}.jpg"; fr.parent.mkdir(exist_ok=True)
    if (pasta / "frame.jpg").exists() and not fr.exists():
        os.link(pasta / "frame.jpg", fr)
    with open(CAT / "INDICE.md", "a", encoding="utf-8") as f:
        f.write(f"| {n} | `{nome}` | {desc} | {tipo} |  |\n")


def nova(args: list[str]):
    """nova <NN|auto> <nome-do-estilo> <tipo> <link> [arquivos...]  — descrição = nome com espaços (edite no REF.md)."""
    import shutil
    n, nome, tipo, link, *arqs = args
    n = f"{proximo():02d}" if n == "auto" else n
    assert not list(CAT.glob(f"*_{nome}")), f"nome já usado: {nome}"
    pasta = CAT / f"{n}_{nome}"; pasta.mkdir(parents=True, exist_ok=True)
    for a in map(Path, arqs):
        dest = {".mp4": "video.mp4", ".txt": "transcricao.txt", ".md": "DNA.md"}.get(a.suffix, a.name)
        if "QUADROS" in a.name.upper(): dest = "quadros.jpg"
        shutil.move(str(a), pasta / dest)
    t = pasta / "transcricao.txt"
    if t.exists():   # sem perfil em lugar nenhum
        t.write_text(re.sub(r"(?m)^Perfil:.*\n", "", t.read_text(encoding="utf-8")), encoding="utf-8")
    v = pasta / "video.mp4"
    if v.exists():
        frame(v, duracao(v) * 0.4, pasta / "frame.jpg")
        if not (pasta / "quadros.jpg").exists(): quadros(v, pasta / "quadros.jpg")
    ficha(pasta, n, nome, nome.replace("-", " "), tipo, link)
    print(f"✓ {pasta.relative_to(RAIZ)}")


def salvar(pasta: Path, escolhas: Path):
    from PIL import Image, ImageDraw, ImageFont
    novos = []
    for l in escolhas.read_text(encoding="utf-8").splitlines():
        if not l.strip() or l.startswith("#"):
            continue
        n, arq, fr, est = [x.strip() for x in l.split("|")[:4]]
        n = f"{proximo():02d}" if n == "auto" else n
        v = pasta / f"{arq}.mp4"
        dest = CAT / f"{n}_{est}"; dest.mkdir(parents=True, exist_ok=True)
        frame(v, duracao(v) * float(fr), dest / "frame.jpg"); quadros(v, dest / "quadros.jpg")
        link = ""
        j = v.with_suffix(".info.json")
        if j.exists():
            link = json.loads(j.read_text(encoding="utf-8")).get("webpage_url", "")
        ficha(dest, n, est, est.replace("-", " "), "visual", link)
        novos.append(dest / "frame.jpg")
    # mosaico do lote
    fonte = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 30)
    W, H, P, C = 270, 480, 8, 6
    R = (len(novos) + C - 1) // C
    tela = Image.new("RGB", (C * W + (C + 1) * P, R * H + (R + 1) * P), "white")
    for i, p in enumerate(novos):
        im = Image.open(p).convert("RGB").resize((W, H)); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 58, 42], fill="black"); d.text((8, 5), p.parent.name[:2], font=fonte, fill="white")
        tela.paste(im, (P + (i % C) * (W + P), P + (i // C) * (H + P)))
    nfolhas = len(list(CAT.glob("_FOLHA-DE-CONTATO-*.jpg")))
    saida = CAT / f"_FOLHA-DE-CONTATO-{nfolhas + 1}.jpg"
    tela.save(saida, quality=88)
    print(f"{len(novos)} referências salvas em CATALOGO/; folha {saida.name}. Escreva o DNA.md de cada pasta e apague {pasta}.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    cmd = sys.argv[1]
    if cmd == "nova":
        nova(sys.argv[2:]); sys.exit()
    pasta = Path(sys.argv[2])
    {"baixar": lambda: baixar(pasta, sys.argv[3:]), "revisar": lambda: revisar(pasta),
     "salvar": lambda: salvar(pasta, Path(sys.argv[3]))}[cmd]()
