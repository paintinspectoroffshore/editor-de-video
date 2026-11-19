# Cortes: vídeo longo do YouTube → Reel (pesquisa 15/11/2026)

## O que o modo faz
Pega um vídeo longo, entende o conteúdo inteiro e gera um Reel **novo**: roteiro reescrito (fatos fiéis, palavras/ordem/cenas diferentes), narrado pela voz clonada **Well**, com os melhores trechos do vídeo original de fundo, no tema do projeto (legenda, gráficos, números com fonte).

## Fluxo (comandos em `00-SISTEMA/bin/cortes.py`)
1. `cortes.py analisar <url>` (~3–7 min, 0 crédito): baixa só um **proxy 360p** + legenda do YouTube (sem legenda → Whisper small) → `cache/youtube/<id>/TRANSCRICAO.md` (blocos de 20 s, 🔥 pico de energia, ✂ cortes de cena) + `_CENAS.jpg` (60 quadros com o tempo).
2. Roteirista lê a transcrição 1 vez, dá nota 0–100 aos momentos (rubrica abaixo), cruza os fatos na web e escreve `ROTEIRO.md` + `cortes.json` (aprovação 1).
3. `cortes.py cortar <slug>` (~10 s por corte, 0 crédito): baixa **só os segundos usados** em 1440p direto do YouTube e grava `assets/stock/ytNN.mp4` 1080×1920 → entram no `fundo.videos` do estilo (Leonida, Impacto, Cronica).
4. Pipeline normal: `produzir.py rapido` (voz Well) → prévia → `entrega`.
5. Fim: `cortes.py limpar <id>` apaga o proxy (~70 MB).

## Modos de enquadramento (`cortes.json` → `modo`)
| modo | quando | como |
|---|---|---|
| `foco` (padrão) | gameplay, trailer, paisagem | recorte 9:16 no ponto `foco` % (0 = esquerda, 100 = direita), `zoom` opcional |
| `geral` | quadro com texto, comparação lado a lado | quadro inteiro no meio + mesmo quadro desfocado de fundo |
| `track` | pessoa falando | YuNet (OpenCV) acha o maior rosto 5×/s, suavizado (EMA) |

## Rubrica de momento viral (de AI-Youtube-Shorts-Generator + openshorts)
Nota 0–100 por: gancho, pico emocional, revelação, opinião forte, conflito, frase citável, número surpreendente, valor prático. Sem trechos sobrepostos (fica o de maior nota). Nunca começar/terminar a <0,4 s de um corte de cena (o `cortar` já empurra a borda).

## Projetos estudados (API do GitHub, 15/11/2026)
| Projeto | ⭐ | Licença | O que aproveitamos |
|---|---|---|---|
| [mutonby/openshorts](https://github.com/mutonby/openshorts) | 8,4k | MIT | PySceneDetect + 4 modos de enquadramento (TRACK/GENERAL/SPLIT/SCREENCAST) → viraram `track`/`geral`/`foco` |
| [modelscope/FunClip](https://github.com/modelscope/FunClip) | 6,5k | MIT | corte guiado pela transcrição com LLM (aqui o LLM é o próprio Claude, sem API extra). O ASR deles (FunASR) é focado em chinês: ficamos no Whisper |
| [Anil-matcha/AI-Youtube-Shorts-Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) | 6,1k | MIT | rubrica de nota 0–100 + deduplicação; rastreio de rosto com suavização |
| [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) | 5,5k | BSD-3 | instalado (`pip install scenedetect`) |
| [FujiwaraChoki/supoclip](https://github.com/FujiwaraChoki/supoclip) | 3,2k | **AGPL** | só estudo (licença contamina o projeto se copiar código) |
| JayWebtech/autoshorts (1,5k, sem licença), jipraks/yt-short-clipper (1,1k), ClipsAI (571, parado desde 2024) | | | descartados: sem licença, app fechado ou abandonado |

**Por que não instalar os apps inteiros:** todos dependem de Gemini/OpenAI pago, GPU ou Docker, e entregam o corte *com a fala original*. Aqui o objetivo é outro (roteiro reescrito + voz própria + motion graphics), então incorporamos as técnicas no nosso pipeline, sem servidor nem API extra.

## Diferenças nossas (economia)
- Vídeo inteiro só em 360p; alta resolução só dos segundos usados (26 min em 1440p seriam ~1,5 GB; 15 cortes ≈ 40 MB).
- Legenda do YouTube primeiro (segundos); Whisper só se não houver.
- Tudo em cache: repetir `analisar`/`cortar` não baixa de novo.

## Lição do 1º teste (15/11)
Criadores gravam letreiros na imagem ("ALARME", "OS CARROS", legendas, selo de capítulo). Depois do `cortar`, olhe **1 quadro de cada corte** numa tira só (ffmpeg `hstack`) antes de gerar voz/prévia. Corte com letreiro: troque (prefira) ou use `fundo.recorte` no Leonida (zoom ancorado no topo).

## Direitos
O vídeo de base é de outro criador. Sempre: crédito na tela ("Base: <canal> (YouTube) · Imagens: <dono>"), roteiro próprio (comentário/análise, não reupload), trechos curtos. Evitar webcam, vinheta e marca d'água do criador.
