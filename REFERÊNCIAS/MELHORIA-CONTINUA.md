# Melhoria contínua: registro das auditorias

Como usar: skill `melhoria-continua` (rodar no fim de cada vídeo). Medição: `python 00-SISTEMA/bin/auditar.py`.
Este arquivo guarda **o que aprendemos**, e não o log bruto. Cada achado vira código ou regra numa skill; aqui fica só o registro e o status.

## Regras de ouro (vindas das auditorias; valem para todo vídeo)
1. **1 vídeo = 1 sessão.** Ao entregar o final, a próxima pauta começa numa sessão nova, porque o custo maior é reler o contexto acumulado.
2. **Opus orquestra e Sonnet produz.** Depois do roteiro aprovado, o agente `produtor` roda `rapido`/`previa`/`entrega`; a sessão principal só olha os mosaicos e conversa com o usuário.
3. **Voz se testa antes de gerar.** Nomes próprios, siglas, inglês e @ vão numa frase curta (`eleven.py teste`, ~50 créditos) antes do vídeo todo (~1.800).
4. **`ouvir` antes da prévia** (já roda no `rapido`). Erro de pronúncia se corrige com `pronuncia`, que só cobra a cena e as vizinhas.
5. **Nunca `cat` de arquivo grande** (skills, `.tsx`, `produzir.py`). Use `grep -n` e depois o trecho.
6. **Ajuste na `previa` (15 s), nunca no render.** A `entrega` roda uma vez, em segundo plano, depois do mosaico aprovado.
7. **Cada número e rótulo da tela confere com a `PESQUISA.md`** antes da prévia, e não depois do final.
8. **Recorte 16:9 → 9:16 com texto** (logo, data, legenda do trailer) usa letterbox com fundo desfocado, não corte. Confira num mosaico de clipes antes de montar.
9. **"Você já tem roteiro?" é a 1ª pergunta.** Roteiro do usuário = sem roteirista e sem revisor.
10. **Compor antes de criar.** Designer só se nenhum bloco do cardápio (`templates/traco_blocos.md`) serve; máx. 1 bloco novo por vídeo.
11. **Montagem por código** (`produzir.py montar`), pronúncia por `eleven.py pronuncia`, sincronia pelos tempos da ElevenLabs. Proibido Whisper medium/large.
12. **Revisor agente só no roteiro do roteirista.** Prévia e final: CHECAGEM + 1 mosaico olhado pela sessão principal.

## Métricas por sessão
"Contexto médio" é quanto cada chamada relê. "Custo ref." é o preço de tabela da API, só para comparar sessões.

| Data | Sessão | Entrega | Duração | Chamadas (princ./sub) | Contexto médio princ. | Custo ref. | Créditos ElevenLabs |
|---|---|---|---|---|---|---|---|
| 10–11/11 | bd97bbbd | montagem do sistema + 3 vídeos + carrosséis | 41 h | 604 / 223 | 235k (opus) | ~US$ 105 | — |
| 14/11 | 338bac92 | GTA 6 Leonida (97,8 s, estilo novo) | 4,1 h | 108 / 49 | 176k (opus) | ~US$ 20 (princ. 12,9 + designer 7,3) | 3.919 → 196 (−3.723) |
| 17–18/11 | 32a53421 | vídeos 14 (126 s) e 15 (120 s), Traço | 149 min | 80 / 178 | 138k (opus) | ~US$ 23 (opus sub 11,3 + princ. 7,4 + sonnet 4,6) | 117.993 → 115.471 (−2.522) |

## Auditoria 18/11/2026: vídeos 14–15 (sessão 32a53421)
| # | Sintoma | Causa | Ação | Status |
|---|---|---|---|---|
| 1 | Produtor 24 min no vídeo 15 | rodou Whisper medium por conta própria para medir sincronia | regra 11; produtor.md proíbe medium | ✅ regra |
| 2 | Designer Opus 2× (~US$ 5, 18 min) | cada vídeo inventava blocos | regra 10 + cardápio gerado por código | ✅ regra + código |
| 3 | Produtor 128–156k tok, gen.py descartável | roteiro.json montado à mão, lendo .tsx de 146 KB | `produzir.py montar` + `cardapio` | ✅ código (testado no vídeo 15: 100% igual) |
| 4 | Roteirista + revisor descartados (~US$ 3) | usuário reescreveu o roteiro | regra 9 | ✅ regra |
| 5 | Revisor Opus frio na prévia (90k) | revisão redundante com CHECAGEM + mosaico | regra 12 | ✅ regra |
| 6 | Teste de pronúncia manual (bug do av) | `eleven.py teste` não transcreve | `eleven.py pronuncia` | ✅ código |
| 7 | Contexto principal 138k × 80 | 2 vídeos na mesma sessão | regra 1 + modo lote (fabrica) | ✅ regra |
| 8 | "Tenho" virou "Tem" no vídeo 14 | corte comia a 1ª sílaba | margem de início 0,04 → 0,15 s em `produzir.py` | ✅ código |

## Auditoria 14/11/2026: GTA 6 (sessão 338bac92)

### Onde foi o custo
- **Tokens:** 93% do custo é *releitura de contexto* (18,8 milhões de tokens lidos do cache em 108 chamadas, média de 176 mil por chamada). A sessão principal (Opus) fez a produção sozinha (93 comandos), contra a regra do `CLAUDE.md`.
- **Designer (Opus):** 49 chamadas, ~US$ 7, para criar o estilo Leonida. Isso é investimento único: os próximos vídeos de game reaproveitam o estilo.
- **Créditos:** −3.723 num vídeo só. Metade (~1.800) foi o vídeo inteiro **gerado de novo** ao trocar de modelo (multilingual_v2 → v4).
- **Tempo:** 17 pesquisas web (necessárias para fonte cruzada), recortes de vídeo refeitos e uma rodada extra só para mandar o vídeo ao celular.

### Achados → ação
| # | Sintoma | Causa | Ação | Status |
|---|---|---|---|---|
| 1 | Pronúncia ruim percebida só pelo usuário, depois do final | ninguém conferia o áudio | `produzir.py ouvir` (Whisper compara com o roteiro), automático no `rapido` | ✅ código |
| 2 | Vídeo inteiro regenerado (−1.800 créditos) | o modelo foi decidido depois de gerar | Chris + v4 + pt viraram padrão; regra de testar as palavras difíceis antes | ✅ código + regra 3 |
| 3 | O corte de pausas achava só 1,1 s | o v4 estica o fim das palavras | corte por `silencedetect` no áudio | ✅ código |
| 4 | "créditos insuficientes" com o áudio pago | a conta incluía o cache | `eleven.em_cache()` | ✅ código |
| 5 | `PYTHONIOENCODING=utf-8` repetido em 3 comandos | o terminal cp1252 quebrava no ⚠️ | `produzir.py`, `eleven.py` e `auditar.py` reconfiguram a saída para UTF-8 | ✅ código |
| 6 | Vídeo de 61 MB não chegou ao celular, e a cópia foi feita à mão | limite de 30 MB | `entrega` gera `cache/celular/*-celular.mp4` sozinho | ✅ código |
| 7 | CHECAGEM "VER" num vídeo longo de propósito | limite fixo de 90 s | campo `duracaoMax` no roteiro | ✅ código |
| 8 | A voz ia ser trocada sem querer em todo roteiro novo | o modelo de roteiro trazia o edge-tts | `templates/roteiro.json` sem `voz`: o padrão vem do código | ✅ código |
| 9 | Recortes `gta_data`/`gta_carro` refeitos | o corte 9:16 cortou o texto do trailer | regra 8 (letterbox desfocado) | ✅ regra |
| 10 | Rótulo "COM MARKETING" errado no GTA 6 | o rótulo não foi conferido contra a pesquisa | regra 7 | ✅ regra |
| 11 | Produção feita pelo Opus, com contexto médio de 176k | não houve delegação | regras 1 e 2; agente `produtor` ganhou os passos de voz | ✅ regra |
| 12 | `cat` da skill `reel` inteira (16 mil caracteres) | releitura de arquivo já carregado | regra 5 | ✅ regra |
| 13 | ffmpeg `drawtext` falhou com o caminho da fonte no Windows | os dois-pontos do `E:` | copiar a fonte para o scratchpad como `f.ttf` e usar caminho relativo | ✅ registrado em `AUTOMACAO.md` §6 |
| 14 | Post 04 de referência era foto, e houve tentativa de baixar como vídeo | o tipo não foi conferido | o garimpeiro confere o tipo do post (foto/carrossel/vídeo) antes de baixar | ✅ regra no agente `garimpeiro` |
| 15 | "Vice City" e "Recorde" ainda com sotaque ("@well.free" resolvido em 16/11: `arrôba uéu ponto frii`, voz Well) | sem crédito para testar | testar os candidatos em 01/12 (`assets/voz/pronuncia.json` → `_a_testar`) | 🟡 pendente (crédito) |

## Lições 16/11/2026: hermes-app (gravação do app X-GO e estilo Traco)



**1. Gravação de tela por adb.** `uiautomator dump` falha ("could not get idle state") com animação contínua. Navegue por print + coordenadas. Nunca toque às cegas (um toque caiu em "Falar com o agente"). No Git Bash use `MSYS_NO_PATHCONV=1`, senão `/sdcard` vira caminho do Windows. adb: `D:\PROJETOS\1- Projetos\3- Agentes\Agentes\01- X-GO - Hermes\apps\xgo-mobile\.work\sdk\platform-tools\adb.exe`. Status: ✅ regra.



**2. Estilo novo `Traco`.** Criado a partir da ref. (fundo branco, traço preto). Prévia de ~2,6 min. Status: ✅ código em `FERRAMENTAS/Remotion/src/traco/`.

## Vídeo 16 (18/11/2026, fábrica de Reels) — 1º com `montar`
- Fluxo: analista (DNA ref. 79) → designer (serifa, `negativo`, `terreno`) → **sessão principal rodou montar/rapido/entrega direto (sem produtor)** → 49 s, CHECAGEM OK, ~500 créditos.
- `montar`: cabeçalho `destaques`/`pronuncia` agora aceita JSON (antes só `a,b` e `a=b;c=d`) | ✅ código
- `entrega` quebrava (`pastas` sombreado em `video_final`, vindo da troca de datas) | ✅ código
- Whisper escreve "Cloud" para qualquer grafia de Claude: não use o OUVIR para julgar esse nome | ✅ regra (pronuncia.json)
- Imagens do `_FRAMES` do catálogo são de terceiros: nunca na tela; para "mostrar estilos" use quadros dos NOSSOS vídeos (`VIDEOS PRONTOS`) | ✅ regra

## Vídeo 17 (18/11/2026, 1 vira 10) — paleta mono + forja
- Designer e roteirista em PARALELO (arquivos diferentes) + voz gerada antes do visual ficar pronto → ganho de ~8 min. | ✅ regra (fabrica: paralelize quando não há arquivo em comum)
- Roteiro em 69 s com tempo 1.25 → `tempo: 1.33` (grátis) = 64,9 s. Regra: 230 palavras ≈ 65 s no 1.33; alvo 60 s ≈ 210 palavras. | ✅ regra
- "Hermes" no meio da frase saiu "Wernes" → `Érmes` no pronuncia.json. | ✅
- Forja deixa alguns quadros quase vazios no _FINAL (bloco ainda desenhando). Se o usuário reclamar de tela vazia: adiantar âncoras ou reduzir antecedência da forja. | 🟡 observar

## Vídeo 18 (18/11/2026, Paint Inspector Pro) — gravação do celular via adb
- `adb` do PC: `C:\Program Files (x86)\Iriun Webcam\adb.exe` (celular Samsung, depuração USB). Script modelo: `00-SISTEMA/bin/gravar_celular.sh` (confere o app em foco antes de cada toque, pausa se entrar ligação, NUNCA usa "voltar", volta ao topo pela aba Início).
- 1ª tentativa errada: o "voltar" saiu do app e os toques caíram no Telefone (risco de ligação/contato). Regra: nunca "voltar" no app; checar `mCurrentFocus` antes de cada toque. | ✅ regra + código
- Git Bash: `MSYS_NO_PATHCONV=1` para `/sdcard`; destino do `adb pull` em caminho Windows (`E:/...`); PNG/MP4 binário nunca por redirecionamento do PowerShell. | ✅
- Flutter não expõe árvore de acessibilidade (uiautomator vazio): navegar por coordenadas (1440×3120) lidas de screenshots reduzidos. | ✅ nota
- Celular: `tam` do bloco `celular` = ALTURA da moldura (860–880 deixa nítido sem cobrir); `numero`/`selos` abaixo do celular em y≈1330, tamanho 120; clipes de tela têm ~2 s de espera no início: usar `inicio` por cena. | ✅ regra
- `fonteAcento: industrial` (Barlow Condensed itálica) para temas técnicos; padrão segue serifa. Áudio: limpeza leve com `agate` (sem desalinhar) quando o usuário pede tirar sons fracos; sem ouvido, pedir segundos exatos. | ✅
