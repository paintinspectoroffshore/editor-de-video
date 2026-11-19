# Cardápio do estilo Traço (gerado por `produzir.py cardapio traco` — não edite à mão)

Formato no ROTEIRO.md: `→ tipo k=v k="texto" k=[json] em=@palavra | outro_tipo …` (veja `produzir.py montar`).
Todo bloco: `x y`(centro, px 1080×1920) `z em ate som somEm somVol`. Defaults de x/y/tam por tipo: `traco_padroes.json`.
Âncora `em`: `"@palavra"` ou `"@palavra+0.3"` = instante em que a palavra é falada NA CENA (vale p/ `ate` e `*Em` e `em` de sub-itens). Número = segundos.
Todo número falado vai na tela com `fonte`. Sem logos: marcas só como texto.

## Campos do topo (roteiro.json; no ROTEIRO.md = cabeçalho `chave: valor`)
- `composicao`: `Traco` (cabeçalho `estilo`) · `mascote`: false tira Lobo/Hermes (emblema X-GO no lugar) · `titulo` `perfil`(@well.free) `credito`
- `paleta`: "mono" (PADRÃO desde 18/11, ref. 79: fundo #F5F5F5 + malha de pontos, tinta #111, cinzas #898988/#C9CAC9, bordas/traços 2 px, sem sombra chapada, zero laranja; acento = sublinhado fino, destaque da legenda = serifa itálica; emblema X-GO em contorno) | "laranja" (vídeos 13–16) · `entrada`: "forja" (liga sozinha com mono: cada bloco é DESENHADO — guia tracejada → contorno 1,4 px com cursor-mira e pontos → conteúdo revela da esq. p/ dir. ~0,5 s antes da âncora → ficam marcas de canto; linhas guia tracejadas ligam blocos; nada de pop/escala) | "normal"
- `trilha` (arquivo em assets/musica) · `trilhaInicio` (s) · `volumeTrilha` (0.08) · `destaques` [palavras em cor na legenda]
- `voz` {id modelo idioma ajustes tempo pausas respiro limiarSilencio} (cabeçalho: `voz: well|chris|<id>`, `tempo: 1.25`) · `pronuncia` {escrito: lido} (só neste vídeo)
- `duracaoMax` (s; checagem aceita 45–90, longo declare) · `respiroFinal` (1.2) · `base` (só no montar: herda o topo de outro projeto)
- Cena: `fala` `duracao`(preenchida pela voz) `tag`(emoção v4) `quem` `camera{zoom x y}`(número ou [de,para]) `transicao`:"corte"|"pan" `legenda`:"base"|"topo"|"nao" `negativo`:true (fundo #111, traço branco)

## Blocos (`tipo: props` — o que faz)
- `celular: video inicio vel tam rot entrada(escala) clipes[{video inicio vel em}] img tela:"lobo" expressaoLobo cracha textoTela zoomTela{em escala origem} toque{em x y} borrar[{x y w h em ate forca}] +moldura proporcao etiqueta titulo flutua fase` — celular flutuante com clipe/print
- `lobo: tam expressao:feliz/acena/comemora/pensando/surpreso cracha caixa disco flutua sombra fase +calado` — mascote Lobo animado (só com mascote)
- `hermes: tam quadros` — sprite Hermes (só com mascote)
- `servidor: tam rotulo diaNoiteEm +flutua` — servidor com luzes, dia/noite
- `torre: tam` — torre de sinal
- `relevo: w h linhas +opacidade` — linhas de relevo no fundo
- `terreno: w h linhas colunas perspectiva amp desenha deriva cor corFrente opacidade` — bloco do Traço
- `circulos: r` — círculos concêntricos de fundo
- `particulas: n area` — pontos flutuando (tela cheia)
- `icone: icone tam cor:"laranja" rotulo +fase flutua espessura tamRotulo` — ícone em traço grande
- `rotulo: texto +tam` — rótulo mono pequeno
- `pilula: texto +tam` — pílula de fonte/crédito
- `titulo: linhas[{t em tam}] acento +w serifa` — título gigante palavra a palavra
- `numero: valor unidade fonte tamanho +dur casas w alinhar prefixo sufixo tamUnidade` — número grande contando
- `lista: itens[{t icone em escuro}] +gap alinhar tam` — lista de chips entrando
- `chip: t icone escuro piscar fase tam` — chip avulso com ícone
- `selo: linhas r +texto rot tam` — carimbo girado
- `balao: texto espera cauda +tam` — balão de fala com cauda
- `terminal: linhas[{t em tipo:cmd/ok/saida}] w tam vel titulo encolhe +altura` — terminal digitando comandos
- `passos: ativo rotulo (3 bolinhas) | itens[{t sub icone em acento}] titulo marcar:false (passo a passo vertical)` — passos numerados/passo a passo
- `orbita: rx ry itens[{t icone em}] vel +angulo tam` — itens girando em órbita
- `conexao: de[x,y] para[x,y] curva icones[{icone t em}]` — fio ligando dois pontos (tela cheia)
- `ajustes: tam preenchido enderecoEm usuarioEm senhaEm manterEm cifraEm conectarEm` — mockup de tela de ajustes
- `cta: palavra palavraEm perfilEm avatar usuario expressaoLobo cracha nota lobo:false tamLobo +icone chamada tam perfil` — chamada final comenta + segue
- `pergunta: w tam texto espera vel rot rotulo numero` — cartão de pergunta digitada
- `emblema: tam icone cracha anel +fase flutua` — emblema X-GO redondo
- `grafico: pontos[{rot valor em destaque}] prefixo sufixo casas titulo salto saltoEm fonte modo:"linha" w h max dur tamValor +largura` — gráfico de linha com salto
- `dado: valor sufixo("%") prefixo casas marca ano icone texto acento[] fonte visual:anel/grade/nenhum contaEm dur w diametro tamNumero tamTexto +max rot` — número % com anel/grade
- `cards: titulo itens[{t sub icone em acento}] colunas:1/2 w tam gap check:false` — lista de cartões com ícone
- `equacao: n esq dir iconeEsq iconeDir igualEm pessoasEm passo cracha fonte +tamPessoa tamEmblema` — 1 agente = N pessoas
- `comparacao: qtd unitario prefixo total periodo rotuloUnit tituloEsq tituloDir linhasDir[] acento cracha totalEm dirEm fonte +dur tamTotal` — preço unitário × total
- `versus: tituloEsq tituloDir iconeEsq iconeDir dirEm linhas[{t esq dir em}] rotuloArco w tam alturaLinha +tamTitulo` — duas colunas ✓/✗ com arco
- `conexoes: itens[{t icone em destaque}] icone cracha tam rx ry giro raioNo tamRotulo w h` — centro ligado a 5-6 nós
- `marcas: titulo itens[{t sub em escuro}] tam gap desloc +w` — chips de marcas em zigue-zague
- `perguntas: itens[{t em tam}] w tam espera rabisco:false` — balões de pergunta empilhando
- `transformacao: de para iconeDe iconePara subDe subPara rotulo setaEm paraEm riscar vao w +tamPara tamDe` — A riscado vira B
- `seta: w curva rot cor:laranja/tinta esp texto dur +tam` — seta desenhada à mão
- `sublinhado: w h forma:onda/reta/dupla/circulo cor esp dur` — traço à mão sob título
- `selos: itens[{linhas[] sub em branco tam}] r gap meio tam` — carimbos lado a lado
- `mensagem: texto vel cauda:dir(enviada, degradê)/esq audio:true tempo toca hora rotulo w tam` — balão de chat/áudio no celular

## Ícones
wifi, globo, nuvem, cadeado, chat, memoria, skills, ferramentas, rotinas, telegram, whatsapp, instagram, aprovacao, casa, relogio, lua, sol, terminal, servidor, persona, financas, fluxo, dedo, modulos, microfone, robo, email, cobranca, recibo, remedio, calendario, saude, lampada, tendencia, documento, lupa, loja

## Sons (`som`)
whoosh, pop, click, tick, carimbo, notificacao, cine, impacto, moedas

## Mídia e dicas
- `celular.video:"app/chat.mp4"`: gravações em `assets/app/` do projeto, por HARDLINK (`New-Item -ItemType HardLink`), nunca cópia. Fonte: `PROJETOS/16-11-2026_xgo-casa-nova/assets/app/*.mp4` (agente bots casa celular chat financas fluxo insta modular tour).
- `celular.etiqueta{t icone sub em pos:baixo/topo escuro}` · `celular.moldura:"janela"` (+`w proporcao titulo`) · `numero` com `casas dur`, milhar com ponto.
- "GRÁTIS" gigante = `titulo` tam 230. `lobo`/`hermes` somem com `mascote:false`. Cena: `camera`, `transicao:"corte"` (sem pan), `legenda`.
- Teste visual: `node motor.mjs previa <props> Traco <pasta> <frames>`. Exemplos: `PROJETOS/16-11-2026_hermes-app/roteiro.json`, `17-11-2026_xgo-agentes-24h`, `18-11-2026_xgo-o-que-e-agente`.
