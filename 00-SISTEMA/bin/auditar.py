"""Auditoria de uma sessão do Claude Code: onde foram os tokens, o tempo e os créditos.
Lê o histórico (.jsonl) da sessão e dos subagentes e imprime um resumo curto. Não precisa abrir o histórico.

    python auditar.py                 # sessão mais recente deste projeto
    python auditar.py <id-da-sessao>  # uma sessão específica (o nome do .jsonl)
    python auditar.py lista           # últimas sessões, com tamanho e data

Usado pela skill `melhoria-continua` (fim de cada vídeo). Só lê; não grava nada.
"""
import json, re, sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

RAIZ = Path(__file__).resolve().parents[2]
HIST = Path.home() / ".claude" / "projects" / re.sub(r"[^A-Za-z0-9]", "-", str(RAIZ))
# preço de referência por 1 milhão de tokens (entrada, saída) só para comparar modelos; confira em claude-api se mudar
PESO = {"opus": (5, 25), "sonnet": (3, 15), "haiku": (1, 5)}


def _familia(modelo: str) -> str:
    return next((f for f in PESO if f in (modelo or "")), "outro")


def _resumo_entrada(nome: str, inp: dict) -> str:
    if nome in ("Bash", "PowerShell"):
        return (inp.get("command") or "")[:90].replace("\n", " ")
    for k in ("file_path", "pattern", "url", "skill", "subagent_type", "query"):
        if inp.get(k):
            return f"{k}={str(inp[k])[-70:]}"
    return ""


def _texto(c) -> str:
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        return " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in c)
    return str(c)


def auditar(arq: Path):
    arquivos = [arq] + sorted((arq.parent / arq.stem / "subagents").glob("*.jsonl"))
    tokens = defaultdict(Counter)            # família -> entrada/cache/saída
    vistos, ferramentas, erros, grandes = set(), Counter(), [], []
    usos, cmds, produzir, creditos = {}, Counter(), Counter(), []
    t0 = t1 = None
    for a in arquivos:
        sub = a != arq
        for linha in a.open(encoding="utf-8"):
            try:
                d = json.loads(linha)
            except json.JSONDecodeError:
                continue
            ts = d.get("timestamp")
            if ts and not sub:
                t = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                t0, t1 = t0 or t, t
            m = d.get("message") or {}
            if d.get("type") == "assistant":
                mid = m.get("id")
                u = m.get("usage")
                if u and mid not in vistos:
                    vistos.add(mid)
                    f = _familia(m.get("model")) + (" (sub)" if sub else "")
                    tokens[f]["entrada"] += u.get("input_tokens", 0) + u.get("cache_creation_input_tokens", 0)
                    tokens[f]["cache"] += u.get("cache_read_input_tokens", 0)
                    tokens[f]["saida"] += u.get("output_tokens", 0)
                    tokens[f]["chamadas"] += 1
                for b in m.get("content") or []:
                    if b.get("type") == "tool_use":
                        nome, inp = b.get("name", "?"), b.get("input") or {}
                        ferramentas[nome] += 1
                        usos[b.get("id")] = (nome, _resumo_entrada(nome, inp))
                        if nome in ("Bash", "PowerShell"):
                            c = (inp.get("command") or "").strip()
                            cmds[c[:80]] += 1
                            for sc in re.findall(r"produzir\.py\s+(\w+)", c):
                                produzir[sc] += 1
            elif d.get("type") == "user" and isinstance(m.get("content"), list):
                for b in m["content"]:
                    if b.get("type") != "tool_result":
                        continue
                    nome, resumo = usos.get(b.get("tool_use_id"), ("?", ""))
                    txt = _texto(b.get("content"))
                    grandes.append((len(txt), nome, resumo))
                    if b.get("is_error"):
                        erros.append((nome, resumo, txt.strip().splitlines()[-1][:110] if txt.strip() else ""))
                    creditos += re.findall(r"restam ([\d.]+) de ([\d.]+)", txt)

    p = print
    dur = f"{(t1 - t0).total_seconds() / 60:.0f} min" if t0 else "?"
    p(f"SESSÃO {arq.stem[:8]}  duração {dur}  subagentes {len(arquivos) - 1}")
    p("\nTOKENS (entrada nova | lida do cache | saída | chamadas)  custo relativo")
    total = 0
    for f, c in sorted(tokens.items(), key=lambda x: -x[1]["entrada"]):
        if not (c["entrada"] or c["cache"]):
            continue
        pe, ps = PESO.get(f.split()[0], (3, 15))
        custo = (c["entrada"] * pe + c["cache"] * pe * 0.1 + c["saida"] * ps) / 1e6
        total += custo
        media = (c["entrada"] + c["cache"]) // max(c["chamadas"], 1)
        p(f"  {f:13} {c['entrada']:>11,} | {c['cache']:>12,} | {c['saida']:>9,} | {c['chamadas']:>4}   ~US$ {custo:,.2f}"
          f"   contexto médio {media // 1000}k")
    p(f"  total ~US$ {total:,.2f} (referência de preço de API; serve para comparar sessões)")
    p("\nFERRAMENTAS  " + "  ".join(f"{n} {q}" for n, q in ferramentas.most_common(10)))
    if produzir:
        p("PIPELINE     " + "  ".join(f"{n}×{q}" for n, q in produzir.most_common()))
    p(f"\nERROS ({len(erros)})")
    for nome, r, e in erros[:12]:
        p(f"  {nome}: {r[:60]}  →  {e}")
    rep = [(q, c) for c, q in cmds.most_common() if q > 1][:8]
    if rep:
        p("\nCOMANDOS REPETIDOS (retrabalho?)")
        for q, c in rep:
            p(f"  {q}×  {c}")
    p("\nMAIORES RESULTADOS (o que mais encheu o contexto, em caracteres)")
    for n, nome, r in sorted(grandes, reverse=True)[:8]:
        p(f"  {n:>8,}  {nome}: {r[:80]}")
    if creditos:
        seq = []
        for r, _ in creditos:
            if not seq or seq[-1] != r:
                seq.append(r)
        p("\nCRÉDITOS ELEVENLABS  " + " → ".join(seq))


def main():
    if not HIST.exists():
        sys.exit(f"Sem histórico em {HIST}")
    sessoes = sorted(HIST.glob("*.jsonl"), key=lambda x: x.stat().st_mtime, reverse=True)
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if arg == "lista":
        for s in sessoes[:10]:
            print(datetime.fromtimestamp(s.stat().st_mtime).strftime("%d/%m %H:%M"), f"{s.stat().st_size / 1e6:5.1f} MB", s.stem)
        return
    alvo = next((s for s in sessoes if s.stem.startswith(arg)), None) if arg else (sessoes[0] if sessoes else None)
    if not alvo:
        sys.exit("Sessão não encontrada.")
    auditar(alvo)


if __name__ == "__main__":
    main()
