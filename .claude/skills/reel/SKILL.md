---
name: reel
description: Produzir um Reel/vídeo vertical do zero neste projeto (briefing, roteiro, voz ElevenLabs, prévia, render, entrega). Use sempre que o usuário pedir um vídeo novo, mudar um roteiro ou renderizar.
---

# Produzir um Reel — fluxo rápido e econômico

## 0. Perguntas (uma vez só, em lista curta; pule o que já foi dito)
1. Tema e **tese** (a frase que o vídeo prova).
2. **Estilo**: mostre `REFERÊNCIAS/CATALOGO/_FOLHA-DE-CONTATO-*.jpg` e peça os números. Se o usuário não escolher, use `Editorial`. Para estilos ainda não implementados, rode a skill `catalogo` (seção "criar estilo").
3. **Material real**: prints, links, produto, loja, GitHub. Se faltar, capture com `node 00-SISTEMA/captura/capturar.mjs`; GitHub em largura 480.
4. **Voz**: ElevenLabs com Chris (padrão; não precisa perguntar), edge-tts ou gravação própria (`audio/gravacao.*`).
5. Aparece o **rosto**? Se sim, a gravação vai para `VIDEO BRUTO/_inbox/`.
6. **CTA** e o **@ do Instagram**: o @ ainda não foi confirmado, então pergunte.
7. Duração (padrão 45–85 s, ~165–190 palavras/min).

## 1. Roteiro → APROVAÇÃO (se o usuário disser "não aguarde aprovação", rode tudo direto até o MP4)
- Comece com `python 00-SISTEMA/bin/produzir.py novo <slug>`. Escreva o `roteiro.json` e um `ROTEIRO.md` com a tabela `# | bloco | narração | na tela` e as fontes dos números. **Ao usuário, apresente no layout de `REFERÊNCIAS/ROTEIRO.md` §5** (blocos em negrito, falas numeradas contínuas, mudanças, fontes, decisões). Funções do produto = gravações reais de tela (§6).
- Gancho: traga 3 opções de `REFERÊNCIAS/GANCHOS.md` adaptadas ao tema, com a recomendada marcada, para o usuário escolher.
- Estrutura: Gancho (até 3 s) → Contexto → Prova → Virada → Fecho com CTA. Frases curtas. Todo número falado aparece na tela, com fonte citada.
- Copie a estrutura do último projeto pronto (`PROJETOS/10-11-2026_github-para-todos/roteiro.json`) em vez de inventar campos.
- **Estilo Traço: escreva só o `ROTEIRO.md` e rode `produzir.py montar <slug>`** (gera o `roteiro.json`; não escreva JSON à mão). Cabeçalho `chave: valor` (estilo, voz=well|chris|id, mascote, trilha, trilhaInicio, tempo, duracaoMax, base=<slug de projeto anterior que herda o topo>, destaques, pronuncia=`A=b; C=d`); falas `N. texto`; visuais nas linhas seguintes `→ tipo k=v k="com espaço" k=[json] em=@palavra | outro_tipo …` (opções da cena: linha `⚙ camera=… transicao=corte tag=animado`). Props dos tipos: `00-SISTEMA/templates/traco_blocos.md`; posição/tamanho padrão: `traco_padroes.json`. Tipo inválido, texto livre depois de `→`, JSON ruim ou âncora `@palavra` que não está na fala = erro claro. Refazer `montar` mantém a `duracao` das cenas com fala igual.
- Use `pronuncia` para siglas: `{"n8n": "ene oito ene"}`. A legenda continua mostrando a grafia original.

## 2. Depois do roteiro aprovado: um comando só
```
python 00-SISTEMA/bin/produzir.py rapido <slug>
```
Ele roda voz → legendas → prévia → ouvir (Whisper confere pronúncia e sincronia, ~70 s).
- **Voz:** ElevenLabs é o motor principal, gera as cenas em paralelo e usa cache, então o mesmo texto não gasta crédito de novo. Sem chave ou sem crédito, cai sozinho para o edge-tts.
- **Legendas:** os tempos de cada palavra vêm da própria ElevenLabs, sem Whisper. O Whisper só roda no edge-tts ou em gravação própria.
- **Prévia:** sai uma imagem por cena, mais **`previa/_MOSAICO.jpg`**. Olhe **só o mosaico**, que é 1 imagem para todas as cenas, e mande ao usuário com `SendUserFile`.
- **Créditos:** o terminal imprime `ElevenLabs: restam X de Y`. Repasse esse número ao usuário toda vez. Se aparecer **⚠️ CRÉDITOS QUASE NO FIM** (menos de 20%), avise com destaque. Consulte quando quiser com `python 00-SISTEMA/bin/eleven.py saldo`.

**Tempo dos blocos: use âncoras, nunca segundos.** `"em": "@palavra"` (ou `"@palavra+0.3"`) faz o bloco entrar no instante exato em que a palavra é falada naquela cena (vale também para `rolarEm`). Não precisa ajustar nada à mão e não dessincroniza ao trocar a voz. Ajustou? Rode só `previa` (~15 s).

## 3. Render antecipado + entrega
Ao mandar o mosaico ao usuário, rode **na mesma hora** `produzir.py entrega <slug>` em segundo plano (`run_in_background`). Quando ele aprovar, o MP4 já está pronto. Se pedir ajuste, corrija, rode `previa` e depois `entrega` de novo. O render usa a GPU (`angle`), ~23% mais rápido.

```
python 00-SISTEMA/bin/produzir.py entrega <slug>
```
Ele roda render → finalizar → checar. Sai `VIDEOS PRONTOS/NN-<slug>.mp4` (numerado na ordem; sem capa na pasta) e `previa/_FINAL.jpg` com 12 frames, mais uma linha CHECAGEM (tamanho, formato, duração e volume). Se a linha disser OK e o mosaico estiver bom, mande ao usuário para a aprovação final.

## Voz — padrão do projeto (Chris, desde 14/11/2026)
**O roteiro não precisa de campo `voz`.** O `produzir.py` já usa sozinho (`VOZ_CFG_PADRAO`):
```json
{"motor": "eleven", "id": "iP95p4xoKVk53GoZ742B", "modelo": "eleven_v4", "idioma": "pt",
 "ajustes": {"stability": 0.35, "similarity_boost": 0.8},
 "tempo": 1.2, "pausas": 0.12, "respiro": 0.08, "limiarSilencio": "-32dB"}
```
Ponha `"voz"` no roteiro só para mudar algum campo; o que vier lá vence. Histórico, falhas e números: `00-SISTEMA/VOZES.md`. Skills de apoio, padrão do projeto: `elevenlabs-tts` (modelo e idioma) e `video-audio` (silêncio, volume, ducking).

**Ordem que economiza crédito (regra):**
1. **Antes de gerar o vídeo todo**, liste os nomes próprios, siglas, palavras em inglês e o @ do roteiro. Teste só eles numa frase curta: `python 00-SISTEMA/bin/eleven.py teste iP95p4xoKVk53GoZ742B "frase"`. Custa ~50 créditos, contra ~1.800 de um vídeo inteiro.
2. Errou? Corrija em `00-SISTEMA/assets/voz/pronuncia.json` (todo vídeo) ou no `pronuncia` do roteiro (só este). A legenda continua mostrando a grafia original.
3. `rapido` → no fim roda **`ouvir`**: o Whisper transcreve a narração e lista só as palavras que soaram diferentes, mais o erro de sincronia (`previa/_OUVIR.txt`). Número e "pra/para" não contam como erro. Se aparecer erro, corrija a pronúncia e rode `voz` de novo: só são cobradas a cena mudada e as 2 vizinhas (a entonação usa o texto de antes e de depois); o resto sai do cache.

**O que cada campo faz:**
- **`idioma: "pt"` + `eleven_v4`:** a voz premade lê como brasileiro (GTA 5, PS5, "1,5 bilhão", "Comenta aí"). O v4 não aceita `speed`/`style`; a velocidade vem do `tempo`.
- **`pausas`:** nenhum silêncio dentro da fala passa desse valor (s). O corte usa o próprio áudio (ffmpeg silencedetect), porque o v4 estica o fim das palavras. Legenda e âncoras seguem sincronizadas. Cortou fôlego demais? `"limiarSilencio": "-38dB"`.
- **`respiro`:** silêncio entre cenas (s). **`respiroFinal`** (topo do roteiro, padrão 1.2): silêncio no fim.
- **`tempo`:** acelera no PC (ffmpeg atempo), sem mudar o tom e **sem gastar crédito**. Use para encaixar a duração em vez de gerar de novo.
- **Duração-alvo:** a CHECAGEM aceita 45–90 s. Vídeo longo? Declare `"duracaoMax": 120` no topo do roteiro.
- **Crédito:** o que já foi gerado sai do cache (`cache/eleven`) e não é cobrado. O `produzir.py` só cobra as cenas novas e imprime `restam X de Y`: repasse ao usuário.
- **Trocar de voz** num vídeo pronto: mude o `voz`, rode `rapido` e depois `entrega`. As âncoras se re-sincronizam sozinhas.
- Plano **grátis**: 10 mil créditos/mês (1 caractere = 1 crédito), ~5 Reels de 90 s com o v4. `eleven_flash_v2_5` custa metade, mas pronuncia pior (teste de 14/11).
- A conta grátis só aceita **vozes premade** pela API. Outras que soam bem em pt: Eric `cjVigY5qzO86Huf0OWal`, Brian `nPczCjzI2devNBz1zQrb`, Liam `TX3LPaxmHKxFdv7VOQHJ`, Will `bIHbv24MWmeRgasZH58o`, Adam `pNInz6obpgDQGcFmaJgB`. Amostras em `00-SISTEMA/assets/voz/amostras/`.
- Reserva grátis: `"motor": "edge"` (`pt-BR-AntonioNeural`, `velocidade` `+38%`).

**Entrega no celular:** quando o MP4 passa de 30 MB, o `entrega` gera sozinho uma cópia leve em `00-SISTEMA/cache/celular/`. Mande essa pelo `SendUserFile`.

### Voz dinâmica e entrevista (implementado em 16/11/2026)
- **`tag` na cena** (`"tag": "animado"` ou `["pausa","sorrindo"]`): vira `[animado]` na frente do texto só para a voz (audio tag do v4). Não aparece na legenda; o `eleven.py` tira a tag dos tempos. Testado: não é lida em voz alta.
- **Entrevista com 2 vozes:** `voz.vozes = {"Entrevistador": "<voice_id>"}` e `"quem": "Entrevistador"` na cena troca a voz daquela cena (as demais usam `voz.id`). Cache e pausas continuam por cena.
- **Conversa num só áudio (API oficial):** `python eleven.py dialogo <voz1> <voz2> "fala 1" "fala 2"` usa `/v1/text-to-dialogue/with-timestamps` (≤2.000 caracteres por pedido), devolve palavras com tempo e a fala de origem (`voz`). Função `eleven.dialogo()`; ainda não ligada ao `produzir.py` (a troca de voz por cena já cobre o formato).
- **Lobo falando (estilo Traco):** a boca abre e fecha enquanto há palavra da narração; `"calado": true` no bloco `lobo` desliga.

## Material visual
- **Cortes de vídeo do YouTube (modo cortes):** `cortes.py analisar <url>` → roteirista lê `cache/youtube/<id>/TRANSCRICAO.md` + `_CENAS.jpg`, reescreve (referência, nunca cópia) e grava `cortes.json` → `cortes.py cortar <slug>` põe `ytNN.mp4` (1080×1920) em `assets/stock/`, usável em `fundo.videos`. Modos `foco`/`geral`/`track`, rubrica de momento e direitos: `REFERÊNCIAS/CORTES.md`.
- **Vídeos de gente real (B-roll) grátis, com licença comercial:** `python 00-SISTEMA/bin/stock.py buscar gym fitness` gera `00-SISTEMA/cache/stock/_STOCK.jpg`, um mosaico numerado por ID. Depois, `stock.py pegar <slug> <id> <id>...` baixa em 1080p para `assets/stock/`. Tudo fica em cache.
- **Telas reais de app:** se o projeto tem demo web, capture em pt-BR e em tamanho de celular (modelo: `00-SISTEMA/captura/opengym_demo.mjs`, que troca o idioma no localStorage e clica nas abas pelo texto). A versão `_longa.png` (página inteira) é a que o bloco `celular` rola.
- **Vídeo real do app (gravação de uso):** `node 00-SISTEMA/captura/gravar_app.mjs <plano.json> <pasta>` grava clipes mp4 do demo web (rolar, clicar por texto). O modelo de plano fica em `PROJETOS/11-11-2026_sobrecarga-opengym/gravacao.json`.
- **Perfil do usuário no CTA:** @well.free (Well Machado). O avatar fica em `PROJETOS/11-11-2026_opengym-app/assets/app/avatar.png`.

## Estilos implementados (campo `composicao`)
- `Impacto` (**padrão para produto/app**): fundo escuro ou vídeo real escurecido, legenda cinética gigante palavra a palavra (números e `destaques` na cor da marca), barra de progresso no topo, flash e "soco" no corte. Código em `src/impacto/`. Campos da cena: `fundo` (`"escuro"`, `{"video":"52094","foco":40,"escuro":1.6,"pb":true}` ou `{"videos":[...],"troca":0.45}` para montagem rápida), `flash`, `legenda` (`base`/`topo`/`meio`/`nao`). Blocos: `titulo`, `celular` (print real que rola: `src w y rolar rolarEm foco{y h rotulo em}`), `numero`, `github` (card com estrelas contando e clique no Star), `lista` (✕ dor riscada / ✓ solução), `selo`, `apk` (baixar → instalar → abrir), `seguir` (perfil real + comentário digitado). Exemplo completo: `PROJETOS/11-11-2026_opengym-app/roteiro.json`.
- `Editorial`: papel/jornal, manchete gigante no topo, cor vinho, carimbos, prints reais. Código em `src/editorial/`. Blocos: `tela`, `carimbo`, `etiqueta`, `numero`, `checklist`, `fluxo`, `antesdepois`, `passos`, `contador`, `citacao`, `pessoas`, `seguir`, `seta`. Todo bloco aceita `x y w rot z em`. Uma cena com `fundo:"vinho"` vira a cortina de ênfase. **`tela` aceita `.mp4`**: é o vídeo dentro do recorte (treino, gravação do app), com `inicio`, `vel`, `foco:[x%,y%]` e `pb`. O bloco **`codigo`** é o card de linhas coloridas da ref. SQL (`linhas:[{t:[["JAN ","amarelo"],["60 kg"]],em,riscar}]`), bom para planilha e progressão. Exemplo: `PROJETOS/11-11-2026_sobrecarga-opengym/roteiro.json`.
- `Cronica` (**documentário informativo: ciclos, história, mercado, "por que acontece"**; mesa escura + recortes de papel + gráficos de jornal + película). Código em `src/cronica/` (`VideoCronica.tsx` + `blocos.tsx`). Seção na `FOLHA-DE-ESTILO.md`. Todo bloco aceita `x y z em ate` (padrão x=70, y=400). `em`, `ate` e todo campo `*Em` (ou `em` de sub-item) são segundos da cena **ou** âncora `@palavra`. Cores aceitam `"acento"` (padrão), `"queda"`, `"creme"`, `"cinza"`, `"frio"` ou um hex. Datas: `"AAAA-MM"` ou `"AAAA-MM-DD"`.
  - **Roteiro (topo):** `cor` (acento, padrão `#F7931A`), `selo` (cabeçalho, padrão "CRÔNICA"), `data` (carimbo à direita do topo), `destaques`.
  - **Cena:** `duracao legenda(base/topo/nao) capitulo` (texto datilografado no cabeçalho), `transicao` (`pelicula` padrão / `zoom` / `corte`), `escurecer` (0–1, "tela escurece"), `camera {zoom x y em dur}` (zoom sobre um ponto da mesa; x/y em %), `fundo` (`"mesa"` padrão, ou película `{"video":"id","escuro":0.6,"pb":true,"desfoque":0,"inicio":0,"vel":1,"foco":50,"zoom":1.08}` com `assets/stock/<id>.mp4`).
  - `manchete`/`titulo`: `linhas[] kicker acento[] marca[] marcaEm tamanho(118) italico(true ou [índices]) sub tamSub fonte cor alinhar(left/center) w`. `acento` pinta as palavras; `marca` passa o marca-texto atrás delas.
  - `numero`: `valor de casas prefixo sufixo unidade tamUnidade kicker fonte data nota notaEm cor contar(s, 1.1) tamanho alinhar w`. A `fonte` vira pílula e a `data` vira carimbo.
  - `grafico`: `serie[[data,valor]]` (obrigatório), `periodo[ini,fim] log min max prefixo sufixo titulo tamTitulo subtitulo fonte w(940) h(760) desenho(s, 2.2; 0 = pronto) cor espessura area(false tira) eixo(false tira) opacidade papel(true = papel creme) rot passoAnos folga padR`.
    - **queda:** `modo:"queda"` (drawdown % do topo, vales vermelhos) ou `quedaEm` (o mesmo gráfico se transforma), `quedaMin(-100)`.
    - **marcos:** `marcos[{data rotulo cor em tam}]` (verticais tracejadas, ex. halvings).
    - **anotações à mão:** `anotacoes[{data texto("\n" quebra) valor queda cor lado(cima/baixo/esq/dir) dist(120) dx dy raio marca(circulo/ponto/nada) tam rot em}]`. Sem `valor`, o círculo fica sobre a linha.
    - **arcos e faixas:** `arcos[{de para texto cor altura em}]` (seta curva de um ponto a outro, ex. halving→topo, com `alturaArco` geral) e `faixas[{de ate rotulo rotuloLado(esq/dir) cor tam em}]` (zona horizontal em valor).
    - **hoje:** `hoje` (`true` ou `{rotulo data valor cor lado em}`) é o ponto pulsando.
  - `relogio` (mostrador de ciclo, pode ir por cima de um `grafico` com `opacidade` 0.35 e `eixo:false`): `raio(330) total(48 meses) itens[{mes rotulo cor anel em tam}] final{mes rotulo anel em}` (pino piscando onde o ponteiro para), `ponteiroEm rotulos[{mes texto}] passoAnel(40) centro(texto ou false) prefixoCentro("MÊS ") lista(false tira a legenda de pinos) fundo(0.62) cor`. Cada item fica num anel (de fora para dentro).
  - `linhaTempo`: `marcos[{rotulo valor texto estimado em tam}]` (a moeda encolhe com o valor), `unidade simbolo("₿") moeda(170) fonte w` e `contador{rotulo valor de inicio alvo rotuloAlvo em}`.
  - `recorte` (print real como papel): `img`("recortes/x.png" em assets), `w(900) corte{x y w h}`(% do print), `rot(-1.5) margem borda("reta" tira o rasgo) fita(false) pb papel`(cor), `marca`(`{x y w h cor em}` ou lista: marca-texto em % da área visível), `circulo`(`{x y w h cor em}` ou lista), `data dataEm corData`(carimbo), `fonte legenda`.
  - `placar`/`card`: `titulo data fonte escuro(true = cartão escuro) borda("rasgada") rot w linhas[{rotulo valor de casas prefixo sufixo cor nota grande texto contar em}]`. Sem `valor`, mostra `texto`.
  - `barras`: horizontais `itens[{rotulo valor texto nota cor em}] titulo tamTitulo max reserva altura tamTexto fonte selo seloEm`. Com `orientacao:"vertical"`: `itens[{valor rotulo cor em}]` (negativo desce em vermelho), mais `h total corTotal totalEm titulo fonte`.
  - `regua`: `inicio fim passo maior titulo unidade nota notaEm faixa{de ate rotulo cor em} marcas[{valor rotulo linha em}] cursor{valor rotulo cor em}`.
  - `fluxo`: `nos[{rotulo sub cor tam em}]`, com cor esquentando de frio→acento→queda. Também `risco`(false tira o termômetro), `rotuloTopo rotuloBase alturaNo(128) espaco(92) fonte w`.
  - `medidor`: `valor max(100) corte rotuloCorte marcas[{valor rotulo em}] titulo nota notaEm fonte cor w(900)`.
  - `grade`: `total(100) colunas(10) n`(quantos ficam cinza/rachados), `cinzaEm duracaoCinza(1.6) texto sufixo("%") cor fonte w(780)`.
  - `sintese`: `titulo linhas[{rotulo texto ok(true ✔ / false ✖) tam em}]`.
  - `cta`: `kicker linhas[] acento[] tamanho pergunta comenta("COMENTA") perguntaEm enviar enviarEm usuario avatar perfilEm aviso avisoEm avisoY(1790)`. O `aviso` fica fixo no rodapé.
  - **Peças soltas:** `carimbo` (`texto sub cor rot tamanho`) e `aviso` (`texto tamanho w`, ponha em y≈1790).
  - **Layout seguro:** conteúdo entre y=200 e 1380 com legenda `base`. Gráfico cheio: `y 230, h 1050–1120`.
- `Dossie` (**investigação, golpe, dados com fonte**; refs 05/07: preto pontilhado, número gigante com pílula da fonte, ficha creme com caixinha ✓ e círculo vermelho à mão, mapa pontilhado do Brasil, onda sonora, legenda caps com palavra-chave vermelha. Código em `src/dossie/VideoDossie.tsx`. Blocos: `manchete` (`linhas kicker vermelho glitch tamanho`), `numero` (`valor prefixo sufixo unidade kicker fonte nota`), `ficha` (`cabecalho sub itens[{t em okEm circuloEm pilula pilulaEm tam}]`), `onda` (`altura cortes[{em}] apagar`), `mapa` (`w opacidade`), `cta` (`linhas vermelho pergunta perguntaEm usuario avatar perfilEm`). Todo bloco aceita `x y z em ate`; `ate` e qualquer campo `*Em` aceitam âncora `@palavra`. Cuidado: âncora casa pelo início (`@só` pega "sou"). Exemplo: `PROJETOS/11-11-2026_eu-sou-a-sua-voz/roteiro.json`.
- `Leonida` (**games / cultura pop / números absurdos**, vibe GTA VI: pôr do sol neon, HUD, clipes com soco + flash, crédito "Imagens: Rockstar Games"). Código em `src/leonida/`. Roteiro (topo): `trilha volumeTrilha trilhaLaco destaques credito`. Cena: `capitulo` ("A · MAPA"), `fundo` (`"sol"` synthwave ou `{"videos":["gta_praia","gta_skyline@1.3"],"troca":2.2,"escuro":0.4}`), `transicao` (`soco`/`corte`), `escurecer`, `legenda`. Blocos (todos `x y z em ate centro`, sem `x` = centralizado; `*Em` aceita âncora; `fonte fonteEm selo seloEm` viram pílula/selo): `titulo` (`linhas kicker acento amarelo tamanho`), `numero` (`valor de casas prefixo sufixo texto kicker unidade cor contar contarEm`), `carimbo` (`texto sub cor rot tamanho`), `selo`, `fonte`, `minimapa` (`tamanho andarEm dur minutos rotulo`), `placas` (`itens[{icone:pe/carro/aviao rotulo valor em}]`), `mapa` (`modo:"comparar"` com `gta5Em leonidaEm vezesEm`; `modo:"regioes"` com `regioes[{nome em}]`), `barras` (verticais `itens[{rotulo valor texto faixaDe selo pronto em}] max h largura predio{em valor rotulo}`; `orientacao:"horizontal"` com `sufixo` e `destaque`), `pessoas` (`de para contarEm rotulo`), `cronometro`, `radar` (`furacaoEm alerta`), `post` (boato genérico: `texto apagar`), `celular` (`hora data itens[{app texto em}]`), `versus` (`opcoes[{texto sub cor em}] ouEm`), `cta` (`avatar nome usuario comentario comentarioEm seguirEm`). Som: `som:"nome"`/`false`. Exemplo: `PROJETOS/14-11-2026_gta6-leonida/roteiro.json`.
- `GtaReal` (**GTA / games com gameplay real — padrão para vídeos de GTA** desde 15/11/2026): vídeo do jogo do começo ao fim, cores originais, SEM máscara/tinta/escurecimento/vinheta; no máximo 1–2 sobreposições leves por cena na faixa de cima (y≈190), centro livre; fonte + crédito em texto de 19 px no canto superior direito. Código em `src/gtareal/` (importa helpers do Leonida). Roteiro (topo): `trilha volumeTrilha trilhaLaco destaques credito recortes` (`recortes: {"yt03":{"zoom":1.3,"origem":"50% 0%"}}` = recorte mínimo só para esconder letreiro queimado do criador). Cena: `fundo` **obrigatório** `{"videos":["yt02@0.5"],"troca":1.9,"foco":50}` (sem `escuro`/`recorte`/`"sol"`), `fonte` (vai para o canto), `capitulo` (só marca a barra e toca o impacto), `transicao`, `legenda`. Blocos (`y em ate x z`; `*Em` aceita âncora): `rotulo` (`linhas acento cor tamanho`≈74), `numero` (`texto` ou `valor de prefixo sufixo contar`; `rotulo cor tamanho`≈140), `estrelas` (`total de novaEm rotulo rotuloEm`), `pilulas` (`titulo vertical tamanho itens[{texto sub cor icone:rosto/roupa/carro marca:x/ok em pronto riscaEm brilhaEm tag}]`), `barras` finas (`titulo w max itens[{rotulo valor texto cor em}]`), `alerta` (notificação de 1 linha: `app cor itens[{texto em}]`), `selo` (carimbo pequeno: `texto cor tamanho rot`), `cta` enxuto (`avatar usuario seguirEm`). Versão sem gastar voz: `produzir.py previa|entrega <proj> --sem-voz`. Exemplo: `PROJETOS/15-11-2026_gta6-realista-v2/roteiro.json`.
- `Trajeto` (**prancheta técnica, ref. catálogo 61, 15/11/2026**): fundo creme-pêssego + grade de "+", UMA linha vertical rosa-laranja contínua ligando todas as cenas, vídeos em 2 janelinhas com rótulo mono (cenas 1 e última em tela cheia + título gigante), números grandes no alto à direita, lista/barras/estrelas em traço no alto, legenda em caixa creme. Mesmos campos de roteiro e blocos do `GtaReal` (`rotulo selo numero estrelas pilulas barras alerta cta`; `selo`/`pilulas` viram o título gigante nas cenas cheias). Código `src/trajeto/VideoTrajeto.tsx`; DNA em `REFERÊNCIAS/CATALOGO/61_prancheta-trajeto/DNA.md`. Exemplo: `PROJETOS/15-11-2026_gta6-realista-v3/roteiro.json`. **v4** (`"janelas": "grande"` no topo): janela 16:9 com 90% da largura, só vídeo (inteiro, sem zoom), 2ª janela no chão (`fundo.b:false` tira), `duracaoVideos` {ytNN: s} evita congelar; bloco `recorte` (`src x y largura rot entrada(pop/slide/desenho) flutua borda rotulo ry cor som em`: PNG de `assets/recortes/` com contorno de adesivo, ligado à linha por guia); selo cheio `ponto:false riscaEm`. Exemplo v4: `PROJETOS/15-11-2026_gta6-ep2/roteiro.json`.
- `Traco` (**app/produto explicado como esboço técnico**, ref., 16/11/2026): branco-gelo, traço preto fino, celulares pretos flutuando com sombra e o clipe real dentro, trajetos pontilhados, rótulos mono, acento no degradê laranja→amarelo do app, Lobo (avatar Hermes) em SVG. Código `src/traco/VideoTraco.tsx`; seção na `FOLHA-DE-ESTILO.md`. Props de cada bloco (cardápio, 1 linha por tipo): `00-SISTEMA/templates/traco_blocos.md` (`produzir.py cardapio traco` regenera do .tsx). **Desde 18/11: `paleta:"mono"` + forja = padrão** (preto/branco/cinza, linha fina, blocos desenhados com cursor-mira; ref. 79); `paleta` ausente = laranja antigo.
- `SplitTH` (**talking head do cliente + painel de dados**, ref. 54, 19/11/2026): 40% de cima = papel milimetrado `#EBEAE5` (`rotulo` "// 01 · tema" azul + `status` + régua de progresso), 60% de baixo = `rosto {video janelas[{de y desfoque}] fonte}` (gravação muda; áudio = narracao; último quadro congela), legenda amarela com contorno na emenda (`legenda:"nao"` some; `destaques` brancos). Código `src/splitth/` (`VideoSplitTH.tsx` + `blocos.tsx`); seção na `FOLHA-DE-ESTILO.md`; exemplo `PROJETOS/19-11-2026_seguro-reembolso-mixto/roteiro.json`. Todo bloco: `x y(topo, px) z em ate`, painel entre y 215–740.
  - `titulo`: `linhas[] acento[] tamanho(132) bandera:"es" sub alinhar` (corpo encolhe sozinho p/ caber em 960 px)
  - `chips`: `titulo tituloEm itens[{texto icone em}]` · ícones: mente mano pie medico pin calendario recibo escudo euro estrela coracao cheque
  - `fluxo`: `nos[{texto icone cor:"vermelho" em}]` (2–3 cartões + seta que se traça)
  - `dupla`: `itens[{rotulo sub icone cor em}]` (2 cartões + "+")
  - `selo`: `texto em cor rotacao tamanho` (carimbo −3°, soco)
  - `numero`: `valor de casas prefixo sufixo unidade rotulo cor tamanho(260) duracaoConta em` (conta sempre termina dentro da cena)
  - `passos`: `itens[{n texto sub destaque em}]` (✓ azul quando o próximo entra)
  - `foto`: `src rotulo etiqueta largura altura em` (etiqueta vermelha tipo "INVADIDO")
  - `cta`: `avatar nome usuario texto textoSeguido em seguirEm y(960)` (cartão sobre o vídeo, botão vira "✓ Siguiendo")
- `Reel` (Dark Tech): painel com cantos marcados, legenda embaixo. Blocos: `headline`, `numero`, `ranking`, `card`, `checklist`, `terminal`, `pilulas`. Código em `src/componentes/`.

## Estilo da voz (escolhido pelo usuário em 18/11/2026)
Cabeçalho do ROTEIRO.md: `estilovoz: professor | natural | apresentador` (presets em `00-SISTEMA/assets/voz/estilos.json`, amostras em `assets/voz/estilos/*.mp3`). Escolha pelo enredo:
- **professor**: educativo/explicativo ("o que é", "como funciona", passo a passo).
- **natural** (padrão): história, humor, conversa, bastidores.
- **apresentador**: dados, novidades, lançamentos, listas, CTA forte.
`tempo:` no cabeçalho vence o do preset (os vídeos de ~60 s usam 1.25–1.33). `tag=` da cena vence a tag do estilo. Pergunte ao usuário só se o enredo for ambíguo.
