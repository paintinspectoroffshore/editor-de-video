estilo: traco
base: fabrica-de-reels
titulo: Um vira dez
voz: well
tempo: 1.33
mascote: false
paleta: mono
duracaoMax: 72
pronuncia: {"Hermes":"Érmes"}
destaques: ["dez","Ana","25%","40%","1h11","19","chefe","X-GO","Hermes","EU QUERO"]

# Um vira dez (18/11/2026) — roteiro auto-aprovado (pedido do usuário)

## Intenção
| Campo | Resposta |
|---|---|
| Verdade | Agente de inteligência artificial não substitui o profissional: transforma 1 pessoa em uma equipe, desde que ela seja o chefe (estudos Harvard/BCG e GitHub). |
| Transformação | "isso vai me substituir / é coisa de empresa grande" → "eu posso comandar uma equipe de agentes" |
| Por que envia | Pro amigo autônomo que faz tudo sozinho: "olha, você é a Ana". |
| Por que segue | O @well.free mostra na prática como ter agentes trabalhando pra você. |
| O que o Well quer passar | Tecnologia multiplica quem sabe o que quer; o humano continua no comando. |
| Motor | E (você dentro da cena) + A (crença quebrada "IA substitui") na virada |

## Ganchos (3 motores diferentes)
- **[RECOMENDADO] E — Você dentro da cena:** "Você, sozinho, trabalhando como uma equipe de dez." · tela: VOCÊ, SOZINHO → *equipe de dez* sobre terreno · som: whoosh de entrada + pop no "dez".
- A — Crença quebrada: "Inteligência artificial não vai te substituir. Vai te dar uma equipe." · tela: "SUBSTITUIR" riscado → "EQUIPE" · som: silêncio 0,2 s + impacto seco no "não".
- B — Número que não cabe: "Duas horas e quarenta e um viraram uma hora e onze." · tela: 2h41 riscado → 1h11 (fonte GitHub) · som: tick de contador + hit no 1h11.
Por que a 1: fala de 2,5 s, cabe a imagem 1→10 no Traço e é paga no prêmio (cena 19). Estilo: Traço (`traco`), mesma série dos 2 últimos vídeos, linhas finas e câmera lenta seguram atenção sem rosto.

**Abertura**
1. Você, sozinho, trabalhando como uma equipe de dez.
   → terreno em=0 | titulo y=500 linhas=[{"t":"VOCÊ,","em":"@Você"},{"t":"SOZINHO","em":"@sozinho"}] som=whoosh | titulo y=860 serifa=true linhas=[{"t":"equipe de dez","em":"@equipe"}] | rotulo y=1250 texto="1 PESSOA → 10 FUNÇÕES" em=@dez som=pop
   ⚙ camera={"zoom":[1,1.08]}
2. Exagero? Deixa eu te contar da Ana.
   → perguntas y=760 itens=[{"t":"exagero?","em":"@exagero"}] | icone y=1250 icone="persona" tam=220 rotulo="ANA · EXEMPLO" em=@Ana
   ⚙ tag=sorrindo camera={"zoom":[1.05,1]}

**A história**
3. A Ana tem uma confeitaria. Faz o bolo, atende o WhatsApp, posta e cobra.
   → rotulo y=420 texto="A CONFEITARIA DA ANA" em=@confeitaria | lista y=900 itens=[{"t":"FAZ O BOLO","icone":"loja","em":"@bolo"},{"t":"ATENDE O WHATSAPP","icone":"whatsapp","em":"@WhatsApp"},{"t":"POSTA NO INSTAGRAM","icone":"instagram","em":"@posta"},{"t":"COBRA OS CLIENTES","icone":"cobranca","em":"@cobra"}]
   ⚙ camera={"zoom":[1,1.06]}
4. Ou seja: a Ana é a empresa inteira. Inclusive o estagiário.
   → titulo y=720 linhas=[{"t":"A EMPRESA","em":"@empresa"},{"t":"INTEIRA","em":"@inteira"}] | selo x=760 y=1180 linhas=["+ O","ESTAGIÁRIO"] em=@estagiário som=carimbo
   ⚙ tag=sorrindo camera={"zoom":[1.06,1]}
5. Até que ela colocou agentes pra trabalhar com ela.
   → circulos r=380 em=0 | icone y=760 icone="robo" tam=260 em=@agentes | titulo y=1160 serifa=true linhas=[{"t":"agentes","em":"@agentes"}]
   ⚙ camera={"zoom":[1,1.08]}
6. Um responde clientes. Outro planeja posts. Outro cuida das contas.
   → cards y=880 titulo="A EQUIPE DA ANA" colunas=1 itens=[{"t":"ATENDIMENTO","sub":"responde os clientes","icone":"chat","em":"@responde"},{"t":"CONTEÚDO","sub":"planeja os posts","icone":"instagram","em":"@planeja"},{"t":"FINANCEIRO","sub":"cuida das contas","icone":"financas","em":"@contas"}]
   ⚙ camera={"zoom":[1.05,1]}
7. Ela continua fazendo o bolo. Mas agora comanda uma equipe.
   → transformacao y=880 de="FAZ TUDO" para="COMANDA" iconeDe="persona" iconePara="robo" subDe="sozinha" subPara="uma equipe" setaEm=@agora paraEm=@comanda riscar=true
   ⚙ tag=animado camera={"zoom":[1,1.06]}

**A prova**
8. Mas funciona fora da confeitaria? Harvard testou com consultores da BCG.
   → perguntas y=600 itens=[{"t":"funciona fora da confeitaria?","em":"@funciona"}] | marcas y=1200 titulo="O TESTE" itens=[{"t":"HARVARD","sub":"pesquisadores","em":"@Harvard"},{"t":"BCG","sub":"consultores","em":"@BCG"}]
   ⚙ camera={"zoom":[1.06,1]}
9. Quem usou foi vinte e cinco por cento mais rápido, com quarenta por cento mais qualidade.
   → numero y=640 valor=25 sufixo="%" unidade="mais rápido" fonte="Harvard/BCG 2023 · HBS 24-013" em=@vinte | numero y=1180 valor=40 sufixo="%" unidade="mais qualidade" fonte="Harvard/BCG 2023 · HBS 24-013" em=@quarenta
   ⚙ camera={"zoom":[1,1.08]}
10. No GitHub, uma tarefa de programação caiu de duas horas e quarenta e um pra uma hora e onze.
   → rotulo y=420 texto="MESMA TAREFA DE PROGRAMAÇÃO" em=@programação | transformacao y=880 de="2h41" para="1h11" subDe="sem assistente" subPara="com GitHub Copilot" setaEm=@caiu paraEm=@onze riscar=true | pilula y=1450 texto="GITHUB RESEARCH 2022 · ARXIV 2302.06590" em=@GitHub
   ⚙ camera={"zoom":[1.05,1]}
11. Sobrou tempo pro café. Duas vezes.
   → icone y=780 icone="relogio" tam=240 em=@tempo | titulo y=1180 serifa=true linhas=[{"t":"café","em":"@café"},{"t":"× 2","em":"@Duas"}] som=pop
   ⚙ tag=sorrindo camera={"zoom":[1,1.06]}

**A virada**
12. Só que tem um detalhe.
   → titulo y=820 linhas=[{"t":"SÓ UM","em":"@Só"},{"t":"DETALHE","em":"@detalhe"}] | sublinhado y=1000 forma=onda em=@detalhe
   ⚙ camera={"zoom":[1.06,1]}
13. Fora da zona da ferramenta, quem usou acertou dezenove pontos a menos.
   → rotulo y=420 texto="FORA DA ZONA DA FERRAMENTA" em=@zona | numero y=860 valor=19 unidade="pontos percentuais a menos de acerto" fonte="Harvard/BCG 2023 · HBS 24-013" em=@dezenove
   ⚙ camera={"zoom":[1,1.08]}
14. Então o segredo não é trocar você pelo agente. É virar o chefe dele.
   → titulo y=620 linhas=[{"t":"NÃO TROQUE","em":"@trocar"}] | seta y=830 rot=90 em=@virar | titulo y=1060 serifa=true linhas=[{"t":"vire o chefe","em":"@chefe"}] som=impacto
   ⚙ negativo=true tag=animado camera={"zoom":[1,1.1]}

**O meu agente**
15. Foi assim que eu montei o X-GO, meu agente pessoal.
   → emblema y=540 tam=300 em=@montei | celular x=540 y=1260 tam=560 video="app/tour.mp4" em=@pessoal
   ⚙ camera={"zoom":[1.05,1]}
16. Dentro dele roda o Hermes, um agente de código aberto que executa as tarefas.
   → celular x=540 y=920 tam=820 video="app/agente.mp4" em=@Hermes etiqueta={"t":"HERMES","sub":"código aberto","icone":"robo","em":"@código"}
   ⚙ camera={"zoom":[1,1.06]}
17. Ele organiza minhas finanças, compromissos e conteúdos do Instagram.
   → rotulo y=380 texto="FINANÇAS · COMPROMISSOS · INSTAGRAM" em=@organiza | celular x=330 y=1000 tam=560 video="app/financas.mp4" em=@finanças | celular x=750 y=1040 tam=560 video="app/insta.mp4" em=@Instagram
   ⚙ camera={"zoom":[1.05,1]}
18. Eu mando um áudio e ele resolve. E nunca pediu aumento.
   → celular x=540 y=1020 tam=760 video="app/chat.mp4" em=@mando etiqueta={"t":"ÁUDIO","icone":"microfone","em":"@áudio"} | selo x=820 y=420 linhas=["NUNCA PEDIU","AUMENTO"] em=@aumento som=carimbo
   ⚙ tag=sorrindo camera={"zoom":[1,1.06]}

**Reflexão**
19. Agente não substitui o profissional. Ele multiplica quem sabe o que quer.
   → titulo y=620 linhas=[{"t":"NÃO SUBSTITUI","em":"@substitui"}] | titulo y=980 serifa=true linhas=[{"t":"multiplica","em":"@multiplica"}] | rotulo y=1300 texto="1 PROFISSIONAL → 1 EQUIPE" em=@quer
   ⚙ camera={"zoom":[1.06,1]}

**Fechamento**
20. Quer montar sua equipe de agentes? Comenta EU QUERO que eu te mando o caminho. E me segue pra ver cada passo.
   → cta palavra="EU QUERO" chamada="COMENTA" palavraEm=@QUERO nota="o caminho pra montar sua equipe" perfil=true perfilEm=@segue lobo=false em=0
   ⚙ tag=animado camera={"zoom":[1,1.05]}

## O que eu mudei e por quê
- Roteiro novo (sem texto do usuário). Ana é personagem de exemplo (rótulo "EXEMPLO" na tela), não pessoa real.
- Humor: "Inclusive o estagiário" (4), "Sobrou tempo pra tomar café. Duas vezes." (11), "E nunca pediu aumento." (18).
- Virada honesta (13): o mesmo estudo mostra que, fora da zona da ferramenta, quem usou errou mais; daí o prêmio "vire o chefe".

## Fontes (≥2 por número)
- **25% mais rápido · 40% mais qualidade · 19 pontos a menos de acerto** — Dell'Acqua et al., "Navigating the Jagged Technological Frontier", HBS Working Paper 24-013 (2023), 758 consultores BCG: 25,1% mais rápido, >40% mais qualidade, 19 p.p. menos acerto fora da fronteira.
  - https://mitsloan.mit.edu/sites/default/files/2023-10/SSRN-id4573321.pdf
  - https://www.library.hbs.edu/working-knowledge/humans-vs-machines-untangling-the-tasks-ai-can-and-cant-handle
  - https://mi-3.com.au/20-09-2023/harvard-business-school-study-bcg-finds-knowledge-workers-using-chat-gpt-outperform
- **2h41 → 1h11** — experimento GitHub (2022), 95 devs, servidor HTTP em JavaScript; 55,8% mais rápido (Peng et al.).
  - https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/
  - https://visualstudiomagazine.com/articles/2022/09/13/copilot-impact.aspx
  - https://arxiv.org/abs/2302.06590
- Não usados (proibidos por já terem saído): MarketsandMarkets/BCC, Gartner 15%, Sebrae 52%, Microsoft 81%, McKinsey 62%, salário mínimo.
- Descartado: Stanford/MIT atendimento (14% na versão NBER, 15% na versão QJE — número muda entre versões).

## Pontos para você decidir
- Duração estimada: ~229 palavras ≈ 55–60 s no tempo 1.25.
- "10" do gancho é ideia (1 pessoa → equipe), não estatística; a tela diz "10 FUNÇÕES", sem fonte.
- Gravações reais usadas: tour, agente, financas, insta, chat (hardlink de `PROJETOS/16-11-2026_xgo-casa-nova/assets/app/`).

## Legenda do post
Você não precisa fazer tudo sozinho. Um profissional com agentes de inteligência artificial trabalha como uma equipe inteira, desde que ele seja o chefe.
Quer montar a sua equipe de agentes? Comenta EU QUERO que eu te mando o caminho.
Fontes: Harvard/BCG (HBS 24-013, 2023) · GitHub Research (2022).
#inteligenciaartificial #agentesdeia #produtividade #empreendedorismo #automacao

## Já registrado
- Pronúncia: X-GO e Hermes normais; sem "IA" solto. Tags de voz em 2, 4, 7, 11, 14, 18, 20 (nenhuma em cena de número: 9, 10, 13).
- Checklist §4: intenção ✅ · gancho E com 3 camadas + whoosh/pop ✅ · 3 motores (E/A/B) ✅ · viradas "Mas" (7, 8), "Só que" (12), "Então" (14) ✅ · números com fonte na tela ✅ · prêmio enviável (19) fecha o gancho ✅ · 1 convite (EU QUERO; seguir vem como promessa de série) ✅ · lido em voz alta ✅.
