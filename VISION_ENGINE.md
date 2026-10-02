# Motor de visão

Ficheiro: `src/engines/vision/candle-extractor.ts`.

## O que faz

1. Recusa imagem abaixo de 480×320 (`VISION_002`).
2. Separa píxeis verdes e vermelhos do fundo, em tema claro ou escuro.
3. Ignora menu e barra lateral quando não têm essas cores.
4. Agrupa colunas em velas.
5. Mede corpo, pavio superior, pavio inferior, máxima e mínima.
6. Devolve preços na escala relativa da área do gráfico. Não inventa cotação absoluta.
7. Com menos de 5 velas, recusa a leitura (`VISION_001`).
8. Com menos de 15 velas, marca contexto insuficiente e baixa a confiança.

## O que não faz

Não usa um modelo de linguagem para dizer compra ou venda. Não afirma uma vela que a cor e a geometria não sustentam.

## Limite

A leitura de print erra mais do que um feed estruturado. Cada vela traz uma confiança. A confiança global é a média. Os gráficos de teste são sintéticos; a taxa de erro em prints reais ainda precisa de um conjunto rotulado pelo mentor.
