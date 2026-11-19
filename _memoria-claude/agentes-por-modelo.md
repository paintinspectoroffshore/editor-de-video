---
name: agentes-por-modelo
description: Usuário quer o trabalho dividido em agentes por modelo (haiku/sonnet/opus), um por vez, com caveman; regras e medições
metadata:
  type: feedback
---

Pedido do usuário em 11/11/2026: dividir as funções do projeto por modelo para ficar mais econômico e rápido, lançando **um agente por vez**, com a skill `caveman` ativa e qualidade máxima mantida.
- Agentes em `.claude/agents/`: garimpeiro e zelador (haiku); produtor e publicador (sonnet); roteirista e designer (opus). A tabela está no `CLAUDE.md`, as medições em `REFERÊNCIAS/AUTOMACAO.md §8`.
- O subagente NÃO consegue clicar em "Publish now" no Metricool: o classificador bloqueia, mesmo com a autorização repassada. A sessão principal dá o clique final quando o usuário autoriza no chat.
- Render final antecipado em segundo plano ao enviar a prévia. GPU `angle` é o padrão: −23% de tempo.

**Why:** economia de tokens e velocidade são prioridade, sem perder qualidade.
**How to apply:** tarefa de 1–3 comandos você faz direto; o resto vai para o agente do modelo certo. Escreva sempre em pt-BR com o usuário (ele reclamou de resposta em inglês). Ligado a [[video-editor-system]], [[instagram-trial-reels]], [[piloto-automatico]].
