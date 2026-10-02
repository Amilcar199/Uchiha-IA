# API

Todas as rotas, excepto o registo e o login, exigem sessão.

| Método | Rota | Função |
| --- | --- | --- |
| POST | `/api/auth/register` | Cria conta |
| POST | `/api/auth/login` | Entra |
| POST | `/api/auth/logout` | Sai |
| GET | `/api/auth/me` | Sessão atual |
| POST | `/api/analyses` | Recebe o print e corre visão, regras e decisão |
| GET | `/api/analyses` | Histórico, com filtros |
| GET | `/api/analyses/:id` | Análise guardada |
| DELETE | `/api/analyses/:id` | Apaga análise e imagem |
| GET | `/api/analyses/:id/image` | Imagem privada |
| POST | `/api/analyses/:id/vision` | Relê a imagem guardada |
| POST | `/api/analyses/:id/evaluate` | Devolve a decisão já gravada, sem recalcular com regra nova |
| POST | `/api/analyses/:id/outcome` | Regista se seguiu e o resultado |
| POST | `/api/analyses/:id/feedback` | Parecer do mentor, sem mudar a regra |
| GET | `/api/rules/parameters` | Parâmetros e o que está pendente |

## Erros

Cada erro tem código, mensagem para o utilizador e detalhe técnico só no log.

Exemplos: `VISION_001`, `VISION_002`, `AUTH_001`, `ANALYSIS_002`.

## Campos do print

`image`, `asset`, `marketRegime` (`REAL` ou `OTC`), `timeframe` (`M1`, `M5`, `M15`), `platform`, `secondsElapsed`, `newsDeclaration` (`FREE`, `ATTENTION`, `BLOCKED`, `UNKNOWN`).

## Registo

Cada conclusão grava `analysis_id`, `request_id`, durações da visão, das regras e da decisão, a versão da regra e o estado. Não grava palavra-passe nem credencial de corretora.
