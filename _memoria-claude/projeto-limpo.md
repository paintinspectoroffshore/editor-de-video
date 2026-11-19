---
name: projeto-limpo
description: "Usuário exige projeto 1-Videos limpo, leve e sem duplicatas; regras em REFERÊNCIAS/ORGANIZACAO.md"
metadata:
  node_type: memory
  type: feedback
  originSessionId: bd97bbbd-4388-4013-873e-7b1883b59739
  modified: 2026-11-11T13:34:01.936Z
---

O usuário quer o projeto sempre limpo, leve, organizado e sem duplicação (arquivos, imagens, vídeos e docs). Em 11/11/2026 caiu de 3,67 GB para ~0,9 GB sem perder qualidade. Os carrosséis ficam em `CARROSSEIS/<data_slug>/`, um por pasta.

**Why:** pediu explicitamente ("seja criterioso"); lixo acumulado deixa o sistema pesado e gasta tokens.
**How to apply:** guarde a fonte e não o derivado; cada etapa limpa o que gerou (`produzir.py limpar` já roda no `entrega`). Baixou, usou, apagou. Uma fonte da verdade por assunto. Rode o checklist de `REFERÊNCIAS/ORGANIZACAO.md` no fim de cada sessão. Remoção de conteúdo do usuário vai para a Lixeira; caches regeneráveis podem ser apagados direto. Ligado a [[video-editor-system]] e [[piloto-automatico]].
