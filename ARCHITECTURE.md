# Arquitetura

A UCHIHA IA responde ao que o preço mostra segundo a metodologia. Não estima para onde o preço vai.

## Camadas

| Camada | Pasta | Função |
| --- | --- | --- |
| Interface | `src/app`, `src/components` | Formulário, histórico e explicação |
| API | `src/app/api` | Autenticação, análise, resultado e feedback |
| Orquestração | `src/engines/orchestrator` | Liga visão, contexto, regras, notícia e decisão |
| Suprema | `src/engines/supreme` | Tendência e ciclo |
| Uchiha | `src/engines/uchiha` | Comando e taxa única |
| Sharingan | `src/engines/sharingan` | Janela dos 15 segundos |
| Notícias | `src/engines/news` | Declaração do utilizador e separação do par |
| Confluência | `src/engines/confluence` | Famílias independentes |
| Decisão | `src/engines/decision` | Gates e texto da leitura |
| Dados | `src/repositories`, `supabase/migrations` | Histórico e RLS |

## Fluxo

```text
print → validação → velas → contexto → regras → gatilho → notícia → confluências → gates → decisão → registo
```

## O que esta versão não faz

- Não executa ordens.
- Não guarda senha de corretora.
- Não raspa o TradingView.
- Não trata o print OTC como se fosse o par real.
- Não altera uma análise antiga quando a regra mudar.
- Não mostra taxa de acerto.

## Confiança

`baixa`, `media` ou `alta` medem a leitura. Não são probabilidade de ganho.

## Versão

A versão corrente é `1.0.0`. O resultado gravado guarda essa versão.
