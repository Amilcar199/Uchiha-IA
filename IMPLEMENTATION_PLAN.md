# Plano de implementação

## 1. Estado atual

A pasta do projeto estava vazia. Os materiais da metodologia estão em `Documents/Btest` e foram lidos antes de qualquer regra ser codificada. Não foram copiados para o repositório.

## 2. Stack encontrada

Não havia aplicação. A stack foi criada agora.

## 3. Stack final

- Next.js 15, React 19, TypeScript, Tailwind CSS 4, App Router
- Route handlers no mesmo projeto, com domínio e motores fora da interface
- PostgreSQL via Supabase, com migration versionada e RLS
- Modo local em `.data/` quando o Supabase ainda não está configurado
- Visão com leitura de píxeis (`sharp`), sem modelo de linguagem a decidir compra ou venda

## 4. Arquitetura

```text
UI → API → AnalysisOrchestrator
              → VisionEngine
              → SupremeEngine
              → UchihaEngine
              → SharinganEngine
              → NewsEngine
              → ConfluenceEngine
              → DecisionEngine
              → repositório
```

Nenhuma regra de trading fica em componente React.

## 5. Banco

Ver `DATABASE.md` e `supabase/migrations/20261002150000_initial.sql`.

## 6. Frontend

Painel, análise, histórico, parâmetros e páginas de conta. O modo estudo só informa que chega numa fase seguinte.

## 7. Backend

Os endpoints da especificação estão em `API.md`. A criação da análise corre o fluxo completo.

## 8. Visão

A visão recorta a região colorida do gráfico, agrupa colunas em velas e devolve preços relativos. Se não houver velas suficientes, a decisão é não operar.

## 9. Motor de regras da fase 1

Implementado, com origem nos materiais:

- comando de compra e de venda
- taxa única
- identificação do candle mágico, só para não confundi-lo com comando
- contexto por topos e fundos
- gatilho dos 15 segundos no M1, quando os segundos são informados
- mínimo de 3 confluências
- gates de imagem, metadados, notícia, contexto, conflito, gatilho e espaço

Não implementado como entrada, porque a fase 2 ainda não começou ou a regra visual não tem texto suficiente:

- candle mágico operacional, taxa dividida operacional, nova posição, primeiro registro, lotes, pressão, preço fechado como entrada, candles clássicos, motor de 5 segundos

## 10. Testes

`npm test` cobre comando, taxa única, decisão, contexto, orquestração e visão em gráficos sintéticos.

## 11. Ordem que foi seguida

1. Leitura dos PDFs de especificação, do manual e do guia.
2. Plano e documentos.
3. Domínio, motores e testes.
4. API, autenticação, histórico e interface.

## 12. Validação humana

Os pontos continuam em `OPEN_QUESTIONS.md`. Enquanto `defenseDistanceRatio` for nulo, o sistema responde aguardar mesmo com o resto da leitura alinhado.
