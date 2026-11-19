---
name: fabrica
description: Linha de produção do @well.free com o modelo certo em cada função (haiku/sonnet/opus) e revisão final do Opus. Use ao começar qualquer criação — Reel vertical, carrossel, vídeo horizontal do YouTube, pesquisa, estudo de DNA, trilha — para saber qual agente chamar, em que ordem e onde estão os portões de aprovação.
---

# Fábrica — quem faz o quê

A sessão principal (Opus) **orquestra**: decide, chama **um agente por vez**, confere e fala com o usuário (caveman, português simples). Tarefa de 1–3 comandos: faça direto, sem agente.

## Roteamento (função → agente → modelo)
| Função | Agente | Modelo | Por quê |
|---|---|---|---|
| Garimpo de virais, ranking, download, transcrição, saldo | `garimpeiro` | haiku | mecânico |
| Faxina, índices, ponteiros | `zelador` | haiku | mecânico |
| Estudo de DNA (visual + som + motor do gancho) | `analista` | sonnet | leitura de mosaico, padrão |
| Trilha, abertura sonora 3 s, SFX | `sonoplasta` | sonnet | regras claras em `TRILHA.md` |
| Montar roteiro.json, voz, prévia, render, carrossel | `produtor` | sonnet | técnico, guiado pela skill `reel` |
| Publicar (Metricool MCP / Chrome / API) | `publicador` | sonnet | passos fixos |
| Pauta, análise de viral, fontes, roteiro, legenda | `roteirista` | opus | o roteiro decide o alcance |
| Estilo novo, gráfico animado, formato 16:9, carrossel novo | `designer` | opus | código + estética |
| **Revisão final de toda etapa criativa** | `revisor` | opus | último filtro |

## Linhas de produção
**Reel vertical (9:16)** — skill `reel`
1. `garimpeiro` (se precisar de pesquisa) → `roteirista` (Intenção + 3 ganchos + roteiro) → **`revisor`** → 🟢 usuário aprova roteiro.
2. `sonoplasta` define trilha/abertura → `produtor` roda `rapido` → **`revisor`** olha `_MOSAICO.jpg` → 🟢 usuário aprova prévia; `produtor` roda `entrega` em segundo plano.
3. **`revisor`** confere `_FINAL.jpg` + CHECAGEM → 🟢 usuário aprova final → `publicador`.

**Carrossel (4:5)** — `roteirista` (capa = gancho com motor, último slide = prêmio) → **`revisor`** → 🟢 → `produtor` (`produzir.py carrossel`) → **`revisor`** no `_MOSAICO_CARROSSEL.jpg` → 🟢 → `publicador`.

**YouTube horizontal (16:9)** — mesma espinha do `ROTEIRO.md` (gancho 15–30 s, capítulos 60–120 s, reset visual a cada ~40 s). `roteirista` → **`revisor`** → 🟢 → `produtor` com composição `*Yt` → **`revisor`** → 🟢. Cada capítulo rende 1 corte 9:16 (`cortes.py`). Estilo 16:9 ainda não existe: primeiro uso pede o `designer` criar `src/youtube/` (largura/altura vindas de `useVideoConfig`).

**Estudo de referências** — `analista` (skill `catalogo`) → `roteirista` atualiza `GANCHOS.md` se surgir motor novo → `zelador` limpa `_lote`.

## Portões (nunca pular)
- Três aprovações do usuário: **roteiro, prévia, final**. O `revisor` aprova antes de cada uma; o usuário decide.
- Antes de "pronto": `npx tsc --noEmit` (se mexeu em código), linha CHECAGEM OK, `_FINAL.jpg`.
- Fim: `melhoria-continua` (auditoria) + `limpeza.py` (faxina).

## Economia
Agentes recebem só o caminho do projeto e o pedido; eles leem os docs-lei sozinhos. Mosaico, nunca frame a frame. 1 vídeo = 1 sessão.

## Regras de economia (18/11/2026, auditoria vídeos 14–15: US$ 23 / 149 min → meta US$ 2–3 / 20 min por vídeo)
1. **1ª pergunta sempre: "Você já tem roteiro?"** Sim → zero `roteirista`, zero `revisor` de roteiro; a sessão principal só pontua o texto e mostra no layout `ROTEIRO.md §5`.
2. **Designer só se nenhum bloco do cardápio (`00-SISTEMA/templates/traco_blocos.md`) compõe a cena.** Tente combinar os existentes primeiro. Máx. 1 bloco novo por vídeo, genérico e reutilizável (exceto se o usuário pedir visual novo). Mesma série/estilo → 0 designer.
3. **Revisor (agente Opus) só no roteiro escrito pelo roteirista.** Prévia/final: CHECAGEM automática + a sessão principal olha 1 mosaico. Sem agente revisor na produção.
4. **Montagem por código:** `produzir.py montar <slug>` (ROTEIRO.md com linhas `→ bloco k=v` → roteiro.json). Produtor nunca escreve gerador próprio nem lê `VideoTraco.tsx` inteiro.
5. **Pronúncia:** `eleven.py pronuncia "A,B,C"` (gera + Whisper small) antes do `rapido`. Resultado bom vai para `pronuncia.json`.
6. **Sincronia vem da ElevenLabs** (tempos por palavra). `ouvir` (Whisper small) é a única conferência. Proibido Whisper medium/large.
7. **Modo lote (dezenas de vídeos):** sessão principal magra; por vídeo, 1 `produtor` (sonnet) com prompt de ~5 linhas: "slug X, ROTEIRO.md pronto, `montar` + `rapido`, relate OUVIR e mosaico". Principal vê só o `_MOSAICO.jpg`, dispara `entrega` em segundo plano e segue para o próximo. Material de vídeo anterior: hardlink de `assets/app/`.
