# Hermes no bolso — roteiro (16/11/2026)

**Tese:** você tem um assistente completo no bolso: instala o Hermes numa VPS uma vez e controla tudo pelo app.
**Duração:** 267 palavras ≈ 94 s a 170 palavras/min (meta 90–110 s; `duracaoMax: 120`).
**Voz:** clonada do Well (`i8rv83UTKnzq0PzTrxjL`, eleven_v4, tempo 1.28), igual a `15-11-2026_gta6-realista`.
**Estilo (base para o designer):** frame #02 @igao.ia (dark, abas "PASSO 1..5" com check) + #01 (balões de UI orbitando) — porque o vídeo é tutorial em passos + tour de app real, e o celular 720×1560 precisa ser o herói da tela.

## Ganchos (de `REFERÊNCIAS/GANCHOS.md`)

| Opção | Gancho do compilado | Fala adaptada | Visual 0–3 s |
|---|---|---|---|
| A **(recomendada)** | #11 Personificação | "Eu sou o Hermes. Sua IA de bolso." | Lobo (avatar do app) em close, respirando; "SUA IA DE BOLSO" palavra a palavra |
| B | #22 Comenta PALAVRA | "Comenta AGENTE: eu te mostro a IA que mora no meu celular." | Palavra "AGENTE" em caixa gigante + celular com o Lobo |
| C | #1 Cadeia de consertos | "Se você quer uma IA trabalhando por você, precisa de um servidor. Mas aí vem o terminal…" | Ícone de servidor sozinho que ganha um terminal, depois um celular |

Por que A: cabe em 2,5 s (8 palavras), usa o mascote que já é do app (criado do zero, sem rosto real), e o vídeo cumpre a promessa (mostra o "bolso" de verdade). Fecha em loop com o Lobo no CTA.

## Roteiro

| # | bloco | narração | na tela |
|---|---|---|---|
| 1 | Gancho | Eu sou o Hermes. Sua IA de bolso. | Lobo em close + "SUA IA DE BOLSO" |
| 2 | O que é | Um agente de IA open source, da Nous Research. Ele roda dia e noite num servidor seu. E trabalha sozinho. | Cavaleiro Hermes + "OPEN SOURCE · NOUS RESEARCH" · servidor aceso, sol/lua girando |
| 3 | O que faz | Tem memória. Aprende skills. Usa ferramentas. Faz rotinas agendadas. E fala com você no Telegram e no WhatsApp. | 5 chips orbitando: Memória · Skills · Ferramentas · Rotinas · Telegram/WhatsApp |
| 4 | Virada | Só que tudo isso morava no terminal. Agora mora no seu celular. | Terminal vira celular → `tour.mp4` (Início com o Lobo) |
| 5 | VPS · passo 1 | Primeiro, alugue uma VPS, um servidor na nuvem. Passo um: cola o comando de instalação. | Aba PASSO 1 · terminal: `curl -fsSL https://hermes-agent.nousresearch.com/install.sh \| bash` |
| 6 | VPS · passo 2 | Passo dois: hermes setup. Um assistente configura tudo pra você. | Aba PASSO 2 · `hermes setup` + 3 checks verdes |
| 7 | VPS · passo 3 | Passo três: liga o painel e coloca HTTPS. Faz isso uma vez só. | Aba PASSO 3 · `hermes dashboard` → "porta 9119" → cadeado "HTTPS (Caddy)" · selo "UMA VEZ SÓ" |
| 8 | Ligar no app | Agora o app. Em Ajustes, cola o endereço do painel e o seu usuário. | Mockup desenhado de Ajustes (endereço **borrado**) |
| 9 | Ligar no app | Digita a senha uma vez. Ela fica guardada cifrada no aparelho. Conectar. | Senha "••••••••" + "Manter conectado" + toque em "Conectar" |
| 10 | Ligar no app | Uma conexão só. Chat, aprovações, Instagram, rotinas, memória e skills chegam juntos. | Fio de luz servidor → celular; 6 ícones descem e encaixam · `tour.mp4` |
| 11 | Tour · Chat | Pergunta: quanto gastei este mês e qual meu saldo? Ele responde com os números reais, conta por conta. | `chat.mp4` (~5 s, cortado) · rótulo "CHAT" |
| 12 | Tour · Finanças | Tem painel de finanças, com extrato e saldo. | `financas.mp4` (~3 s) |
| 13 | Tour · Instagram | Monitora o seu Instagram inteiro. | `insta.mp4` (~3 s) |
| 14 | Tour · Fluxos | E cria fluxos automáticos: comentou a palavra, recebeu a mensagem. | `fluxo.mp4` (~4 s) |
| 15 | Tour · Agentes | São vinte e três agentes prontos. Vendedor, suporte, secretária, pesquisador. | `bots.mp4` · **23 modelos** [app X-GO 0.30.0] |
| 16 | Tour · Agente | E nada do Hermes se perde. Setenta e oito skills ativas, rotinas, memória, persona. Tudo aqui. | `agente.mp4` · **78 skills** [app X-GO 0.30.0] |
| 17 | Tour · Modular | E o app é seu. Põe, tira e arrasta módulos. Ou pede pro agente mudar por você. | `modular.mp4` + balão do Lobo "muda pra mim?" |
| 18 | Tour · Extras | Ainda tem casa inteligente, relógio, WhatsApp e Telegram. | `casa.mp4` → `tour.mp4` (menu) |
| 19 | Tour · Segurança | E ele até controla o celular. Mas só com a sua aprovação. | `celular.mp4`, zoom em Negar / Aprovar |
| 20 | Síntese | Instala uma vez na VPS. Controla tudo pelo bolso. | Servidor ↔ celular com Lobo · "UMA VEZ NA VPS → TUDO NO BOLSO" |
| 21 | CTA | Comenta AGENTE que eu te mando o link. Quem responde é o próprio fluxo do app. E segue o @well.free. | "AGENTE" gigante + seta · Lobo acenando · card @well.free "Seguir" |

## Números e fontes (todo número falado/escrito está na tela)

| Número | Onde | Fonte 1 | Fonte 2 |
|---|---|---|---|
| 23 modelos de agente | cena 15 | tela "Novo agente" (`bots.mp4`), app X-GO 0.30.0 | — (dado do próprio app; não é dado externo) |
| 78 skills ativas | cena 16 | tela "Agente" (`agente.mp4`), app X-GO 0.30.0 | — (contagem da instalação do Well; dito como "ativas", não "o Hermes tem 78") |
| porta 9119 (só na tela, não falado) | cena 7 | docs Hermes: hermes-agent.nousresearch.com/docs/user-guide/features/web-dashboard | briefing validado |

**Fatos sem número, cruzados:**
- Comando de instalação `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash` e `hermes setup` ("configura tudo de uma vez"): README em github.com/NousResearch/hermes-agent (conferido 16/11) + briefing validado.
- Hermes é open source (licença MIT), da Nous Research, com memória, skills, ferramentas, rotinas agendadas, Telegram/WhatsApp: README oficial + docs.
- `hermes dashboard` abre o painel na porta 9119: docs oficiais (página web-dashboard) + briefing.
- Ajustes → endereço + usuário → senha uma vez, guardada cifrada → Conectar: app X-GO 0.30.0 (briefing; **não há clipe gravado dessa tela**, o designer desenha o mockup).

## Atenção (antes de gravar a voz)
- **CTA, cena 21:** "quem responde é o próprio fluxo do app" só é verdade se o Well deixar ativo um fluxo "Comentou AGENTE → manda o link". Senão, troque por "Comenta AGENTE que eu te mando o link."
- **Sem IP, endereço nem senha** em nenhum quadro. Na cena 11, os valores reais de gasto/saldo aparecem no clipe; borrar se o Well preferir.
- **Pronúncia não testada** com a voz do Well: "@well.free", "Nous Research", "hermes setup", "HTTPS", "skills". Rodar `eleven.py teste` numa frase com todas antes do `rapido` (ver `00-SISTEMA/VOZES.md`).

## Legenda do post (sem citar a loja)

Eu sou o Hermes: um agente de IA open source que trabalha dia e noite por você.
Instala uma vez numa VPS (3 comandos) e controla tudo pelo celular: chat, finanças, Instagram, fluxos automáticos, agentes prontos e o seu próprio app modular.

Comenta AGENTE que eu te mando o link.
Salva pra montar o seu e manda pra quem vive no terminal.

#inteligenciaartificial #agenteia #opensource #automacao #produtividade
