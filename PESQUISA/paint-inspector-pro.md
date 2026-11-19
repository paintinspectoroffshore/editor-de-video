# Paint Inspector Pro: resumo factual (leitura, nada alterado)
Fonte: `D:\PROJETOS\1- Projetos\2- Paint Inspector Pro`. So fatos do codigo/docs.

## 1. O que e
- Nome: Paint Inspector Pro (pubspec `paint_inspector_pro`, v1.3.12+39).
- App de inspecao de pintura industrial + SaaS web (README).
- Plataforma: Flutter/Dart. Android = alvo. README: "iOS nao existe".
- Web: Flutter web so para teste de UI. Pastas `web/` e `pwa/`.
- Backend: Supabase. Arquivos: Cloudflare R2. Pagamento: Asaas. IA: Gemini via proxy Supabase.
- Site/portal: `Landing Page/` (Astro, Cloudflare Pages).
- Rodar web (RUNBOOK.md:193): `flutter run -d web-server --web-port 8080 --web-hostname 127.0.0.1` + headers COOP/COEP + `--dart-define-from-file=tool/release_defines.production.json`.
- URLs nas docs: paintinspector.com.br, paintinspector.pages.dev, staging.app.paintinspector.com.br. URL final de producao: nao encontrado.

## 2. Telas e modulos
- Rotas: 58 (`lib/app/app.dart`). Barra: Inicio, Documentos, Acoes (+), Relatorios.
- Inicio (grade): Normas, Procedimentos, Criterios, Tintas, Calculos, Equipamentos. Tambem Buscar, Escanear QR, Digitalizar PDF, Simulados.
- Acoes (+): Nova Inspecao, Novo Projeto, Novo Documento, Calculos, Novo Checklist, Relatorios, Delineamento, Controle de Tinta, Passagem de Servico, Subir arquivo.
- Condicoes ambientais (card na Inicio -> `/environmental-analysis`):
  - Campos: temp. do ar, umidade, orvalho (calculado, so leitura), temp. da superficie, vento.
  - Clicar num campo abre edicao manual (override salvo em preferencias).
  - Dado ao vivo: Open-Meteo. Sem dado: fallback 28 C, 65 %, 12 km/h, orvalho 24,1 C.
  - Criterios: sem chuva/neblina (N-13); umidade <85 % (N-13/N-9); temp. >=5 C (N-13); superficie >=3 C acima do orvalho (N-13/N-9).
  - Resultado: "Propicio" ou "Improprio p/ pintura" (`paint_suitability.dart`).
- Normas: 94 seeds fixos em `standard_repository.dart`. PETROBRAS 35, ABNT 27, ISO 17, SSPC 12, NACE 3. Ex.: PETROBRAS N-0002/N-0009/N-0013/N-1374/N-2677; ISO 8501-1, 8502-3/-6, 8503, 12944, 4624, 2808, 9227, 2409; ABNT NBR 15158/11003/16172; SSPC-SP 1/5/6/10/11, PA 2, VIS 1.
- Normas so citadas no codigo: ASTM D3359/D4541/D4285/D4752; NACE SP0188.
- Procedimentos: ~30 (`petrobras_procedures_data.dart`) + esquemas de pintura.
- Criterios: aceitacao/rejeicao, metodo, frequencia. Padroes fotograficos. Nao contei.
- Tintas: 54 entradas, 5 fabricantes (WEG, Sherwin-Williams/Sumare, Renner, Jotun, International/AkzoNobel), ~11 cada. Boletins tecnicos por fabricante em `assets/boletins_tecnicos/`.
- Cores: tabela Munsell N, ~125 elementos, 8 secoes (Padroes, Estruturas, Vasos e Processos, Tubulacoes, Sistemas Navais, Equipamentos, Seguranca, Sistemas).
- Calculos (15 telas `/calc/*`): Ponto de Orvalho (Magnus a=17,27 b=237,7); Conversoes (um->mil x25,4; m2->ft2 x10,7639; L->gal x0,264172; C->F); WFT (DFT/solidos); Area (retangulo, cilindro); MPa->psi/kgf; Rendimento teorico e pratico (perdas, over spray); Eficiencia; Tempo estimado; Produtividade (m2/h, homem-hora); Delineamento (m/mm); Bresle (ISO 8502-6/-9); Holiday (NACE/AMPP SP0188); Aceite DFT (SSPC-PA 2); Consumo por metodo (trincha, pistola, airless, HVLP, eletrostatica).
- Relatorios: RIP, RF (fotografico), Combinado (RIP+RF), importar Excel/Word/PDF, criar com IA. Tambem modelos, cronologicos, auditoria (beta), QR e PDF.
  Modelos: check_list, data_book, formularios de inspecao, planilha de avanco, cronologico, rip-rf-lv.
- Simulado:
  - 1327 questoes, 216 temas. Facil 781, medio 293, dificil 253.
  - 4 alternativas, gabarito, explicacao, fonte.
  - Config: 15/20/30/40/50 questoes; temas; nivel; correcao imediata ou ao final; botao "Rapido" = facil.
  - Ranking de Inspetores: XP, nivel, sequencia, posicao ("#x de y"), "faltam N XP". Perfil publico. Historico, progresso. XP zera apos dias sem pratica.
- Equipamentos: cadastro, busca por QR/codigo, calibracao.
- Controle de Tinta: lote, validade, status "Vencida", exportacao.
- Nova Inspecao: projeto ou avulsa, tipo, estrutura, local, sistema, demaos, DFT min/max, preparo, fotos, inspetor.
- Outros: Documentos, Projetos, Checklists, Glossario, Governanca, Analytics, Passagem de Servico, Fabricantes, Planos, Configuracoes (MFA, equipe, logs, admin).

## 3. Numeros verificaveis
- Normas: 94. Questoes: 1327 (216 temas). Calculos: 15. Relatorios padrao: 3 (+ importacao + IA). Tintas: 54 (5 fabricantes). Cores: ~125. Rotas: 58. Procedimentos: ~30.

## 4. Fluxo diario (ordem pelo menu; nao documentada)
1. Inicio: ver condicoes ambientais (ou sobrescrever com leitura do local).
2. Consultar Normas, Criterios, Procedimentos, Tintas, Cores.
3. Calculos (WFT, rendimento, consumo, Bresle, Holiday, DFT).
4. Projetos -> Nova Inspecao (tipo, sistema, DFT, fotos).
5. Controle de Tinta e Equipamentos.
6. Relatorios RIP/RF/Combinado -> PDF/Excel.

## 5. Versao web no PC
Sim, so para teste de UI (RUNBOOK), nao e release.

## 6. Arquivos principais
1. `README.md`  2. `pubspec.yaml`  3. `PROJECT_MASTER.md` (720 KB; buscar, nao ler inteiro)  4. `RUNBOOK.md`
5. `lib/app/app.dart`  6. `lib/features/home/screens/environmental_analysis_screen.dart`
7. `lib/core/utils/paint_suitability.dart`  8. `lib/core/utils/calculations.dart`
9. `lib/features/calculations/screens/calculations_screen.dart`  10. `lib/features/standards/repositories/standard_repository.dart`
11. `lib/features/simulados/data/question_bank_seed.dart`  12. `lib/features/colors/screens/color_codes_screen.dart`
13. `lib/features/reports/screens/create_report_selection_screen.dart`  14. `lib/features/home/home_screen.dart`  15. `lib/features/simulados/screens/simulados_config_screen.dart`

Imagens:
- Prints: `Img-Paint Inspector Pro\Atual\` (12 jpeg, ex.: "Condicoes ambientais.jpeg", "Menu.jpeg") e `Img-Paint Inspector Pro\New\` (9).
- Logo: `assets\branding\paint_inspector_logo_pdf.png`; icone: `assets\branding\paint_inspector_icon.png`.
- Icone 512: `web\icons\Icon-512.png`. Feature graphic e screenshots: `playstore_assets\` (screenshot_01..11.jpg).

## Pontos de atencao
- Normas sao seed fixo. Conferir edicao vigente antes de citar no video.
- Sem leitura ao vivo o app mostra valores padrao (28 C, 65 %). Nao usar como medicao.
- Campo `fonte` de algumas questoes: "edicao aplicavel deve ser confirmada". Nao afirmar numero de norma sem checar.
- Nao li `ferramentas/` nem `build/`.
- Nao encontrado: URL final de producao e planos/precos atuais.
