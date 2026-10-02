# Plano de testes

Comando: `npm test`.

O runner é o `node:test`, porque o binário nativo do Vitest foi bloqueado pela política de aplicativos desta máquina.

## Já cobertos

- Compra e venda de comando.
- Não detectar comando quando a abertura não é a mínima.
- Candle mágico separado do comando.
- Taxa única e o caso negativo com pavios dos dois lados.
- Menos de 3 confluências → aguardar.
- Notícia bloqueada → não operar.
- Imagem rejeitada → não operar.
- Sinais contraditórios → aguardar.
- Três confluências, gatilho e espaço → compra.
- Gatilho ausente → aguardar.
- Espaço sem parâmetro → aguardar.
- A mesma série, no orquestrador, só opera quando o parâmetro de espaço é injetado.
- Visão em tema escuro, tema claro, barra lateral, resolução baixa e poucas velas.

## Ainda por fazer

- Prints reais rotulados pelo mentor.
- Dupla posição, tripla posição, nova alta, nova baixa, defesa e preço fechado, quando essas regras entrarem.
- Regressão de cada mudança de regra, registada em `RULE_CHANGELOG.md`.
- Replay que receba apenas as velas disponíveis naquele instante.

## Regra de regressão

Um teste antigo só muda quando a alteração da regra for intencional e estiver no changelog.
