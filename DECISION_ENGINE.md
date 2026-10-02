# Motor de decisão

Função: `evaluateDecision` em `src/engines/decision/decision-engine.ts`.

A ordem segue a especificação funcional, secção 12.

| Gate | Pergunta | Se falhar |
| --- | --- | --- |
| Imagem | As velas são legíveis? | Não operar |
| Metadados | Há ativo, regime e timeframe? | Aguardar |
| Notícia real | Há bloqueio declarado? | Não operar |
| Notícia OTC | Há bloqueio declarado? | Aguardar, como cautela |
| Contexto | O ciclo foi classificado? | Aguardar |
| Conflito | As leituras apontam para lados diferentes, ou retração e reversão não se separam? | Aguardar |
| Confluência | Há pelo menos 3 famílias independentes? | Aguardar |
| Gatilho | A reação está na vela atual, dentro dos 15 segundos do M1? | Aguardar |
| Espaço | O parâmetro de distância está validado e a folga existe? | Aguardar |
| Contexto visual | Há pelo menos 15 velas? | Aguardar |

Estados: `OPERAR_COMPRA`, `OPERAR_VENDA`, `AGUARDAR`, `NAO_OPERAR`.

A explicação cita o ciclo, a tendência, as confluências e o que ainda falta. Não usa percentagem de acerto.

Com os parâmetros de fábrica, uma leitura alinhada termina em aguardar por falta de espaço validado. O teste do motor mostra compra apenas quando esse parâmetro é injetado de propósito.
