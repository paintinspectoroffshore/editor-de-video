estilo: traco
base: um-vira-dez
titulo: Paint Inspector Pro
credito: Telas: app Paint Inspector Pro
voz: well
estilovoz: apresentador
tempo: 1.2
mascote: false
paleta: mono
fonteAcento: industrial
duracaoMax: 80
pronuncia: {"N-13":"ene treze","SSPC":"esse esse pê cê","NACE":"nêice","Munsell":"mânsel","NCS":"ene cê esse","XP":"xis pê","Bresle":"Brésli"}
destaques: ["Paint","92%","85%","impróprio","94","15","1.327","simulado","ranking","link"]

# Paint Inspector Pro (18/11/2026) — apresentação do app para grupos de WhatsApp de inspetores

## Intenção
| Campo | Resposta |
|---|---|
| Verdade | Existe um app Android que junta clima, normas, cálculos, tintas, cores, relatórios e simulado do inspetor de pintura num lugar só. |
| Transformação | "carrego planilha, PDF de norma e calculadora no celular" → "tá tudo num app só, feito por um colega" |
| Por que envia | Pro colega do grupo ou da equipe: "olha esse app, tem até ranking do simulado". |
| Por que segue | O Well é inspetor e faz ferramenta que resolve o dia a dia do campo. |
| O que o Well quer passar | Ferramenta boa nasce de quem vive o serviço; inspeção com critério, não no achismo. |
| Motor | E (você dentro da cena: "todo inspetor") no gancho + C (perda: pintura suspensa) na prova |

## Ganchos (3 motores diferentes)
- **[RECOMENDADO] E — Você dentro da cena (identidade):** "Esse é o aplicativo que todo inspetor de pintura deveria ter." · tela: celular com a tela inicial + *todo inspetor* em serifa com sublinhado · som: whoosh de entrada + pop no "deveria".
- C — Ameaça / perda: "Umidade em noventa e dois por cento. Você ainda pintaria?" · tela: 92% contra máx. 85% (N-13) + selo IMPRÓPRIO · som: drone grave baixo + notificação.
- B — Número que não cabe: "Noventa e quatro normas cabendo no seu bolso." · tela: 94 contando sobre o celular das normas (fonte: no app) · som: tick de contador + hit no 94.
Por que a 1: é a frase pedida pelo usuário, fala de ~3 s, e é paga no prêmio (cena 19, "tudo no bolso de quem inspeciona"). Estilo: Traço mono (`traco`, forja), pedido do usuário; traço fino desenhado em volta da tela real tem cara de ficha técnica de inspeção.

**Abertura**
1. Esse é o aplicativo que todo inspetor de pintura deveria ter.
   → particulas em=0 | rotulo y=230 texto="PAINT INSPECTOR PRO · ANDROID" em=@aplicativo som=whoosh | celular x=540 y=690 tam=860 video="app/inicio.mp4" inicio=1.5 vel=1 em=0 | titulo y=1330 serifa=true linhas=[{"t":"todo inspetor","tam":120,"em":"@inspetor"}] | sublinhado y=1490 w=520 forma=onda em=@deveria som=pop
   ⚙ camera={"zoom":[1,1.06]}
2. Chama Paint Inspector Pro. Feito por inspetor, pra quem vive o campo.
   → circulos r=380 em=0 | titulo y=680 linhas=[{"t":"PAINT INSPECTOR","em":"@Paint"},{"t":"PRO","em":"@Pro"}] | selos y=1180 itens=[{"linhas":["FEITO POR"],"sub":"inspetor","em":"@Feito"},{"linhas":["PARA QUEM"],"sub":"vive o campo","em":"@campo"}]
   ⚙ tag=sorrindo camera={"zoom":[1.05,1]}

**Condições ambientais**
3. Na tela inicial, condições ambientais em tempo real. Tocou no card, edita cada valor.
   → rotulo y=230 texto="CONDIÇÕES AMBIENTAIS" em=@condições | celular x=540 y=690 tam=860 video="app/ambiental.mp4" inicio=2 vel=1 em=0 etiqueta={"t":"UMIDADE 92%","sub":"sua leitura","icone":"nuvem","em":"@edita"} | rotulo y=1330 texto="TOQUE NO CARD → VALORES EDITÁVEIS" em=@Tocou
   ⚙ camera={"zoom":[1,1.06]}
4. Umidade em noventa e dois por cento, acima dos oitenta e cinco da N-13?
   → rotulo y=300 texto="EXEMPLO · CRITÉRIO DA N-13" em=@Umidade | numero y=700 valor=92 sufixo="%" unidade="umidade relativa" fonte="exemplo no app" em=@noventa | sublinhado y=860 w=480 forma=reta em=@acima | numero y=1160 valor=85 sufixo="%" unidade="máximo para pintar" fonte="Petrobras N-13 · cadastrada no app" em=@oitenta
   ⚙ camera={"zoom":[1.05,1]}
5. O app avisa: impróprio. Pintura suspensa.
   → circulos r=380 em=0 | selo x=540 y=780 linhas=["IMPRÓPRIO","PRA PINTAR"] em=@impróprio som=carimbo | titulo y=1220 serifa=true linhas=[{"t":"pintura suspensa","em":"@suspensa"}]
   ⚙ tag=pausa camera={"zoom":[1,1.08]}

**Normas e procedimentos**
6. Mas não para no clima. São noventa e quatro normas cadastradas no app.
   → celular x=540 y=690 tam=860 video="app/normas.mp4" inicio=2 vel=1 em=0 | numero y=1330 tamanho=120 valor=94 unidade="normas cadastradas" fonte="no app" em=@noventa
   ⚙ camera={"zoom":[1,1.06]}
7. Trinta e cinco da Petrobras, vinte e sete da ABNT, doze da SSPC e outras vinte.
   → rotulo y=300 texto="AS 94 NORMAS DO APP" em=@Trinta | cards y=840 colunas=2 itens=[{"t":"35","sub":"Petrobras","icone":"documento","em":"@Trinta"},{"t":"27","sub":"ABNT","icone":"documento","em":"@vinte"},{"t":"12","sub":"SSPC","icone":"documento","em":"@doze"},{"t":"20","sub":"ISO e NACE","icone":"documento","em":"@outras"}] | pilula y=1300 texto="FONTE: NO APP" em=@outras
   ⚙ camera={"zoom":[1.05,1]}
8. Procedimentos e critérios de aceitação, prontos pra consultar.
   → celular x=540 y=690 tam=860 em=0 clipes=[{"video":"app/procedimentos.mp4","inicio":2.0,"vel":1},{"video":"app/criterios.mp4","inicio":2.6,"vel":1,"em":"@critérios"}] etiqueta={"t":"CONSULTA RÁPIDA","icone":"lupa","em":"@consultar"} | rotulo y=1330 texto="PROCEDIMENTOS · CRITÉRIOS DE ACEITAÇÃO" em=@aceitação
   ⚙ camera={"zoom":[1,1.06]}

**Cálculos**
9. Precisa calcular? São quinze cálculos: ponto de orvalho, espessura úmida, consumo de tinta.
   → celular x=540 y=690 tam=860 video="app/calculos.mp4" inicio=2 vel=1 em=0 | numero y=1330 tamanho=120 valor=15 unidade="cálculos" fonte="no app" em=@quinze
   ⚙ camera={"zoom":[1.05,1]}
10. Tem conversões, teste de Bresle e holiday. Sem abrir planilha.
   → conexoes y=780 icone="ferramentas" itens=[{"t":"PONTO DE ORVALHO","em":0},{"t":"ESPESSURA ÚMIDA","em":0},{"t":"CONSUMO","em":0},{"t":"CONVERSÕES","em":"@conversões"},{"t":"BRESLE","em":"@Bresle","destaque":true},{"t":"HOLIDAY","em":"@holiday"}] | titulo y=1330 serifa=true linhas=[{"t":"sem planilha","em":"@planilha"}]
   ⚙ tag=sorrindo camera={"zoom":[1,1.06]}

**Tintas e cores**
11. Tintas dos fabricantes, com os boletins técnicos.
   → rotulo y=230 texto="TINTAS · BOLETINS TÉCNICOS" em=@tintas | celular x=540 y=690 tam=860 video="app/tintas.mp4" inicio=2 vel=1 em=0 etiqueta={"t":"BOLETIM TÉCNICO","icone":"documento","em":"@boletins"}
   ⚙ camera={"zoom":[1.05,1]}
12. E o código de cores, com a tabela Munsell.
   → celular x=540 y=690 tam=860 video="app/cores.mp4" inicio=4.3 vel=1 em=0 | selos y=1330 itens=[{"linhas":["MUNSELL"],"em":"@Munsell"}]
   ⚙ camera={"zoom":[1,1.06]}

**Relatórios**
13. Terminou a inspeção? O relatório sai padronizado: RIP, fotográfico ou combinado, em PDF.
   → rotulo y=230 texto="RELATÓRIOS PADRONIZADOS · PDF" em=@padronizado | celular x=540 y=690 tam=860 video="app/relatorios.mp4" inicio=1.9 vel=1 em=0 | selos y=1330 itens=[{"linhas":["RIP"],"em":"@RIP"},{"linhas":["RF"],"sub":"fotográfico","em":"@fotográfico"},{"linhas":["RIP + RF"],"sub":"combinado","em":"@combinado"}]
   ⚙ camera={"zoom":[1.05,1]}

**A virada: o simulado**
14. Mas a parte que mais vicia é o simulado.
   → terreno em=0 | titulo y=760 linhas=[{"t":"O SIMULADO","em":"@simulado"}] | sublinhado y=900 forma=onda em=@vicia
   ⚙ tag=sorrindo camera={"zoom":[1,1.08]}
15. São mil trezentas e vinte e sete questões, com base em ABNT, ISO e NACE.
   → rotulo y=230 texto="BASE: ABNT · ISO · NACE · NORMAS BR" em=@base | celular x=540 y=690 tam=860 video="app/simulado.mp4" inicio=3 vel=1 em=0 | numero y=1330 tamanho=120 valor=1327 unidade="questões" fonte="no app" em=@mil
   ⚙ camera={"zoom":[1.05,1]}
16. Modo rápido, ganha XP, sobe de nível.
   → passos y=820 titulo="NO SIMULADO" itens=[{"t":"MODO RÁPIDO","icone":"relogio","em":"@rápido"},{"t":"GANHA XP","icone":"tendencia","em":"@ganha"},{"t":"SOBE DE NÍVEL","icone":"aprovacao","em":"@sobe"}]
   ⚙ camera={"zoom":[1,1.06]}
17. No ranking de inspetores, você vê o desempenho dos colegas.
   → particulas em=0 | celular x=540 y=690 tam=860 video="app/ranking.mp4" inicio=4 vel=1 em=0 etiqueta={"t":"RANKING","sub":"de inspetores","icone":"tendencia","em":"@ranking"} | rotulo y=1330 texto="XP · NÍVEL · POSIÇÃO DOS COLEGAS" em=@colegas
   ⚙ negativo=true tag=animado camera={"zoom":[1,1.1]}
18. Então você descobre quem está estudando de verdade. Inclusive você.
   → titulo y=720 serifa=true linhas=[{"t":"quem estuda","em":"@estudando"},{"t":"de verdade","em":"@verdade"}] | selo x=780 y=1180 linhas=["INCLUSIVE","VOCÊ"] em=@Inclusive som=carimbo
   ⚙ tag=sorrindo camera={"zoom":[1.06,1]}

**Reflexão**
19. Clima, norma, cálculo, relatório e estudo. Tudo no bolso de quem inspeciona.
   → lista y=760 itens=[{"t":"CLIMA","icone":"sol","em":"@Clima"},{"t":"NORMAS","icone":"documento","em":"@norma"},{"t":"CÁLCULOS","icone":"ferramentas","em":"@cálculo"},{"t":"RELATÓRIOS","icone":"recibo","em":"@relatório"},{"t":"ESTUDO","icone":"lampada","em":"@estudo"}] | titulo y=1360 serifa=true linhas=[{"t":"tudo no bolso","em":"@bolso"}]
   ⚙ camera={"zoom":[1,1.06]}

**Fechamento**
20. Quer usar no próximo serviço? Clique no link abaixo ou entre em contato com o inspetor de pintura Well.
   → cta palavra="LINK ABAIXO" chamada="CLIQUE NO" palavraEm=@link nota="ou fale com o inspetor de pintura Well" perfil=false lobo=false em=0
   ⚙ tag=sorrindo camera={"zoom":[1,1.05]}

## O que eu mudei e por quê
- Gancho do usuário mantido ("Esse é o aplicativo que todo inspetor de pintura deveria ter."), só com ponto final.
- CTA do usuário mantido; entrou antes uma pergunta curta ("Quer usar no próximo serviço?") para não soar anúncio.
- Humor leve de colega: "Inclusive você" (18). Viradas: "Mas não para no clima" (6), "Mas a parte que mais vicia" (14), "Então você descobre" (18).
- RF falado como "fotográfico" (a voz erra siglas soltas); a tela mostra RIP · RF · RIP + RF.

## Fontes (números do app; sem dado de mercado)
- **94 normas (Petrobras 35, ABNT 27, SSPC 12, ISO 17 + NACE 3 = 20)** — seeds de `standard_repository.dart` (`PESQUISA/paint-inspector-pro.md` §2 e §3) + briefing do usuário (mesma divisão).
- **15 cálculos** — 15 telas `/calc/*` (`PESQUISA/paint-inspector-pro.md` §2) + briefing do usuário.
- **1.327 questões** — `question_bank_seed.dart` (1327 questões, 216 temas) + briefing do usuário.
- **Umidade máx. 85% (N-13)** — critério de `paint_suitability.dart` (umidade <85 %, N-13/N-9) + briefing do usuário. **92%** é leitura de exemplo (tela: "exemplo no app"), não medição.
- RIP/RF/Combinado e PDF: `create_report_selection_screen.dart` (pesquisa §2) + briefing.

## Pontos para você decidir
- Duração estimada: ~229 palavras ≈ 60–66 s no tempo 1.2 (limite 80 s).
- **Cores RAL e NCS:** a pesquisa do código só achou a tabela Munsell. Mantive RAL e NCS porque estão no seu briefing; confirme no clipe `cores` (se não tiver, a fala 12 vira "com a tabela Munsell").
- "Normas BR" no rótulo da cena 15 = sua lista "ABNT/ISO/NACE/BR"; na fala ficou só ABNT, ISO e NACE.
- Clipes esperados em `assets/app/` (7 s cada, início 0, vel 1): inicio, ambiental, normas, procedimentos, criterios, calculos, tintas, cores, relatorios, simulado, ranking.
- Trilha herdada da base (hiphop_never-going-broke); o sonoplasta pode trocar por algo mais calmo para tom de apresentação.

## Legenda do post
Clima com critério de norma, 94 normas, 15 cálculos, tintas e cores, relatórios em PDF e um simulado com 1.327 questões e ranking de inspetores. Tudo no celular, feito por inspetor.
Quer usar no próximo serviço? Clique no link ou fale com o inspetor de pintura Well.
#inspecaodepintura #pinturaindustrial #inspetordepintura #corrosao #petrobras

## Já registrado
- Voz Well, estilo apresentador, tempo 1.2. Pronúncia: N-13, SSPC, NACE, Munsell, NCS, XP. Nenhuma âncora cai em palavra com pronúncia trocada.
- Tags em 2, 5, 10, 14, 17, 18, 20 (nenhuma nas cenas de número: 4, 6, 7, 9, 15).
- Checklist §4: intenção ✅ · gancho E com 3 camadas (celular + fala + "todo inspetor") + whoosh/pop ✅ · 3 motores (E/C/B) ✅ · viradas 6, 14, 18 ✅ · números com fonte "no app" na tela ✅ · prêmio 19 fecha o gancho e é enviável ✅ · 1 convite (link/contato) ✅ · lido em voz alta: tom de colega ✅.
