# Livro de regras — versão 1.0.0

Prioridade: texto do Guia e do manual, depois a especificação funcional. Onde o texto não chega, o estado é `PENDING_MENTOR_VALIDATION`.

## Comando

Fonte: Guia, “O que é um comando”.

- Compra: abertura igual à mínima e ainda há pavio no fechamento.
- Venda: abertura igual à máxima e ainda há pavio no fechamento.
- Candle sem pavio nos dois lados é candle mágico, não comando.
- Rompimento sem pavio não é entrada.
- Retorno à linha, com fechamento do lado do corpo, não escolhe sozinho entre retração e reversão. Os cenários que separam os dois estão em imagem.

## Taxa única

Fonte: Guia, “Candle de taxa única”.

- Pavio na abertura e ausência de pavio no fechamento.
- A linha fica no fechamento.
- O rompimento segue o mesmo filtro de pavio do comando.

## Contexto

Fonte: Guia, ciclos; manual, fundamento 2.

- Alta: últimos topos e fundos ascendentes.
- Baixa: últimos topos e fundos descendentes.
- Sem essa estrutura, a tendência fica indefinida.
- Com topos e fundos na mesma direção, o ciclo é correção em tendência.
- Com topos e fundos sem direção única, o ciclo é correção lateral.
- O ciclo consolidado não é atribuído. O Guia o trata como operável e também lista gráficos de consolidação entre os que não operar.
- O ciclo tendencial não é forçado: “agressivo” não tem número validado.

Operacional permitido:

- Correção em tendência: retração, reversão, rompimento e continuação.
- Correção lateral: retração e reversão.
- Tendencial: só quando for classificado no futuro, rompimento e continuação.

## Gatilho de 15 segundos

Fonte: Guia, retração no comando. O valor 15 está no material. Aplica-se ao M1. Outros timeframes continuam pendentes.

O print não mostra o caminho interno da vela. A confirmação exige que a reação seja a vela atual e que o utilizador informe os segundos. Fora da janela, a entrada não é sugerida.

## Espaço

Fonte: manual e apanhados, “sem espaço até a próxima defesa, sem entrada”.

A defesa reconhecida nesta fase é um topo ou fundo onde o preço já reagiu. A distância mínima não tem número. Enquanto `defenseDistanceRatio` for nulo, o gate de espaço não passa.

## Confluências

Fonte: Guia, mínimo de 3. Famílias separadas: ciclo, tendência, marcação e gatilho temporal. Comando, comando respeitado e comando confirmado não contam três vezes.

## Notícias

Fonte: especificação funcional, secção 7. O calendário automático não está ligado. O estado vem da declaração de quem enviou o print. No mercado real, bloqueio impede operar. No OTC, a mesma declaração é cautela, não causa do preço sintético.

## Fora desta versão

Taxa dividida, nova posição, primeiro registro, dupla e tripla posição, lotes, exaustão, preço fechado como entrada, pressão, travamento operacional, candles clássicos e o perfil de 5 segundos. O candle mágico só é identificado.
