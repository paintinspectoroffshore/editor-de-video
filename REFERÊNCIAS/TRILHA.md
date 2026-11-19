# Trilha e som — DNA sonoro (17/11/2026)

Fonte única de áudio do projeto (a FOLHA-DE-ESTILO §9 aponta para cá). Voz: `00-SISTEMA/VOZES.md`. Ferramentas: skills `video-audio` e `elevenlabs-tts`.

## O que está validado (e o que é hipótese)
- ✅ **Fala humana nos 3 s iniciais aumenta retenção.** Emplifi (análise de Reels de marcas): voz e pessoa nos 3 s iniciais → +3,6% retenção em 3 s e +10,1% em 10 s; "o áudio pesa mais que o visual sozinho". [Emplifi](https://emplifi.io/?p=23678)
- ✅ **Tempo assistido é o sinal nº 1 dos Reels** (Mosseri, 2025). Som que segura os 3 s alimenta esse sinal. ([Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/))
- 🟡 **Parte grande assiste sem som** (blogs citam 50–70%, sem estudo original achado). Por isso som **e** texto no 1º segundo, sempre.
- 🟡 Números tipo "84% decidido no 3º segundo" circulam sem fonte. **Não usar como fato.** O nosso aprendizado vem da tabela no fim deste arquivo.

## As 6 regras da abertura sonora (0–3 s)
1. **Nada de silêncio no quadro 0.** A primeira coisa audível chega em ≤0,15 s: voz, impacto ou o beat.
2. **Voz começa em ≤0,3 s**, no meio da ideia (sem "oi, gente"). A primeira palavra é a palavra-gancho.
3. **Um "acento" sonoro na palavra-gancho** (impacto, carimbo, tick final do contador), sincronizado ao quadro em que o texto aparece. Só um. Dois acentos em 3 s viram ruído.
4. **Música entra no tempo forte**, não em fade-in lento. Se a faixa tem intro calma, corte direto para o primeiro beat/drop (`trilhaInicio`, em segundos).
5. **Contraste dinâmico:** 0,2 s de quase-silêncio antes do acento faz o acento parecer 2× mais forte (motor A: crença quebrada).
6. **Som combina com o motor do gancho** (tabela em `GANCHOS.md`, coluna "Som"). Ameaça não abre com som fofo; personagem não abre com sirene.

## Mapa de som por momento
| Momento | Som | Arquivo em `00-SISTEMA/assets/sfx/` |
|---|---|---|
| Gancho: palavra de impacto | impacto seco / trailer | `impacto.mp3`, `impacto-trailer.mp3` |
| Gancho: número | tick no contador + impacto no valor | `tick.wav` + `impacto.mp3` |
| Gancho: ameaça | sirene baixa / notificação | `sirene.mp3`, `notificacao.mp3` |
| Troca de cena | whoosh curto (≤0,4 s) | `whoosh.wav`, `whoosh-cine.mp3` |
| Item de lista / check | pop ou clique | `pop.wav`, `click.wav` |
| Selo / carimbo / veredito | carimbo | `carimbo.wav` |
| Dinheiro / preço | moedas | `moedas.mp3`, `moeda-game.mp3` |
| Virada ("mas…") | corte da trilha por 0,4 s (silêncio é o efeito) | — |
| Fecho / prêmio | trilha volta cheia 1 s antes do fim, sem SFX | — |

## Mixagem (números fixos)
- Voz manda: final em **−14 LUFS** integrado (`produzir.py entrega` já faz).
- Trilha **~−26 LUFS sob a voz**, ducking de 6 dB quando há fala; nos 3 s iniciais pode subir até −20 LUFS se a voz ainda não entrou.
- SFX: picos 3–6 dB abaixo da voz; **nunca em cima de palavra importante** (exceto o acento único do gancho, que é a própria palavra).
- Final do vídeo: sem fade-out longo; trilha termina no beat ou no laço (`trilhaLaco`) para o replay emendar.

## Biblioteca de trilhas (ampliar)
| Arquivo (`assets/musica/`) | Clima | Serve para |
|---|---|---|
| `synthwave_sun-in-your-eyes.mp3` | neon, nostalgia, energia | games, GTA, cultura pop |
| `hiphop_never-going-broke.mp3` | confiança, dinheiro | finanças, produto, X-GO |

Faltam climas: **tensão/investigação** (Dossiê, golpes), **descoberta/curiosidade** (ciência, "você sabia"), **lo-fi tech calmo** (tutorial, Traço), **épico curto** (lançamentos). Fontes livres para uso comercial, sem atribuição obrigatória: [Pixabay Music](https://pixabay.com/music/) e a Biblioteca de Áudio do YouTube (filtro "sem atribuição"). Nome do arquivo: `clima_titulo.mp3`; anote a licença na linha da tabela.
**Música em alta do Instagram:** só vale se postada pelo app (direito da faixa). No nosso MP4 renderizado use apenas trilha livre.

## Aprendizado (preencher depois de cada vídeo publicado; `insta.py desempenho`)
| Vídeo | Motor do gancho | Abertura sonora (0–3 s) | Retenção 3 s / média | Envios por alcance | Lição |
|---|---|---|---|---|---|
| | | | | | |

Regra: depois de 5 linhas, o sonoplasta compara e promove a abertura que venceu a "padrão" do motor.
