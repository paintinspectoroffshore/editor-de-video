---
name: instagram-trial-reels
description: "Como postar Reels de teste (Trial Reels) do @well.free pelo PC: só via Metricool; Instagram web e Meta Business Suite não têm a opção"
metadata:
  node_type: memory
  type: reference
  originSessionId: bd97bbbd-4388-4013-873e-7b1883b59739
  modified: 2026-11-11T12:45:48.010Z
---

"Reels testes" que o usuário pede = **Trial Reels** (só para não seguidores, fora da grade). Testado em 2026-11-11:
- instagram.com (web) e Meta Business Suite: NÃO têm a opção. Não publicar por lá (sairia público).
- **Metricool** (conta criada pelo usuário, login no Chrome): Planning → Create post → tipo "TRIAL REEL" → anexar vídeo → "Publish now". Funcionou (2 de 3 "Published", 3º ficou Pending).
- Truques: legenda com emoji via `document.execCommand('insertText')` no `.editor-box` (digitar tecla por tecla travou o Chrome); campo de arquivo só aparece após sobrescrever `HTMLInputElement.prototype.click` e clicar em Add video; depois usar file_upload no input `#__up`. Menus abrem com atraso: esperar 1–2 s antes de clicar.
- Vídeos para upload comprimidos (<10 MB, 720x1280) em `VIDEOS PRONTOS/_publicados/ig/`, legendas em `legendas.txt` (sem citar X-GO, por pedido do usuário).
- Plano grátis do Metricool: 20 posts/mês.

**Why:** o usuário quer testar o alcance dos Reels sem expor aos seguidores.
**How to apply:** ao pedir "poste nos reels testes", ir direto ao Metricool; nunca publicar como Reel normal sem confirmar. Ligado a [[video-editor-system]].
