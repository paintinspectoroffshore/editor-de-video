---
name: video-editor-system
description: "Projeto 1-Videos — sistema de produção de Reels; status, catálogo de estilos, voz ElevenLabs e pendências do usuário"
metadata:
  node_type: memory
  type: project
  originSessionId: bd97bbbd-4388-4013-873e-7b1883b59739
  modified: 2026-11-11T03:56:08.623Z
---

Sistema de Reels em `1-Videos` (montado 2026-11-10). CLAUDE.md enxuto + skills de projeto `reel` (produção) e `catalogo` (referências/DNA). Comandos-chave: `produzir.py rapido` (voz→legendas→mosaico) e `entrega` (render→finalizar→checar); `stock.py` (B-roll grátis Mixkit).

Vídeos: `10-11-2026_github-para-todos` (Editorial, pronto) e `11-11-2026_opengym-app` (estilo novo **Impacto**, prévia aguardando aprovação em 2026-11-11). Projetos-fonte de apps ficam em `PROJETOS/<n>-Nome` irmãos (ex.: `2-Gym` com APK pt-BR).

Instagram do usuário: **@well.free** (Well Machado) — confirmado 2026-11-11; CTA padrão "segue + comenta EU QUERO".

Voz: desde 2026-11-14 o padrão do projeto (pedido do usuário) é **Chris** premade + `eleven_v4` + idioma pt, tempo 1.2, pausas 0.12 — já embutido no `produzir.py` (`VOZ_CFG_PADRAO`), roteiro não precisa de `voz`. Não clonar a Chris (voz de dublador); clonar só a voz do próprio usuário (exige plano pago). ElevenLabs grátis 10k créditos/mês (renova dia 1), ~1.800 créditos por vídeo de 90 s. Sempre avisar saldo; avisar forte abaixo de 20%. Histórico de falhas de áudio: `00-SISTEMA/VOZES.md`.

Pendências: aprovação formal da folha de estilo, trilha musical, plano pago (licença comercial).

**Why:** o usuário quer produção rápida e barata do tema ao MP4, com aprovações (roteiro, prévia, final), e pede para sempre otimizar o processo.
**How to apply:** ao retomar, carregue a skill `reel`; use âncoras `"em":"@palavra"` em vez de segundos; informe o saldo a cada geração de voz.
