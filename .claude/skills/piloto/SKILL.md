---
name: piloto
description: Piloto automático de conteúdo do @well.free, de ponta a ponta. Pesquisa o nicho, escolhe a pauta, escreve o roteiro, produz um Reel ou carrossel, manda para aprovação no Telegram e publica sozinho ao aprovar. Use em rodadas agendadas, quando o usuário disser "piloto", "rodada", "post automático", ou pedir para pesquisar, criar e postar sem a participação dele.
---

# Piloto automático (prioridades: qualidade > velocidade > economia de tokens)

Referência completa, com as fontes validadas: `REFERÊNCIAS/AUTOMACAO.md`. Abra o arquivo só se travar.

## 0. Fila primeiro (custa ~0 tokens)
```
python 00-SISTEMA/bin/aprovar.py vigiar   # processa os cliques; o aprovado já é publicado aqui
python 00-SISTEMA/bin/aprovar.py status
```
- Se aparecer `ajustar` com `pedido`: aplique o pedido no projeto, refaça só a etapa afetada, mande de novo com `aprovar.py enviar <slug>` e encerre a rodada.
- Se já houver 2 projetos em `aguardando`, não produza mais nada. Encerre.

## 1. Pesquisa (só leia o arquivo-resumo)
- Com a API configurada, rode `python 00-SISTEMA/bin/insta.py pesquisa` e leia **apenas** `PROJETOS/_pesquisa/<hoje>.md` (top 20).
- Uma vez por semana, rode também `insta.py desempenho 12` e anote 1 aprendizado em `REFERÊNCIAS/APRENDIZADOS.md`.
- Sem a API: faça no máximo 3 buscas no Google pelo Chrome do usuário, filtradas para a "última semana", e use só o que tiver data visível de até 7 dias.
- Nunca invente métrica, link ou data. Use 2 fontes para cada fato que for ao ar.

## 2. Pauta
- Escolha **1** tema e registre-o em `PROJETOS/_pesquisa/PAUTAS.md` com data, formato e motivo (o post da pesquisa que provou interesse).
- O tema precisa ter as três coisas:
  - prova de interesse (pesquisa ou desempenho);
  - aderência ao `00-SISTEMA/nicho.json`;
  - fonte verificável.
- Formato:
  - **Reel** se o tema pede demonstração ou movimento.
  - **Carrossel** se o tema é lista, passo a passo ou dado.
  - Alterne Reel e carrossel conforme `nicho.json.frequencia`.

## 3. Roteiro (regras validadas, sem exceção)
- **Gancho** em até 3 s. Pode ser número, contraste ou dor. Não comece com "Eu".
- Escreva 3 opções de gancho de `REFERÊNCIAS/GANCHOS.md` adaptadas ao tema, marque a recomendada e use-a (as outras vão no `ROTEIRO.md` e na aprovação do Telegram).
- **2 pontos** no máximo. Uma ideia por cena ou por slide.
- **Retenção** é o que o algoritmo mede (tempo assistido, envios por alcance, curtidas por alcance). Para isso:
  - dê o motivo para ficar até o fim já no início;
  - feche com motivo para **mandar a alguém** ("manda pra quem…").
- Todo número falado ou escrito aparece na tela com a fonte.
- **Legenda** espelha o roteiro:
  - os primeiros 125 caracteres são o gancho;
  - CTA de seguir @well.free;
  - **no máximo 5 hashtags**.
- **Palavra de comentário** (1 palavra, MAIÚSCULA) só se existir mesmo o que entregar.
- **Reel:** siga a skill `reel` (estrutura do `roteiro.json`, estilos Impacto ou Editorial, voz e âncoras).
- **Carrossel:** de 7 a 10 slides em `carrossel.json`, com tipos capa, texto, lista, dado, imagem e cta. O slide 1 é o gancho, de 5 a 8 palavras. O último é o CTA (salvar, seguir, comentar).
- **Porta de qualidade:** dê nota a si mesmo e só siga com **≥ 90/100**:
  - fontes e precisão: 30;
  - gancho e estrutura: 25;
  - clareza e duração: 20;
  - voz do @well.free: 15;
  - CTA e legenda: 10.

## 4. Produção (1 comando por formato; olhe só os mosaicos)
- **Reel:**
  1. `produzir.py novo <slug>`, depois escreva o `roteiro.json`.
  2. `produzir.py rapido <slug>`, depois confira `previa/_MOSAICO.jpg`.
  3. `produzir.py entrega <slug>`, depois confira a linha CHECAGEM e `_FINAL.jpg`.
- **Carrossel:**
  1. `produzir.py carrossel-novo <slug>` cria `CARROSSEIS/<data>_<slug>/`. Escreva o `carrossel.json` e ponha as imagens em `assets/`.
  2. `produzir.py carrossel <slug>`, depois confira `CARROSSEIS/<data>_<slug>/_MOSAICO.jpg`. Os slides ficam em `slides/`.
- Uma rodada de correção no máximo. Se ainda estiver ruim, simplifique o layout em vez de insistir.
- Rode `eleven.py saldo`. Abaixo de 20%, mande `aprovar.py avisar "⚠️ ElevenLabs: X créditos"`.

## 5. Aprovação e publicação
- Escreva `legenda.txt` e `piloto.json` = `{"teste": true, "graduacao": "MANUAL"}`. Os valores de teste e graduação vêm do `nicho.json`.
- `python 00-SISTEMA/bin/aprovar.py enviar <slug>` manda o vídeo ou os slides para o Telegram, com os botões.
- **Encerre a rodada.** A publicação acontece sozinha no `vigiar` (agendado a cada 10 min) quando o usuário toca em ✅.
- **Sem a API do Instagram** (`insta.py conferir` falha: falta `segredos/instagram.json`), o `vigiar` não publica sozinho. Caminho alternativo: depois do ✅, a sessão agenda pelo **MCP do Metricool** (`publicador`, item 1). Status 17/11: API **configurada e validada** (@well.free, token de página sem validade, `instagram_content_publish` ok); MCP do Metricool configurado, falta autenticar.
- Nunca publique sem o ✅ do usuário. Nunca publique como Reel público se `publicar_como` for "teste".

## Economia de tokens
- Leia só os resumos que os scripts imprimem e 1 imagem por etapa (os mosaicos).
- Copie a estrutura do último `roteiro.json` ou `carrossel.json` em vez de reler a documentação.
- Pesquisas pesadas vão para um subagente barato, que devolve só a conclusão.
