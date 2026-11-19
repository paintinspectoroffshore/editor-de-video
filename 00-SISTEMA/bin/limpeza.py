"""Faxina segura do projeto (regras em REFERÊNCIAS/ORGANIZACAO.md). Nunca apaga fonte, entrega nem ferramenta.

Uso:
  python -I 00-SISTEMA/bin/limpeza.py           # relatório + faxina segura
  python -I 00-SISTEMA/bin/limpeza.py --so-ver  # só relatório

Faz: duplicatas em PROJETOS/ viram link do mesmo arquivo (0 perda), apaga __pycache__, pastas vazias,
cópia velha do celular, lotes temporários de referência. Avisa (não apaga): arquivo solto na raiz,
vídeo esquecido na PESQUISA (deveria ir para o CATALOGO), cache do YouTube de série encerrada, pastas _teste/_backup/tmp.
"""
import collections, hashlib, os, shutil, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
R = Path(__file__).resolve().parents[2]
SO_VER = "--so-ver" in sys.argv
RAIZ_OK = {"00-SISTEMA", "CARROSSEIS", "CLAUDE.md", "FERRAMENTAS", "PASSO-A-PASSO.md", "PESQUISA", "PROJETOS",
           "REFERÊNCIAS", "VIDEO BRUTO", "VIDEOS PRONTOS", "skills-lock.json", ".claude", ".mcp.json", "YOUTUBE"}
liberado, avisos = 0, []


def mb(n): return f"{n / 1e6:.1f} MB"


def tam(p: Path) -> int:
    return sum(f.stat().st_size for f in p.rglob("*") if f.is_file()) if p.is_dir() else p.stat().st_size


# 1) duplicatas em PROJETOS (v1/v2/v3 do mesmo vídeo) -> hardlink
grupos = collections.defaultdict(list)
for f in (R / "PROJETOS").rglob("*"):
    if f.is_file() and f.stat().st_size > 500_000:
        grupos[(f.stat().st_size, hashlib.md5(f.read_bytes()).hexdigest())].append(f)
for (t, _), fs in grupos.items():
    for d in fs[1:]:
        if os.stat(d).st_ino != os.stat(fs[0]).st_ino:
            if not SO_VER:
                tmp = d.with_name(d.name + ".tmp_link"); os.link(fs[0], tmp); os.replace(tmp, d)
            liberado += t

# 2) lixo regenerável
lixo = list(R.glob("00-SISTEMA/**/__pycache__")) + list((R / "00-SISTEMA/cache/celular").glob("*.mp4"))
lixo += [p for p in (R / "REFERÊNCIAS").glob("_lote*")] + [R / "REFERÊNCIAS/_downloads"]
for p in lixo:
    if p.exists():
        liberado += tam(p)
        if not SO_VER:
            shutil.rmtree(p) if p.is_dir() else p.unlink()

# 3) avisos (decisão humana)
for p in R.iterdir():
    if p.name not in RAIZ_OK:
        avisos.append(f"solto na raiz: {p.name}")
for p in (R / "PESQUISA").rglob("*.mp4"):
    avisos.append(f"vídeo na PESQUISA (promova: catalogar.py nova auto ... viral): {p.relative_to(R)}")
for p in list((R / "PROJETOS").rglob("*")) + list((R / "CARROSSEIS").rglob("*")):
    if p.is_dir() and any(k in p.name.lower() for k in ("_teste", "_backup", "tmp", "render_bruto")):
        avisos.append(f"pasta temporária: {p.relative_to(R)}")
yt = R / "00-SISTEMA/cache/youtube"
for p in (yt.iterdir() if yt.exists() else []):
    avisos.append(f"cache YouTube {p.name} ({mb(tam(p))}): se a série acabou, `cortes.py limpar {p.name}`")
for p in sorted((R / "PROJETOS").iterdir()):
    if not (p / "roteiro.json").exists() and not (p / "ROTEIRO.md").exists():
        avisos.append(f"projeto sem roteiro (lixo?): {p.name}")

if not SO_VER:
    for d in sorted((R / "PROJETOS").rglob("*"), key=lambda x: -len(x.parts)):
        if d.is_dir() and not any(d.iterdir()):
            d.rmdir()

print(("Liberaria " if SO_VER else "Liberado ") + mb(liberado))
for a in avisos:
    print("⚠️ " + a)
print("Tamanhos:", " · ".join(f"{n} {mb(tam(R / n))}" for n in ("PROJETOS", "VIDEOS PRONTOS", "REFERÊNCIAS", "CARROSSEIS", "PESQUISA")))
