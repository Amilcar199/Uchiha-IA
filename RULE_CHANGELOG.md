# Changelog das regras

## 1.1.0 — 2026-10-02

Entram as marcações que a primeira versão só deixava de fora: taxa dividida, nova posição, primeiro registro, nova alta e nova baixa, dupla e tripla posição, posicionamento, domínio, lotes, conexão, exaustão, preço fechado, vela de força, alvos e os candles clássicos do Lorenz.

- A taxa dividida só existe com taxa única antes do comando.
- O primeiro registro deixa de valer no quarto rompimento.
- No rompimento sem pavio continua a valer o comando, não o preço fechado.
- O ciclo tendencial só aparece se o número de velas seguidas estiver configurado. O padrão continua nulo.
- O perfil de 5 segundos fica desligado.
- Pavio longo, espaço até a defesa e janela de notícia continuam sem número.

## 1.0.0 — 2026-10-02

Primeira versão executável.

- Comando e taxa única seguem o texto do Guia.
- Candle mágico é só identificado.
- Contexto usa topos e fundos, sem limiar inventado para o ciclo tendencial.
- O ciclo consolidado não é classificado.
- Espaço, pavio longo, pavio curto, proximidade e janela de notícia ficam nulos.
- A janela de 15 segundos vale para o M1 porque o número está no Guia. Fora do M1 continua pendente.
- Nenhuma análise desta versão deve ser relida em silêncio por uma regra futura.
