"""ElevenLabs — narração principal com tempos por palavra (dispensa o Whisper) e controle de créditos.

    python eleven.py saldo                 # créditos usados/restantes
    python eleven.py vozes                 # vozes pt-BR disponíveis na conta
    python eleven.py teste <voice_id> "texto curto"   # gera _teste_<id>.mp3 (gasta ~len(texto) créditos); aceita audio tags: "[animado] Olha isso!"
    python eleven.py pronuncia "A,B,C" [voz]   # teste de pronúncia (Whisper confere); voz padrão = Well; ~15 créditos/palavra
    python eleven.py dialogo <voz1> <voz2> "fala 1" "fala 2" ...   # conversa com 2 vozes (formato entrevista)

Chave: env ELEVENLABS_API_KEY ou 00-SISTEMA/segredos/elevenlabs.key (nunca imprimir).
Cache: mesmo texto + voz + modelo + ajustes = reaproveita o áudio sem gastar crédito.
"""
import base64, hashlib, json, os, sys, time, urllib.error, urllib.request
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SISTEMA = Path(__file__).resolve().parents[1]
CHAVE_ARQ = SISTEMA / "segredos" / "elevenlabs.key"
CACHE = SISTEMA / "cache" / "eleven"
API = "https://api.elevenlabs.io"

VOZ_PADRAO = "iP95p4xoKVk53GoZ742B"   # Chris (premade) — padrão do projeto desde 14/11/2026; conta grátis só libera premade via API
MODELO_PADRAO = "eleven_v4"           # com language_code "pt": pronúncia e números em português (ver 00-SISTEMA/VOZES.md)
AJUSTES_PADRAO = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": 1.1}
ALERTA_PCT = 0.20                    # avisa quando sobrar menos de 20%


def chave() -> str | None:
    k = os.environ.get("ELEVENLABS_API_KEY")
    if k:
        return k.strip()
    return CHAVE_ARQ.read_text().strip() if CHAVE_ARQ.exists() else None


def _req(caminho: str, corpo: dict | None = None, timeout=120):
    h = {"xi-api-key": chave(), "Content-Type": "application/json", "Accept": "application/json"}
    data = json.dumps(corpo).encode() if corpo is not None else None
    r = urllib.request.Request(API + caminho, data=data, headers=h, method="POST" if corpo is not None else "GET")
    try:
        return json.load(urllib.request.urlopen(r, timeout=timeout))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"ElevenLabs {e.code}: {e.read()[:300].decode(errors='ignore')}") from None


def saldo() -> dict:
    s = _req("/v1/user/subscription")
    usados, limite = s["character_count"], s["character_limit"]
    reset = datetime.fromtimestamp(s["next_character_count_reset_unix"]).strftime("%d/%m/%Y")
    return {"plano": s.get("tier"), "usados": usados, "limite": limite, "restam": limite - usados, "renova": reset}


def aviso_saldo(precisa: int = 0) -> str:
    """Texto de alerta para mostrar ao usuário (vazio se tudo ok)."""
    s = saldo()
    msg = f"ElevenLabs: restam {s['restam']:,} de {s['limite']:,} créditos (renova {s['renova']}).".replace(",", ".")
    if precisa and s["restam"] < precisa:
        return "⚠️ SEM CRÉDITO SUFICIENTE — " + msg + f" Este vídeo precisa de ~{precisa}. Vou usar a voz grátis (edge-tts)."
    if s["restam"] - precisa < s["limite"] * ALERTA_PCT:
        return "⚠️ CRÉDITOS QUASE NO FIM — " + msg
    return msg


def _palavras(al: dict, offset: float = 0.0) -> list[dict]:
    """Converte alinhamento por caractere em tempos por palavra."""
    chars, ini, fim = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    out, cur, t0 = [], "", None
    em_tag = False   # audio tags "[animado]" são direção de voz, não palavra: não entram na legenda
    for c, a, b in zip(chars, ini, fim):
        if c == "[":
            em_tag = True
        if em_tag:
            if c == "]":
                em_tag = False
            continue
        if c.isspace():
            if cur:
                out.append({"word": cur, "start": round(t0 + offset, 3), "end": round(ultimo + offset, 3)})
            cur, t0 = "", None
            continue
        if t0 is None:
            t0 = a
        cur += c
        ultimo = b
    if cur:
        out.append({"word": cur, "start": round(t0 + offset, 3), "end": round(ultimo + offset, 3)})
    return out


def _ajustes(modelo: str, ajustes: dict | None) -> dict:
    aj = {**AJUSTES_PADRAO, **(ajustes or {})}
    if modelo.startswith("eleven_v4"):   # v4 só aceita stability e similarity_boost (sem style/speed: use 'tempo' local)
        aj = {k: v for k, v in aj.items() if k in ("stability", "similarity_boost")}
    return aj


def _hash(texto, voz, modelo, ajustes=None, anterior="", seguinte="", idioma="") -> str:
    usa_idioma = idioma and modelo != "eleven_multilingual_v2"   # o v2 ignora o idioma: não invalida o cache antigo
    chave_cache = [texto, voz, modelo, _ajustes(modelo, ajustes), anterior, seguinte] + ([idioma] if usa_idioma else [])
    return hashlib.sha1(json.dumps(chave_cache, ensure_ascii=False).encode()).hexdigest()[:16]


def em_cache(*args, **kw) -> bool:
    """True se esse áudio já foi pago e está no cache (mesmos argumentos de falar, sem o mp3)."""
    h = _hash(*args, **kw)
    return (CACHE / f"{h}.mp3").exists() and (CACHE / f"{h}.json").exists()


def falar(texto: str, mp3: Path, voz: str = VOZ_PADRAO, modelo: str = MODELO_PADRAO,
          ajustes: dict | None = None, anterior: str = "", seguinte: str = "", idioma: str = "") -> list[dict]:
    """Gera mp3 + devolve tempos por palavra (relativos ao início do áudio). Usa cache.
    idioma: código ISO 639-1 ("pt") que força a pronúncia e a normalização de números do idioma
    (skill oficial elevenlabs/skills text-to-speech). Vale nos modelos eleven_v4 e flash/turbo v2.5;
    o eleven_multilingual_v2 ignora."""
    aj = _ajustes(modelo, ajustes)
    h = _hash(texto, voz, modelo, ajustes, anterior, seguinte, idioma)
    CACHE.mkdir(parents=True, exist_ok=True)
    c_mp3, c_js = CACHE / f"{h}.mp3", CACHE / f"{h}.json"
    if not (c_mp3.exists() and c_js.exists()):
        corpo = {"text": texto, "model_id": modelo, "voice_settings": aj}
        if idioma and modelo != "eleven_multilingual_v2":
            corpo["language_code"] = idioma
        if anterior: corpo["previous_text"] = anterior      # mantém entonação contínua entre cenas
        if seguinte: corpo["next_text"] = seguinte
        for tent in range(3):
            try:
                r = _req(f"/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128", corpo)
                break
            except RuntimeError as e:
                if "429" in str(e) and tent < 2:
                    time.sleep(3 * (tent + 1)); continue
                raise
        c_mp3.write_bytes(base64.b64decode(r["audio_base64"]))
        c_js.write_text(json.dumps(r.get("normalized_alignment") or r["alignment"], ensure_ascii=False), encoding="utf-8")
    mp3.write_bytes(c_mp3.read_bytes())
    return _palavras(json.loads(c_js.read_text(encoding="utf-8")))


def dialogo(falas: list[tuple[str, str]], mp3: Path, modelo: str = MODELO_PADRAO, idioma: str = "pt",
            ajustes: dict | None = None) -> list[dict]:
    """Conversa de 2+ vozes num só áudio (endpoint oficial text-to-dialogue/with-timestamps, doc 16/11/2026).
    falas = [(voice_id, texto), ...]; limite de ~2.000 caracteres por pedido (divida em blocos).
    Devolve palavras com tempo e campo 'voz' (índice da fala em falas). Cache por conteúdo."""
    if sum(len(t) for _, t in falas) > 2000:
        raise RuntimeError("diálogo passa de 2.000 caracteres: divida em pedidos menores")
    ch = hashlib.sha1(json.dumps(["dialogo", falas, modelo, idioma, ajustes], ensure_ascii=False).encode()).hexdigest()[:16]
    CACHE.mkdir(parents=True, exist_ok=True)
    c_mp3, c_js = CACHE / f"dlg_{ch}.mp3", CACHE / f"dlg_{ch}.json"
    if not (c_mp3.exists() and c_js.exists()):
        corpo = {"inputs": [{"text": t, "voice_id": v} for v, t in falas], "model_id": modelo}
        if idioma and modelo != "eleven_multilingual_v2":
            corpo["language_code"] = idioma
        if ajustes:
            corpo["settings"] = ajustes   # só stability/similarity (doc oficial)
        r = _req("/v1/text-to-dialogue/with-timestamps?output_format=mp3_44100_128", corpo, timeout=240)
        c_mp3.write_bytes(base64.b64decode(r["audio_base64"]))
        c_js.write_text(json.dumps({"alinhamento": r.get("normalized_alignment") or r.get("alignment"),
                                    "segmentos": r["voice_segments"]}, ensure_ascii=False), encoding="utf-8")
    dados = json.loads(c_js.read_text(encoding="utf-8"))
    mp3.write_bytes(c_mp3.read_bytes())
    al = dados["alinhamento"]
    out = []
    for seg_ in dados["segmentos"]:   # palavras de cada trecho, marcadas com a fala de origem
        a, b = seg_["character_start_index"], seg_["character_end_index"]
        parte = {k: al[k][a:b] for k in ("characters", "character_start_times_seconds", "character_end_times_seconds")}
        out += [{**w, "voz": seg_["dialogue_input_index"]} for w in _palavras(parte)]
    return out


def custo(textos: list[str], modelo: str = MODELO_PADRAO) -> int:
    n = sum(len(t) for t in textos)
    return n // 2 if "flash" in modelo or "turbo" in modelo else n   # flash/turbo = metade do crédito

VOZ_WELL = "i8rv83UTKnzq0PzTrxjL"


def pronuncia(palavras: list, voz: str = VOZ_WELL) -> None:
    """Teste curto de pronúncia: 1 mp3 com 'Isso é A. Isso é B.', Whisper small confere, imprime `palavra -> ouvido`.
    Aplica assets/voz/pronuncia.json (o que o vídeo faria). Gasta ~15 créditos por palavra (cache se repetir)."""
    import re, unicodedata
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from produzir import achar_ffmpeg
    achar_ffmpeg()
    from legendar import carregar_audio
    from faster_whisper import WhisperModel

    def norm(t):
        t = unicodedata.normalize("NFD", t.lower())
        return re.sub(r"[^a-z0-9]", "", "".join(c for c in t if unicodedata.category(c) != "Mn"))

    arq = SISTEMA / "assets" / "voz" / "pronuncia.json"
    mapa = json.loads(arq.read_text(encoding="utf-8")) if arq.exists() else {}
    mapa = {k: v for k, v in mapa.items() if not k.startswith("_") and v}
    lidas = []
    for pal in palavras:
        lida = pal
        for escrito in sorted(mapa, key=len, reverse=True):
            lida = re.sub(rf"(?<!\w){re.escape(escrito)}(?!\w)", mapa[escrito], lida)
        lidas.append(lida)
    texto = " ".join(f"Isso é {l}." for l in lidas)
    ajustes = {"stability": 0.4, "similarity_boost": 0.8} if voz == VOZ_WELL else None
    mp3 = Path(f"_pronuncia_{os.getpid()}.mp3")
    try:
        falar(texto, mp3, voz=voz, idioma="pt", ajustes=ajustes)
        segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(
            carregar_audio(mp3), language="pt", word_timestamps=True, vad_filter=False)
        ouvidas = [w.word.strip() for s in segs for w in (s.words or []) if norm(w.word)]
    finally:
        mp3.unlink(missing_ok=True)
    # separa por "Isso é": o que vem entre um marcador e o próximo é o que foi ouvido para aquela palavra
    marcas = [i for i in range(len(ouvidas) - 1) if norm(ouvidas[i]) == "isso" and norm(ouvidas[i + 1]) == "e"]
    grupos = [" ".join(ouvidas[m + 2:(marcas[k + 1] if k + 1 < len(marcas) else len(ouvidas))]) for k, m in enumerate(marcas)]
    if len(grupos) != len(palavras):
        print("  aviso: não separei as frases; transcrição inteira:", " ".join(ouvidas))
        grupos = [""] * len(palavras)
    for pal, lida, ouv in zip(palavras, lidas, grupos):
        ok = norm(ouv) in (norm(pal), norm(lida)) and bool(ouv)
        print(f"{pal} -> {ouv or '?'}  {'✅' if ok else '⚠️'}" + (f"  (lida como '{lida}')" if lida != pal else ""))
    print(aviso_saldo())


if __name__ == "__main__":
    if not chave():
        sys.exit("Sem chave ElevenLabs.")
    cmd = sys.argv[1] if len(sys.argv) > 1 else "saldo"
    if cmd == "saldo":
        print(aviso_saldo())
    elif cmd == "vozes":
        for v in _req("/v2/voices?page_size=100")["voices"]:
            lb = v.get("labels") or {}
            if lb.get("language") == "pt" or "brazil" in str(lb).lower():
                print(v["voice_id"], "|", v["name"], "|", lb.get("accent", ""))
    elif cmd == "dialogo":   # dialogo <voz1> <voz2> "fala 1" "fala 2" ...  (alterna as vozes; gasta ~total de caracteres)
        v = sys.argv[2:4]
        p = Path("_teste_dialogo.mp3")
        w = dialogo([(v[i % 2], t) for i, t in enumerate(sys.argv[4:])], p)
        print(p, len(w), "palavras; vozes por palavra:", sorted({x["voz"] for x in w}), w[:3])
        print(aviso_saldo())
    elif cmd == "pronuncia":   # pronuncia "A,B,C" [voz]  (padrão: Well)
        pronuncia([x.strip() for x in sys.argv[2].split(",") if x.strip()], *(sys.argv[3:4]))
    elif cmd == "teste":
        p = Path(f"_teste_{sys.argv[2]}.mp3")
        w = falar(sys.argv[3], p, voz=sys.argv[2], idioma="pt")
        print(p, len(w), "palavras", w[:3])
        print(aviso_saldo())
