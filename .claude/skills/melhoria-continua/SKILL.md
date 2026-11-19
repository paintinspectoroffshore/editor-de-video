---
name: melhoria-continua
description: Auditoria e melhoria contínua do sistema de vídeos. Use no fim de cada vídeo/carrossel entregue, quando o usuário pedir "auditoria", "onde errou", "economia de tokens", "acelerar", "melhorar o processo", ou ao notar retrabalho (mesmo comando 3x, erro repetido, voz gerada de novo). Mede a sessão com auditar.py, acha a causa de cada desperdício, corrige no código/skill e registra em REFERÊNCIAS/MELHORIA-CONTINUA.md.
---

# Melhoria contínua: cada vídeo deixa o próximo mais rápido, barato e bom

Meta: **vídeo de altíssima qualidade com o mínimo de tokens, créditos e minutos.** Toda falha vira **código** (melhor) ou **regra numa skill** (quando não dá para automatizar). Nunca só uma anotação.

## Quando rodar
- No fim de cada entrega (depois da aprovação final), antes do checklist do zelador.
- Quando o usuário pedir auditoria ou melhoria do processo.
- Na hora, sem esperar o fim, se um erro se repetir 2 vezes.

## Passo a passo (custa ~5 chamadas)
1. **Medir:** `python 00-SISTEMA/bin/auditar.py`. A sessão mais recente sai em ~40 linhas: tokens por modelo (com o contexto médio por chamada), ferramentas, chamadas do pipeline, erros, comandos repetidos, maiores resultados e créditos da ElevenLabs. **Não abra o .jsonl da sessão.**
2. **Classificar** cada achado em uma linha: `sintoma → causa → custo (tokens, créditos ou minutos)`. Use também o que você lembra da sessão: erros que o usuário apontou, coisas refeitas, avisos ignorados.
3. **Corrigir pela raiz**, nesta ordem de preferência:
   1. Script faz sozinho (ex.: `ouvir` automático, cópia para o celular, UTF-8 no terminal).
   2. Padrão no código (ex.: `VOZ_CFG_PADRAO`, `duracaoMax`).
   3. Regra curta na skill certa (`reel`, `catalogo`, `piloto`) ou no agente certo (`.claude/agents/*.md`).
   Não crie doc novo se já existir um lugar para aquilo.
4. **Testar** o que mudou com um comando real num projeto existente, sem gastar crédito da ElevenLabs (o cache serve). Mexeu em `.tsx`? Rode `npx tsc --noEmit`.
5. **Registrar** em `REFERÊNCIAS/MELHORIA-CONTINUA.md`:
   - uma linha na tabela de **métricas** (para comparar as sessões);
   - os achados com a ação e o status (✅ feito / 🟡 pendente).
   - Se algo for regra nova de ouro, coloque também na lista **Regras de ouro**, no topo do mesmo arquivo.
6. **Relatar** ao usuário em lista: o que custou mais, o que foi corrigido e o ganho esperado.

## Onde costuma ir o desperdício (confira sempre)
- **Contexto grande × muitas chamadas.** O custo maior é *ler o contexto de novo* a cada chamada. Contexto médio acima de 120k? Delegue a parte mecânica a um agente (`produtor` sonnet, `zelador` haiku) e feche a sessão ao fim do vídeo: **1 vídeo = 1 sessão**.
- **Opus fazendo trabalho de Sonnet.** Depois do roteiro aprovado, o `produtor` roda `rapido`/`previa`/`entrega`, e a sessão principal só olha os mosaicos.
- **Leitura inteira de arquivo grande** (`cat` de skill, `.tsx`, `produzir.py`). Use `grep -n` + trecho. Uma skill já carregada não se relê.
- **Regeneração de voz.** Teste as palavras difíceis antes (`eleven.py teste`). Decida modelo e voz antes do `rapido`. Velocidade se ajusta com `tempo`, que é grátis.
- **Render repetido.** Ajuste olhando a `previa` (~15 s); `entrega` só depois do mosaico aprovado, em segundo plano.
- **Comando que falhou e foi repetido com pequenas variações.** Leia o erro e mude a abordagem. Depois de 2 falhas, vira item desta auditoria.
- **Fato errado na tela, achado tarde.** Confira cada número e rótulo contra a `PESQUISA.md` **antes** da prévia.
