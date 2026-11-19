# Organização e limpeza: regra permanente

**Por que isso importa:** projeto limpo significa sistema rápido, backup leve, menos tokens gastos lendo coisa velha e zero confusão sobre qual arquivo vale. Lixo acumula sozinho (renders, prévias, cópias, downloads), então cada etapa **limpa o que gerou**. Duplicata é risco, porque alguém edita a cópia errada.

Marco: em 11/11/2026 o projeto caiu de **3.672 MB para 880 MB (−76%)** sem perder qualidade em nenhum vídeo, áudio, carrossel ou imagem final.

## As 7 regras
1. **Uma fonte da verdade por assunto.** Cada informação mora em um só arquivo. Os outros apontam para ele, sem copiar o texto.
   - Manual do sistema: `CLAUDE.md`.
   - DNA visual: `FOLHA-DE-ESTILO.md`.
   - Automação e fatos validados: `AUTOMACAO.md`.
   - Organização: este arquivo.
2. **Cada entrega numa pasta isolada:**
   - formato da data nas pastas: **DD-MM-AAAA_slug** (helper `bin/pastas.py`);
   - vídeo em `PROJETOS/DD-MM-AAAA_slug/`;
   - carrossel em `CARROSSEIS/DD-MM-AAAA_slug/`;
   - MP4 final em `VIDEOS PRONTOS/`.
   - Nada solto na raiz.
3. **Guarde a fonte, não o derivado.** Fica o que não dá para refazer: roteiro, narração (custa crédito), gravações e capturas, o MP4 ou os slides finais e os mosaicos. Sai o que dá para regerar com um comando: render bruto, frames soltos, cópias em `Remotion/public`, caches.
4. **Baixou, usou, apagou:**
   - **Stock:** o MP4 original sai depois de convertido. O projeto guarda `assets/stock/BAIXAR.txt` com os IDs.
   - **Referências:** depois de catalogadas, ficam só os frames, o DNA e os links (`CATALOGO/_LINKS-LOTES.md`).
5. **Limpeza automática embutida:**
   - `produzir.py entrega` termina com `limpar`, que tira render bruto, prévias por cena, `audio/_cenas`, props e cópias no Remotion.
   - `produzir.py carrossel` não deixa props nem cópias para trás.
   - `stock.py` apaga os MP4 temporários.
   - O motor (`motor.mjs`) não usa cache de webpack e só espelha a mídia do projeto atual.
6. **Segredos só em `00-SISTEMA/segredos/`.** Nunca chave solta na raiz ou em `.txt` de anotação. Já havia uma cópia exposta da chave da ElevenLabs, que foi removida.
7. **Ferramenta parada não ocupa espaço.** Instale quando for usar e remova se não fizer parte do fluxo. Anote aqui como reinstalar.

## Estrutura (o que é cada pasta)
| Pasta | Conteúdo | Pode crescer? |
|---|---|---|
| `00-SISTEMA/bin` | scripts | não |
| `00-SISTEMA/cache/eleven` | áudios já pagos (evita gastar crédito) | sim, é útil |
| `00-SISTEMA/cache/stock` | só miniaturas 320 px + índice | pouco |
| `00-SISTEMA/cache/celular` | só a última cópia leve (< 30 MB) para o chat; o `entrega` substitui | sim, apagável |
| `00-SISTEMA/ferramentas` | `cloudflared.exe` (túnel do carrossel) | não |
| `00-SISTEMA/captura` | Puppeteer para capturas e gravação de app | não |
| `FERRAMENTAS/VozLocal` | clone da voz do usuário: `tratar.py`, `clonar.py`, `.venv` (Qwen3-TTS 0.6B + ClearerVoice) e `modelos/` (~2,6 GB). Um ambiente só; Whisper vem do cache global | não |
| `FERRAMENTAS/Remotion` | motor; `node_modules/.remotion` = Chrome do render (necessário) | não |
| `PROJETOS/` | vídeos: roteiro, áudio, assets, mosaicos | 1 pasta por vídeo |
| `CARROSSEIS/` | `carrossel.json`, `legenda.txt`, `assets/`, `slides/`, `_MOSAICO.jpg`, `piloto.json` | 1 pasta por carrossel |
| `VIDEOS PRONTOS/` | MP4 final + capa | 1 arquivo por vídeo |
| `REFERÊNCIAS/` | docs-lei + `CATALOGO/` (1 pasta por referência: REF.md, frame, quadros, DNA, vídeo quando é base/viral) | pouco |
| `PESQUISA/` | `DD-MM-AAAA_tema/`: ranking, fatos com fonte, roteiro final. **Sem vídeo** (vai para o catálogo) | pouco |

## Limpeza por etapa (regra fixa: quem gera, limpa)
Faxina automática e segura: `python -I 00-SISTEMA/bin/limpeza.py` (duplicatas viram link, caches e lotes temporários saem; avisa o resto). `--so-ver` só mostra.

| Etapa | Fica (fonte/entrega) | Sai (no fim da etapa) | Quem/como |
|---|---|---|---|
| **Pesquisa / garimpo** | `PESQUISA/DD-MM-AAAA_tema/`: `RANKING.md`, `PESQUISA.md` (fatos + fontes), `ROTEIRO FINAL.txt` | `NN-VIDEO/ROTEIRO/QUADROS` **saem da pesquisa**: o que serviu vira referência `viral` no catálogo (`catalogar.py nova auto <nome-do-estilo> viral <link> <arquivos>`); o resto é apagado | garimpeiro, ao fechar o roteiro |
| **Estudo de DNA / catálogo** | `CATALOGO/NN_nome-do-estilo/` (REF.md, frame, quadros, DNA.md) + `_FRAMES/` (link, 0 MB) + `_LINKS-LOTES.md` | `REFERÊNCIAS/_lote*` inteiro (MP4 brutos, `_tiras`, `_revisao`) | analista, depois do DNA.md escrito |
| **Roteiro** | `PROJETOS/<slug>/ROTEIRO.md` + `roteiro.json` | rascunhos `*_v1.md`, `rascunho*` (a versão aprovada é a única) | roteirista |
| **Voz** | `audio/` (narração custa crédito) + `00-SISTEMA/cache/eleven` | `audio/_cenas`, testes de `eleven.py teste` | `produzir.py` (automático) |
| **Prévia / render (Reel e YouTube)** | `previa/_MOSAICO.jpg`, `previa/_FINAL.jpg`, MP4 em `VIDEOS PRONTOS/` | render bruto, frames por cena, props, cópias em `Remotion/public` | `produzir.py entrega` → `limpar` (automático) |
| **Versão nova do mesmo vídeo (v2, v3)** | só o que mudou | assets repetidos viram link (`limpeza.py`) | automático |
| **Cortes do YouTube** | trechos 9:16 em `assets/stock/` do projeto | `cache/youtube/<id>` quando a série acabar | `cortes.py limpar <id>` |
| **Carrossel** | `CARROSSEIS/<slug>/`: json, legenda, assets, slides, mosaico | props, cópias, slides de teste | `produzir.py carrossel` (automático) |
| **Stock / B-roll** | `assets/stock/` convertido + `BAIXAR.txt` | MP4 original 1080p | `stock.py` (automático) |
| **Publicação** | MP4 em `VIDEOS PRONTOS/_publicados/` + linha em `_publicados/ig/legendas.txt` | cópia comprimida de upload, `cache/celular` | publicador |
| **Fim de sessão** | — | rodar `limpeza.py`; nada solto na raiz; nenhum doc duplicado | zelador (30 s) |

**Nunca apagar:** ferramentas (`FERRAMENTAS/`, `00-SISTEMA/bin`, `captura`, `assets`), narrações pagas, roteiros aprovados, entregas, catálogo, `segredos/`.

## Checklist ao fim de cada sessão (30 s)
- [ ] `python -I 00-SISTEMA/bin/limpeza.py` rodou e os avisos foram resolvidos.
- [ ] Nada novo solto na raiz. Nenhuma pasta `_teste`, `_backup`, `tmp` esquecida.
- [ ] Nenhum doc novo repetindo outro. Se sim, junte e deixe o ponteiro.
- [ ] Vídeo entregue? Skill `melhoria-continua` rodou (`auditar.py` + registro em `MELHORIA-CONTINUA.md`).

## Removido em 11/11/2026 (para a Lixeira do Windows; recuperável até esvaziar)
| Item | Tamanho | Como recuperar, se precisar |
|---|---|---|
| 98 vídeos brutos de referência (`_downloads/modelos*`) | 860 MB | links em `CATALOGO/_LINKS-LOTES.md` + `catalogar.py baixar` |
| Cache de stock (originais 1080p e prévias 360p) | 740 MB | `stock.py pegar <projeto> <ids>` (`BAIXAR.txt` em cada projeto) |
| Cache do webpack + bundle + cópias em `public/` | 650 MB | regenera sozinho (bundle em ~17 s) |
| OpenMontage (sem uso no fluxo) | 158 MB | `git clone https://github.com/calesthio/OpenMontage.git` |
| HyperFrames (sem uso no fluxo) | 95 MB | `npm i hyperframes@^0.9.28` |
| Renders brutos, frames de prévia, `_cenas`, backups, projeto de teste, cópias comprimidas de upload | ~200 MB | o MP4 final está em `VIDEOS PRONTOS` |

| Limpeza 15/11/2026: VoiceDesign 1.7B, Pocket TTS, 2º ambiente Python, Whisper duplicado, `@remotion/player` e `install-whisper-cpp` | ~6,4 GB e ~32 mil arquivos | `pip install` no `.venv` de `FERRAMENTAS/VozLocal`, `npm i` no Remotion |
| Reorganização 17/11/2026: catálogo em 1 pasta por referência (78), PESQUISA sem vídeos (6 viraram refs virais 73–78), duplicatas de PROJETOS viram link, cópia velha do celular | ~164 MB | nada apagado de fonte: links e catálogo guardam tudo |
