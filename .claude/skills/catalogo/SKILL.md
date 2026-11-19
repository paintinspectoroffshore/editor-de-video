---
name: catalogo
description: Estudar Reels de referência (links do Instagram/TikTok), extrair o DNA visual, ampliar o catálogo REFERÊNCIAS/CATALOGO, ou transformar um modelo do catálogo em estilo novo no Remotion.
---

# Catálogo de estilos e DNA visual

## Estrutura (lei)
**Uma referência = uma pasta** `REFERÊNCIAS/CATALOGO/NN_nome-do-estilo/`: `REF.md` (nome registrado, descrição, link, tipo, o que pegar) + `frame.jpg` + `quadros.jpg` (8 quadros em 1 imagem) e, quando houver, `DNA.md`, `transcricao.txt`, `video.mp4`. Índice único: `CATALOGO/INDICE.md`. Ver rápido: `CATALOGO/_FRAMES/NN_nome.jpg` (1 imagem por estilo).
**Nunca nome de perfil** (pasta, REF.md, DNA, índice, transcrição, link). Cada estilo tem **nome registrado** único, curto, visual (`fundo-elemento-assinatura`, ex.: `dark-celular-metricas-grafico`). Para criar com base num estilo: ache por número ou nome, leia `REF.md` + `DNA.md` + `frame.jpg`. Folhas: `_FOLHA-DE-CONTATO-N.jpg`.
Tipos: `visual` (estilo) · `base do DNA` (ref01–ref11 = 62–72, guardam MP4) · `viral` (Reel do garimpo para estudar roteiro/gancho; vem da `PESQUISA`).

## A. Estudar links que o usuário mandou (o caminho mais barato)
```
python -I 00-SISTEMA/bin/catalogar.py baixar  REFERÊNCIAS/_lote <link> <link> ...
python -I 00-SISTEMA/bin/catalogar.py revisar REFERÊNCIAS/_lote
```
- O `revisar` gera `_revisao_*.jpg` (1 linha por vídeo: 8 frames, código, duração, cortes, paleta) e `_dna_auto.json`. **Olhe só os `_revisao_*.jpg`**.
- `escolhas.txt`: `NN|arquivo_sem_ext|fração|nome-do-estilo` (`NN` = `auto` pega o próximo número). `catalogar.py salvar REFERÊNCIAS/_lote escolhas.txt` cria as pastas, a linha no `INDICE.md`, a imagem em `_FRAMES` e a folha nova. Depois edite a descrição no `REF.md`.
- Escreva o `DNA.md` **dentro da pasta de cada referência** (formato de `51_*/DNA.md`: paleta hex, tipografia, layout, legenda, movimento, **áudio dos 3 s iniciais**, gancho, como recriar). Padrões do lote inteiro: `CATALOGO/_PADROES-<faixa>.md`.
- Referência avulsa (ex.: viral do garimpo): `catalogar.py nova auto <nome-do-estilo> viral <link> NN-VIDEO.mp4 NN-ROTEIRO.txt NN-QUADROS.jpg` (move os arquivos para a pasta nova).
- **Limpeza obrigatória**: links em `CATALOGO/_LINKS-LOTES.md` e **apague `REFERÊNCIAS/_lote`**. Do lote ficam só as pastas do catálogo.
- Carrossel (`/p/`): o yt-dlp baixa cada slide como um vídeo. Escolha um slide como frame e conte o carrossel como 1 modelo.
- Para cores de destaque que a paleta automática não pega, filtre os pixels saturados (veja o histórico do lote 51–59).

## B. Achar modelos novos sozinho
- O Instagram do usuário fica logado no Chrome; use o **Claude in Chrome**. Abra `instagram.com/<perfil>/reels/` e colete os links com `[...document.querySelectorAll('a[href*="/reel/"]')]`. Não use as APIs internas: são bloqueadas.
- Faça tudo em um `browser_batch`, com 8 perfis por lote. Use no máximo 2 vídeos por perfil e marque **TH** quando aparecer pessoa falando.
- O TikTok pede CAPTCHA, e você **nunca** resolve CAPTCHA.

## C. Criar um estilo novo a partir de um número do catálogo
1. Leia o `DNA.md` da pasta (ou crie). Se precisar de detalhe, gere frames extras com o ffmpeg.
2. **Inspire-se, não copie:** nunca reutilize arte, personagem, logo ou texto da referência. Recrie a gramática visual com a identidade da X-GO.
3. Crie `FERRAMENTAS/Remotion/src/<estilo>/` com `tema.ts`, `blocos.tsx` e `Video<Estilo>.tsx`, seguindo `src/editorial/` como modelo. Registre em `src/Root.tsx` com `calculateMetadata`. Fontes: só os pesos usados e `subsets: ["latin","latin-ext"]`, porque carregar tudo deixa o render lento.
4. Valide com `npx tsc --noEmit`. Faça um roteiro-teste de 2–3 cenas, rode `produzir.py previa` e mostre o `_MOSAICO.jpg`.
5. Documente: uma seção nova na `FOLHA-DE-ESTILO.md` e a lista "Estilos implementados" na skill `reel`.
