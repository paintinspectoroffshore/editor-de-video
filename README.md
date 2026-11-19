# Editor de Vídeo — fábrica de Reels, carrosséis e vídeos com Claude Code

Sistema completo para produzir **Reels 9:16, carrosséis 4:5 e vídeos 16:9** em motion graphics (e talking head com painel de dados), comandado por conversa no [Claude Code](https://claude.com/claude-code). Você fala o que quer, o Claude roteiriza, gera voz, monta, renderiza e (opcionalmente) publica. Você só aprova **roteiro, prévia e final**.

O Claude lê `CLAUDE.md` (manual de operação), usa as skills de `.claude/skills/` e os agentes de `.claude/agents/`.

## Instalar (Windows, 5 minutos)
```powershell
git clone https://github.com/paintinspectoroffshore/editor-de-video.git "Editor-de-Video"
cd "Editor-de-Video"
.\instalar.ps1
```
O instalador põe Node, Python, FFmpeg e Git (via winget), instala as dependências (Remotion, puppeteer, faster-whisper, edge-tts, yt-dlp…), baixa o `cloudflared`, cria as pastas de trabalho e copia os modelos de chave para `00-SISTEMA/segredos/`.
Depois abra a pasta no Claude Code e diga: *"faz um vídeo sobre X"*.

## Chaves (opcionais — nenhuma vem no repositório)
Copie cada `*.exemplo` de `00-SISTEMA/segredos/` (o instalador já faz) e preencha:
| Arquivo | Para quê | Sem ele |
|---|---|---|
| `elevenlabs.key` | voz ElevenLabs (padrão) | cai para `edge-tts` grátis |
| `instagram.json` | publicar/pesquisar pela API oficial da Meta | publicação manual ou via Metricool |
| `telegram.key` | aprovação por botões no Telegram (piloto automático) | aprova no chat |

## O que tem aqui
- `CLAUDE.md` — manual de operação (regras, comandos, agentes). `PASSO-A-PASSO.md` — guia para o usuário.
- `.claude/skills/` — `reel`, `fabrica`, `catalogo`, `piloto`, `melhoria-continua`, `caveman`, `elevenlabs-tts`, `video-audio`, `remotion-best-practices`. `.claude/agents/` — 9 agentes por modelo (haiku/sonnet/opus).
- `00-SISTEMA/bin/` — todos os comandos (`produzir.py`, `eleven.py`, `rosto.py`, `insta.py`, `garimpar.py`, `catalogar.py`…). `templates/`, `assets/` (sfx, texturas, músicas livres, fontes, logos, amostras de voz), `captura/` (prints e gravações de sites).
- `FERRAMENTAS/Remotion/` — motor de render e todos os estilos (`src/editorial`, `traco`, `cronica`, `dossie`, `impacto`, `leonida`, `gtareal`, `trajeto`, `splitth`…).
- `REFERÊNCIAS/` — folha de estilo, roteiro, ganchos, trilha, automação e o **CATALOGO** com 79 referências: DNA (`DNA.md`), quadros e folhas de contato. Os vídeos de referência **não** sobem.
- `PROJETOS/`, `CARROSSEIS/`, `PESQUISA/` — um exemplo por vídeo: `roteiro.json`, `ROTEIRO.md` e quadros da prévia. A descrição de todos está em [`VIDEOS-DESCRICAO.md`](VIDEOS-DESCRICAO.md).
- `_memoria-claude/` — memória do Claude sobre o projeto (preferências e decisões). Para o Claude Code de outra máquina "lembrar", copie estes `.md` para `~/.claude/projects/<pasta-do-projeto-codificada>/memory/`.

## Fora do repositório (de propósito)
Vídeos (MP4 etc.), áudios gerados, `node_modules`, caches, binários (`cloudflared.exe`, FFmpeg), ambiente de voz local e **todas as chaves e tokens**. O `instalar.ps1` recria o que for técnico.

## Comandos principais
```
python 00-SISTEMA/bin/produzir.py novo <slug>        # nova pasta de vídeo
python 00-SISTEMA/bin/produzir.py montar <slug>      # ROTEIRO.md -> roteiro.json
python 00-SISTEMA/bin/produzir.py rapido <slug>      # voz + legendas + prévia
python 00-SISTEMA/bin/produzir.py entrega <slug>     # render + loudness + checagem
python 00-SISTEMA/bin/rosto.py preparar <slug> <video>   # talking head: corta pausas, limpa áudio (estilo SplitTH)
```
Detalhes de cada etapa: skill `reel` e `CLAUDE.md`.
