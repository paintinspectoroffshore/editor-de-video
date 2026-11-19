"""Aprovação pelo Telegram (botões) + publicação automática ao aprovar. Só biblioteca padrão, 0 tokens enquanto espera.

Configuração (uma vez): crie um bot no @BotFather, cole o token em 00-SISTEMA/segredos/telegram.key,
mande /start para o bot e rode `python aprovar.py configurar` (captura o seu chat_id).

Comandos:
  configurar                    salva o chat_id de quem mandou /start
  enviar <slug>                 manda o vídeo final (ou o carrossel) + legenda com botões Aprovar / Ajustar / Descartar
  vigiar                        processa os cliques: aprovado -> publica (insta.py) ; ajustar -> guarda o pedido
  status                        fila de aprovação
  avisar "<texto>"              mensagem simples (ex.: alerta de créditos)

Estado de cada projeto: PROJETOS/<slug>/piloto.json ou CARROSSEIS/<slug>/piloto.json  {"etapa": "aguardando|aprovado|publicado|ajustar|descartado", ...}
"""
from __future__ import annotations

import json
import mimetypes
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pastas

for _s in (sys.stdout, sys.stderr):  # console do Windows (cp1252) não derruba os ✓/✗
    _s.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parents[2]
SEG = RAIZ / "00-SISTEMA" / "segredos"
BIN = Path(__file__).resolve().parent
PRONTOS = RAIZ / "VIDEOS PRONTOS"


def tg(metodo: str, arquivos: dict | None = None, **p) -> dict:
    tok = (SEG / "telegram.key").read_text().strip()
    url = f"https://api.telegram.org/bot{tok}/{metodo}"
    for k, v in list(p.items()):
        if isinstance(v, (dict, list)):
            p[k] = json.dumps(v, ensure_ascii=False)
    if arquivos:  # multipart
        lim = uuid.uuid4().hex
        corpo = b""
        for k, v in p.items():
            corpo += f'--{lim}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for k, arq in arquivos.items():
            arq = Path(arq)
            tipo = mimetypes.guess_type(arq.name)[0] or "application/octet-stream"
            corpo += f'--{lim}\r\nContent-Disposition: form-data; name="{k}"; filename="{arq.name}"\r\nContent-Type: {tipo}\r\n\r\n'.encode() + arq.read_bytes() + b"\r\n"
        corpo += f"--{lim}--\r\n".encode()
        req = urllib.request.Request(url, data=corpo, headers={"Content-Type": f"multipart/form-data; boundary={lim}"})
    else:
        req = urllib.request.Request(url, data=urllib.parse.urlencode(p).encode())
    with urllib.request.urlopen(req, timeout=300) as r:
        res = json.loads(r.read())
    if not res.get("ok"):
        raise RuntimeError(res.get("description"))
    return res["result"]


def chat() -> str:
    return json.loads((SEG / "telegram.json").read_text())["chat_id"]


PASTAS = ("PROJETOS", "CARROSSEIS")   # vídeos e carrosséis (cada carrossel numa pasta isolada)


def projeto(slug: str) -> Path:
    achados = pastas.ordenar(p for d in PASTAS for p in (RAIZ / d).glob(f"*{slug}*") if p.is_dir())
    if not achados:
        sys.exit(f"✗ projeto '{slug}' não encontrado")
    return achados[-1]


def estado(p: Path) -> dict:
    f = p / "piloto.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def salvar(p: Path, e: dict) -> None:
    (p / "piloto.json").write_text(json.dumps(e, indent=2, ensure_ascii=False), encoding="utf-8")


def configurar() -> None:
    ups = tg("getUpdates")
    msgs = [u["message"] for u in ups if "message" in u]
    if not msgs:
        sys.exit("✗ Mande /start para o seu bot no Telegram e rode de novo.")
    cid = msgs[-1]["chat"]["id"]
    (SEG / "telegram.json").write_text(json.dumps({"chat_id": cid}))
    tg("sendMessage", chat_id=cid, text="✅ Piloto automático conectado. As aprovações chegam aqui.")
    print("✓ chat configurado")


def enviar(slug: str) -> None:
    p = projeto(slug)
    e = estado(p)
    leg = (p / "legenda.txt").read_text(encoding="utf-8") if (p / "legenda.txt").exists() else ""
    botoes = {"inline_keyboard": [[{"text": "✅ Aprovar e postar", "callback_data": f"ok|{p.name}"}],
                                  [{"text": "✏️ Ajustar", "callback_data": f"aj|{p.name}"}, {"text": "❌ Descartar", "callback_data": f"no|{p.name}"}]]}
    modo = "TESTE (só não seguidores)" if e.get("teste", True) else "PÚBLICO"
    resumo = f"🎬 {p.name}\nPublicação: {modo}\n\n{leg[:900]}"
    slides = sorted((p / "slides").glob("*.jpg"))
    mp4 = video_final(p)
    if slides:
        tg("sendMediaGroup", arquivos={f"s{i}": s for i, s in enumerate(slides[:10])}, chat_id=chat(),
           media=[{"type": "photo", "media": f"attach://s{i}"} for i in range(len(slides[:10]))])
        msg = tg("sendMessage", chat_id=chat(), text=resumo, reply_markup=botoes)
    elif mp4.exists() and mp4.stat().st_size < 49e6:
        msg = tg("sendVideo", arquivos={"video": mp4}, chat_id=chat(), caption=resumo[:1000], reply_markup=botoes, supports_streaming="true")
    else:
        mos = p / "previa" / "_FINAL.jpg"
        msg = tg("sendPhoto", arquivos={"photo": mos}, chat_id=chat(), caption=resumo[:1000], reply_markup=botoes)
    e.update(etapa="aguardando", msg_id=msg["message_id"], enviado=time.strftime("%Y-%m-%d %H:%M"))
    salvar(p, e)
    print(f"✓ enviado para aprovação: {p.name}")



def video_final(p: Path) -> Path:
    """Acha o MP4 numerado do projeto (VIDEOS PRONTOS/NN-<slug>.mp4 ou em _publicados/)."""
    slug = pastas.slug_de(p.name)
    for pasta in (PRONTOS, PRONTOS / "_publicados"):
        achado = sorted(pasta.glob(f"[0-9][0-9]-{slug}.mp4"))
        if achado:
            return achado[0]
    return PRONTOS / f"{p.name}.mp4"

def publicar(p: Path, e: dict) -> str:
    leg = p / "legenda.txt"
    if any((p / "slides").glob("*.jpg")):
        cmd = [sys.executable, str(BIN / "insta.py"), "carrossel", str(p / "slides"), str(leg)]
    else:
        cmd = [sys.executable, str(BIN / "insta.py"), "reel", str(video_final(p)), str(leg)]
        if e.get("teste", True):
            cmd += ["--teste", e.get("graduacao", "MANUAL")]
        if e.get("capa_ms") is not None:
            cmd += ["--capa-ms", str(e["capa_ms"])]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    return (r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout + r.stderr).strip() else "sem saída"


def vigiar() -> None:
    """Roda a cada poucos minutos (Agendador do Windows). Sem cliques novos, sai na hora."""
    off_f = SEG / "telegram_offset.txt"
    off = int(off_f.read_text()) if off_f.exists() else 0
    for u in tg("getUpdates", offset=off, timeout=0):
        off = u["update_id"] + 1
        if "callback_query" in u:
            q = u["callback_query"]
            acao, nome = q["data"].split("|", 1)
            p = next((RAIZ / d / nome for d in PASTAS if (RAIZ / d / nome).is_dir()), RAIZ / "PROJETOS" / nome)
            e = estado(p)
            tg("answerCallbackQuery", callback_query_id=q["id"], text="Recebido!")
            if acao == "ok" and e.get("etapa") == "aguardando":
                e["etapa"] = "aprovado"
                salvar(p, e)
                res = publicar(p, e)
                e["etapa"] = "publicado" if res.startswith("✓") else "erro"
                e["resultado"] = res
                salvar(p, e)
                tg("sendMessage", chat_id=chat(), text=f"{res}")
            elif acao == "aj":
                e["etapa"] = "ajustar"
                salvar(p, e)
                tg("sendMessage", chat_id=chat(), text=f"✏️ O que ajusto em {nome}? Responda esta mensagem com o pedido.", reply_markup={"force_reply": True})
            elif acao == "no":
                e["etapa"] = "descartado"
                salvar(p, e)
                tg("sendMessage", chat_id=chat(), text=f"🗑 {nome} descartado.")
        elif "message" in u and u["message"].get("reply_to_message"):
            txt = u["message"].get("text", "")
            for pj in (pj for d in PASTAS for pj in (RAIZ / d).glob("*/piloto.json")):
                e = json.loads(pj.read_text(encoding="utf-8"))
                if e.get("etapa") == "ajustar" and not e.get("pedido"):
                    e["pedido"] = txt
                    pj.write_text(json.dumps(e, indent=2, ensure_ascii=False), encoding="utf-8")
                    tg("sendMessage", chat_id=chat(), text="👍 Anotado. Ajusto na próxima rodada do piloto.")
                    break
    off_f.write_text(str(off))


def status() -> None:
    for pj in sorted((pj for d in PASTAS for pj in (RAIZ / d).glob("*/piloto.json")), key=lambda x: pastas.chave_data(x.parent.name)):
        e = json.loads(pj.read_text(encoding="utf-8"))
        print(f"{pj.parent.name:45} {e.get('etapa', '?'):11} {e.get('pedido', '')[:60]}")


def main() -> None:
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        return
    {"configurar": configurar, "vigiar": vigiar, "status": status}.get(a[0], lambda: None)()
    if a[0] == "enviar":
        enviar(a[1])
    elif a[0] == "avisar":
        tg("sendMessage", chat_id=chat(), text=a[1])


if __name__ == "__main__":
    main()
