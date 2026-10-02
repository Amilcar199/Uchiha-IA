# Base de dados

A migration está em `supabase/migrations/20261002150000_initial.sql`.

## Tabelas

`profiles`, `analyses`, `analysis_images`, `candles`, `market_contexts`, `markings`, `patterns`, `confluences`, `decisions`, `rule_versions`, `rule_parameters`, `rule_executions`, `analysis_outcomes`, `mentor_feedback`, `news_events`, `audit_logs`.

`analyses.payload` guarda o resultado completo da versão que produziu a leitura. As tabelas filhas existem para consulta. O resultado posterior e o feedback do mentor não reescrevem a análise.

## Papéis

- `USER` lê e cria o que é seu.
- `MENTOR` lê análises para revisão e regista feedback.
- `ADMIN` gere regras, parâmetros e auditoria.

## Storage

Bucket privado `analysis-images`.

```text
user_id/ano/mês/analysis_id/original.png
```

No modo local, o mesmo caminho fica sob `.data/images`.

## Retenção

Não há prazo automático. O número de dias não está definido nos materiais. O utilizador pode apagar a análise e a imagem. Um prazo de retenção fica pendente.

## Modo local

Sem `NEXT_PUBLIC_SUPABASE_URL`, contas e análises ficam em `.data/db.json`. Esse modo serve para desenvolver. Produção deve usar o Supabase e a RLS da migration.
