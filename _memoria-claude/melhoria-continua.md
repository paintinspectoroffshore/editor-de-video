---
name: melhoria-continua
description: usuário quer auditoria após cada vídeo — toda falha vira código/regra; projeto como "máquina" rápida, barata e de altíssima qualidade
metadata:
  type: feedback
---

Pedido de 2026-11-14: depois de cada vídeo, rodar a skill `melhoria-continua` (`python 00-SISTEMA/bin/auditar.py` → corrigir pela raiz → registrar em `REFERÊNCIAS/MELHORIA-CONTINUA.md`).

**Why:** o usuário quer o projeto como "máquina de criação de vídeos com velocidade, economia e altíssima qualidade". A auditoria do GTA 6 mostrou que 93% do custo de tokens foi releitura de contexto (Opus fazendo produção sozinho, 176k por chamada) e que ~1.800 créditos ElevenLabs foram gastos regenerando a voz inteira.

**How to apply:** 1 vídeo = 1 sessão; após roteiro aprovado, delegar produção ao `produtor` (sonnet); testar palavras difíceis com `eleven.py teste` antes do `rapido`; nunca `cat` de arquivo grande. Ver [[video-editor-system]] e [[agentes-por-modelo]].
