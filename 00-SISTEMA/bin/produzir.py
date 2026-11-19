#!/usr/bin/env python3
"""
Pipeline de produção de Reels — do roteiro ao MP4 publicado.

    python produzir.py novo <slug>          cria PROJETOS/DD-MM-AAAA_<slug>/ com roteiro modelo
    python produzir.py voz <projeto>        narração TTS por cena (pula se houver gravação sua)
    python produzir.py legendas <projeto>   Whisper -> timestamps palavra a palavra
    python produzir.py previa <projeto>     renderiza 4 frames-chave em previa/ para revisão
    python produzir.py render <projeto>     renderiza o vídeo (Remotion)
    python produzir.py finalizar <projeto>  loudness -14 LUFS -> VIDEOS PRONTOS/NN-<slug>.mp4 (numerado, sem capa)
    python produzir.py tudo <projeto>       voz -> legendas -> render -> finalizar
    python produzir.py rapido <projeto>     voz -> legendas -> previa (_MOSAICO.jpg)   [após aprovar roteiro]
    python produzir.py entrega <projeto>    render -> finalizar -> checar (_FINAL.jpg) [após aprovar prévia]
    python produzir.py ouvir <projeto>      Whisper confere pronúncia e sincronia da narração (previa/_OUVIR.txt)
    python produzir.py celular <projeto>    cópia < 30 MB do MP4 final em cache/celular (entrega já faz sozinho)
    python produzir.py checar <projeto>     ffprobe + LUFS + mosaico de 12 frames do MP4 final
    python produzir.py limpar <projeto>     apaga intermediários (render bruto, frames soltos, cópias no Remotion)
    python produzir.py cardapio traco       gera templates/traco_blocos.md (tipos de bloco + props) do .tsx + doc
    python produzir.py montar <projeto>     ROTEIRO.md (falas `N. texto` + `→ tipo k=v`) -> roteiro.json
    python produzir.py carrossel-novo <slug> cria CARROSSEIS/DD-MM-AAAA_<slug>/ (uma pasta isolada por carrossel)
    python produzir.py carrossel <slug>     carrossel.json -> slides/slide01.jpg… (1080x1350) + _MOSAICO.jpg

Voz: ElevenLabs é o motor principal (roteiro.voz.motor="eleven", id da voz em roteiro.voz.id);
cai sozinho para edge-tts sem chave/créditos. Tempos por palavra da ElevenLabs dispensam o Whisper.

    --sem-voz (em qualquer etapa, ex.: `previa <projeto> --sem-voz`, `entrega <projeto> --sem-voz`)
    reaproveita o audio/ que já existe (narracao.wav + words/tempos): bloqueia a etapa `voz`
    e o import de eleven.py, então NENHUMA chamada à ElevenLabs (nem saldo/cache) é possível.
    Use em versões novas de um vídeo já narrado (copie audio/ com os tempos).

<projeto> = nome da pasta em PROJETOS/ (ou o slug, se for único).
"""
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pastas

RAIZ = Path(__file__).resolve().parents[2]
SISTEMA = RAIZ / "00-SISTEMA"
PROJETOS = RAIZ / "PROJETOS"
PRONTOS = RAIZ / "VIDEOS PRONTOS"
CARROSSEIS = RAIZ / "CARROSSEIS"
REMOTION = RAIZ / "FERRAMENTAS" / "Remotion"
FPS = 30
VOZ_PADRAO = "pt-BR-AntonioNeural"   # reserva grátis (edge-tts)
VELOCIDADE_PADRAO = "+12%"   # ~170-190 ppm, ritmo das referências
PAUSA_ENTRE_CENAS = 0.25     # s de respiro no fim de cada cena (só se o roteiro zerar o padrão abaixo)
# Voz padrão do projeto desde 14/11/2026 (vídeo GTA 6): Chris + eleven_v4 forçado em pt, acelerada 1.2x
# no PC e sem pausas longas. O roteiro só precisa de "voz" para fugir disso (o que vier lá vence).
# Histórico, falhas e motivos: 00-SISTEMA/VOZES.md.
VOZ_CFG_PADRAO = {"motor": "eleven", "id": "iP95p4xoKVk53GoZ742B", "modelo": "eleven_v4", "idioma": "pt",
                  "ajustes": {"stability": 0.35, "similarity_boost": 0.8},
                  "tempo": 1.2, "pausas": 0.12, "respiro": 0.08, "limiarSilencio": "-32dB"}
PRONUNCIA_GLOBAL = SISTEMA / "assets" / "voz" / "pronuncia.json"   # vale para todo vídeo; o roteiro sobrescreve
LIMITE_CELULAR = 30e6        # acima disso o arquivo não chega ao celular (Remote Control): gera cópia leve

try:   # acentos e ⚠️ no terminal do Windows sem precisar de PYTHONIOENCODING=utf-8
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

NPX = "npx.cmd" if os.name == "nt" else "npx"
PUBLIC_FIXO = {"sfx", "texturas", "musica"}   # mídia compartilhada; o resto de public/ é cópia temporária do projeto


def _public(proj: Path) -> Path:
    """Deixa em FERRAMENTAS/Remotion/public SÓ a mídia do projeto atual (não acumula cópias de projetos antigos)."""
    raiz = REMOTION / "public"
    raiz.mkdir(exist_ok=True)
    for d in raiz.iterdir():
        if d.is_dir() and d.name not in PUBLIC_FIXO and d.name != proj.name:
            shutil.rmtree(d, ignore_errors=True)
    pub = raiz / proj.name
    pub.mkdir(exist_ok=True)
    if (proj / "assets").is_dir():
        shutil.copytree(proj / "assets", pub / "assets", dirs_exist_ok=True)
    return pub


# ---------- utilidades ----------

def achar_ffmpeg() -> str:
    if shutil.which("ffmpeg"):
        return "ffmpeg"
    base = Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages"
    for exe in base.glob("Gyan.FFmpeg*/**/bin/ffmpeg.exe"):
        os.environ["PATH"] = f"{exe.parent}{os.pathsep}{os.environ['PATH']}"
        return "ffmpeg"
    sys.exit("FFmpeg não encontrado. Rode: winget install Gyan.FFmpeg")


def rodar(cmd: list, **kw) -> None:
    """Silencioso (economiza tokens); só mostra o comando se falhar ou com VERBOSO=1."""
    linha = " ".join(str(c) for c in cmd)
    if os.environ.get("VERBOSO"):
        print("  $", linha[:160])
    r = subprocess.run([str(c) for c in cmd], **kw)
    if r.returncode != 0:
        sys.exit(f"Falhou (código {r.returncode}): {linha[:300]}")


def duracao(arquivo: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(arquivo)],
        capture_output=True, text=True,
    ).stdout.strip()
    return float(out)


def achar_projeto(nome: str) -> Path:
    cand = pastas.achar(PROJETOS, nome) or []
    if len(cand) == 1:
        return cand[0]
    sys.exit(f"Projeto '{nome}' não encontrado (ou ambíguo) em {PROJETOS}")


def ler_roteiro(proj: Path) -> dict:
    return json.loads((proj / "roteiro.json").read_text(encoding="utf-8"))


def salvar_roteiro(proj: Path, r: dict) -> None:
    (proj / "roteiro.json").write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")


def frames(seg: float) -> int:
    return round(seg * FPS)


# ---------- etapas ----------

def novo(slug: str) -> None:
    slug = re.sub(r"[^a-z0-9-]+", "-", slug.lower()).strip("-")
    proj = PROJETOS / pastas.nome_novo(slug)
    if proj.exists():
        sys.exit(f"Já existe: {proj}")
    for sub in ("audio", "assets", "previa"):
        (proj / sub).mkdir(parents=True)
    shutil.copy(SISTEMA / "templates" / "roteiro.json", proj / "roteiro.json")
    # BRIEFING.md não é copiado (ficava vazio): o modelo está em 00-SISTEMA/templates/ se precisar
    print(f"Criado: {proj}")


def voz(proj: Path) -> None:
    r = ler_roteiro(proj)
    gravada = next((p for p in (proj / "audio").glob("gravacao.*")), None)
    final = proj / "audio" / "narracao.wav"

    if gravada:
        # Voz gravada por você: duração das cenas proporcional ao nº de palavras da fala.
        print(f"Usando sua gravação: {gravada.name}")
        rodar(["ffmpeg", "-y", "-v", "error", "-i", gravada, "-ac", "1", "-ar", "48000", final])
        total = duracao(final)
        pesos = [max(1, len(c["fala"].split())) for c in r["cenas"]]
        soma = sum(pesos)
        for c, w in zip(r["cenas"], pesos):
            c["duracao"] = round(total * w / soma, 3)
        salvar_roteiro(proj, r)
        return

    # guarda os tempos antigos: a etapa 'legendas' re-sincroniza os 'em' dos blocos com a voz nova
    antigos = proj / "audio" / "narracao.words.json"
    if antigos.exists() and all("duracao" in c for c in r["cenas"]):
        (proj / "audio" / "_sync_anterior.json").write_text(json.dumps(
            {"duracoes": [c["duracao"] for c in r["cenas"]], "palavras": json.loads(antigos.read_text(encoding="utf-8"))},
            ensure_ascii=False), encoding="utf-8")

    # TTS por cena: duração exata de cada cena = duração da fala + respiro.
    vozcfg = {**VOZ_CFG_PADRAO, **r.get("voz", {})}
    tmp = proj / "audio" / "_cenas"
    tmp.mkdir(parents=True, exist_ok=True)
    pron = json.loads(PRONUNCIA_GLOBAL.read_text(encoding="utf-8")) if PRONUNCIA_GLOBAL.exists() else {}
    pron = {k: v for k, v in {**pron, **r.get("pronuncia", {})}.items() if not k.startswith("_") and v}
    textos = []
    for c in r["cenas"]:
        texto = c["fala"]
        for escrito in sorted(pron, key=len, reverse=True):   # o mais longo primeiro ("GTA 5" antes de "GTA")
            texto = re.sub(rf"(?<!\w){re.escape(escrito)}(?!\w)", pron[escrito], texto)
        tag = c.get("tag") or vozcfg.get("tag")   # tag da cena, senão a do estilo da voz (estilos.json). Direção de emoção do v4 por cena: "animado", "sussurrando", ["pausa", "sorrindo"]...
        if tag:   # vai só para a voz; a legenda segue com c["fala"] e o eleven.py tira a tag dos tempos
            texto = "".join(f"[{t}] " for t in ([tag] if isinstance(tag, str) else tag)) + texto
        textos.append(texto)
    # Entrevista: roteiro.voz.vozes = {"Entrevistador": "<voice_id>"} + cena {"quem": "Entrevistador"} troca a voz da cena
    vids = [vozcfg.get("vozes", {}).get(c.get("quem"), vozcfg.get("id")) for c in r["cenas"]]

    # Motor: ElevenLabs (principal, enquanto houver crédito) -> edge-tts (reserva grátis)
    motor = vozcfg.get("motor", "eleven")
    tempos_cena = [None] * len(textos)
    if motor == "eleven":
        try:
            import eleven as E
            if not E.chave():
                raise RuntimeError("sem chave")
            modelo = vozcfg.get("modelo", E.MODELO_PADRAO)
            aj, idi = vozcfg.get("ajustes"), vozcfg.get("idioma", "")
            vids = [v or E.VOZ_PADRAO for v in vids]
            novos = [t for i, t in enumerate(textos)   # só cobra o que não está no cache
                     if not E.em_cache(t, vids[i], modelo, aj, textos[i - 1] if i else "",
                                       textos[i + 1] if i + 1 < len(textos) else "", idi)]
            print("  " + E.aviso_saldo(E.custo(novos, modelo)) + f" (a gerar: {len(novos)} de {len(textos)} cenas)")
            if novos and E.saldo()["restam"] < E.custo(novos, modelo):
                raise RuntimeError("créditos insuficientes")
            from concurrent.futures import ThreadPoolExecutor
            def gera(i):
                return E.falar(textos[i], tmp / f"c{i + 1:02}.mp3", voz=vids[i], modelo=modelo,
                               ajustes=vozcfg.get("ajustes"),
                               anterior=textos[i - 1] if i else "", seguinte=textos[i + 1] if i + 1 < len(textos) else "",
                               idioma=vozcfg.get("idioma", ""))
            with ThreadPoolExecutor(max_workers=2) as ex:     # plano grátis: 2 pedidos simultâneos
                tempos_cena = list(ex.map(gera, range(len(textos))))
            print("  voz: ElevenLabs (" + vozcfg.get("id", E.VOZ_PADRAO) + ")")
            print("  " + E.aviso_saldo())
        except Exception as e:
            print(f"  ElevenLabs indisponível ({str(e)[:140]}) -> usando edge-tts")
            motor = "edge"
            tempos_cena = [None] * len(textos)
    if motor == "edge":
        from concurrent.futures import ThreadPoolExecutor
        def gera_edge(i):
            subprocess.run([sys.executable, "-m", "edge_tts", "--voice", vozcfg.get("nome", VOZ_PADRAO),
                            f"--rate={vozcfg.get('velocidade', VELOCIDADE_PADRAO)}", "--text", textos[i],
                            "--write-media", str(tmp / f"c{i + 1:02}.mp3")], check=True, capture_output=True)
        with ThreadPoolExecutor(max_workers=6) as ex:
            list(ex.map(gera_edge, range(len(textos))))

    # 'pausas' (s): encurta todo silêncio da fala para no máximo esse valor — jump-cut de áudio, como o
    # auto-editor da skill claude-video-audio (.claude/skills/video-audio). O silêncio é medido no próprio
    # áudio (ffmpeg silencedetect), porque o eleven_v4 estica o fim da palavra por cima da pausa; os tempos
    # de cada palavra são remapeados pelo mesmo corte, então legenda e âncoras @palavra seguem sincronizadas.
    if vozcfg.get("pausas") is not None:
        maxp, cortado = float(vozcfg["pausas"]), 0.0
        limiar = vozcfg.get("limiarSilencio", "-35dB")
        for i in range(1, len(textos) + 1):
            ws, src, dst = tempos_cena[i - 1], tmp / f"c{i:02}.mp3", tmp / f"c{i:02}_p.mp3"
            total = duracao(src)
            log = subprocess.run(["ffmpeg", "-i", str(src), "-af", f"silencedetect=noise={limiar}:d={min(maxp, 0.1)}",
                                  "-f", "null", "-"], capture_output=True, text=True, errors="ignore").stderr
            ini_s = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
            fim_s = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
            sil = [(max(0.0, a), fim_s[k] if k < len(fim_s) else total) for k, a in enumerate(ini_s)]
            keep, a = [], 0.0
            for s0, s1 in sil:
                if s0 <= 0.01:                       # silêncio no começo: deixa 0,15 s (0,04 comia a 1ª sílaba de 'Tenho')
                    a = max(0.0, s1 - 0.15); continue
                if s1 >= total - 0.01:               # silêncio no fim: deixa 0,08 s
                    keep.append((a, min(total, s0 + 0.08))); a = None; break
                if s1 - s0 > maxp:
                    keep.append((a, s0 + maxp / 2)); a = s1 - maxp / 2
            if a is not None:
                keep.append((a, total))
            keep = [(k0, k1) for k0, k1 in keep if k1 - k0 > 0.005]

            def novo(t, keep=keep):   # instante no áudio original -> instante no áudio cortado
                acc = 0.0
                for k0, k1 in keep:
                    if t <= k1:
                        return round(acc + max(0.0, t - k0), 3)
                    acc += k1 - k0
                return round(acc, 3)
            if ws:
                tempos_cena[i - 1] = [{**w, "start": novo(w["start"]), "end": novo(w["end"])} for w in ws]
            filtro = "".join(f"[0:a]atrim={k0:.3f}:{k1:.3f},asetpts=PTS-STARTPTS[s{j}];" for j, (k0, k1) in enumerate(keep))
            filtro += "".join(f"[s{j}]" for j in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[o]"
            rodar(["ffmpeg", "-y", "-v", "error", "-i", src, "-filter_complex", filtro, "-map", "[o]", "-q:a", "2", dst])
            cortado += total - duracao(dst)
            dst.replace(src)
        print(f"  pausas encurtadas para no máximo {maxp}s: -{cortado:.1f}s de silêncio")

    # 'tempo' acelera/desacelera localmente sem mudar o tom (ffmpeg atempo) — ajusta a duração sem gastar crédito
    tempo = float(vozcfg.get("tempo", 1.0))
    if abs(tempo - 1) > 0.001:
        for i in range(1, len(textos) + 1):
            src, dst = tmp / f"c{i:02}.mp3", tmp / f"c{i:02}_t.mp3"
            rodar(["ffmpeg", "-y", "-v", "error", "-i", src, "-af", f"atempo={tempo}", "-q:a", "2", dst])
            dst.replace(src)
        tempos_cena = [[{**w, "start": round(w["start"] / tempo, 3), "end": round(w["end"] / tempo, 3)} for w in ws]
                       if ws else ws for ws in tempos_cena]
        print(f"  áudio acelerado localmente x{tempo}")

    partes, palavras, t_ini = [], [], 0.0
    for i, c in enumerate(r["cenas"], 1):
        mp3, wav = tmp / f"c{i:02}.mp3", tmp / f"c{i:02}.wav"
        fala = duracao(mp3)
        extra = r.get("respiroFinal", 1.2) if i == len(r["cenas"]) else 0
        alvo = frames(fala + float(vozcfg.get("respiro", PAUSA_ENTRE_CENAS)) + extra) / FPS   # alinhado ao quadro
        c["duracao"] = round(alvo, 4)
        rodar(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ac", "1", "-ar", "48000",
               "-af", f"apad,atrim=0:{alvo}", wav])
        partes.append(wav)
        if tempos_cena[i - 1]:
            palavras += [{**w, "start": round(w["start"] + t_ini, 3), "end": round(w["end"] + t_ini, 3)} for w in tempos_cena[i - 1]]
        t_ini += alvo
        pass

    lista = tmp / "lista.txt"
    lista.write_text("".join(f"file '{p.as_posix()}'\n" for p in partes), encoding="utf-8")
    rodar(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", final])
    salvar_roteiro(proj, r)
    marca = proj / "audio" / "narracao.tempos.json"
    if palavras:   # ElevenLabs já devolve o tempo de cada palavra: dispensa o Whisper
        marca.write_text(json.dumps(palavras, ensure_ascii=False), encoding="utf-8")
    elif marca.exists():
        marca.unlink()
    print(f"Narração: {final.name} ({duracao(final):.1f}s, {len(partes)} cenas, motor {motor})")


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(ch for ch in s if unicodedata.category(ch) != "Mn"))


def _alinhar(roteiro: dict, whisper: list) -> list:
    """
    Usa o TEXTO do roteiro (grafia certa) com os TEMPOS do Whisper.
    Alinha cena a cena; palavras que o Whisper ouviu diferente recebem tempo interpolado.
    """
    saida, t0 = [], 0.0
    for cena in roteiro["cenas"]:
        t1 = t0 + cena["duracao"]
        tokens = cena["fala"].split()
        ouvidas = [w for w in whisper if t0 - 0.05 <= w["start"] < t1 - 0.02]
        tempos: list = [None] * len(tokens)
        sm = difflib.SequenceMatcher(None, [_norm(t) for t in tokens], [_norm(w["word"]) for w in ouvidas], autojunk=False)
        for op, a0, a1, b0, b1 in sm.get_opcodes():
            if op == "equal" or (op == "replace" and a1 - a0 == b1 - b0):
                for k in range(a1 - a0):
                    tempos[a0 + k] = (ouvidas[b0 + k]["start"], ouvidas[b0 + k]["end"])
            elif op == "replace":
                ini, fim = ouvidas[b0]["start"], ouvidas[b1 - 1]["end"]
                pesos = [max(1, len(t)) for t in tokens[a0:a1]]
                tot, acc = sum(pesos), ini
                for k, p in enumerate(pesos):
                    d = (fim - ini) * p / tot
                    tempos[a0 + k] = (acc, acc + d)
                    acc += d
        # preenche lacunas (palavras não ouvidas) entre vizinhos conhecidos
        fala_fim = max([w["end"] for w in ouvidas], default=t1 - 0.3)
        i = 0
        while i < len(tokens):
            if tempos[i] is not None:
                i += 1
                continue
            j = i
            while j < len(tokens) and tempos[j] is None:
                j += 1
            ini = tempos[i - 1][1] if i > 0 else (ouvidas[0]["start"] if ouvidas else t0)
            fim = tempos[j][0] if j < len(tokens) else fala_fim
            fim = max(fim, ini + 0.12 * (j - i))
            pesos = [max(1, len(t)) for t in tokens[i:j]]
            tot, acc = sum(pesos), ini
            for k, p in enumerate(pesos):
                d = (fim - ini) * p / tot
                tempos[i + k] = (acc, acc + d)
                acc += d
            i = j
        saida += [{"word": t, "start": round(a, 3), "end": round(b, 3)} for t, (a, b) in zip(tokens, tempos)]
        t0 = t1
    return saida


def legendas(proj: Path) -> None:
    audio = proj / "audio" / "narracao.wav"
    if not audio.exists():
        sys.exit("Sem narração. Rode a etapa 'voz' antes.")
    arq = proj / "audio" / "narracao.words.json"
    tempos = proj / "audio" / "narracao.tempos.json"
    if tempos.exists() and tempos.stat().st_mtime >= audio.stat().st_mtime - 5:
        print("  tempos vieram da ElevenLabs — Whisper dispensado")
        bruto = json.loads(tempos.read_text(encoding="utf-8"))
    else:
        rodar([sys.executable, SISTEMA / "bin" / "legendar.py", audio, "--saida", proj / "audio",
               "--idioma", ler_roteiro(proj).get("idioma", "pt")])   # "idioma": "es" no roteiro (talking head em espanhol etc.)
        bruto = json.loads(arq.read_text(encoding="utf-8"))
        (proj / "audio" / "narracao.whisper.json").write_text(json.dumps(bruto, ensure_ascii=False), encoding="utf-8")
    r = ler_roteiro(proj)
    alinhado = _alinhar(r, bruto)
    arq.write_text(json.dumps(alinhado, ensure_ascii=False, indent=1), encoding="utf-8")
    sync = proj / "audio" / "_sync_anterior.json"
    if sync.exists():
        _ressincronizar(proj, r, json.loads(sync.read_text(encoding="utf-8")), alinhado)
        sync.unlink()
    print(f"  legenda alinhada ao roteiro: {len(alinhado)} palavras (whisper ouviu {len(bruto)})")


def _ressincronizar(proj: Path, r: dict, ant: dict, novas: list) -> None:
    """Voz trocada: move cada 'em'/'tempos' dos blocos junto com a palavra em que estava ancorado
    (mapa linear por trechos: tempo antigo -> tempo novo, palavra a palavra, cena a cena)."""
    velhas, dur_v = ant["palavras"], ant["duracoes"]
    if len(velhas) != len(novas) or len(dur_v) != len(r["cenas"]):
        print("  aviso: roteiro mudou de tamanho — 'em' dos blocos não foram re-sincronizados")
        return
    iv = inn = 0
    t0v = t0n = 0.0
    k = 0
    for c, dv in zip(r["cenas"], dur_v):
        dn = c["duracao"]
        n = len(c["fala"].split())
        pares = [(0.0, 0.0)] + [(velhas[k + j]["start"] - t0v, novas[k + j]["start"] - t0n) for j in range(n)] + [(dv, dn)]
        pares.sort()
        def mapa(t: float) -> float:
            for (a0, b0), (a1, b1) in zip(pares, pares[1:]):
                if t <= a1:
                    return round(b0 + (b1 - b0) * ((t - a0) / (a1 - a0) if a1 > a0 else 0), 2)
            return round(min(dn - 0.3, t * dn / dv), 2)
        def anda(o, dentro_tempos=False):
            if isinstance(o, dict):
                for key, v in o.items():
                    if isinstance(v, (int, float)) and (key == "em" or dentro_tempos):
                        o[key] = mapa(v)
                    elif isinstance(v, list) and dentro_tempos:
                        o[key] = [mapa(x) if isinstance(x, (int, float)) else x for x in v]
                    else:
                        anda(v, key == "tempos")
            elif isinstance(o, list):
                for x in o:
                    anda(x, dentro_tempos)
        anda(c["blocos"])
        k += n
        t0v += dv
        t0n += dn
    salvar_roteiro(proj, r)
    print("  blocos re-sincronizados com a voz nova (ancorados palavra a palavra)")


def _ancorar(proj: Path, r: dict, cenas: list) -> None:
    """`"em": "@palavra"` (ou "@palavra+0.3") vira o segundo exato em que a palavra é falada na cena.
    Assim nenhum tempo é ajustado à mão, e trocar voz/velocidade nunca dessincroniza."""
    words = proj / "audio" / "narracao.words.json"
    if not words.exists():
        return
    ws = json.loads(words.read_text(encoding="utf-8"))
    k, t0, faltou = 0, 0.0, []
    for c_r, c in zip(r["cenas"], cenas):
        n = len(c_r["fala"].split())
        da_cena = ws[k:k + n]

        def resolve(v):
            ancora, _, desl = v[1:].partition("+")
            alvo = _norm(ancora)
            for w in da_cena:
                if _norm(w["word"]).startswith(alvo):
                    return round(max(0.0, w["start"] - t0 + float(desl or 0)), 2)
            faltou.append(v)
            return 0.0

        def anda(o):
            if isinstance(o, dict):
                for key, v in o.items():
                    if (key in ("em", "ate") or key.endswith("Em")) and isinstance(v, str) and v.startswith("@"):
                        o[key] = resolve(v)
                    else:
                        anda(v)
            elif isinstance(o, list):
                for x in o:
                    anda(x)

        anda(c["blocos"])
        k += n
        t0 += c_r["duracao"]
    if faltou:
        print(f"  aviso: âncoras não encontradas na fala: {faltou}")


def _props(proj: Path) -> Path:
    """Monta o JSON de props do Remotion e copia mídia para public/."""
    r = ler_roteiro(proj)
    pub = _public(proj)

    props = {k: v for k, v in r.items() if k not in ("voz", "briefing", "composicao", "pronuncia")}
    props["cenas"] = [{k: v for k, v in c.items() if k != "fala"} for c in r["cenas"]]
    _ancorar(proj, r, props["cenas"])
    props["base"] = proj.name
    # SplitTH: duração do vídeo do rosto (o componente congela o último quadro quando ele acaba)
    ro = props.get("rosto")
    if isinstance(ro, dict) and ro.get("video") and not ro.get("duracao") and (proj / ro["video"]).exists():
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(proj / ro["video"])],
                             capture_output=True, text=True).stdout.strip()
        if out:
            ro["duracao"] = round(float(out), 3)

    # efeitos sonoros compartilhados
    for pasta in ("sfx", "texturas"):
        origem = SISTEMA / "assets" / pasta
        if origem.is_dir():
            shutil.copytree(origem, REMOTION / "public" / pasta, dirs_exist_ok=True)

    narr = proj / "audio" / "narracao.wav"
    if narr.exists():
        shutil.copy(narr, pub / "narracao.wav")
        props["narracao"] = f"{proj.name}/narracao.wav"
    words = proj / "audio" / "narracao.words.json"
    if words.exists():
        props["palavras"] = json.loads(words.read_text(encoding="utf-8"))

    if r.get("trilha"):
        musica = SISTEMA / "assets" / "musica" / r["trilha"]
        if musica.exists():
            ini = float(r.get("trilhaInicio") or 0)   # TRILHA.md regra 4: música entra no beat, sem intro lenta
            if ini > 0:
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{ini:.3f}", "-i", str(musica), "-c:a", "libmp3lame",
                                "-q:a", "2", str(pub / musica.name)], check=True)
            else:
                shutil.copy(musica, pub / musica.name)
            props["trilha"] = f"{proj.name}/{musica.name}"
        else:
            print(f"  aviso: trilha '{r['trilha']}' não encontrada em assets/musica — renderizando sem.")
            props.pop("trilha", None)

    saida = proj / "previa" / "_props.json"
    saida.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
    return saida


def previa(proj: Path) -> None:
    props = _props(proj)
    r = ler_roteiro(proj)
    t, marcas = 0.0, []
    for c in r["cenas"]:
        marcas.append(t + min(c["duracao"] * 0.7, c["duracao"] - 0.4))
        t += c["duracao"]
    comp = r.get("composicao", "Reel")
    pasta = proj / "previa"
    for velho in pasta.glob("cena*.*"):
        velho.unlink()
    rodar(["node", "motor.mjs", "previa", props, comp, pasta, ",".join(str(frames(m)) for m in marcas)], cwd=REMOTION)
    mosaico(sorted(pasta.glob("cena*.jpg")), pasta / "_MOSAICO.jpg")
    print(f"Prévias em {pasta} — revise só o _MOSAICO.jpg (1 imagem = todas as cenas)")


def mosaico(imgs: list, saida: Path, colunas: int = 6, w: int = 270) -> None:
    """Junta várias imagens numeradas numa só (revisão rápida, gasta 1 imagem em vez de N)."""
    from PIL import Image, ImageDraw, ImageFont
    h = int(w * 16 / 9)
    linhas = (len(imgs) + colunas - 1) // colunas
    tela = Image.new("RGB", (colunas * w + (colunas + 1) * 6, linhas * h + (linhas + 1) * 6), "white")
    fonte = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 28)
    for i, p in enumerate(imgs):
        im = Image.open(p).convert("RGB").resize((w, h))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 48, 38], fill="black")
        d.text((7, 4), f"{i + 1:02}", font=fonte, fill="white")
        tela.paste(im, (6 + (i % colunas) * (w + 6), 6 + (i // colunas) * (h + 6)))
    tela.save(saida, quality=85)


def carrossel_novo(slug: str) -> None:
    slug = re.sub(r"[^a-z0-9-]+", "-", slug.lower()).strip("-")
    pasta = CARROSSEIS / pastas.nome_novo(slug)
    if pasta.exists():
        sys.exit(f"Já existe: {pasta}")
    (pasta / "assets").mkdir(parents=True)
    shutil.copy(SISTEMA / "templates" / "carrossel.json", pasta / "carrossel.json")
    print(f"Criado: {pasta}")


def achar_carrossel(nome: str) -> Path:
    cand = pastas.achar(CARROSSEIS, nome) or []
    if len(cand) != 1:
        sys.exit(f"Carrossel '{nome}' não encontrado (ou ambíguo) em {CARROSSEIS}")
    return cand[0]


def carrossel(pasta: Path) -> None:
    """CARROSSEIS/<slug>/carrossel.json -> slides/slide01.jpg … (1080x1350 JPEG, pronto p/ API) + _MOSAICO.jpg"""
    r = json.loads((pasta / "carrossel.json").read_text(encoding="utf-8"))
    _public(pasta)
    r["base"] = pasta.name
    props = SISTEMA / "cache" / "props" / f"{pasta.name}.json"   # temporário, fora da pasta do carrossel
    props.parent.mkdir(parents=True, exist_ok=True)
    props.write_text(json.dumps(r, ensure_ascii=False), encoding="utf-8")
    slides = pasta / "slides"
    shutil.rmtree(slides, ignore_errors=True)
    n = len(r["slides"])
    rodar(["node", "motor.mjs", "previa", props, "Carrossel", slides, ",".join(str(i) for i in range(n))], cwd=REMOTION)
    for c in sorted(slides.glob("cena*.jpg")):
        c.rename(slides / c.name.replace("cena", "slide"))
    from PIL import Image
    imgs = sorted(slides.glob("slide*.jpg"))
    w, h, col = 324, 405, min(5, n)
    tela = Image.new("RGB", (col * w + (col + 1) * 6, ((n + col - 1) // col) * (h + 6) + 6), "white")
    for i, p in enumerate(imgs):
        tela.paste(Image.open(p).convert("RGB").resize((w, h)), (6 + (i % col) * (w + 6), 6 + (i // col) * (h + 6)))
    tela.save(pasta / "_MOSAICO.jpg", quality=85)
    props.unlink(missing_ok=True)   # limpeza: props e cópia em public/ não ficam
    shutil.rmtree(REMOTION / "public" / pasta.name, ignore_errors=True)
    for b in (REMOTION / ".cache").glob(f"bundle-*/public/{pasta.name}"):
        shutil.rmtree(b, ignore_errors=True)
    print(f"{n} slides em {slides.relative_to(RAIZ)} — revise {pasta.name}/_MOSAICO.jpg")


def render(proj: Path) -> None:
    props = _props(proj)
    out = proj / "render_bruto.mp4"
    comp = ler_roteiro(proj).get("composicao", "Reel")
    rodar(["node", "motor.mjs", "render", props, comp, out], cwd=REMOTION)



def video_final(proj: Path) -> Path:
    """MP4 final numerado: VIDEOS PRONTOS/NN-<slug>.mp4 (ou já movido para _publicados/). Novo = próximo número."""
    slug = pastas.slug_de(proj.name)
    destinos = (PRONTOS, PRONTOS / "_publicados")
    for pasta in destinos:
        achado = sorted(pasta.glob(f"[0-9][0-9]-{slug}.mp4"))
        if achado:
            return achado[0]
    nums = [int(a.name[:2]) for pasta in destinos for a in pasta.glob("[0-9][0-9]-*.mp4")]
    return PRONTOS / f"{max(nums, default=0) + 1:02d}-{slug}.mp4"

def finalizar(proj: Path) -> None:
    bruto = proj / "render_bruto.mp4"
    if not bruto.exists():
        sys.exit("Rode 'render' antes.")
    PRONTOS.mkdir(exist_ok=True)
    final = video_final(proj)
    pix = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=pix_fmt",
                          "-of", "csv=p=0", str(bruto)], capture_output=True, text=True).stdout.strip()
    if pix == "yuv420p":   # o motor já entrega H.264 yuv420p bt709: só trata o áudio (sem re-encodar o vídeo)
        video = ["-c:v", "copy"]
    else:
        video = ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-color_range", "tv",
                 "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709"]
    rodar(["ffmpeg", "-y", "-v", "error", "-i", bruto, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", *video,
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", final])
    print(f"\nPRONTO: {final}  ({duracao(final):.1f}s)")
    checar(proj)
    celular(proj)
    limpar(proj)


def celular(proj: Path) -> None:
    """Cópia leve (< 30 MB) para mandar ao celular pelo chat. Fica em cache/celular (só a última; não é entrega)."""
    final = video_final(proj)
    if not final.exists() or final.stat().st_size <= LIMITE_CELULAR:
        return
    pasta = SISTEMA / "cache" / "celular"
    shutil.rmtree(pasta, ignore_errors=True)
    pasta.mkdir(parents=True)
    saida = pasta / final.name.replace(".mp4", "-celular.mp4")
    kbps = int(LIMITE_CELULAR * 0.85 * 8 / duracao(final) / 1000) - 128   # 85% do limite, menos o áudio
    rodar(["ffmpeg", "-y", "-v", "error", "-i", final, "-c:v", "libx264", "-preset", "veryfast", "-b:v", f"{kbps}k",
           "-maxrate", f"{int(kbps * 1.3)}k", "-bufsize", f"{kbps * 2}k", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", saida])
    print(f"CELULAR: {saida}  ({saida.stat().st_size / 1e6:.0f} MB) -> mande este pelo chat (SendUserFile)")


_NUM_EXTENSO = set(("um uma dois duas tres quatro cinco seis sete oito nove dez onze doze treze quatorze catorze quinze "
                    "dezesseis dezessete dezoito dezenove vinte trinta quarenta cinquenta sessenta setenta oitenta "
                    "noventa cem cento duzentos duzentas trezentos quatrocentos quinhentos seiscentos setecentos "
                    "oitocentos novecentos mil milhao milhoes bilhao bilhoes e virgula meio meia").split()) | {""}
_SINONIMOS = {"pra", "para", "ta", "esta", "pro", "para", "o", "a", "ce", "voce", "to", "estou"}


def ouvir(proj: Path) -> None:
    """Confere a narração SEM ninguém ouvir: transcreve com o Whisper (CPU) e compara com o roteiro.
    Mostra palavras que soaram diferentes (pronúncia) e o erro de sincronia das legendas.
    Rodar logo depois da voz, ANTES da prévia: pegar erro aqui custa 1 cena de crédito, não o vídeo todo."""
    audio, tempos = proj / "audio" / "narracao.wav", proj / "audio" / "narracao.tempos.json"
    relato = proj / "previa" / "_OUVIR.txt"
    if not audio.exists():
        sys.exit("Rode 'voz' antes.")
    if relato.exists() and relato.stat().st_mtime > audio.stat().st_mtime:
        print(relato.read_text(encoding="utf-8")); return   # mesma narração já conferida
    from legendar import carregar_audio
    from faster_whisper import WhisperModel
    segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(
        carregar_audio(audio), language="pt", word_timestamps=True, vad_filter=False)
    ouvidas = [(w.word.strip(), w.start) for s in segs for w in (s.words or []) if _norm(w.word)]
    r = ler_roteiro(proj)
    esperadas, cena_de = [], []
    for i, c in enumerate(r["cenas"], 1):
        for p in c["fala"].split():
            if _norm(p):
                esperadas.append(p); cena_de.append(i)
    a, b = [_norm(p) for p in esperadas], [_norm(p) for p, _ in ouvidas]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    linhas, erros_sync, ruins = [], [], 0
    marc = json.loads(tempos.read_text(encoding="utf-8")) if tempos.exists() else []
    if marc:   # tempos da legenda (ElevenLabs) × tempos ouvidos (Whisper), nas palavras que batem
        sm2 = difflib.SequenceMatcher(None, [_norm(w["word"]) for w in marc], b, autojunk=False)
        erros_sync = [abs(marc[bl.a + k]["start"] - ouvidas[bl.b + k][1])
                      for bl in sm2.get_matching_blocks() for k in range(bl.size)]
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        esc, ouv = " ".join(esperadas[i1:i2]), " ".join(p for p, _ in ouvidas[j1:j2])
        ne, no = {_norm(p) for p in esperadas[i1:i2]}, {_norm(p) for p, _ in ouvidas[j1:j2]}
        if ne <= _NUM_EXTENSO and all(x.isdigit() or x in _NUM_EXTENSO for x in no):
            continue   # "trinta e cinco" × "35": o Whisper escreve número em algarismo, não é erro
        if (ne | no) <= _SINONIMOS:
            continue   # "pra" × "para", "tá" × "está"
        if esc or ouv:
            ruins += max(i2 - i1, 1)
            t = ouvidas[j1][1] if j1 < len(ouvidas) else 0
            linhas.append(f"  cena {cena_de[min(i1, len(cena_de) - 1)]:>2} {t:6.1f}s  roteiro: {esc or '—'}  |  ouvido: {ouv or '—'}")
    acerto = 100 * (len(a) - ruins) / max(len(a), 1)
    sync = (f"sincronia: média {sum(erros_sync) / len(erros_sync):.2f}s, pior {max(erros_sync):.2f}s"
            if erros_sync else "sincronia: sem tempos da ElevenLabs para comparar")
    txt = "\n".join([f"OUVIR: {acerto:.0f}% das palavras batem com o roteiro · {sync} · {len(linhas)} trechos diferentes",
                     *linhas[:40],
                     "  (número escrito × falado e sotaque do Whisper geram falso alarme: confira só nomes, siglas e @)"])
    relato.write_text(txt, encoding="utf-8")
    print(txt)


def limpar(proj: Path) -> None:
    """Apaga o que é regenerável depois da entrega. Fica: roteiro, áudio, assets, mosaicos e o MP4 final."""
    lixo = [proj / "render_bruto.mp4", proj / "previa" / "_final", REMOTION / "public" / proj.name,
            proj / "audio" / "_cenas",   # refeito do cache da ElevenLabs (cache/eleven) sem gastar crédito
            *(proj / "previa").glob("cena*.jpg"), *(proj / "previa").glob("_props*.json"),
            *(REMOTION / ".cache").glob(f"bundle-*/public/{proj.name}")]
    total = 0
    for p in lixo:
        if p.is_dir():
            total += sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
            shutil.rmtree(p, ignore_errors=True)
        elif p.exists():
            total += p.stat().st_size
            p.unlink()
    print(f"LIMPEZA: {total / 1e6:.0f} MB de intermediários apagados")


def checar(proj: Path) -> None:
    """Revisão final compacta: ffprobe + loudness + 1 mosaico com 12 frames do vídeo pronto."""
    final = video_final(proj)
    if not final.exists():
        sys.exit("Sem vídeo final.")
    info = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                           "stream=codec_name,width,height,pix_fmt,r_frame_rate,color_space:format=duration",
                           "-of", "json", str(final)], capture_output=True, text=True).stdout
    j = json.loads(info)
    v = next(s for s in j["streams"] if s.get("width"))
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", subprocess.run(
        ["ffmpeg", "-v", "info", "-i", str(final), "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr)
    d = float(j["format"]["duration"])
    pasta = proj / "previa" / "_final"
    pasta.mkdir(parents=True, exist_ok=True)
    imgs = []
    for k in range(12):
        f = pasta / f"f{k:02}.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{d * (k + 0.5) / 12:.2f}", "-i", str(final),
                        "-frames:v", "1", "-vf", "scale=360:-2", str(f)])
        imgs.append(f)
    mosaico(imgs, proj / "previa" / "_FINAL.jpg")
    shutil.rmtree(pasta, ignore_errors=True)  # os 12 frames soltos não ficam: o mosaico basta
    r = ler_roteiro(proj)   # duração-alvo: padrão 45–90 s; vídeo longo declara "duracaoMax" no roteiro (ex. 120)
    dmin, dmax = float(r.get("duracaoMin", 45)), float(r.get("duracaoMax", 90))
    ok = v["width"] == 1080 and v["height"] == 1920 and v["pix_fmt"] == "yuv420p" and dmin <= d <= dmax
    print(f"CHECAGEM: {v['width']}x{v['height']} {v['codec_name']} {v['pix_fmt']} {v['r_frame_rate']} "
          f"{d:.1f}s  loudness {lufs[-1] if lufs else '?'} LUFS  -> {'OK' if ok else 'VER'}  | mosaico: previa/_FINAL.jpg")


def main() -> None:
    sem_voz = "--sem-voz" in sys.argv
    if sem_voz:
        sys.argv.remove("--sem-voz")
        sys.modules["eleven"] = None   # qualquer `import eleven` vira ImportError: zero acesso à API
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    etapa, alvo = sys.argv[1], sys.argv[2]
    achar_ffmpeg()
    if etapa == "novo":
        return novo(alvo)
    if etapa == "carrossel-novo":
        return carrossel_novo(alvo)
    if etapa == "carrossel":
        return carrossel(achar_carrossel(alvo))
    if etapa == "cardapio":
        import roteiro_montar
        return roteiro_montar.cardapio()   # alvo = estilo (só 'traco')
    if etapa == "montar":
        import roteiro_montar
        return roteiro_montar.montar(achar_projeto(alvo), achar_projeto)
    proj = achar_projeto(alvo)
    etapas = {"voz": voz, "legendas": legendas, "previa": previa, "ouvir": ouvir, "celular": celular,
              "render": render, "finalizar": finalizar, "checar": checar, "limpar": limpar}
    if sem_voz:
        if not (proj / "audio" / "narracao.wav").exists() or not (proj / "audio" / "narracao.words.json").exists():
            sys.exit("--sem-voz: falta audio/narracao.wav ou narracao.words.json no projeto (copie o audio/ do original).")

        def _voz_bloqueada(_p: Path) -> None:
            sys.exit("--sem-voz: etapa 'voz' bloqueada — o áudio existente é reaproveitado, nada vai à ElevenLabs.")
        etapas["voz"] = _voz_bloqueada
        print("  --sem-voz: reaproveitando audio/ existente (ElevenLabs bloqueada)")
    combos = {"tudo": ("voz", "legendas", "ouvir", "render", "finalizar"),
              "rapido": ("voz", "legendas", "previa", "ouvir"),   # roteiro aprovado -> prévia + conferência da pronúncia
              "entrega": ("render", "finalizar")}               # prévia aprovada -> MP4 + checagem
    if etapa in combos:
        for e in combos[etapa]:
            print(f"\n=== {e.upper()} ===")
            etapas[e](proj)
    elif etapa in etapas:
        etapas[etapa](proj)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
