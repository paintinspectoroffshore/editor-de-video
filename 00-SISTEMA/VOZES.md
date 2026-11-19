# Vozes: padrão do projeto, pipeline de áudio e alternativas

## ✅ EM USO: ElevenLabs + Chris (padrão do projeto desde 14/11/2026)
- Chave em `00-SISTEMA/segredos/elevenlabs.key`. Código: `bin/eleven.py` (API) e `bin/produzir.py voz` (pipeline).
- **Voz padrão: Chris** (`iP95p4xoKVk53GoZ742B`, premade), com o modelo `eleven_v4` e `language_code: "pt"`. Vale para todo vídeo sem precisar escrever nada no roteiro (`VOZ_CFG_PADRAO` no `produzir.py` e `VOZ_PADRAO`/`MODELO_PADRAO` no `eleven.py`).
- **Não precisa clonar:** a Chris é uma voz *premade*. Ela fica na conta para sempre e funciona no plano grátis pela API. Clonar a voz dela num programa local não é recomendado, porque a voz pertence a um dublador contratado pela ElevenLabs (regra do projeto: clone só a sua voz ou a de quem autorizou por escrito).
- Plano **grátis**: 10.000 créditos/mês, renova todo dia 1. Um vídeo de 90 s em v4 custa ~1.800 créditos, ou seja, ~5 vídeos/mês. Saldo: `python 00-SISTEMA/bin/eleven.py saldo`.
- O grátis **não dá licença comercial** e exige crédito à ElevenLabs. O **Starter** resolve licença, triplica os créditos e libera clonar a **sua** voz.
- Quando o crédito acaba, o sistema cai sozinho para o edge-tts (`pt-BR-AntonioNeural`).

## Pipeline de áudio (o que roda em cada `produzir.py voz`)
1. **Dicionário de pronúncia:** `assets/voz/pronuncia.json` (todo vídeo) + `pronuncia` do roteiro (vence). Troca só o texto falado; a legenda mantém a grafia original. O mais longo é trocado primeiro.
2. **Geração por cena** (2 em paralelo, limite do grátis), com `previous_text`/`next_text` para manter a entonação entre as cenas, e tempos por palavra (`with-timestamps`, dispensa o Whisper na legenda).
3. **Cache:** a chave é texto + voz + modelo + ajustes + vizinhas + idioma. Repetir não gasta crédito. Antes de gerar, o sistema conta só as cenas que não estão no cache.
4. **Corte de pausas** (`pausas`, padrão 0.12 s): `ffmpeg silencedetect` (`limiarSilencio`, padrão −32 dB) acha cada silêncio. Começo da cena → 0,04 s, fim → 0,08 s, meio → no máximo `pausas`. Os tempos das palavras são remapeados pelo mesmo corte, então legenda e âncoras não desalinham. Método da skill `video-audio`.
5. **Aceleração local** (`tempo`, padrão 1.2): `ffmpeg atempo` acelera sem mudar o tom e sem gastar crédito. Os tempos são divididos pelo mesmo fator.
6. **Respiro entre cenas** (`respiro`, padrão 0.08 s) e no fim (`respiroFinal`, 1.2 s), alinhados ao quadro (30 fps).
7. **Conferência sem ouvir** (`produzir.py ouvir`, roda no fim do `rapido`): o Whisper small (CPU, ~70 s) transcreve e compara com o roteiro. Mostra só o que soou diferente (ignora número escrito × falado e pra/para) e o erro de sincronia. Relatório em `previa/_OUVIR.txt`.
8. **Final:** loudnorm −14 LUFS (`finalizar`), CHECAGEM (duração-alvo 45–90 s ou `duracaoMax` do roteiro) e cópia < 30 MB para o celular em `cache/celular/`.

## Histórico do vídeo GTA 6 (14/11/2026): o que deu errado e o que mudou
| Problema | Causa | Correção (já no código) |
|---|---|---|
| "GT A5", "P, S5", "Comenta a GAI", "Arroba UL .free", "Viscity" | `eleven_multilingual_v2` adivinha o idioma, e a voz premade é americana | `eleven_v4` + `idioma: "pt"`. No teste curto, o v4 venceu o `flash_v2_5` |
| 26 s de pausas e voz lenta | o v4 fala com pausas longas entre frases | `pausas` 0.12 + `tempo` 1.2 + `respiro` 0.08: 117 s → 97,8 s (−18,3 s de silêncio) |
| O corte de pausas só achava 1,1 s | o v4 estica o fim da palavra por cima da pausa, então o vão entre palavras some | o silêncio passou a ser medido no áudio (silencedetect), não nos tempos das palavras |
| "créditos insuficientes" com o áudio já pago | a conta somava o vídeo todo, inclusive o que estava no cache | `eleven.em_cache()`: só as cenas novas entram na conta |
| O v4 recusou `style`/`speed` | o v4 só aceita `stability` e `similarity_boost` | `_ajustes()` filtra por modelo |
| O idioma no cache invalidaria os áudios antigos do v2 | o hash incluía o idioma | o idioma só entra no hash quando o modelo usa idioma |
| `'charmap' codec can't encode` ao imprimir ⚠️ | terminal do Windows em cp1252 | os scripts reconfiguram a saída para UTF-8 |
| faster-whisper quebrava (`metadata_errors`) | a versão do `av` | o áudio é lido via ffmpeg → numpy (`legendar.carregar_audio`) |
| Erro de pronúncia só notado pelo usuário, depois do final | ninguém ouvia antes da entrega | `ouvir` automático no `rapido` |
| **~1.800 créditos gastos de novo** (vídeo inteiro regenerado) | o modelo foi trocado depois de gerar tudo | regra: testar as palavras difíceis numa frase curta **antes** (`eleven.py teste`, ~50 créditos) |
| Vídeo de 61 MB não chegou ao celular | limite de 30 MB do envio | `entrega` gera a cópia leve sozinho |

**Resolvido 16/11/2026:** "@well.free" com a voz Well lê "arrôba uéu ponto frii" (validado no Whisper; `assets/voz/pronuncia.json`).

**Ainda a resolver** (exige crédito; testar em 01/12): o 1º "Vice City" saiu "Vicerie"; "Recorde" saiu "Record". Candidatos em `assets/voz/pronuncia.json` → `_a_testar`.

## Alternativas de voz (pesquisa de 10/11/2026)

### Atualização 14/11/2026: grátis, código aberto e roda neste PC (só CPU)
| Opção | Link | pt-BR | Clona | Licença | Velocidade na CPU | Uso aqui |
|---|---|---|---|---|---|---|
| **Pocket TTS** (Kyutai) | https://github.com/kyutai-labs/pocket-tts | ⚠️ "portuguese" listado; não diz se é BR | ✅ (wav de referência) | código MIT; cada voz tem licença própria | a mais rápida: ~2,3× tempo real em 4 vCPU, usa 2 núcleos | rascunho rápido e teste da sua voz |
| **Chatterbox Multilingual pt-BR** (Resemble) | https://github.com/resemble-ai/chatterbox · https://huggingface.co/ResembleAI/Chatterbox-Multilingual-pt-br | ✅ checkpoint próprio | ✅ ~10 s | MIT (marca d'água inaudível) | lenta (exige ~6 GB de RAM; sem número oficial) | melhor aposta de qualidade em pt-BR |
| **Qwen3-TTS 0.6B** (Alibaba) | https://github.com/QwenLM/Qwen3-TTS | ✅ (entre os 10 idiomas) | ✅ ~3 s | Apache-2.0 | ~0,33× tempo real em int8 (90 s de fala ≈ 4–5 min) | qualidade alta; gera enquanto a prévia roda |
| **Voicebox** (app com interface) | https://github.com/jamiepine/voicebox | via Qwen3/Chatterbox | ✅ grava a voz no próprio app | MIT | depende do modelo | o jeito mais fácil, sem terminal |
| **MOSS-TTS-Nano** | https://github.com/OpenMOSS/MOSS-TTS-Nano | ✅ | ✅ | ⚠️ o README diz "ainda sem licença para redistribuir" | tempo real em 4 núcleos (ONNX) | esperar a licença |
| **Kokoro** | https://github.com/hexgrad/kokoro | ⚠️ fraco | ❌ | Apache | muito rápida | não serve para pt-BR |
| **Applio/RVC** | https://github.com/IAHispano/Applio | qualquer | ✅ treina com 10–30 min | MIT | treino lento sem GPU boa | converte edge-tts para a sua voz |

**Gravar a própria voz com som de estúdio (grátis):** grave no celular → limpe com **DeepFilterNet** (https://github.com/Rikorose/DeepFilterNet; tempo real numa CPU de 1 núcleo, licença MIT/Apache) → o pipeline já aceita `audio/gravacao.*` (legenda via Whisper) e aplica −14 LUFS. O corte de pausas ainda vale só para TTS; estender para gravação é a próxima melhoria.
Fora: F5-TTS e XTTS (não comercial), DPDFNet (CC BY-NC-ND). Nenhuma opção foi testada aqui ainda: o próximo passo é gerar a mesma cena com Pocket, Chatterbox pt-BR e Qwen3 e comparar com a Chris.
Fontes: READMEs acima · [Qwen3 na CPU (ocdevel)](https://ocdevel.com/blog/20260711-quantized-cpu-tts) · [Chatterbox CPU (doc)](https://www.mintlify.com/yocxy2/chatterboxyocxy/models/chatterbox-multilingual) · [DeepFilterNet (Telnyx)](https://telnyx.com/learn-ai/speech-enhancer.md) · [BentoML 2026](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)

**Popularidade e manutenção (API do GitHub, 14/11/2026):** Voicebox 60,6k⭐ (último push 07/10, v0.5.0) · Chatterbox 27,8k⭐ (push 04/11) · F5-TTS 15,6k⭐ · Qwen3-TTS 14,4k⭐ (parado desde 17/03) · Pocket TTS 10,3k⭐ (v4.0.1 em 21/10, push 13/11) · Kokoro 10,1k⭐ (parado desde 08/2025) · DeepFilterNet 5,0k⭐ (última versão 2023) · MOSS-TTS-Nano 4,7k⭐ (agora com Apache-2.0 no GitHub) · Applio 4,0k⭐ (3.7.1 em 26/10) · Resemble Enhance 2,5k⭐ (parado desde 12/2024).

### Ranking anterior (10/11/2026)
Antes da ElevenLabs, a voz era **edge-tts** (`pt-BR-AntonioNeural`): grátis e estável, mas com cara de "robô bom", a mesma que todo mundo usa.
Objetivo: chegar a uma voz natural em pt-BR, de preferência **a sua voz clonada**, sem pagar por minuto.

**Limite do PC:** a GTX 750 (4 GB, 2014) não roda os modelos novos na GPU. Na CPU funciona, só que devagar. Para gerar rápido, use o **Google Colab** com GPU grátis.


| # | Projeto | Link | pt-BR | Clona voz | Uso comercial | Veredito |
|---|---|---|---|---|---|---|
| 1 | **Qwen3-TTS** (Alibaba) | https://github.com/QwenLM/Qwen3-TTS | ✅ (10 idiomas, inclui PT) | ✅ com ~3 s de áudio (modelos *Base*) | ✅ Apache-2.0 | **Melhor aposta.** Licença livre, versão pequena (0.6B) que roda em CPU, e tem também "voice design" (descrever a voz em texto) |
| 2 | **Chatterbox Multilingual** (Resemble AI) | https://github.com/resemble-ai/chatterbox · modelo pt-BR: https://huggingface.co/ResembleAI/Chatterbox-Multilingual-pt-br | ✅ checkpoint próprio pt-BR | ✅ com ~10 s | ✅ MIT (o áudio sai com marca d'água inaudível) | **Segunda aposta.** Muito natural, controla a emoção/exagero |
| 3 | **Voicebox** (app desktop) | https://github.com/jamiepine/voicebox | via Qwen3/Chatterbox | ✅ | ✅ MIT | Interface pronta tipo ElevenLabs que roda o 1 e o 2. Bom para você usar sem terminal |
| 4 | **F5-TTS pt-BR** | https://huggingface.co/firstpixel/F5-TTS-pt-br (base: https://github.com/SWivid/F5-TTS) | ✅ fine-tune comunitário | ✅ | ❌ CC-BY-NC (não comercial) | Boa qualidade, mas é "teste preliminar" e a licença bloqueia vídeo que vende produto |
| 5 | **Voxtral TTS** (Mistral) | https://mistral.ai/news/voxtral-tts | ✅ | ✅ com ~3 s | ❌ pesos CC-BY-NC; comercial só pela API (US$ 0,016 por 1 mil caracteres) | A API sai barata: um Reel custa centavos. Bom plano B pago |
| 6 | **XTTS-v2** (Coqui, fork mantido) | https://github.com/idiap/coqui-ai-TTS | ✅ | ✅ com ~6 s | ❌ CPML não comercial, e a empresa fechou | Era o padrão, hoje está superado e com licença problemática |
| 7 | **Kokoro** | https://github.com/hexgrad/kokoro | ⚠️ 3 vozes pt-BR fracas | ❌ | ✅ Apache | Muito rápido na CPU, mas o pt-BR soa estrangeiro. Não troca o edge-tts |
| — | **Applio / RVC** (conversão de voz) | https://github.com/IAHispano/Applio | qualquer | ✅ treina com 10–30 min da sua voz | ✅ MIT | Outro caminho: gera com edge-tts e **converte** o timbre para a sua voz. Ótimo para manter o ritmo atual |

## Atende ao seu propósito?
**Sim.** Para Reels com a **sua voz** e uso comercial (você vende na X-GO), as opções que servem são **Qwen3-TTS**, **Chatterbox** e **Applio/RVC**, todas com licença livre. F5, Voxtral (pesos locais) e XTTS são só para uso pessoal.

Custo e esforço:
- **Grátis e local (lento):** Qwen3-TTS 0.6B ou Chatterbox na CPU. Calcule alguns minutos por vídeo de 60 s; ainda não medimos.
- **Grátis e rápido:** um notebook Colab com GPU T4. Você sobe o roteiro e baixa o `narracao.wav`.
- **Pago e sem dor:** API do Voxtral ou o próprio ElevenLabs. Ambos são pagos, e o ElevenLabs é o mais caro.

## Próximo passo sugerido
1. Grave **30–60 s da sua voz**, lendo qualquer texto, num lugar silencioso. Salve como `00-SISTEMA/assets/voz/referencia.wav`.
2. Eu instalo o **Qwen3-TTS (0.6B Base)** e o **Chatterbox pt-BR** e gero a mesma cena com os dois.
3. Você ouve e escolhe. O vencedor vira a opção `"voz": {"motor": "clone"}` no `produzir.py voz`.

**Ética e segurança:** clone só a sua voz, ou a de quem autorizou por escrito. O Chatterbox marca o áudio com marca d'água inaudível.

Fontes: [Chatterbox](https://huggingface.co/ResembleAI/chatterbox) · [Chatterbox Multilingual](https://www.resemble.ai/learn/models/chatterbox-multilingual) · [Qwen3-TTS (licença)](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice/blob/main/README.md) · [Qwen3-TTS anúncio](https://gigazine.net/gsc_news/en/20260123-qwen3-tts-family-opensource) · [F5-TTS-pt-br](https://huggingface.co/firstpixel/F5-TTS-pt-br) · [Voxtral TTS](https://mistral.ai/en/news/voxtral-tts) · [Voxtral licença](https://the-decoder.com/mistrals-first-open-weight-tts-model-voxtral-clones-voices-from-three-seconds-of-audio-across-nine-languages/) · [XTTS licença](https://localaimaster.com/blog/xtts-coqui-commercial-license) · [coqui fork](https://github.com/coqui-ai/TTS/discussions/4145) · [Kokoro pt-BR](https://soniqo.audio/guides/kokoro) · [Voicebox](https://github.com/jamiepine/voicebox) · [alternativas ElevenLabs](https://findskill.ai/blog/best-open-source-tts-2026/)

## Voz local (teste de 14/11/2026, pasta `FERRAMENTAS/VozLocal/`)
- **Qwen3-TTS 1.7B VoiceDesign** (voz criada por descrição): ~5 min de CPU para 20 s de áudio; o usuário não gostou das vozes. Modelo baixado (4,3 GB) fica em `VozLocal/modelos/`, mas não é usado.
- **Pocket TTS (Kyutai)**: 20 s de áudio em 11 s na CPU (~25× mais rápido que o Qwen3). A clonagem exige aceitar os termos em huggingface.co/kyutai/pocket-tts e fazer login (`hf auth login`). A voz pronta "rafael" (pt) teve 88% de acerto no Whisper; sotaque a confirmar.
- `gerar.py` (Qwen3) e `limpar.py` (corta pausas a 0,12 s, filtro de voz, −14 LUFS, Whisper confere a fala).
- **Próximo:** clonar a voz do próprio usuário. Roteiro de gravação: `assets/voz/minha/GRAVAR.md`.
- **Voz do usuário (14/11):** gravação de 67 s pelo WhatsApp → `assets/voz/minha/` (`original.ogg`).
  `FERRAMENTAS/VozLocal/tratar.py --ia` = IA **MossFormer2_SE_48K** (ClearerVoice-Studio, Apache 2.0, CPU, 81 s por 67 s) para tirar ruído, eco e chiado de compressão; depois adeclip, EQ de locução, de-esser, compressor, pausas a 0,12 s e −14 LUFS. Saída `minha_voz_tratada.wav` (59,6 s) e `referencia.wav` (14,6 s, bloco 1) + `referencia.txt`.
  Descartados: NVIDIA RE-USE (licença não comercial, precisa de GPU CUDA), Pocket TTS (o usuário achou travado e sem fluidez).
  Clone: `clonar.py` (Qwen3-TTS 0.6B Base, lote + Whisper refaz a frase com nota < 97%).
