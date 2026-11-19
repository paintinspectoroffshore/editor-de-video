# Melhorias do projeto (pesquisa de 11/11/2026)

> **Conferência do orquestrador (11/11/2026):**
> - ✅ **Licença confirmada na central de ajuda oficial da ElevenLabs:** o plano grátis **não permite uso comercial** e exige "elevenlabs.io" no título do conteúdo publicado ([help center](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)). A decisão (assinar ou trocar a voz) é do usuário.
> - ♻️ **Item "with-timestamps + cache": já existe.** O `eleven.py` já pega o tempo de cada palavra da ElevenLabs (Whisper dispensado) e guarda cache por texto em `cache/eleven`. As "2 gerações" do produtor foram 1 cobrada + ajuste local de `tempo`.
> - ♻️ **Item "benchmark de concurrency": já feito** (AUTOMACAO.md §8: GPU angle −23%, 7 núcleos). `--hardware-acceleration` no Remotion só codifica com hardware no macOS, então não vale aqui.


Regra da casa: cada item tem 2+ fontes. Itens marcados **(verificar)** têm só fontes de terceiros ou dados conflitantes; testar antes de adotar. Câmbio usado: US$ 1 ≈ R$ 5,8.

## Achado mais importante
**O plano GRÁTIS da ElevenLabs não dá licença comercial** ([happyrobot](https://www.happyrobot.ai/hub/elevenlabs-pricing), [bigvu](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/), [dev.to](https://dev.to/techsifted/elevenlabs-pricing-2026-plans-credits-and-api-costs-explained-1549)). A X-GO Store é uma loja, então o Reel é conteúdo comercial. Confirme nos termos oficiais em elevenlabs.io. Se for verdade, o plano Starter (~US$ 6 ≈ R$ 35/mês, 30 mil créditos, o triplo de hoje) deixa de ser luxo e vira obrigação, ou a voz passa a ser edge-tts/Azure.

## Tabela priorizada

| # | Área | Melhoria | Ganho esperado | Esforço | R$/mês | Fontes | Veredito |
|---|---|---|---|---|---|---|---|
| 1 | Voz/legal | Assinar ElevenLabs Starter (licença comercial + 30k créditos = ~12–20 Reels) | Legal + 3x créditos | baixo | ~35 | [happyrobot](https://www.happyrobot.ai/hub/elevenlabs-pricing), [bigvu](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/) | FAZER JÁ (após conferir termos) |
| 2 | Voz/tempo | Pedir a voz com `/with-timestamps` (tempo por caractere vem junto) e **pular o faster-whisper** quando a voz for ElevenLabs. Menos CPU, tempo certo | -1 a 2 min por Reel, legenda sincronizada exata | médio | 0 | [ElevenLabs blog](https://elevenlabs.io/blog/new-text-to-speech-endpoints-with-timestamps), [docs](https://elevenlabs.io/docs/api-reference/streaming-with-timestamps) | FAZER JÁ |
| 3 | Áudio | Trilha de fundo + ducking automático (pasta de música está vazia). Baixar 10–15 faixas do Pixabay Music e rodar sidechaincompress | Maior salto de "cara de profissional" | baixo | 0 | [Pixabay FAQ](https://pixabay.com/service/faq/), [toolradar](https://toolradar.com/guides/best-free-music-and-sound-effects-for-commercial-use), [ffmpeg-cookbook](https://ffmpeg-cookbook.pages.dev/en/articles/audio-ducking/), [ffmpeg-user](https://ffmpeg.org/pipermail/ffmpeg-user/2018-August/040933.html) | FAZER JÁ |
| 4 | Render | Rodar `npx remotion benchmark` para achar o `--concurrency` ideal (padrão = metade das threads; 8 núcleos pode ir a 6–8) e testar `--hardware-acceleration if-possible` (NVENC; GTX 750 pode não suportar, aí cai em software sem erro). Crf não vale com NVENC, usar bitrate | -10 a -30% no render (medir) | baixo | 0 | [Remotion performance](https://www.remotion.dev/docs/performance), [hardware acceleration](https://www.remotion.dev/docs/hardware-acceleration), [gpu](https://www.remotion.dev/docs/gpu) | FAZER JÁ |
| 5 | Economia (tokens) | CLAUDE.md curto (ponteiros, não tabelas), skills só sob demanda (já fazemos), subagente barato (haiku/zelador) para tarefas mecânicas, `/context` e `/usage` para ver o que pesa | -20 a -60% de tokens (anedótico) | baixo | 0 | [KDnuggets](https://kdnuggets.com/7-practical-ways-to-reduce-claude-code-token-usage), [Composio](https://composio.dev/blog/ways-to-cut-token-consumption-in-claude-code) | FAZER JÁ (já fazemos 70%; medir com /usage) |
| 6 | Voz (plano B grátis) | Azure AI Speech F0: 500 mil caracteres/mês grátis em voz Neural (≈ 60+ Reels de 90 s) com pt-BR (Francisca, Antonio, Thalita) e eventos de palavra. Pelo Q&A da Microsoft, camada grátis não proíbe uso comercial **(verificar)**. Exige conta Azure (cartão de verificação) | Voz comercial grátis e volume ilimitado na prática | médio | 0 | [Microsoft preços](https://azure.microsoft.com/en-in/pricing/details/cognitive-services/speech-services), [limites](https://learn.microsoft.com/azure/ai-services/speech-service/speech-services-quotas-and-limits) | TESTAR (usuário cria a conta; eu não crio contas) |
| 7 | Voz (plano B grátis) | edge-tts com `--boundary WordBoundary` já dá tempo por palavra; padrão da lib mudou para SentenceBoundary **(verificar)**. Mesmas vozes neurais da Microsoft, sem chave | Fallback sem custo e sem Whisper | baixo | 0 | [rany2/edge-tts](https://github.com/rany2/edge-tts), [PyPI](https://pypi.org/project/edge-tts/6.0.6/) | TESTAR (zona cinza de termos; usar só em rascunho) |
| 8 | Voz local | Kokoro-82M (pt-BR: `pf_dora`, `pm_alex`, `pm_santa`), 82M parâmetros, roda em CPU, licença Apache. Qualidade menor que ElevenLabs, serve de rascunho/prévia sem gastar crédito | Prévia grátis ilimitada (cortar a 2ª geração de voz do produtor) | médio | 0 | [VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blame/main/VOICES.md), [tutorial pt-BR](https://thomazrb.github.io/posts/python-tts-kokoro) | TESTAR |
| 9 | Voz local | Piper `pt_BR-faber-medium` (MIT, dados CC0, 63 MB, CPU). Mais robótica que Kokoro | Rascunho offline | baixo | 0 | [model card](https://huggingface.co/rhasspy/piper-voices/blob/refs%2Fpr%2F11/pt/pt_BR/faber/medium/MODEL_CARD), [tree](https://huggingface.co/rhasspy/piper-voices/tree/c943ef2ef718de2600086f77cb0b3b5353110efd/pt/pt_BR/faber/medium) | DEPOIS |
| 10 | Voz | Gemini 2.5 Flash TTS: US$ 0,50/M tokens de entrada, US$ 10/M de saída; página da API diz grátis, página do Cloud diz indisponível (conflito) | Voz expressiva, barata | médio | ~0–3 | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [Cloud TTS](https://cloud.google.com/text-to-speech/pricing/?hl=pt-br) | TESTAR (conferir se tem tempo por palavra; provavelmente não, precisa Whisper) |
| 11 | Legenda | Trocar o fluxo de "páginas" caseiro por `@remotion/captions` (`createTikTokStyleCaptions`, `combineTokensWithinMilliseconds`) e olhar o `template-tiktok` oficial para destaque de palavra | Menos código, padrão do ecossistema | médio | 0 | [docs](https://www.remotion.dev/docs/captions/transcribing), [template-tiktok](https://github.com/remotion-dev/template-tiktok) | TESTAR (só se o nosso já não faz) |
| 12 | Legenda/tempo | WhisperX (alinhamento wav2vec2, ±30 ms vs ±100–500 ms do faster-whisper puro). Só para voz que NÃO traga tempo (talking head do usuário). Mais lento em CPU; palavras com número/pontuação podem ficar sem tempo | Sincronia melhor em vídeo falado | médio | 0 | [dev.to](https://dev.to/jovan_chan_9500711396d4e6/faster-whisper-vs-whispercpp-vs-whisperx-2026-o29), [Modal](https://modal.com/blog/choosing-whisper-variants) | DEPOIS |
| 13 | Fonte | Adicionar **Space Grotesk** (títulos de dado) e **Bricolage Grotesque** (expressiva); manter Archivo Black e Inter. Todas OFL (grátis, comercial). Testar legibilidade a 1080×1920 no celular | Mais variedade sem estilo novo | baixo | 0 | [blitzcut](https://blitzcutai.com/blog/best-fonts-for-video-editing-2026), [blendnow](https://www.blendnow.com/blog/best-fonts-for-advertising-in-2026) | TESTAR |
| 14 | SFX | Ampliar de 5 para ~25 sons (whoosh curto/longo, riser, hit, glitch, digitação, notificação, swipe). Fontes: Pixabay Sound Effects, Mixkit SFX (mesma licença do vídeo que já usamos) | Ritmo e "polimento" | baixo | 0 | [Pixabay FAQ](https://pixabay.com/service/faq/), [toolradar](https://toolradar.com/guides/best-free-music-and-sound-effects-for-commercial-use) | FAZER JÁ (junto com #3) |
| 15 | Lote | Gerar roteiros de 3–4 Reels de uma vez (1 sessão de roteirista), voz em um só lote, render noturno agendado (`produzir.py entrega` em fila) | Menos recarga de contexto, render sem esperar | médio | 0 | [Composio](https://composio.dev/blog/ways-to-cut-token-consumption-in-claude-code), [Remotion perf](https://www.remotion.dev/docs/performance) | TESTAR |
| 16 | Cache de voz | Guardar o mp3 por hash do texto em `00-SISTEMA/cache/voz/`; só gera voz de novo se o texto mudou. Ataca direto o "produtor gasta 2 gerações" | -1 geração por Reel (≈ -30–50% de crédito) | baixo | 0 | (prática interna; docs do endpoint de timestamps acima) | FAZER JÁ |
| 17 | Skills | `remotion-dev/skills` (já instalada). Referência extra: regras de captions/3D/transições do `everything-claude-code` e `davila7/claude-code-templates`; ler, não instalar (28k estrelas em diretório de terceiros, não verificado no GitHub) | Ideias de componentes | baixo | 0 | [skills.sh davila7](https://skills.sh/davila7/claude-code-templates/remotion), [openskillindex ECC](https://openskillindex.com/skills/affaan-m-everything-claude-code-remotion-video-creation) | DEPOIS |
| 18 | Render | Remotion Lambda/Cloud Run: não suportam aceleração por hardware e cobram uso; nosso Reel (2,5 min/90 s) já é aceitável | Quase nenhum | alto | pago | [Remotion hardware acceleration](https://www.remotion.dev/docs/hardware-acceleration), [Remotion performance](https://www.remotion.dev/docs/performance) | NÃO |

## Top 5 para fazer já (passo exato)

### 1. Conferir licença e assinar ElevenLabs Starter (ou trocar de voz)
1. Abrir elevenlabs.io, página de preços e termos de uso (Terms of Service, seção de "commercial use"). Confirmar se o plano grátis permite uso comercial.
2. Se não permite: assinar Starter (~US$ 6/mês) na conta; a chave em `00-SISTEMA/segredos/` continua a mesma. Conferir com `python 00-SISTEMA/bin/eleven.py saldo` (deve mostrar ~30.000).
3. Se o usuário não quiser pagar: usar Azure F0 (#6) como voz oficial e deixar ElevenLabs para testes.
4. Registrar a decisão em `REFERÊNCIAS/AUTOMACAO.md` §2.

### 2. Tempo por palavra direto da voz (sem Whisper) + cache por hash (#2 e #16)
- Arquivo: `00-SISTEMA/bin/eleven.py` (geração) e a etapa de legendas de `produzir.py rapido`.
- Trocar a chamada `POST /v1/text-to-speech/{voice_id}` por `POST /v1/text-to-speech/{voice_id}/with-timestamps` (mesmo corpo, `model_id` igual). A resposta traz áudio em base64 e o campo `alignment` / `normalized_alignment` (caracteres + início/fim). Montar palavras agrupando caracteres entre espaços e gravar no mesmo formato que o faster-whisper já gera hoje, para o resto do pipeline não mudar.
- Cache: `chave = sha1(texto + voice_id + model_id + settings)`; salvar `00-SISTEMA/cache/voz/<chave>.mp3` e `.json`. Se existir, pular a API.
- Fallback: se não vier `alignment`, cair no faster-whisper atual.
- Verificar o nome exato dos campos na [doc oficial](https://elevenlabs.io/docs/api-reference/streaming-with-timestamps) antes de codar.

### 3. Trilha + ducking + SFX novos (#3 e #14)
1. Baixar à mão (o usuário, no navegador; eu não baixo sem permissão) 10–15 faixas de [Pixabay Music](https://pixabay.com/music/) filtrando "tech", "corporate", "ambient", 70–110 BPM, sem vocal. Salvar em `00-SISTEMA/assets/musica/<mood>_<nome>.mp3` e anotar licença e URL em `00-SISTEMA/assets/musica/LICENCAS.md`. A FAQ do Pixabay diz uso comercial sem atribuição, mas fontes de terceiros divergem; guardar print da página da faixa.
2. Mixagem no `finalizar` do `produzir.py` (voz em `voz.wav`, música em `musica.mp3`):
```
ffmpeg -i video.mp4 -i voz.wav -stream_loop -1 -i musica.mp3 -filter_complex \
"[2:a]volume=0.35[m];[1:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=400[duck];[v2][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map 0:v -map "[a]" -shortest -c:v copy -c:a aac -b:a 192k saida.mp4
```
   Valores iniciais vêm do [ffmpeg-cookbook](https://ffmpeg-cookbook.pages.dev/en/articles/audio-ducking/); ajustar `ratio` (4–8) e `release` (300–500 ms) de ouvido. Ordem: ducking, mix, depois loudnorm. Se a trilha ficar alta, baixar `volume` para 0.25.
3. Sugestão de teste A/B: Reel com e sem trilha, medir retenção no `insta.py desempenho`.
4. SFX: baixar ~20 sons curtos (Pixabay Sound Effects / Mixkit) para `00-SISTEMA/assets/sfx/`, nomeados por função (`whoosh_curto`, `riser`, `hit`, `glitch`...). Atualizar a lista que o estilo usa.

### 4. Afinar o render (#4)
1. `cd FERRAMENTAS/Remotion` e rodar `npx remotion benchmark` com concurrency 4, 6 e 8 sobre uma composição de 30 s. Anotar o menor tempo.
2. Testar `--hardware-acceleration if-possible` no render (NVENC). Se a GTX 750 não suportar, o Remotion volta para software; se suportar, comparar qualidade (usa bitrate, não crf) e tamanho no `_FINAL.jpg`.
3. Gravar o melhor valor no `motor.mjs` (opção `concurrency`) e registrar em `AUTOMACAO.md` §5. Cuidado: concurrency alto demais faz o Chrome estrangular ([docs](https://www.remotion.dev/docs/performance)).

### 5. Tokens: medir e enxugar (#5)
1. Rodar `/usage` e `/context` numa sessão típica de Reel para ver o que pesa (CLAUDE.md, skills, leituras).
2. CLAUDE.md: manter só o que o modelo não deduz do código; tabelas de comandos longas podem ir para `00-SISTEMA/bin/LEIA.md` (lido só quando preciso). Meta: cortar ~30% do tamanho.
3. Delegar o mecânico a subagentes baratos (`zelador`, `garimpeiro`, `produtor`) e deixar Opus só para `roteirista` e `designer` (já é o plano).
4. Reaproveitar contexto: um único `produtor` por lote de Reels em vez de um por vídeo.

## Descartado e por quê
- **Remotion Lambda / Cloud Run**: pago, sem aceleração por hardware; render local de 2,5 min já serve ([Remotion](https://www.remotion.dev/docs/hardware-acceleration)).
- **Uppbeat, YouTube Audio Library, Free Music Archive**: licença por faixa ou com atribuição; mais risco e trabalho que Pixabay. A pesquisa não achou termos oficiais do Uppbeat. (Não recomendado agora; rever se Pixabay não bastar.)
- **Skills "pagas" de publicação (Composio, Ayrshare etc.)**: já descartadas no AUTOMACAO §3; a API oficial é grátis.
- **XTTS/F5-TTS em CPU**: não pesquisado a fundo, mas é pesado para 16 GB e sem GPU útil; Kokoro/Piper cobrem rascunho local. Reavaliar se surgir demanda de clonagem.
- **WhisperX como padrão**: mais lento em CPU e só necessário para talking head; o tempo da própria voz sintética é exato.
- **Pacotes grandes de skills de terceiros (davila7, ECC)**: inflam o contexto; ler como inspiração, não instalar.

## Pendências de verificação (para o próximo passo)
- Termos comerciais exatos: ElevenLabs grátis, Azure F0, edge-tts, Gemini TTS. Fontes achadas são blogs/Q&A.
- Campos exatos do JSON de `with-timestamps` (usar a doc oficial na hora).
- Se a GTX 750 aceita NVENC no Remotion (testar).
- Tendências de motion 2026 (3D/2.5D, transições): a pesquisa não achou fonte confiável; o garimpo de Reels virais (AUTOMACAO §7) é melhor fonte que listas de blog.

## Candidatos externos — a validar (pesquisa de 16/11/2026)
Detalhes, fontes e atividade de cada um: `REFERÊNCIAS/PESQUISA-SKILLS-2026-11-16.md`. Nada foi instalado de terceiros. Status atualizado em 16/11/2026 após implementação.

| # | Frente | Candidato | Próximo passo | Esforço | Veredito |
|---|---|---|---|---|---|
| E1 | Voz/entrevista | ElevenLabs **Text to Dialogue** `with-timestamps` (2 vozes num áudio, `eleven_v4`) | teste curto de 3 falas; conferir `voice_segments` na legenda | médio | ✅ FEITO 16/11: `eleven.dialogo()` + CLI `dialogo`; teste ok (2 vozes, tempo por palavra). Falta ligar ao produzir.py (voz por cena já cobre) |
| E2 | Voz/ritmo | **Audio tags** do v4 | campo `tag` por cena no produzir.py; tag fora da legenda | baixo | ✅ FEITO 16/11 (não lida em voz alta; falta ouvir se a emoção muda de fato) |
| E3 | Roteiro | Regras do **vyralcontent/content-skills** (retention.md, viral-hooks): 3 modos de falha, curva de tensão, gancho em 3 camadas | resumir em PT no `roteirista.md` (não instalar: tem propaganda embutida) | baixo | ✅ FEITO 16/11 (seção Storytelling no roteirista.md) |
| E4 | Storytelling | **"Mas/Então"** + loop aberto | regra + checagem (mín. 2 viradas) no roteirista | baixo | ✅ FEITO 16/11 |
| E5 | Mascote | **Boca do Lobo falando**: v1 pelo tempo por palavra (sem instalar); v2 com **Rhubarb Lip Sync** (6 bocas, modo fonético) | designer faz a v1; Rhubarb só com aprovação para baixar | médio | ✅ v1 FEITO 16/11 (boca pela fala, `calado` desliga; tsc ok, falta ver num render). Rhubarb NÃO baixado: só se a v1 não bastar |
| E6 | Mascote | `@remotion/rive` (oficial) | só se E5 não bastar | alto | ⏸ não feito (só se E5 não bastar) |
| E7 | Motion | **remotion-bits** (AnimatedText, transições) e **digitalsamba video-toolkit** (`video-design`, `synthetic-ui-demo`) | designer lê como referência | baixo | 📚 anotado, sem uso ainda |
