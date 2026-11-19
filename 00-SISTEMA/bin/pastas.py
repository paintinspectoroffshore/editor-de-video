"""Nomes de pasta com data: criar = DD-MM-AAAA_slug; achar/ordenar aceita DD-MM-AAAA e o formato antigo AAAA-MM-DD."""
import re
from datetime import date
from pathlib import Path

_NOVO = re.compile(r"^(\d{2})-(\d{2})-(\d{4})(?:_|$)")
_VELHO = re.compile(r"^(\d{4})-(\d{2})-(\d{2})(?:_|$)")


def prefixo_hoje() -> str:
    return date.today().strftime("%d-%m-%Y")


def nome_novo(slug: str) -> str:
    return f"{prefixo_hoje()}_{slug}"


def chave_data(nome: str):
    """Chave de ordenação pela data real (AAAA, MM, DD). Sem data: vai pro começo."""
    nome = Path(nome).name
    m = _NOVO.match(nome)
    if m:
        return (int(m[3]), int(m[2]), int(m[1]), nome)
    m = _VELHO.match(nome)
    if m:
        return (int(m[1]), int(m[2]), int(m[3]), nome)
    return (0, 0, 0, nome)


def ordenar(pastas):
    return sorted(pastas, key=lambda p: chave_data(p.name))


def slug_de(nome: str) -> str:
    """Tira o prefixo de data (qualquer formato)."""
    return re.sub(r"^(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2})_", "", Path(nome).name)


def achar(raiz: Path, nome: str):
    """Pasta exata ou única que termina em `nome` (slug). lista (vazia se não achar)."""
    if not raiz.is_dir():
        return []
    m = _VELHO.match(nome)
    if m:  # nome no formato antigo -> converte para o novo
        nome = f"{m[3]}-{m[2]}-{m[1]}" + nome[10:]
    direto = raiz / nome
    if direto.is_dir():
        return [direto]
    return ordenar(p for p in raiz.iterdir() if p.is_dir() and p.name.endswith(nome))
