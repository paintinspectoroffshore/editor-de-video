---
name: piloto-automatico
description: Piloto automático de conteúdo (pesquisa→roteiro→produção→aprovação Telegram→publicação API oficial); status da configuração e pendências do usuário
metadata:
  node_type: memory
  type: project
  originSessionId: bd97bbbd-4388-4013-873e-7b1883b59739
  modified: 2026-11-11T13:12:29.634Z
---

Montado em 2026-11-11 a pedido do usuário ("automático de ponta a ponta; prioridade qualidade, velocidade, economia de tokens"). Skill `piloto`, `insta.py`, `aprovar.py`, `produzir.py carrossel`, referência em `REFERÊNCIAS/AUTOMACAO.md`.

Pendências do usuário (2026-11-11), sem elas o piloto não publica sozinho:
1. App Meta + token → `00-SISTEMA/segredos/instagram.json`, depois `insta.py token-longo` e `conferir`.
2. Bot do Telegram → `segredos/telegram.key`, mandar /start, `aprovar.py configurar`.
3. Autorizar o download do `cloudflared.exe` (o classificador bloqueou como código externo), necessário só para carrossel pela API.
4. Depois disso: criar os agendamentos (Windows `aprovar.py vigiar` a cada 10 min + tarefa diária do Claude "rode a skill piloto").

Regra do usuário: cruzar várias fontes, não confiar no 1º resultado, implementar só o validado. Máx. 5 hashtags.

**Why:** o usuário quer o Instagram no piloto automático com aprovação dele antes de postar.
**How to apply:** ao retomar, confira as pendências com `insta.py conferir` e `aprovar.py status` antes de propor qualquer coisa. Ligado a [[video-editor-system]] e [[instagram-trial-reels]].
