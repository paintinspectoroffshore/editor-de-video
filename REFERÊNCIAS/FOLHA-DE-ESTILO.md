# FOLHA DE ESTILO — DNA Visual
> Extraída de 11 Reels de referência (análise de frames, cortes, áudio e metadados).
> Status: **AGUARDANDO SUA APROVAÇÃO**. Depois de aprovada, isto vira lei em todo vídeo.

---

## 0. A descoberta mais importante

**Nenhuma das referências tem pessoa falando na tela.**

São 100% *motion graphics gerados por código* — telas falsas, cards, gráficos, terminais e tipografia animada, com narração em voz over por cima. Isso é ótimo para você: significa que o vídeo inteiro é **programável** (Remotion/HyperFrames), reproduzível e não depende de câmera, luz ou gravação.

O valor não está no "efeito bonito". Está em **provar na tela** o que a narração diz. Cada número falado aparece como gráfico. Cada afirmação vira um card com fonte citada.

---

## 1. Formato técnico (fixo, sem exceção)

| Item | Valor | Observação |
|---|---|---|
| Proporção | 9:16 vertical | 100% das referências |
| Resolução de entrega | **1080 × 1920** | as refs baixadas são 720×1280 (compressão do Instagram); masterizamos em 1080p |
| FPS | **30** | 100% das referências |
| Duração alvo | **45–85 s** | mediana 56 s. Acima de 90 s a retenção despenca |
| Áudio | AAC 192 kbps, **−14 LUFS** | padrão de loudness para Instagram/TikTok |
| Vídeo | H.264 High, CRF 18, `yuv420p`, `+faststart` | compatibilidade universal |
| Zona segura | 12% topo / **22% base** | a base é onde entra a legenda e a UI do Instagram |

---

## 2. Paleta

Três variantes coexistem nas referências. Proponho adotar a **A** como principal e manter B e C como alternativas conforme o tema.

### A — Dark Tech *(principal — 8 dos 11 reels)*
```
Fundo base      #0A0A0A   preto levemente quente
Fundo card      #141414   superfícies elevadas
Borda           #262626   1px, sutil
Acento primário #FF5C35   laranja coral  → número-chave, palavra destacada, brackets
Positivo        #22C55E   verde neon     → ganho, "mais barato", aprovado
Negativo        #DC2626   vermelho       → perda, queda, alerta
Texto forte     #FFFFFF
Texto médio     #A3A3A3
Texto fraco     #525252   labels mono, rodapés de fonte
```
**Regra de ouro:** o acento laranja ocupa no máximo **10% da tela**. Ele é bisturi, não tinta de parede.

### B — Dark Alerta *(ref02 — temas de risco, vazamento, investigação)*
Igual à A, mas acento primário vira `#E63946` e o verde some. Tom mais sério, investigativo.

### C — Light Editorial *(ref07 — temas de mercado, dinheiro, notícia)*
```
Fundo     #F5F3EF  off-white com grid de pontos sutil
Tinta     #1A1A1A  preto tipográfico
Acento    #8B1A1A  vinho escuro
Verde     #1B5E3A  dinheiro / valor de mercado
```
Cards com **borda 4px preta + sombra dura deslocada** (10px, sem blur, preta ou vinho). Estética de jornal impresso / zine.

**Regras próprias do Editorial** (implementadas em `FERRAMENTAS/Remotion/src/editorial/`):
- A legenda **é a manchete**: Oswald 700 em CAPS, 104–178px, no topo (y 150–570), até 3 palavras por vez, cada palavra entrando com desfoque. Números ficam em vinho e 22% maiores; destaques também em vinho.
- Conteúdo na zona y 600–1590: prints reais em "janelas" com barra preta, etiquetas, carimbos tortos (`rot` de −10° a +3°), setas desenhadas à mão e colagem com sobreposição.
- Cortina vinho de tela cheia para a frase de virada (manchete em papel e destaque em amarelo).
- Fundo: papel `#F1EFEA` + grade de pontos 34px + fibra de papel sutil.

---

## 3. Tipografia

| Papel | Fonte | Peso | Tratamento |
|---|---|---|---|
| Headline de cena | **Archivo Black** (alt: Anton) | 900 | CAPS, `letter-spacing: -0.02em`, 2 linhas máx |
| Números grandes | **Archivo Black** | 900 | tabular-nums, até 180px |
| Legenda (voz over) | **Inter** | 700 | sentence case, 44px |
| Labels / UI falsa | **JetBrains Mono** | 500 | CAPS, `letter-spacing: 0.12em`, 20px, cor `#525252` |
| Código em tela | **JetBrains Mono** | 400 | syntax highlight real |

Hierarquia obrigatória: **nunca mais de 3 tamanhos de fonte visíveis no mesmo frame.**

---

## 4. Legenda — a assinatura da marca

Este é o elemento mais reconhecível das referências. Especificação exata:

- Posição: **centralizada, logo abaixo do painel — centro em ~72% da altura** (y ≈ 1385 de 1920)
- Estilo: Inter 700, 46px, branco
- Revelação **palavra por palavra**, sincronizada com a voz (Whisper dá os timestamps)
- Janela visível: **até 5 palavras** — quebra também em pontuação e pausas da fala, nunca a frase inteira
- **Uma palavra por frase recebe a cor de acento.** A palavra-chave, não a primeira.
  > `e` `vinte por cento` → "vinte por cento" em laranja
  > `segundo a` `Anthropic` → "Anthropic" em laranja
- Entrada: fade + subida de 8px em 120ms, `ease-out`
- Sem caixa de fundo, sem contorno. Só texto sobre o escuro.

---

## 5. Moldura e identidade persistente

Presente em quase todos os frames de:

- **Painel enquadrado**: o conteúdo vive num painel de y 350 a y 1310, com margem lateral de 56px.
- **Corner brackets**: 4 cantos *do painel* (não da tela), linhas laranja de 3px, 44px de comprimento. Dão sensação de "visor/scanner".
- **Handle** acima do painel, à esquerda: `@seu.perfil` em JetBrains Mono 20px, `#A3A3A3`
- **Badge de crédito** acima do painel, à direita: pílula com borda, `feito pelo [ferramenta]`
- **Marcador de cena** dentro do painel, no topo: `[01] O TESTE` — número em quadrado laranja + título em mono CAPS
- **Grão de filme**: overlay de ruído a 3% de opacidade + vinheta radial suave. É o que impede o preto de parecer "chapado".

---

## 6. Ritmo e cortes

Dado medido: **2 a 10 cortes duros por vídeo** — muito pouco. O vídeo não é rápido por cortar, é rápido por **animar**.

- **Cena** = 6 a 12 s. Cada cena entrega **uma** ideia.
- Transição entre cenas: crossfade de 300ms **ou** empurrão vertical (a cena nova sobe, a velha desce).
- Dentro da cena, elementos entram **em cascata**, com atraso de 80–120ms entre eles (stagger). Nunca tudo de uma vez.
- Curva padrão: `cubic-bezier(0.22, 1, 0.36, 1)` — rápido no início, assentamento suave.
- Números sempre **contam** até o valor (count-up de 600ms). Barras sempre **crescem** da esquerda.
- Micro-zoom contínuo de 1.00 → 1.04 ao longo da cena. Impede a tela de parecer parada.

---

## 7. Estrutura narrativa (os 5 blocos)

Padrão observado em todas as referências:

| Bloco | Tempo | Função |
|---|---|---|
| **1. Gancho** | 0–3 s | Um número absurdo ou uma afirmação que desafia. *"300 bilhões"* / *"O número que foi pulado"* |
| **2. Contexto** | 3–15 s | O que é isso, por que importa. Entra a primeira tela falsa |
| **3. Prova** | 15–45 s | O miolo. Gráficos, comparações, dados com fonte citada |
| **4. Virada** | 45–60 s | *"Só um aviso"* / *"Um detalhe:"* — a nuance que ninguém comentou. **É isso que gera comentário** |
| **5. Fecho** | 60–75 s | Prêmio (a frase que a pessoa envia) + convite natural, nunca CTA forçado |

Método completo de roteiro (intenção, espinha, CTA natural, checklist): **`REFERÊNCIAS/ROTEIRO.md`**.

**Regra de ferro:** todo número falado tem que aparecer na tela. Toda afirmação forte tem que ter a fonte citada em mono pequeno no rodapé do card.

---

## 8. Narração

- Ritmo medido: **~190 palavras por minuto** (Whisper no ref01: 174 palavras em 54s) — rápido, mas articulado.
- Frases **curtas**. Média de 7 palavras. Ponto final, não vírgula.
- Sem saudação. Sem "fala galera". O vídeo começa **no meio da ideia**.
- Tom: analista que descobriu algo, não vendedor. Afirma, não pergunta.
- Pausa de 400ms antes da virada (bloco 4). O silêncio é parte do argumento.

---

## 9. Áudio

Regras, abertura sonora dos 3 s, mapa de SFX, mixagem e biblioteca de trilhas: **`REFERÊNCIAS/TRILHA.md`** (fonte única).

---

## 10. O que NÃO fazer

- Talking head / pessoa na tela
- Emoji na legenda
- Mais de um acento de cor por frame
- Música alta o suficiente para competir com a voz
- Texto na zona de 22% da base (a UI do Instagram cobre)
- Stock footage genérico — se precisa de imagem, é print de UI real ou gráfico desenhado
- Afirmar número sem mostrar fonte

---

## 11. Checklist de aprovação (antes de todo render final)

- [ ] 1080×1920, 30fps, 45–85s
- [ ] Áudio normalizado a −14 LUFS
- [ ] Legenda palavra-a-palavra com 1 destaque por frase
- [ ] Todo número falado está na tela
- [ ] Toda afirmação forte tem fonte citada
- [ ] Gancho resolve em menos de 3s
- [ ] Bloco de virada presente
- [ ] Nada importante abaixo de y=1500 (a legenda fica em ~1385)
- [ ] Grão + vinheta aplicados
- [ ] Primeiro frame funciona como capa estática


## Estilo IMPACTO (11/11/2026, primeiro uso: openGym)
- **Para quê:** vender app ou produto com dor → prova → solução → CTA. É o padrão para os vídeos da X-GO.
- **Cor:** fundo #0A0C0F e cards #14171C/#1B1F26. Destaque na **cor do próprio produto** (openGym: lima #A3E635). Dor em #FF4D4D.
- **Tipo:** Archivo Black em CAIXA ALTA nas legendas e selos; Inter 800 nos cards; JetBrains Mono na fonte dos números.
- **Ritmo:** corte a cada 3–5 s com "soco" de zoom (1.07→1) e flash branco nos cortes de virada. B-roll real escurecido atrás das telas do app. Barra de progresso lima no topo.
- **Legenda:** 2–3 palavras por vez, 104 px, contorno preto de 16 px. Números e palavras-chave na cor de destaque.
- **Estrutura:** gancho de dor (pergunta + vídeo real) → lista de dores riscada → prova social (card do GitHub) → 3–4 telas reais do app com foco destacado → lista de ✓ → "o problema: só pra programador" → APK em 1 clique → montagem rápida → perfil real + comentário "EU QUERO".


## Estilo Dossiê (11/11/2026)
Para temas de investigação, golpe ou segurança, com dados e fonte. A gramática vem dos modelos 05 e 07; a arte é nossa.
- **Paleta:** fundo #0D0D11 com pontos #26262E, creme #ECE5D3, tinta #16161B, vermelho #E5333F, cinza #8C8C99.
- **Fontes:** Archivo Black para números e manchetes; JetBrains Mono 700 para kickers, pílulas e fichas.
- **Regras:** todo número leva uma pílula branca com a fonte; uma palavra-chave por frase em vermelho; a ficha creme entra girada −0,8°; a legenda fica em y=1420.
- **Código:** `src/dossie/VideoDossie.tsx`.

## Estilo Crônica (11/11/2026, primeiro uso: bitcoin-ciclo)
Documentário de arquivo vivo: a pessoa aprende, se diverte e se informa. Para explicar ciclos, história, mercado e "por que isso acontece", com muito dado e fonte. Gramática estudada em 34/35 (FT), 36 (WaPo), 38 (BBC), 40 (Morning Brew), 05/07 (dossiê) e 26 (rótulos); a arte é nossa.
- **Cena-base:** uma "mesa de montagem" escura e quente, com textura de fibra e grade discreta de tapete de corte. Por cima entram recortes de papel (borda rasgada, fita, marca-texto), gráficos de jornal que se desenham sozinhos com anotações à mão, carimbos e contadores. Vídeo real (stock) entra como **película**: P&B sépia, escurecido, com vinheta e leve tremor.
- **Paleta:** mesa #15110D→#2A2119, papel #EFE6D2, tinta #1B1611, creme #F3EBDD, cinza quente #9C9183, linha #3B332A, queda #E0473C (**só para quedas e alertas**), frio #9FB4C2 (começo de escalas de risco). **Acento** padrão laranja-bitcoin #F7931A, trocável por vídeo no campo `"cor"` do roteiro.
- **Fontes:** Fraunces 800 (títulos, legenda e rótulos de nó) e Fraunces 600 itálico (notas e legendas de recorte); JetBrains Mono 500/700 (dados, eixos, kickers, carimbos, fontes); Archivo Black (números grandes).
- **Película:** grão animado, poeira e riscos ocasionais, vinheta, luz de projetor oscilando, tremor de 1–2 px no conteúdo. A transição padrão é o **corte de película** (flash quente + quadro escorregando + faixa preta). A alternativa é o `zoom` (câmera recua sobre a mesa, com desfoque). A câmera "respira" de 1 até 1,025 em toda cena.
- **Legenda:** Fraunces 800, 80 px, 1–3 palavras. A palavra falada ganha um **marca-texto na cor de acento** (texto escuro). Números e `destaques` ficam na cor de acento. Posição y=1420 (`base`) ou 230 (`topo`).
- **Moldura:** régua/linha do tempo no topo (marca de segundo, corte de cena e cursor ▼ com tempo), cabeçalho mono `SELO · capítulo` datilografado e carimbo de data à direita.
- **Regras:** todo número tem fonte visível (pílula creme com ponto de acento, ou rodapé mono "FONTE:" no gráfico). Vermelho só para queda. Cada cena tem no máximo 1 papel girado (entre −2° e 2°). O conteúdo fica entre y=200 e y=1380 quando a legenda está embaixo.
- **Código:** `FERRAMENTAS/Remotion/src/cronica/` (`VideoCronica.tsx` é a casca, `blocos.tsx` tem os blocos). Composição `Cronica`. Manual de campos: skill `reel`, seção "Estilos implementados".

## Estilo Leonida (14/11/2026, primeiro uso: gta6-leonida)
Vibe GTA VI: pôr do sol de Vice City, neon e HUD de jogo. Para games, cultura pop e "números absurdos" com ritmo alto. Inspirado no jogo, **sem copiar logo nem arte da Rockstar**: mapa, minimapa, prédio, ícones, radar e celular são desenhos próprios e aproximados.
- **Paleta:** rosa neon #FF4F9A, laranja #FF9F43, roxo #2B1240, noite #14081F, ciano #2EC4B6, amarelo-placar #FFD23F. Vermelho #FF3355 só para "SEM FONTE"/alerta. Brilho neon em números e carimbos.
- **Fontes:** Anton 400 (títulos, números, legenda, HUD), Yellowtail 400 (script de letreiro: kicker, "ou", "em Vice City"), Inter (fontes e textos de UI).
- **Fundo:** clipes oficiais (`assets/stock/gta_*.mp4`) trocando a cada 1,5–3 s, cada troca com soco de zoom + flash, tinta rosa→laranja e roxo em cima/embaixo; ou o **sol synthwave** desenhado (sol listrado, palmeiras, grade em perspectiva andando). Clipe com logo/cartela no início: `"gta_skyline@1.3"` pula o começo.
- **Crédito obrigatório:** "Imagens: Rockstar Games", 22 px, 60%, canto superior direito, sempre que a cena tem clipe do jogo.
- **Legenda:** Anton 108 px CAIXA ALTA, branca com contorno preto grosso, até 3 palavras; números (inclusive por extenso) em amarelo e `destaques` em rosa, com brilho. y=1430.
- **Moldura:** barra de progresso rosa→laranja no topo com marcas amarelas nos capítulos; selo de capítulo `A · MAPA` (letra em caixa amarela) que entra de novo a cada capítulo. Cada capítulo (A–E) abre com mini-gancho para virar corte de 20/30/60 s.
- **Ritmo/som:** abertura de capítulo = impacto-trailer; outras cenas = whoosh-cine + soco + flash. Moedas, notificação, sirene e carimbo nos blocos. Trilha synthwave com ducking sob a voz (−45%) e laço com crossfade de 3 s (`trilhaLaco`).
- **Regras:** fonte de todo número em pílula pequena (20 px); estimativa sempre com selo amarelo (ESTIMATIVA / ESTIMATIVA DE FÃS / PREVISÃO); boato com carimbo SEM FONTE.
- **Código:** `FERRAMENTAS/Remotion/src/leonida/` (`VideoLeonida.tsx` casca, `blocos.tsx` blocos). Composição `Leonida`. Campos: skill `reel`.

## Estilo GTA Real (15/11/2026, primeiro uso: gta6-realista-v2) — padrão para vídeos de GTA
Pedido do usuário: "tela com muita poluição visual", "todos os quadros devem ter vídeo", "tire a máscara", "fonte menor no canto superior direito". O gameplay é a estrela; a informação só pousa por cima.
- **Fundo:** vídeo real do jogo em 100% das cenas, cores originais. Proibido: fundo desenhado/imagem parada, tinta/gradiente, escurecer, faixas escuras, vinheta, saturação extra. Letreiro queimado do criador: troque o trecho (`yt04@4.0`) ou use `recortes` com o menor zoom que o esconde.
- **Informação:** no máximo 1–2 elementos por vez, todos na faixa de cima (y≈190–450); centro do quadro livre. Formas: título curto Anton ≈74 px, número grande Anton ≈140 px + rótulo em pílula, pílulas (Inter 800, fundo preto 48% + borda colorida), barras finas de 12 px, estrelas de procurado, notificação de 1 linha, carimbo pequeno. Nada de celular, mapa, radar, painel ou avatar grande.
- **Legibilidade:** só contorno fino + sombra no texto e pílulas pequenas semitransparentes.
- **Fonte e crédito:** Inter 600, 19 px, 78%, canto superior direito: "Fonte: …" da cena + "Base: … · Imagens: Rockstar Games".
- **Legenda:** Anton 86 px (menor que o Leonida), contorno 6 px, números amarelos, `destaques` rosa, y=1440.
- **Moldura/ritmo/som:** barra de progresso de 5 px; soco + flash branco nos cortes; whoosh/impacto, pop/carimbo/notificação nos blocos; trilha com ducking. Sem selo de capítulo na tela.
- **Código:** `FERRAMENTAS/Remotion/src/gtareal/` (`VideoGtaReal.tsx` casca, `blocos.tsx` blocos leves). Composição `GtaReal`. Campos: skill `reel`.

## Estilo Trajeto (15/11/2026)
Prancheta creme-pêssego (#F0E4D7 → #F3DAD4) com grade de "+", linha vertical rosa-laranja (#EA5A5A → #F58A5C) contínua, vídeos em janelinhas com borda fina e rótulo mono, Anton + JetBrains Mono, legenda em caixa creme com texto preto e palavra-chave cinza sublinhada. Código `FERRAMENTAS/Remotion/src/trajeto/`; DNA `REFERÊNCIAS/CATALOGO/61_prancheta-trajeto/DNA.md`.
- **v4 (15/11, pedido do usuário; ligue com `"janelas": "grande"` no topo do roteiro; sem o campo = v3 igual):** janela principal 16:9 com 90% da largura (972×547, y 620); 2ª janela 16:9 (440×248) pousada na linha de chão, do lado oposto à linha vermelha (`fundo.b: false` tira). **Só vídeo nas janelas, nunca foto.** Vídeo inteiro (`contain`, sem zoom nem recorte forçado). Cenas cheias: o 16:9 inteiro no meio (1080×608) sobre o próprio vídeo desfocado. `duracaoVideos` (s por arquivo) faz o trecho voltar ao início em vez de congelar no fim.
- **Recortes soltos (bloco `recorte`):** PNG sem fundo (arma, carro, personagem) com contorno branco fino de adesivo (3 px) + sombra suave, flutuando de leve; entrada `pop`/`slide`/`desenho`; ligado à linha vermelha por linha-guia tracejada + rótulo mono em chip creme. Lugar: faixa de baixo (y≈1450, sobre o chão, maior quando `fundo.b: false`) ou por cima do canto da janela principal. Recorte cortado/ruim fica de fora. Selo da cena cheia: `ponto:false` + `riscaEm` risca o título (mito desmentido).

## Estilo Traço (16/11/2026, primeiro uso: hermes-app) — produto/app explicado como esboço técnico
- **PALETA MONO + FORJA = PADRÃO DOS PRÓXIMOS VÍDEOS (18/11/2026, pedido do usuário, ref. 79 à risca):** topo `"paleta": "mono"` (o `montar` já põe; roteiro antigo sem o campo segue laranja, vídeos 13–16 intactos). Cores: fundo #F5F5F5 com **malha de pontos** #C9CAC9 sutil (sem a trilha pontilhada), tinta #111/#262726, cinzas #898988/#C9CAC9, papel #FFF nos cartões; **zero laranja/degradê** em títulos, cards, cta, emblema, selos, dado, mensagem, legenda e barra de progresso (laranja literal que sobrar vira cinza). Cor só nas fotos/gravações ("pouquinha cor"). Acento = tinta com **sublinhado fino**; destaque da legenda = **serifa itálica** (Instrument Serif); emblema X-GO **em contorno**; terminal vira janela de papel. **Linha fina:** bordas e traços 2 px, contorno da forja 1,4 px, ícones ~2 px, sem sombra chapada. **Forja** (liga com a mono; `"entrada": "normal"` desliga, `"entrada": "forja"` liga também no laranja): cada bloco é **desenhado** — guia tracejada chega ao canto → contorno fino com **cursor-mira** (bolinha preta + anel + cruz) e pontos surgindo ao longo do traço → conteúdo revela da esquerda p/ direita (~0,5 s antes da âncora, entradas internas sem mola/salto) → contorno some e ficam **marcas de canto** cinza. Linhas guia tracejadas ligam um bloco ao seguinte. `negativo` continua valendo. Prévia de conferência: vídeo fabrica-de-reels em mono.
Ref. Reel (AirDrop): só a gramática, nenhuma arte copiada. Fundo branco-gelo `#F6F6F4` com vinheta cinza leve; tudo em **traço preto fino** (servidor, torre em treliça, relevo ondulado, ícones lineares, órbitas e trajetos pontilhados, círculos concêntricos, partículas pretas). Muito espaço vazio. Objeto-herói: **celular preto flutuando com sombra elíptica**, com o clipe real do app dentro (grande ≈960 px de altura quando é a função em destaque; 700–760 quando é objeto da cena). Acento único: degradê do app laranja→amarelo `#EE7E31 → #FBE74D` (medido em `home.png`); texto em laranja usa `#E8711F` (legível no branco). Fontes: Archivo Black (títulos, números, legenda), JetBrains Mono (rótulos, terminal, pílulas), Inter (UI dos mockups). Código `FERRAMENTAS/Remotion/src/traco/VideoTraco.tsx`.
- **Câmera e transição:** cada cena desce pela linha pontilhada contínua do fundo (pan vertical de ~16 frames + whoosh). `transicao:"corte"` mantém a mesma tela (ex. Ajustes 8→9). `camera {zoom x y}` aceita número ou `[de, para]`; sem ela, push-in leve de 3,5%.
- **Lobo (mascote v3, 16/11, fiel ao ícone do app `assets/hermes/lobo.png`):** cabeça PRETA geométrica (facetas planas, focinho em V até o nariz preto), orelhas triangulares, contorno laranja-dourado neon `#E8A33A` com brilho (drop-shadow laranja), olhos âmbar `#FFB23A` com ponto de luz e halo pulsando; corpo, braços, patas hexagonais e rabo no mesmo preto facetado com borda neon, sombra no chão. Pisca, respira, balança, mexe as orelhas, inclina a cabeça e abana o rabo sozinho. `expressao`: `feliz` (padrão, olhos ^ ^ brilhando), `acena` (piscadinha + pata acenando), `comemora` (olhos ^ ^, boca aberta com brilho laranja, braços pra cima, confete laranja/amarelo), `pensando` (um olho semicerrado, olhar de lado, pata no queixo, balão "?"), `surpreso` (olhos redondos grandes, boca em "o", patas no rosto, traços neon). `cracha:"X-GO"` = crachá laranja com texto preto; `caixa:true` = caixa de papelão (o crachá desce para a frente dela). `acena:true` antigo = `expressao:"acena"`. `disco:true` = medalhão escuro com aro neon (igual ao ícone). `celular tela:"lobo"` e `cta` usam o mesmo mascote (`expressaoLobo`, `cracha`).
- **Pergunta (entrevista):** cartão-ficha branco com contorno preto, sombra chapada, fita adesiva no degradê, microfone em traço + rótulo mono "PERGUNTA" (+ `numero` opcional em laranja), pergunta em Archivo Black caixa alta digitada letra a letra com cursor laranja, sobre pauta clara. Fica no alto (y≈260, ocupa ~110–410): legenda na base e celular de tam ≤ 900 em y ≥ 940.
- **Borrão no celular:** `borrar:[{x y w h em ate}]` em % da tela do celular desfoca forte só aquela área (valor total, endereço). Acompanha o `zoomTela`.
- **"GRÁTIS" gigante:** `titulo` com `linhas:["GRÁTIS"] acento:["grátis"] tam:230` (260 estoura a largura) + Lobo `comemora` ao lado; não precisa de bloco novo.
- **Legenda:** palavra a palavra, Archivo Black 76 px, preto sem caixa com halo branco-gelo, `destaques` e números em laranja; base em y≈1575. Conteúdo entre y≈200 e 1440.
- **Número falado = número na tela** com pílula de fonte contornada em mono ("fonte: app X-GO 0.30.0"). Terminal escuro com o comando real digitando; endereço do servidor sempre borrado.
- **Sem mascote (17/11, agentes-24h):** `"mascote": false` no topo do roteiro.json some com `lobo`/`hermes` no vídeo todo; `celular tela:"lobo"` e `cta` mostram o **emblema X-GO** (disco no degradê, contorno preto + sombra chapada, robô em traço, anel pontilhado girando, crachá preto). `cta` aceita `lobo:false` só nele. Sem o campo, nada muda (vídeo 13 igual).
- **Blocos de dado (17/11):** cartões brancos de contorno preto 3 px e **sombra chapada preta** (mesma família da `pergunta`), número em Archivo Black que **conta** com saída suave e formato brasileiro (8.105), sufixo em laranja, **pílula de fonte** sempre embaixo. `grafico` = barras que crescem (passadas em hachura cinza, a destacada no degradê), trajeto pontilhado com seta e selo do salto ("≈6×"); `dado` = anel que enche até o % (ou grade 10×10, ou número gigante); `cards` = funções entrando da direita em sequência com ícone num disco e ✓ verde; `equacao` = emblema "1 AGENTE" = bonequinhos caindo um a um com contador; `comparacao` = custo de gente × 1 agente com VS no meio (o agente nunca ganha preço); `passos` com `itens` = passo a passo vertical, trilho pontilhado que escurece e ✓ nos passos feitos.
- **Gravação real com etiqueta:** `celular` com `video` + `etiqueta {t icone sub}` põe um chip sobre a borda de baixo do aparelho dizendo QUAL função aparece (sub = "gravação real · app X-GO"). `moldura:"janela"` = janela escura de computador para gravação horizontal.
- **Traço à mão (18/11, o-que-e-agente):** linhas se **desenham** (não aparecem prontas), ponta de seta só quando o traço chega; preto 3–4 px p/ ligação, laranja 6–8 px p/ ênfase (seta, arco, ?). Sublinhado à mão sob a palavra-chave (onda/reta), círculo à mão ao redor de um dado. Máx. 1–2 traços de ênfase por cena: decorar sem poluir. Blocos: `versus` (✓ verde × ✗ riscado), `conexoes` (hub X-GO + fios com pulso), `marcas` (só texto, nunca logo de terceiro), `perguntas`, `transformacao`, `selos`, `mensagem` (chat/áudio sobre o celular), `seta`, `sublinhado`. Props: skill `reel`, linha Traco.
- **Padrão linha fina (ref. 79, 18/11):** fundo branco + objeto-herói centrado sobre `terreno` (malha/curvas de nível 3D em linha fina #C9CAC9/#898988, z baixo, desenha na entrada e deriva lento) e dolly contínuo `camera:{zoom:[1,1.1]}` por cena; poucos cortes, ~10–15 s/cena.
- Termo-chave em **serifa itálica** (Instrument Serif, peso normal, caixa normal): `titulo` com `serifa:true` (bloco inteiro ou só a linha `{t,serifa:true}`), misturável com linha em Archivo; rótulos/pílulas mono continuam.
- **1 cena em negativo** por vídeo (abertura ou clímax): campo de cena `negativo:true` → fundo #111, tinta/traços/legenda brancos; laranja, fotos e mascote mantêm a cor.

## Estilo SplitTH (19/11/2026, primeiro uso: seguro-reembolso-mixto) — talking head + painel de dados
Ref. 54 (`CATALOGO/54_TH-split-grafico-topo-rosto/DNA.md`). Uso: cliente/usuário gravou o rosto; o painel explica com dado e esquema.
- **Divisão:** painel 0–40% (768 px) em papel milimetrado `#EBEAE5` (grade 48 px, 6%); rosto 40–100% (1080×1152). Degradê de 110 px funde o papel no vídeo.
- **Cores:** tinta `#1A1A1A`, rótulo/status/régua azul `#1F3FA8`, dado/acento vermelho `#C8372D`; legenda amarela `#F2C230` Inter 800 64 px, contorno preto 4 px, `destaques` brancos, palavra ativa +6%.
- **Cabeçalho:** "// NN · tema" mono azul à esquerda, STATUS mono à direita, régua de ticks com trecho azul = progresso do vídeo. Troca de cena: conteúdo desliza (~0,35 s), cabeçalho em fade.
- **Desenho:** ícones SVG de traço fino (≈3 px) que se desenham; preenchimento vermelho/azul só no acento; cartões creme com borda preta 2,5 px (vermelha 3,5 px no destaque).
- **Rosto:** `janelas` movem o recorte (0,4 s); `desfoque:true` = blur 26 px + 35% escuro + 18% azul (esconde texto queimado do original). Vídeo acaba antes da narração → congela o último quadro. Crédito `rosto.fonte` em mono no rodapé.
- **Regras:** blocos só entre y 215–740 (margem 60 px); âncora `@palavra` cedo o bastante para o bloco ficar ≥1 s na tela; legenda some em cena `legenda:"nao"` (CTA).
