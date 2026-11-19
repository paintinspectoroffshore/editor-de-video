estilo: traco
base: xgo-o-que-e-agente
titulo: A fábrica de Reels
voz: well
tempo: 1.25
mascote: false
duracaoMax: 55
pronuncia: {"yt-dlp":"uai tí dí él pí"}
destaques: ["GitHub","VÍDEO","79","grátis","comando"]

# A fábrica de Reels (18/11/2026) — roteiro auto-aprovado (pedido do usuário)
Intenção: quem cria conteúdo vê que dá pra montar uma fábrica de Reels com ferramentas grátis, entende o passo a passo e comenta VÍDEO pra pegar o projeto.
Gancho: motor A (crença quebrada) — "feito por IA" + promessa de mostrar tudo. DNA visual: Traço + ref. 79 (linha fina, câmera lenta contínua, termo em serifa itálica, 1 cena negativa, terreno 3D).

1. Esse vídeo foi feito por uma inteligência artificial. E eu vou te mostrar a fábrica inteira.
   → terreno em=0 | titulo y=470 linhas=[{"t":"FEITO POR","em":"@feito"}] | titulo y=780 serifa=true linhas=[{"t":"inteligência artificial","em":"@inteligência"}] | rotulo y=1250 texto="A FÁBRICA INTEIRA" em=@fábrica
   ⚙ camera={"zoom":[1,1.08]}
2. Tudo começa com quatro ferramentas grátis do GitHub.
   → circulos r=380 em=0 | numero y=760 valor=4 unidade="ferramentas grátis" fonte="GitHub · código aberto" em=@quatro | titulo y=1150 serifa=true linhas=[{"t":"GitHub","em":"@GitHub"}]
   ⚙ camera={"zoom":[1.05,1]}
3. O Remotion transforma código em vídeo. O FFmpeg corta e mixa o som.
   → cards y=760 titulo="FERRAMENTAS" colunas=1 itens=[{"t":"REMOTION","sub":"código vira vídeo","icone":"terminal","em":"@Remotion"},{"t":"FFMPEG","sub":"corta e mixa o som","icone":"ferramentas","em":"@FFmpeg"}]
   ⚙ camera={"zoom":[1,1.06]}
4. O Whisper ouve a voz e cria as legendas. E o yt-dlp baixa as referências.
   → cards y=760 titulo="FERRAMENTAS" colunas=1 itens=[{"t":"WHISPER","sub":"ouve e cria legendas","icone":"microfone","em":"@Whisper"},{"t":"YT-DLP","sub":"baixa as referências","icone":"nuvem","em":"@baixa"}]
   ⚙ camera={"zoom":[1.06,1]}
5. Quem comanda tudo é o Claude Code, com nove agentes e nove skills. Um escreve o roteiro, outro desenha, outro produz.
   → conexoes y=880 icone="robo" itens=[{"t":"ROTEIRISTA","icone":"documento","em":"@escreve"},{"t":"DESIGNER","icone":"lampada","em":"@desenha"},{"t":"PRODUTOR","icone":"terminal","em":"@produz"},{"t":"9 SKILLS","icone":"skills","em":"@skills"},{"t":"9 AGENTES","icone":"modulos","em":"@agentes"}] | pilula y=1420 texto="CLAUDE CODE · 9 AGENTES · 9 SKILLS" em=@Claude
   ⚙ negativo=true camera={"zoom":[1,1.1]}
6. A voz vem da ElevenLabs. Neste vídeo, é a minha própria voz, clonada.
   → icone y=640 icone="microfone" tam=220 em=@voz | mensagem y=1000 audio=true cauda="dir" texto="minha voz, clonada" em=@minha | rotulo y=1250 texto="ELEVENLABS" em=@ElevenLabs
   ⚙ camera={"zoom":[1,1.06]}
7. Tudo fica organizado em cinco pastas: sistema, ferramentas, referências, projetos e vídeos prontos.
   → lista y=820 itens=[{"t":"00-SISTEMA","icone":"modulos","em":"@sistema"},{"t":"FERRAMENTAS","icone":"ferramentas","em":"@ferramentas"},{"t":"REFERÊNCIAS","icone":"lupa","em":"@referências"},{"t":"PROJETOS","icone":"documento","em":"@projetos"},{"t":"VÍDEOS PRONTOS","icone":"aprovacao","em":"@prontos"}] | pilula y=420 texto="5 PASTAS" em=@cinco
   ⚙ camera={"zoom":[1.05,1]}
8. E um catálogo com setenta e nove estilos de vídeo pra escolher.
   → numero y=420 valor=79 unidade="estilos" fonte="catálogo do projeto" em=@setenta | celular x=230 y=1100 tam=420 img="temas/t01.jpg" em=@estilos | celular x=540 y=1080 tam=440 img="temas/t04.jpg" em=@vídeo | celular x=850 y=1100 tam=420 img="temas/t08.jpg" em=@escolher
   ⚙ camera={"zoom":[1,1.08]}
9. Qualquer pessoa consegue: você escreve o roteiro, escolhe um estilo e dá um comando.
   → passos y=820 titulo="PASSO A PASSO" itens=[{"t":"ESCREVA O ROTEIRO","icone":"documento","em":"@escreve"},{"t":"ESCOLHA UM ESTILO","icone":"lampada","em":"@escolhe"},{"t":"DÊ UM COMANDO","icone":"terminal","em":"@comando"}]
   ⚙ camera={"zoom":[1.05,1]}
10. E o vídeo sai pronto: voz, legenda e trilha. Cada vez mais rápido e mais barato.
   → terminal y=700 linhas=[{"t":"produzir.py rapido","tipo":"cmd","em":0.2},{"t":"voz ✓","tipo":"ok","em":"@voz"},{"t":"legenda ✓","tipo":"ok","em":"@legenda"},{"t":"trilha ✓","tipo":"ok","em":"@trilha"}] | selos y=1300 itens=[{"linhas":["MAIS","RÁPIDO"],"em":"@rápido"},{"linhas":["MAIS","BARATO"],"em":"@barato"}]
   ⚙ camera={"zoom":[1,1.06]}
11. Quer usar o mesmo projeto? Comenta VÍDEO que eu te mando o link do GitHub pra baixar e começar hoje.
   → cta palavra="VÍDEO" chamada="COMENTA" palavraEm=@VÍDEO nota="link do GitHub" perfil=false lobo=false em=0
   ⚙ camera={"zoom":[1,1.05]}
