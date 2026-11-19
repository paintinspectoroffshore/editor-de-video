# Automação de conteúdo do @well.free: referência

Atualizado em 11/11/2026. **Prioridades:** qualidade > velocidade > economia de tokens.
Regra de pesquisa (pedido do usuário): nunca confiar no primeiro resultado. Cada fato abaixo foi cruzado em 2 ou mais fontes, e só entra no sistema o que a documentação oficial e a comunidade confirmam.

## 1. Arquitetura (o que roda sozinho)

```
[Agendador do Claude, 1×/dia]  skill `piloto`
   pesquisa (insta.py pesquisa) → pauta → roteiro (porta ≥90) → produção (produzir.py) → aprovar.py enviar
                                                                                         │ Telegram: ✅ ✏️ ❌
[Agendador do Windows, a cada 10 min]  aprovar.py vigiar  (Python puro, 0 tokens) ◄──────┘
   ✅ → insta.py reel/carrossel (API oficial, Trial Reel)  ·  ✏️ → guarda o pedido p/ a próxima rodada  ·  ❌ → descarta
```
- **Claude só faz a parte criativa:** pauta, roteiro e checagem visual. Pesquisa, render, envio e publicação são scripts. É isso que economiza tokens.
- Esperar a sua aprovação não custa nada, porque quem espera é o Python, não o Claude.

| Arquivo | Função |
|---|---|
| `.claude/skills/piloto/SKILL.md` | roteiro de cada rodada automática |
| `00-SISTEMA/bin/insta.py` | API oficial: conferir, descobrir, token-longo, reel, carrossel, pesquisa, desempenho |
| `00-SISTEMA/bin/aprovar.py` | Telegram: configurar, enviar, vigiar (publica ao aprovar), status, avisar |
| `00-SISTEMA/bin/produzir.py carrossel-novo/carrossel <slug>` | `CARROSSEIS/<data>_<slug>/` (pasta isolada): `carrossel.json` → `slides/` JPEG 1080×1350 + `_MOSAICO.jpg` |
| `FERRAMENTAS/Remotion/src/carrossel/Carrossel.tsx` | modelo de carrossel (temas `editorial` e `impacto`; slides capa, texto, lista, dado, imagem, cta) |
| `00-SISTEMA/nicho.json` | tema, público, concorrentes, hashtags, frequência, publicar como teste |
| `PROJETOS/<slug>/piloto.json` | estado: aguardando, aprovado, publicado, ajustar, descartado |
| `PROJETOS/_pesquisa/` | ranking diário (`DD-MM-AAAA.md`) e `PAUTAS.md` |

## 2. Fatos validados (fonte primária + confirmação)

| Fato | Status | Fontes |
|---|---|---|
| A API oficial publica **Trial Reels**: `trial_params={"graduation_strategy":"MANUAL"\|"SS_PERFORMANCE"}`, com `media_type=REELS` | ✅ doc Meta + changelog de dez/2025 + PRs de produção | [Meta Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [postproxy](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/), [PR Crove](https://github.com/DOS/Crove/pull/1036) |
| Vídeo sobe **sem hospedagem**, por upload resumable em `rupload.facebook.com`, exige *Facebook Login* (não Instagram Login) | ✅ doc Meta | Meta Content Publishing e referência IG User Media |
| Container de vídeo: consultar `status_code` (IN_PROGRESS, FINISHED, ERROR, EXPIRED) antes de `media_publish` | ✅ doc Meta | idem |
| Imagem (carrossel) exige **URL pública** que a Meta baixa; links do Google Drive, Dropbox, Imgur e ImgBB falham | ✅ doc Meta + comunidades n8n e Make | [n8n](https://community.n8n.io/t/facebook-graph-api-integration-with-chatgtp-image-1-not-working-through-google-drive-dropbox-airtable-imgbb-imgur/169950), [Make](https://community.make.com/t/instagram-no-longer-accepts-google-drive-links-as-valid-images-for-carousels-giving-the-error-only-photo-or-video-can-be-accepted-as-media-type-9004-oauthexception/79591) |
| Truque "foto não publicada da página do Facebook como image_url" | ❌ **não validado**, não usar | nenhuma fonte confiável |
| Limite de publicação: 100 posts por API em 24 h (carrossel conta 1); 400 containers em 24 h | ✅ doc Meta. Um trecho cita 50; na dúvida, `content_publishing_limit` | Meta |
| Carrossel: aceita até 10 itens com segurança (a doc já fala em 20), JPEG, 4:5 a 1.91:1, todos cortados pela proporção do 1º | ✅ doc Meta + Ayrshare | [Ayrshare](https://www.ayrshare.com/solutions/instagram-api-error-100-carousel-validation-failed-how-to-fix-it/) |
| **Máximo de 5 hashtags** por post ou Reel (Mosseri, dez/2025) | ✅ vários veículos | [Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/), [Business Today](https://www.businesstoday.in/technology/news/story/no-more-hashtag-stuffing-instagram-limits-hashtag-usage-to-just-5-per-reel-and-post-507444-2025-12-19) |
| Sinais que mais pesam: **tempo assistido, curtidas por alcance, envios por alcance**; envios pesam mais para quem não segue | ✅ Mosseri jan/2025, repetido por vários | [Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-2025/738034/), [Buffer](https://buffer.com/resources//instagram-algorithms/) |
| Carrossel com 8 a 10 slides engaja um pouco mais que 2 a 4 (2,07% vs 1,90%) | 🟡 1 estudo grande (22 mi de posts), mas de 2020 | [Socialinsider](https://www.socialinsider.io/data-geeks/Instagram-Carousel-Study.pdf) |
| Pesquisa de hashtag: 30 hashtags únicas por 7 dias; `top_media` / `recent_media` | ✅ doc Meta | [Hashtag Search](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/hashtag-search) |
| `business_discovery` lê posts e curtidas/comentários de contas Business/Creator (Facebook Login) | ✅ doc Meta | Meta Business Discovery |
| Envios (shares) de **concorrentes** não aparecem na API, só os dos seus posts (insights) | ✅ doc Meta (campos públicos) | idem |

**Implicações aplicadas:**
- Roteiro com gancho em até 3 s e motivo para ficar até o fim.
- CTA "manda pra quem…" para gerar envios.
- Legenda com no máximo 5 hashtags. O `insta.py` bloqueia se passar.
- Carrossel de 7 a 10 slides.

## 3. Skills e ferramentas avaliadas

| Item | Decisão | Por quê |
|---|---|---|
| `remotion-dev/skills` → **remotion-best-practices** | ✅ instalada (`.claude/skills/`) | oficial do Remotion; instalada via `npx skills add remotion-dev/skills` |
| `elevenlabs/skills` → text-to-speech, instalada como **elevenlabs-tts** | ✅ instalada em 14/11/2026 (`.claude/skills/elevenlabs-tts/`, MIT) | oficial da ElevenLabs. Trouxe o `eleven_v4` + `language_code: "pt"`. Teste com Whisper: o multilingual_v2 errava GTA ("GT A5"), PS5 ("P, S5"), "Comenta aí" ("a GAI") e "@well.free" ("UL .free"); o v4 + pt acertou todos. Implementado em `eleven.py` (`idioma`) |
| `AgriciDaniel/claude-video` → video-audio, instalada como **video-audio** | ✅ instalada em 14/11/2026 (`.claude/skills/video-audio/`, MIT) | ensina o corte de silêncio (auto-editor/silencedetect), loudnorm e ducking. Virou o campo `voz.pausas` no `produzir.py`: o silêncio é medido no áudio, porque o v4 estica o fim da palavra por cima da pausa, e o tempo de cada palavra é remapeado. Resultado no GTA 6: 117 s → 98 s, legenda com erro médio de 0,11 s |
| charlie947/social-media-skills (reels-scripting, hook-generator, niche-research, post-scorer) | 📚 estudadas, não instaladas | dependem de Apify e Gemini pagos e são em inglês britânico. Aproveitei as regras: gancho, 2 pontos, porta de nota, palavra única no CTA, nunca inventar métrica |
| agricidaniel/claude-repurpose (repurpose-instagram) | 📚 estudada | estrutura de carrossel slide a slide e CTA triplo |
| Skills "instagram-automation" (Composio/Rube) | ❌ | dependem de um intermediário pago; a API oficial é grátis e direta |
| Upload-Post, Zernio, Ayrshare | ❌ (por ora) | APIs pagas que fazem o mesmo que a oficial |
| Metricool | 🟢 plano A (17/11) | **MCP oficial** `https://ai.metricool.com/mcp` (OAuth) funciona em qualquer plano, inclusive grátis (20 posts/mês); agenda/publica posts, Reels e Stories do Instagram e lê métricas. Configurado em `.mcp.json`; falta o usuário autenticar (`/mcp` → metricool). Trial Reel pelo MCP: não documentado, segue pelo navegador (testado 11/11). A API HTTP é que exige plano Advanced. Fontes: [FAQ do MCP](https://help.metricool.com/faqs-about-the-metricool-mcp-1i3w0), [Conectar o MCP](https://help.metricool.com/how-to-connect-metricools-mcp-eqp9h), [Metricool no Claude Code](https://metricool.com/metricool-mcp-claude/) |
| Vídeo de referência ([Thiago Skiante](https://www.youtube.com/watch?v=8HOVxyuJhI0)) | 📚 | mostra skill de carrossel + publicação pela API; a skill dele é um arquivo do Google Drive, que não baixei. O sistema daqui faz o mesmo, com a nossa identidade |

**17/11/2026: API oficial validada** — `segredos/instagram.json` criado a partir do token do usuário (token de página @well.free, não expira; permissões incluem `instagram_content_publish` e `instagram_manage_insights`). `insta.py conferir` e `desempenho` OK. O token de System User (`token_sistema`) não tem página atribuída: para usá-lo, atribua a página Well Games ao System User no Business Manager.

## 4. Configuração única (o usuário faz uma vez, ~15 min)

1. **Meta, para publicar e pesquisar:**
   1. Em developers.facebook.com, crie um app → tipo "Empresa" → adicione o produto "Instagram" (API com login do Facebook).
   2. No Explorador da Graph API, gere um token com estas permissões: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `business_management`.
   3. Crie `00-SISTEMA/segredos/instagram.json` com `{"token":"...","app_id":"...","app_secret":"...","usuario":"well.free"}`.
   4. Rode `insta.py token-longo` (gera o token de página, que não expira), depois `insta.py conferir`.
   5. O @well.free já é conta profissional e está ligado à página "Well Games", conforme visto no Business Suite.
2. **Telegram, para aprovar:**
   1. No @BotFather, use `/newbot` e cole o token em `00-SISTEMA/segredos/telegram.key`.
   2. Mande `/start` ao bot.
   3. Rode `aprovar.py configurar`.
3. **Imagens do carrossel:** `00-SISTEMA/ferramentas/cloudflared.exe`, binário oficial da Cloudflare. Ele cria um túnel público temporário e fecha depois de postar. O download precisa da autorização do usuário.
4. **Agendamentos:**
   - Agendador do Windows: `python aprovar.py vigiar` a cada 10 min.
   - Tarefa agendada do Claude: 1×/dia com o prompt "rode a skill piloto".

## 5. Velocidade medida (GTX 750, 8 núcleos)

| Etapa | Tempo |
|---|---|
| Carrossel de 9 slides | 16 s |
| Reel: voz + legendas + prévia | ~50 s |
| Reel: render final de 60 a 85 s | ~5,5 min |
| Upload pela API | ~1 min |

## 6. Erros conhecidos e soluções

- **Chrome travou ao digitar emoji no editor do Metricool:** inserir o texto com `document.execCommand('insertText')`.
- **Animações de exercício do openGym (GymVisual):** licença própria, **não usar**. Use telas de estatística ou de plano.
- **Instagram web e Meta Business Suite:** não têm Trial Reel. Use a API (`--teste`) ou o Metricool.
- **ffmpeg `drawtext` com `fontfile=E:/...`:** os dois-pontos do drive quebram o filtro. Copie a fonte para a pasta de trabalho como `f.ttf` e use o caminho relativo. Para arquivos temporários, use o scratchpad, nunca `/tmp`.
- **faster-whisper `metadata_errors` (versão do `av`):** leia o áudio com ffmpeg → numpy (`legendar.carregar_audio`), como o `produzir.py ouvir` já faz.
- **`'charmap' codec can't encode` ao imprimir ⚠️:** os scripts já reconfiguram a saída para UTF-8. Em script novo, copie o bloco `sys.stdout.reconfigure(encoding="utf-8")`.
- **Áudio e voz:** histórico completo das falhas e correções em `00-SISTEMA/VOZES.md`; auditorias em `REFERÊNCIAS/MELHORIA-CONTINUA.md`.

## 7. Garimpo de Reels virais (testado em 11/11/2026)

Use para achar o que viraliza num tema, baixar os melhores e extrair o roteiro. Custa 0 créditos.

1. **Coletar** (Claude in Chrome, Instagram logado): abra `instagram.com/explore/tags/<tag>/` e rode o bloco COLETAR de `00-SISTEMA/captura/garimpo.js`. São ~70 posts por hashtag, e 5 hashtags dão ~300 posts.
2. **Medir:** rode o bloco MEDIR com os códigos. Ele lê curtidas, comentários, perfil, data e tipo (Reel ou não) na página pública de cada post, 4 em paralelo, ~60 posts/min. Depois rode o bloco **TOP**: a saída do `javascript_tool` corta em ~2.500 caracteres, então peça o ranking em blocos de 10.
3. **Ranquear:** `garimpar.py ranquear coleta.json <pasta>` gera `RANKING.md`. Score = curtidas + 3×comentários.
4. **Baixar e transcrever:** `garimpar.py baixar <pasta> COD1 COD2 COD3` gera:
   - `NN-VIDEO.mp4`, via yt-dlp;
   - `NN-ROTEIRO.txt`, com a legenda do post e a fala com tempo, transcrita pelo faster-whisper local;
   - `NN-QUADROS.jpg`, um mosaico de 8 quadros para analisar o visual sem abrir o vídeo.
   - Leva ~30 s por vídeo.
   - **Ganchos (todo mês):** `garimpar.py ganchos <pasta> COD1 COD2 …` corta os 15 s iniciais (8 quadros + fala) em `GANCHOS_n.jpg` + `GANCHOS.json` e apaga os mp4; use para revalidar `REFERÊNCIAS/GANCHOS.md`.
5. **Depois:** corrija os nomes próprios que o Whisper erra (ex.: "Cloud" → Claude) e escreva "como é feito" e "por que viralizou".

**Limites validados:**
- **Envios de terceiros não são públicos** (nem na API nem na página). O ranking usa curtidas + comentários; views também não aparecem.
- O topo das hashtags mistura temas (política, jogos). Filtre pelo assunto antes de escolher.
- Bibliotecas do GitHub como instaloader exigem login por script e arriscam bloqueio da conta. Os scrapers do Apify são pagos (US$ 14–20/mês). **Não usar.**
- yt-dlp não baixa carrossel de fotos ("No video formats found").
- Nunca recrie deepfake de pessoa real, mesmo que a referência faça.

## 8. Agentes por modelo e velocidade (medido em 11/11/2026)

**Divisão:** a tabela fica no `CLAUDE.md`; cada agente em `.claude/agents/*.md` traz as regras de qualidade e o relatório caveman.
- Haiku faz o trabalho mecânico (coleta, limpeza).
- Sonnet faz a produção técnica e a publicação.
- Opus faz roteiro, design e orquestração.
- Os agentes só aparecem na sessão seguinte à criação do arquivo. Antes disso, use `general-purpose` com `model` igual ao do agente e mande ele ler o `.md`.

**Teste 1: publicar Trial Reel, agente `publicador` (Sonnet)**

| | Resultado |
|---|---|
| Tempo | 3 min 24 s (comprimir, abrir o Metricool, montar o post), ~28 ações |
| Tokens | ~80 mil, no Sonnet (~1/5 do preço do Opus); nada disso entrou no contexto da sessão principal |
| ⚠️ Bloqueio | o clique final "Publish now" é **negado ao subagente** pelo classificador de segurança ("Unrequested Commit in a Connected App"), mesmo com a autorização repassada |
| Solução | o subagente deixa o post pronto e a **sessão principal dá o clique final**, depois de o usuário autorizar no chat |
| Aviso do Metricool | Trial Reel pode falhar em contas com menos de 1.000 seguidores |

**Render (benchmark: 300 quadros, alternado e repetido):**

| Configuração | Tempo |
|---|---|
| GL padrão, 7 núcleos | 31,8 s (média) |
| **GL `angle` (GPU), 7 núcleos** | **24,6 s (média): −23%** ← agora é o padrão do `motor.mjs` |
| `angle`, 6 núcleos | 24,1 s (empate) |
| GL padrão, 8 núcleos | 35,4 s (pior: falta núcleo para o Chrome) |
| `swangle` | 119,7 s (4× mais lento, nunca usar) |

- Qualidade: entre 0,2% e 0,9% dos pixels mudam, só no antisserrilhado das bordas. Imperceptível.
- Para voltar ao modo antigo: `MOTOR_GL=` (vazio). Variáveis de teste: `MOTOR_CONC`, `MOTOR_FRAMES=600-899`.

**Para onde foram os 10 min 24 s do "Eu sou a sua voz", e o que mudou:**

| Etapa | Antes | Agora |
|---|---|---|
| Criar o estilo Dossiê | ~4 min | 0 (feito uma vez; reaproveitado) |
| Voz + legenda + prévia (`rapido`) | 65 s | igual (bundle já em cache: ~45 s) |
| Esperar a aprovação da prévia | ~1,5 min | **0**: o render final já roda em segundo plano enquanto o usuário avalia (render antecipado) |
| Render + finalizar | 179 s | ~140 s com a GPU, e normalmente já pronto ao aprovar |

**Regra do render antecipado:** mandou o `_MOSAICO.jpg`? Rode `entrega` em segundo plano no mesmo instante. O MP4 só é **enviado ou publicado** depois da aprovação. Se o usuário pedir ajuste, rode de novo, o que custa só CPU, sem tokens nem créditos.

**Teste 2: vídeo completo "O relógio do Bitcoin" (estilo novo Crônica, 89,6 s), sem aprovações intermediárias**

| Agente (modelo) | Tempo | Tokens | Entregou |
|---|---|---|---|
| roteirista (Opus) | 7,6 min | 125 mil | ROTEIRO.md com 13 cenas e 18 fontes, dados.json reais (2013–2026), recortes.json, legenda |
| designer (Opus) | 17,7 min | 216 mil | estilo Crônica: 16 blocos, Fraunces, doc completa (feito uma vez; reaproveitável) |
| produtor (Sonnet) | 21,5 min | 184 mil | 6 recortes reais, 3 stocks, voz (2 gerações), roteiro.json, prévia, render |
| **Total** | **48 min 14 s** (14:19 → 15:07) | ~525 mil | MP4 com CHECAGEM OK |

**Lições:**
- O produtor gastou 2 gerações de voz porque a 1ª deu 98 s. Mire a duração pelo número de palavras (~190 palavras/min com `tempo` 1.17) **antes** de gerar.
- O site da SEC bloqueia a captura automática.
- O `capturar.mjs` aceita `"carrega":"domcontentloaded"` para sites com anúncios pesados.
- Bug corrigido: cena do Crônica sem `capitulo` quebrava o render.
- O grão de filme do Crônica aumenta o arquivo: 71 MB para 90 s. Para postar, comprima (o publicador já faz).
