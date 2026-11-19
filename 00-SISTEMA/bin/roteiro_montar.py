"""Cardápio e montagem de roteiro do estilo Traço (usado por produzir.py: `cardapio traco` e `montar <slug>`).

ROTEIRO.md (fonte única) -> roteiro.json. Formato:
    # Título (opcional)
    estilo: Traco            chave: valor (só antes da 1ª fala). Chaves: estilo voz mascote trilha trilhaInicio
    voz: well                tempo duracaoMax base titulo perfil credito volumeTrilha destaques pronuncia respiroFinal respiro paleta entrada
    base: 18-11-2026_xgo-o-que-e-agente   herda os campos do topo desse projeto (o header vence)
    1. Texto da fala.        N. texto  (uma fala = uma cena)
    → titulo @Todo linhas=[{"t":"OLÁ","em":"@Todo"}] | sublinhado @agentes forma=onda
    ⚙ camera={"zoom":[1,1.2]} transicao=corte tag=animado    (opcional: opções da cena)
Valores: k=v, k="com espaço", k=[json], k={json}, true/false/número. `@palavra` solto = em=@palavra.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SISTEMA = RAIZ / "00-SISTEMA"
TSX = RAIZ / "FERRAMENTAS" / "Remotion" / "src" / "traco" / "VideoTraco.tsx"
DOC = SISTEMA / "templates" / "traco_doc.md"          # doc original dos blocos (fonte do cardápio, junto com o .tsx)
CARDAPIO = SISTEMA / "templates" / "traco_blocos.md"
PADROES = SISTEMA / "templates" / "traco_padroes.json"

VOZES = {"well": "i8rv83UTKnzq0PzTrxjL", "chris": "iP95p4xoKVk53GoZ742B"}
VOZ_WELL = {"motor": "eleven", "id": VOZES["well"], "modelo": "eleven_v4", "idioma": "pt",
            "ajustes": {"stability": 0.4, "similarity_boost": 0.8}, "tempo": 1.25, "pausas": 0.08,
            "respiro": 0.05, "limiarSilencio": "-32dB"}

GERAIS = {"x", "y", "z", "em", "ate", "tipo", "som", "somEm", "somVol"}

DESC = {
    "celular": "celular flutuante com clipe/print", "lobo": "mascote Lobo animado (só com mascote)",
    "hermes": "sprite Hermes (só com mascote)", "servidor": "servidor com luzes, dia/noite",
    "torre": "torre de sinal", "relevo": "linhas de relevo no fundo", "circulos": "círculos concêntricos de fundo",
    "particulas": "pontos flutuando (tela cheia)", "icone": "ícone em traço grande", "rotulo": "rótulo mono pequeno",
    "pilula": "pílula de fonte/crédito", "titulo": "título gigante palavra a palavra", "numero": "número grande contando",
    "lista": "lista de chips entrando", "chip": "chip avulso com ícone", "selo": "carimbo girado",
    "balao": "balão de fala com cauda", "terminal": "terminal digitando comandos", "passos": "passos numerados/passo a passo",
    "orbita": "itens girando em órbita", "conexao": "fio ligando dois pontos (tela cheia)",
    "ajustes": "mockup de tela de ajustes", "cta": "chamada final comenta + segue", "pergunta": "cartão de pergunta digitada",
    "emblema": "emblema X-GO redondo", "grafico": "gráfico de linha com salto", "dado": "número % com anel/grade",
    "cards": "lista de cartões com ícone", "equacao": "1 agente = N pessoas", "comparacao": "preço unitário × total",
    "versus": "duas colunas ✓/✗ com arco", "conexoes": "centro ligado a 5-6 nós", "marcas": "chips de marcas em zigue-zague",
    "perguntas": "balões de pergunta empilhando", "transformacao": "A riscado vira B", "seta": "seta desenhada à mão",
    "sublinhado": "traço à mão sob título", "selos": "carimbos lado a lado", "mensagem": "balão de chat/áudio no celular",
}

# a doc/.tsx não deixam claro estes (props lidas por helper ou 2 modos): fixos aqui
OVERRIDE = {
    "chip": "t icone escuro piscar fase tam",
    "ajustes": "tam preenchido enderecoEm usuarioEm senhaEm manterEm cifraEm conectarEm",
    "passos": "ativo rotulo (3 bolinhas) | itens[{t sub icone em acento}] titulo marcar:false (passo a passo vertical)",
}


# ---------------------------------------------------------------- cardápio
def _blocos_tsx() -> dict:
    """tipo -> lista de props lidas (b.xxx) no componente, direto do .tsx."""
    linhas = TSX.read_text(encoding="utf-8").split("\n")
    ini = next(i for i, l in enumerate(linhas) if l.startswith("const BLOCOS"))
    mapa = {}
    for l in linhas[ini + 1:]:
        if l.startswith("};"):
            break
        m = re.match(r"\s+(\w+): (\w+),", l)
        if m:
            mapa[m.group(1)] = m.group(2)
    def props_de(comp: str, visto: set) -> list:
        if comp in visto:
            return []
        visto.add(comp)
        i = next((k for k, l in enumerate(linhas) if re.match(rf"const {comp}:", l)), None)
        props = []
        if i is None:
            return props
        for k, l in enumerate(linhas[i:]):
            if k and re.match(r"(const |function |export |/\*)", l):
                break
            for p in re.findall(r"(?<![\w.])b\??\.(\w+)", l):
                if p not in props:
                    props.append(p)
            for sub in re.findall(r"<(\w+)\s+b=\{b\}", l):   # delega a outro componente com o mesmo b
                props += [p for p in props_de(sub, visto) if p not in props]
        return props

    out = {tipo: props_de(comp, set()) for tipo, comp in mapa.items()}
    return out


def _doc_props() -> dict:
    """tipo -> notação das props com sub-itens, extraída da doc original (traco_doc.md ou linha da skill reel)."""
    if not DOC.exists():
        return {}
    t = DOC.read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"`(\w+)`(?:/`(\w+)`)?\s*\(`([^`]*)`", t):
        for tipo in (m.group(1), m.group(2)):
            if tipo and tipo not in out:
                out[tipo] = m.group(3).strip()
    # blocos documentados como "`tipo` (`...`" mas com ressalva depois do parêntese ficam como estão
    return out


def _icones() -> list:
    linhas = TSX.read_text(encoding="utf-8").split("\n")
    i = next(k for k, l in enumerate(linhas) if l.startswith("const ICONES"))
    nomes = []
    for l in linhas[i + 1:]:
        if l.startswith("};"):
            break
        m = re.match(r"  (\w+):", l)
        if m:
            nomes.append(m.group(1))
    return nomes


def _sfx() -> list:
    m = re.search(r"const SFX[^=]*=\s*\{([^}]*)\}", TSX.read_text(encoding="utf-8"))
    return re.findall(r"(\w+):", m.group(1)) if m else []


def tipos() -> list:
    return list(_blocos_tsx())


def cardapio() -> None:
    blocos, doc = _blocos_tsx(), _doc_props()
    L = ["# Cardápio do estilo Traço (gerado por `produzir.py cardapio traco` — não edite à mão)",
         "",
         "Formato no ROTEIRO.md: `→ tipo k=v k=\"texto\" k=[json] em=@palavra | outro_tipo …` (veja `produzir.py montar`).",
         "Todo bloco: `x y`(centro, px 1080×1920) `z em ate som somEm somVol`. Defaults de x/y/tam por tipo: `traco_padroes.json`.",
         "Âncora `em`: `\"@palavra\"` ou `\"@palavra+0.3\"` = instante em que a palavra é falada NA CENA (vale p/ `ate` e `*Em` e `em` de sub-itens). Número = segundos.",
         "Todo número falado vai na tela com `fonte`. Sem logos: marcas só como texto.",
         "",
         "## Campos do topo (roteiro.json; no ROTEIRO.md = cabeçalho `chave: valor`)",
         "- `composicao`: `Traco` (cabeçalho `estilo`) · `mascote`: false tira Lobo/Hermes (emblema X-GO no lugar) · `titulo` `perfil`(@well.free) `credito`",
         "- `paleta`: \"mono\" (PADRÃO desde 18/11, ref. 79: fundo #F5F5F5 + malha de pontos, tinta #111, cinzas #898988/#C9CAC9, bordas/traços 2 px, sem sombra chapada, zero laranja; acento = sublinhado fino, destaque da legenda = serifa itálica; emblema X-GO em contorno) | \"laranja\" (vídeos 13–16) · `entrada`: \"forja\" (liga sozinha com mono: cada bloco é DESENHADO — guia tracejada → contorno 1,4 px com cursor-mira e pontos → conteúdo revela da esq. p/ dir. ~0,5 s antes da âncora → ficam marcas de canto; linhas guia tracejadas ligam blocos; nada de pop/escala) | \"normal\"",
         "- `trilha` (arquivo em assets/musica) · `trilhaInicio` (s) · `volumeTrilha` (0.08) · `destaques` [palavras em cor na legenda]",
         "- `voz` {id modelo idioma ajustes tempo pausas respiro limiarSilencio} (cabeçalho: `voz: well|chris|<id>`, `tempo: 1.25`) · `pronuncia` {escrito: lido} (só neste vídeo)",
         "- `duracaoMax` (s; checagem aceita 45–90, longo declare) · `respiroFinal` (1.2) · `base` (só no montar: herda o topo de outro projeto)",
         "- Cena: `fala` `duracao`(preenchida pela voz) `tag`(emoção v4) `quem` `camera{zoom x y}`(número ou [de,para]) `transicao`:\"corte\"|\"pan\" `legenda`:\"base\"|\"topo\"|\"nao\" `negativo`:true (fundo #111, traço branco)",
         "",
         "## Blocos (`tipo: props` — o que faz)"]
    for tipo, props in blocos.items():
        if tipo in OVERRIDE:
            txt = OVERRIDE[tipo]
        elif tipo in doc:
            txt = doc[tipo]
            citados = set(re.findall(r"[A-Za-z]\w*", txt))
            extra = [p for p in props if p not in citados and p not in GERAIS]
            txt = txt + (" +" + " ".join(extra) if extra else "")
        else:
            txt = " ".join(p for p in props if p not in GERAIS)
        L.append(f"- `{tipo}: {txt}` — {DESC.get(tipo, 'bloco do Traço')}")
    L += ["", "## Ícones", ", ".join(_icones()), "", "## Sons (`som`)", ", ".join(_sfx()),
          "", "## Mídia e dicas",
          "- `celular.video:\"app/chat.mp4\"`: gravações em `assets/app/` do projeto, por HARDLINK (`New-Item -ItemType HardLink`), nunca cópia. Fonte: `PROJETOS/16-11-2026_xgo-casa-nova/assets/app/*.mp4` (agente bots casa celular chat financas fluxo insta modular tour).",
          "- `celular.etiqueta{t icone sub em pos:baixo/topo escuro}` · `celular.moldura:\"janela\"` (+`w proporcao titulo`) · `numero` com `casas dur`, milhar com ponto.",
          "- \"GRÁTIS\" gigante = `titulo` tam 230. `lobo`/`hermes` somem com `mascote:false`. Cena: `camera`, `transicao:\"corte\"` (sem pan), `legenda`.",
          "- Teste visual: `node motor.mjs previa <props> Traco <pasta> <frames>`. Exemplos: `PROJETOS/16-11-2026_hermes-app/roteiro.json`, `17-11-2026_xgo-agentes-24h`, `18-11-2026_xgo-o-que-e-agente`."]
    CARDAPIO.write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"Cardápio: {CARDAPIO} ({len(blocos)} tipos, {CARDAPIO.stat().st_size} bytes)")


# ---------------------------------------------------------------- tokenizer
def _norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(ch for ch in s if unicodedata.category(ch) != "Mn"))


def _escalar(v: str):
    if v in ("true", "false"):
        return v == "true"
    if v == "null":
        return None
    try:
        return int(v)
    except ValueError:
        pass
    try:
        return float(v)
    except ValueError:
        return v


def _ler_json(s: str, i: int) -> int:
    """s[i] é '[' ou '{': devolve o índice logo após o fecho correspondente (respeita aspas)."""
    prof, aspas, esc = 0, False, False
    for j in range(i, len(s)):
        c = s[j]
        if aspas:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                aspas = False
        elif c == '"':
            aspas = True
        elif c in "[{":
            prof += 1
        elif c in "]}":
            prof -= 1
            if prof == 0:
                return j + 1
    raise ValueError("colchete/chave sem fechar")


def _dividir(s: str) -> list:
    """Separa blocos por '|' fora de aspas/colchetes."""
    partes, ini, i = [], 0, 0
    while i < len(s):
        c = s[i]
        if c == '"':
            i = s.index('"', i + 1) + 1 if '"' in s[i + 1:] else len(s)
            continue
        if c in "[{":
            i = _ler_json(s, i)
            continue
        if c == "|":
            partes.append(s[ini:i])
            ini = i + 1
        i += 1
    partes.append(s[ini:])
    return [p.strip() for p in partes if p.strip()]


def _tokens(s: str) -> list:
    """'tipo k=v ...' -> [(chave|None, valor)]. Levanta ValueError com mensagem clara."""
    out, i, n = [], 0, len(s)
    while i < n:
        if s[i].isspace():
            i += 1
            continue
        j = i
        while j < n and not s[j].isspace() and s[j] != "=":
            j += 1
        if j >= n or s[j] != "=":
            out.append((None, s[i:j]))
            i = j
            continue
        chave, i = s[i:j], j + 1
        if i >= n or s[i].isspace():
            raise ValueError(f"'{chave}=' sem valor")
        if s[i] == '"':
            k = i + 1
            while k < n and not (s[k] == '"' and s[k - 1] != "\\"):
                k += 1
            if k >= n:
                raise ValueError(f"aspas sem fechar em {chave}=")
            out.append((chave, json.loads(s[i:k + 1])))
            i = k + 1
        elif s[i] in "[{":
            k = _ler_json(s, i)
            try:
                out.append((chave, json.loads(s[i:k])))
            except json.JSONDecodeError as e:
                raise ValueError(f"JSON inválido em {chave}= ({e.msg}); use aspas duplas") from None
            i = k
        else:
            k = i
            while k < n and not s[k].isspace():
                k += 1
            out.append((chave, _escalar(s[i:k])))
            i = k
    return out


# ---------------------------------------------------------------- montagem
def _valor_cab(chave: str, v: str):
    v = v.strip()
    if chave in ("destaques", "pronuncia") and v[:1] in "[{":
        try:
            return json.loads(v)   # aceita JSON também: ["a","b"] / {"a":"b"}
        except json.JSONDecodeError:
            sys.exit(f"cabeçalho '{chave}': JSON inválido -> {v}")
    if chave in ("destaques",):
        return [x.strip() for x in v.split(",") if x.strip()]
    if chave == "pronuncia":
        d = {}
        for par in v.split(";"):
            if "=" in par:
                a, b = par.split("=", 1)
                d[a.strip()] = b.strip()
        return d
    return _escalar(v)


def _ancoras(o, fala_norm: list, onde: str, erros: list) -> None:
    if isinstance(o, dict):
        for k, v in o.items():
            if (k in ("em", "ate") or k.endswith("Em")) and isinstance(v, str):
                if not v.startswith("@"):
                    erros.append(f"{onde}: '{k}={v}' — âncora deve começar com @ (ou use número)")
                else:
                    alvo = _norm(v[1:].partition("+")[0])
                    if not alvo or not any(w.startswith(alvo) for w in fala_norm):
                        erros.append(f"{onde}: âncora '{v}' não existe na fala desta cena")
            else:
                _ancoras(v, fala_norm, onde, erros)
    elif isinstance(o, list):
        for x in o:
            _ancoras(x, fala_norm, onde, erros)


def montar(proj: Path, achar_projeto) -> None:
    md = proj / "ROTEIRO.md"
    if not md.exists():
        sys.exit(f"Falta {md}")
    cab, cenas, titulo_h1 = {}, [], None
    erros = []
    validos = _blocos_tsx()
    props_ok = {t: set(p) | GERAIS for t, p in validos.items()}
    padroes = json.loads(PADROES.read_text(encoding="utf-8")) if PADROES.exists() else {}
    atual = None
    avisados = set()
    for n, bruto in enumerate(md.read_text(encoding="utf-8").split("\n"), 1):
        l = bruto.strip()
        m_fala = re.match(r"(\d+)\.\s+(.+)", l)
        if m_fala:
            atual = {"fala": m_fala.group(2).strip(), "blocos": [], "_n": int(m_fala.group(1)), "_linha": n}
            cenas.append(atual)
            continue
        if l.startswith("→") or l.startswith("->"):
            corpo = l[1:] if l.startswith("→") else l[2:]
            if atual is None:
                erros.append(f"linha {n}: '→' antes da primeira fala")
                continue
            for bl in _dividir(corpo):
                try:
                    tk = _tokens(bl)
                except (ValueError, json.JSONDecodeError) as e:
                    erros.append(f"linha {n} (fala {atual['_n']}): {e} — em «{bl[:60]}»")
                    continue
                if not tk or tk[0][0] is not None or tk[0][1] not in validos:
                    erros.append(f"linha {n} (fala {atual['_n']}): «{bl[:60]}» não começa com tipo válido (texto livre não vale)")
                    continue
                tipo = tk[0][1]
                b = {"tipo": tipo, **padroes.get(tipo, {})}
                for k, v in tk[1:]:
                    if k is None:
                        if v.startswith("@"):
                            b["em"] = v
                        else:
                            erros.append(f"linha {n} (fala {atual['_n']}): '{v}' sem chave= no bloco {tipo}")
                    else:
                        b[k] = v
                        if k not in props_ok[tipo]:
                            if (tipo, k) not in avisados:
                                avisados.add((tipo, k))
                                print(f"  aviso: linha {n} fala {atual['_n']}: '{k}' não é prop conhecida de '{tipo}'")
                atual["blocos"].append(b)
            continue
        if l.startswith("⚙"):
            if atual is None:
                erros.append(f"linha {n}: '⚙' antes da primeira fala")
                continue
            try:
                for k, v in _tokens(l[1:]):
                    if k is None:
                        raise ValueError(f"'{v}' sem chave=")
                    atual[k] = v
            except (ValueError, json.JSONDecodeError) as e:
                erros.append(f"linha {n}: {e}")
            continue
        if atual is None:   # cabeçalho
            if l.startswith("# ") and not titulo_h1:
                titulo_h1 = l[2:].strip()
                continue
            m = re.match(r"[-*\s]*([A-Za-zçÇ]\w*)\s*:\s*(.+)", l)
            if m and m.group(1).lower() in CHAVES:
                cab[CHAVES[m.group(1).lower()]] = m.group(2).strip()
    if erros:
        sys.exit("ROTEIRO.md com erro(s):\n  " + "\n  ".join(erros) + f"\nTipos válidos: {', '.join(validos)}\n(props: {CARDAPIO}; regenere com `produzir.py cardapio traco`)")
    if not cenas:
        sys.exit("ROTEIRO.md sem falas (formato `N. texto`).")
    seq = [c["_n"] for c in cenas]
    if seq != list(range(1, len(cenas) + 1)):
        print(f"  aviso: numeração das falas não é 1..N contínua: {seq}")

    estilo = _norm(str(cab.get("estilo", "Traco")))
    if estilo != "traco":
        sys.exit(f"montar só conhece o estilo Traco (veio '{cab['estilo']}').")

    # topo: base herdada < cabeçalho
    topo = {}
    if "base" in cab:
        bp = achar_projeto(str(cab["base"]))
        topo = {k: v for k, v in json.loads((bp / "roteiro.json").read_text(encoding="utf-8")).items() if k != "cenas"}
    topo.setdefault("perfil", "@well.free")
    topo.setdefault("credito", "Telas: app X-GO")
    topo["composicao"] = "Traco"
    for k in ("titulo", "perfil", "credito", "trilha", "trilhaInicio", "volumeTrilha", "duracaoMax", "respiroFinal", "mascote", "paleta", "entrada", "fonteAcento"):
        if k in cab:
            topo[k] = _valor_cab(k, str(cab[k]))
    if "titulo" not in topo:
        topo["titulo"] = titulo_h1 or proj.name
    for k in ("destaques", "pronuncia"):
        if k in cab:
            topo[k] = _valor_cab(k, str(cab[k]))
    voz = json.loads(json.dumps(topo.get("voz", {})))
    if "voz" in cab:
        txt = str(cab["voz"])
        achado = re.search(r"\b[A-Za-z0-9]{20}\b", txt)
        nome = next((v for k, v in VOZES.items() if k in txt.lower()), None)
        vid = achado.group(0) if achado else nome
        if not vid:
            sys.exit(f"voz '{txt}': use well, chris ou o id de 20 caracteres.")
        if vid == VOZES["well"] and not voz:
            voz = json.loads(json.dumps(VOZ_WELL))
        voz = {**voz, "id": vid}
    if "estilovoz" in cab:   # preset da voz Well: professor | natural | apresentador (00-SISTEMA/assets/voz/estilos.json)
        est = json.loads((SISTEMA / "assets" / "voz" / "estilos.json").read_text(encoding="utf-8"))
        nome_e = str(cab["estilovoz"]).strip().lower()
        if nome_e not in est or nome_e.startswith("_"):
            sys.exit(f"estilovoz '{nome_e}': use {', '.join(k for k in est if not k.startswith('_'))}.")
        p = est[nome_e]
        voz["ajustes"] = {**voz.get("ajustes", {}), **p["ajustes"]}
        voz["tempo"] = p["tempo"]
        if p.get("tag"):
            voz["tag"] = p["tag"]
        else:
            voz.pop("tag", None)
    for k_cab, k_voz in (("tempo", "tempo"), ("respiro", "respiro"), ("pausas", "pausas")):
        if k_cab in cab:
            voz[k_voz] = _valor_cab(k_cab, str(cab[k_cab]))
    if voz:
        topo["voz"] = voz
    topo.setdefault("destaques", [])
    topo.setdefault("pronuncia", {})

    # duração já medida (mesma fala, mesma posição) é preservada: o `voz` usa para re-sincronizar
    antigo = []
    antigo_topo = None
    rj = proj / "roteiro.json"
    if rj.exists():
        try:
            antigo_topo = json.loads(rj.read_text(encoding="utf-8"))
            antigo = antigo_topo.get("cenas", [])
        except json.JSONDecodeError:
            pass
    # paleta mono + forja = padrão desde 18/11/2026 (ref. 79); roteiro antigo sem `paleta` continua no laranja
    if "paleta" not in topo and not (antigo_topo is not None and "paleta" not in antigo_topo):
        topo["paleta"] = "mono"
    ordem = ["titulo", "perfil", "credito", "composicao", "mascote", "paleta", "entrada", "fonteAcento", "trilha", "trilhaInicio", "volumeTrilha", "voz", "pronuncia", "destaques", "duracaoMax"]
    roteiro = {k: topo[k] for k in ordem if k in topo}
    roteiro.update({k: v for k, v in topo.items() if k not in roteiro})
    saida = []
    for i, c in enumerate(cenas):
        fala_norm = [_norm(w) for w in c["fala"].split()]
        n_blocos_erro = len(erros)
        _ancoras(c["blocos"], fala_norm, f"fala {c['_n']}", erros)
        cena = {"fala": c["fala"]}
        for k, v in c.items():
            if k not in ("fala", "blocos", "_n", "_linha"):
                cena[k] = v
        cena["blocos"] = c["blocos"]
        if i < len(antigo) and antigo[i].get("fala") == c["fala"] and "duracao" in antigo[i]:
            cena["duracao"] = antigo[i]["duracao"]
        saida.append(cena)
    if erros:
        sys.exit("ROTEIRO.md com âncora(s) ruim(ns):\n  " + "\n  ".join(erros))
    roteiro["cenas"] = saida
    rj.write_text(json.dumps(roteiro, ensure_ascii=False, indent=2), encoding="utf-8")
    nb = sum(len(c["blocos"]) for c in saida)
    print(f"roteiro.json montado: {len(saida)} cenas, {nb} blocos ({rj})")


CHAVES = {k.lower(): k for k in ("estilo", "voz", "mascote", "trilha", "trilhaInicio", "tempo", "duracaoMax", "base", "titulo",
                                 "perfil", "credito", "volumeTrilha", "destaques", "pronuncia", "respiroFinal", "respiro", "pausas",
                                 "paleta", "entrada", "estilovoz", "fonteAcento")}
