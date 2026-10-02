# UCHIHA IA

Leitura estruturada de gráficos pela Lógica do Preço. O sistema sugere e explica. Não envia ordens.

## O que a versão 1.0.0 faz

1. Criar conta e entrar.
2. Enviar um print com ativo, regime (real ou OTC), timeframe e estado de notícia.
3. Extrair velas da imagem.
4. Classificar contexto quando há topos e fundos suficientes.
5. Identificar comando e taxa única.
6. Contar confluências independentes e aplicar os gates.
7. Devolver uma decisão explicada e guardar o histórico.

Sem os parâmetros numéricos que os materiais não definem, a decisão não avança para operar. Isso é intencional.

## Arranque local

```bash
npm install
npm test
npm run dev
```

Sem variáveis do Supabase, a autenticação e o histórico ficam em `.data/`, fora do git. Para produção, preencha `.env.example` e aplique `supabase/migrations/20261002150000_initial.sql`.

## Documentos

- `IMPLEMENTATION_PLAN.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `RULEBOOK.md`
- `DECISION_ENGINE.md`
- `VISION_ENGINE.md`
- `API.md`
- `TEST_PLAN.md`
- `RULE_CHANGELOG.md`
- `OPEN_QUESTIONS.md`

## Aviso

Operar opções binárias pode levar à perda de todo o valor investido. A confiança mostrada é a confiança da leitura, não uma probabilidade de ganho.
