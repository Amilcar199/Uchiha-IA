# Questões em aberto

Nenhuma foi resolvida por suposição. O estado inicial de todas é `PENDING_MENTOR_VALIDATION`.

| ID | Descrição | Fonte | Estado | Parâmetro proposto | Decisão | Decidido por | Decidido em |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-01 | O ciclo consolidado é operável ou entra nos gráficos que não se operam? | Guia, ciclos e “quais gráficos não operar”; especificação funcional, ponto 1 | PENDING_MENTOR_VALIDATION | Não classificar automaticamente |  |  |  |
| OQ-02 | Rompimento sem pavio não se pega no comando, mas o preço fechado permite continuidade sem pavio. Qual contexto vale? | Guia, comando e preço fechado; especificação, ponto 2 | PENDING_MENTOR_VALIDATION | No comando e na taxa única, sem pavio não é entrada |  |  |  |
| OQ-03 | Os 15 segundos foram descritos para a retração. Como se aplicam ao M5 e a outras plataformas? | Guia; especificação, ponto 3 | PENDING_MENTOR_VALIDATION | `first15SecondsRule.applicableTimeframes = ["M1"]` |  |  |  |
| OQ-04 | O que é pavio longo, pavio pequeno e pavio muito grande? | Guia, reversão e taxa dividida; especificação, ponto 4 | PENDING_MENTOR_VALIDATION | `longWickRatio = null`, `smallWickRatio = null` |  |  |  |
| OQ-05 | Qual distância conta como espaço até a próxima defesa, e o que é “perto”? | Manual e apanhados; especificação, ponto 4 | PENDING_MENTOR_VALIDATION | `defenseDistanceRatio = null`, `proximityTolerance = null` |  |  |  |
| OQ-06 | Reversão após o rompimento e os setups das páginas 40–42 estão só em imagem. | Guia, páginas 9 e 40–42 | PENDING_MENTOR_VALIDATION | Não implementar |  |  |  |
| OQ-07 | O material do Mago dos Candles ainda não entrou. Quando os nomes coincidirem, qual regra prevalece? | Especificação técnica, secção 7; especificação funcional, ponto 6 | PENDING_MENTOR_VALIDATION | Não misturar |  |  |  |
| OQ-08 | Qual é a janela de bloqueio por notícia e o que conta como alto impacto? | Especificação funcional, secção 7 | PENDING_MENTOR_VALIDATION | `newsBlockWindowMinutes = null` |  |  |  |
| OQ-09 | Quais plataformas e pares entram na versão 1? | Especificação funcional, ponto 8 | PENDING_MENTOR_VALIDATION | Qualquer par informado; print da plataforma operada |  |  |  |
| OQ-10 | Como separar, só com o corpo e os pavios, retração e reversão no mesmo toque da linha? | Guia, cenários em imagem | PENDING_MENTOR_VALIDATION | Conflito e aguardar |  |  |  |
| OQ-11 | Quantos dias uma imagem fica guardada? | Especificação de privacidade | PENDING_MENTOR_VALIDATION | Apagar só por pedido, sem prazo inventado |  |  |  |
