# WWP Backend — CRM Imobiliário com WhatsApp & IA

Backend produção-ready para CRM imobiliário com integração WhatsApp via **UazAPI**, orquestração de agentes com **LangGraph** e pipeline completo de atendimento automatizado.

## Stack

| Camada | Tecnologia |
|---|---|
| API | FastAPI 0.115, Python 3.12, Pydantic v2 |
| Banco | PostgreSQL 16, SQLAlchemy 2.x async |
| Cache/Broker | Redis 7 |
| Workers | Celery 5 (4 filas) + Beat scheduler |
| IA | LangGraph, langchain-openai (GPT-4o) |
| Storage | MinIO (S3-compatible) |
| WhatsApp | UazAPI (HTTP + Webhooks) |
| Infra | Docker Compose (6 serviços) |

---

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   UazAPI     │────▶│  Webhook     │────▶│  Celery      │
│  (WhatsApp)  │     │  Endpoint    │     │  Worker      │
└─────────────┘     └──────────────┘     └──────┬───────┘
                                                │
        ┌───────────────────────────────────────┤
        ▼              ▼              ▼         ▼
   ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
   │ Routing │  │  Contact   │  │  Chat    │  │ LangGraph│
   │ Engine  │  │  Service   │  │ Service  │  │  Agent   │
   └─────────┘  └───────────┘  └──────────┘  └──────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   PostgreSQL 16   │
                    └───────────────────┘
```

### Fluxo de Mensagem

1. **Webhook UazAPI** → `POST /webhooks/uazapi/{secret}`
2. **Identificação da conexão** via `webhook_secret_ref`
3. **Dedup** por `evento_externo_id` + fallback SHA-256 hash
4. **Celery task** `process_webhook_event`:
   - Parser tolerante (UazAPI mapper) extrai campos canonicos
   - `find_or_create` Contato pelo telefone E.164
   - Verifica chat ativo existente → encaminha msg
   - Senão: **Routing Engine** avalia regras por prioridade
   - Cria Oportunidade, abre Chat, invoca **LangGraph agent**
5. **Resposta do agente** → `UazAPI send_text` → salva mensagem saída

---

## Estrutura de Diretórios

```
app/
├── api/
│   ├── deps/           # Dependências (auth, session)
│   ├── routes/         # health, webhooks, admin_crud, admin_ops
│   └── schemas/        # Pydantic v2 schemas
├── core/               # config, database, redis, storage, celery, security, logging
├── domain/
│   ├── enums/          # Todos os enums de negócio
│   └── models/         # 14 modelos SQLAlchemy
├── graphs/
│   ├── nodes/          # Nós LangGraph (classify, respond, handoff, etc.)
│   ├── prompts/        # System prompts por agente
│   ├── graphs.py       # Graph builders (triagem, vendas, aluguel)
│   ├── registry.py     # Registry de grafos compilados
│   └── state.py        # AgentState definition
├── providers/
│   └── uazapi/         # client HTTP, mapper defensivo, adapter
├── repositories/       # Base genérico + repos especializados
├── services/           # Lógica de negócio (chat, message, routing, etc.)
└── workers/
    └── tasks/          # webhook, message, scheduled (beat)
alembic/                # Migrations
scripts/                # seed.py
tests/                  # Testes unitários
```

---

## Quick Start

### 1. Configurar ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais reais
```

### 2. Subir serviços

```bash
make build
make up
```

Serviços Docker:

| Serviço | Porta | Descrição |
|---|---|---|
| `api` | 8000 | FastAPI (uvicorn) |
| `worker` | — | Celery worker (4 filas) |
| `beat` | — | Celery Beat scheduler |
| `postgres` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 |
| `minio` | 9000/9001 | MinIO (S3 storage) |

### 3. Rodar migrations

```bash
make migrate
```

### 4. Seed (dados iniciais)

```bash
make seed
```

Cria: 1 empresa (Salu Imóveis), 2 filiais (Sorocaba, BC), 3 equipes, 4 agentes IA, 3 conexões, 6 regras de roteamento — tudo com UUIDs determinísticos.

### 5. Verificar saúde

```bash
make health   # GET /health
make ready    # GET /ready (checa db, redis, storage)
```

---

## Endpoints da API

### Health

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness (db + redis + storage) |

### Webhooks

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/webhooks/uazapi/{secret}` | Recebe webhook UazAPI |

### Admin CRUD

Rotas RESTful geradas dinamicamente para todas as entidades:

`/admin/{entidade}` — `GET` (listar), `POST` (criar)
`/admin/{entidade}/{id}` — `GET` (detalhe), `PUT` (atualizar), `DELETE` (remover)

Entidades: `empresas`, `filiais`, `equipes`, `usuarios`, `agentes-ia`, `conexoes`, `regras-roteamento`, `contatos`, `oportunidades`, `imoveis`

### Admin Operacional

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/admin/chats` | Listar chats (filtro: empresa, contato, status) |
| `GET` | `/admin/chats/{id}` | Detalhe do chat |
| `GET` | `/admin/chats/{id}/mensagens` | Mensagens do chat |
| `POST` | `/admin/chats/{id}/mensagens` | Enviar mensagem pelo chat |
| `POST` | `/admin/chats/{id}/handoff` | Transferir para humano |
| `POST` | `/admin/chats/{id}/close` | Fechar chat |
| `POST` | `/admin/chats/{id}/resume` | Retomar chat |
| `POST` | `/admin/chats/{id}/assign-agent` | Atribuir agente IA |
| `POST` | `/admin/uazapi/instance` | Criar instância UazAPI |
| `GET` | `/admin/uazapi/instance/{id}/status` | Status da instância |

### Autenticação

- **API Key**: header `X-API-Key` (variável `API_KEY`)
- **JWT Bearer**: header `Authorization: Bearer <token>`
- Webhooks não requerem auth (autenticados pelo `secret` na URL)

---

## Routing Engine

O motor de roteamento avalia regras JSONB ordenadas por prioridade. Condições suportadas:

| Condição | Tipo | Descrição |
|---|---|---|
| `palavras_chave` | `string[]` | Match case-insensitive no texto |
| `horario_comercial` | `bool` | Dentro/fora do horário |
| `tipo_conexao` | `string` | Canal da conexão |
| `opt_out` | `bool` | Contato marcou opt-out |
| `primeira_mensagem` | `bool` | Primeiro contato |
| `chat_ativo` | `bool` | Já existe chat ativo |
| `origem` | `string` | Origem do contato |

Ações: `ABRIR_CHAT`, `ENCAMINHAR_HUMANO`, `IGNORAR`

---

## Agentes LangGraph

4 grafos pré-configurados:

| graph_id | Tipo | Descrição |
|---|---|---|
| `triagem_sorocaba` | Triagem | Classifica intent → roteia para vendas/aluguel |
| `vendas_sorocaba` | Vendas | Qualifica lead, busca imóveis, agenda visita |
| `aluguel_sorocaba` | Aluguel | Qualifica para locação |
| `vendas_bc` | Vendas | Vendas Balneário Camboriú |

### Flow dos Grafos

**Triagem**: `classify_intent` → (vendas/aluguel/humano) → `respond`
**Vendas/Aluguel**: `update_crm` → `respond` → (handoff/search_property/continue/end)

---

## Celery Workers

### Filas

| Fila | Prioridade | Uso |
|---|---|---|
| `webhooks` | Alta | Processamento de webhooks |
| `messages` | Alta | Envio de mensagens |
| `agents` | Normal | Execução de agentes IA |
| `default` | Normal | Demais tarefas |

### Beat Schedule

| Task | Intervalo | Descrição |
|---|---|---|
| `retry_failed_messages` | 5 min | Reenvia mensagens com falha |
| `close_idle_chats` | 10 min | Fecha chats inativos (> 60 min) |
| `cleanup_temp_files` | 1 hora | Limpa arquivos temporários |
| `reprocess_error_webhooks` | 15 min | Reprocessa webhooks com erro |
| `sync_connection_status` | 30 min | Sincroniza status das conexões |

---

## Variáveis de Ambiente

Veja `.env.example` para o template completo. Principais:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | PostgreSQL async connection string |
| `REDIS_URL` | Redis (cache + locks) |
| `CELERY_BROKER_URL` | Redis (broker) |
| `UAZAPI_BASE_URL` | URL da instância UazAPI |
| `UAZAPI_ADMIN_TOKEN` | Token admin UazAPI |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `OPENAI_MODEL` | Modelo LLM (default: gpt-4o-mini) |
| `API_KEY` | Chave de autenticação da API admin |
| `JWT_SECRET_KEY` | Secret para tokens JWT |

---

## Banco de Dados

14 tabelas com PostgreSQL 16:

`empresas` → `filiais` → `equipes` → `usuarios`
`agentes_ia`, `conexoes` (por empresa)
`regras_roteamento` (por conexão, JSONB conditions)
`contatos` (unique por empresa+telefone)
`oportunidades` (contato + filial + linha de negócio)
`chats` (partial unique index: 1 chat ativo por contato+conexão)
`mensagens` (com dedup por mensagem_externa_id)
`eventos_webhook` (dedup por evento_externo_id + hash)
`imoveis`, `interesses_imovel`

### Migrations

```bash
make migrate                         # Aplica migrations
make migrate-create MSG="descrição"  # Cria nova migration
```

---

## Testes

```bash
make test       # Roda testes
make test-cov   # Testes com cobertura
```

Cobertura de testes inclui:
- **UazAPI Mapper**: 15 testes (payloads baileys, flat, status, image, from_me, edge cases)
- **Routing Engine**: Regras, prioridades, keywords, opt-out, fallback
- **Chat Service**: Open, close, handoff, resume, assign
- **Message Service**: Inbound dedup, outbound, status updates
- **Webhook Dedup**: By ID, by hash, deterministic hashing
- **Health Endpoint**: Liveness + readiness com mocks
- **Webhook Flow**: Endpoint → dedup → dispatch (route-level)

---

## Comandos Úteis

```bash
make help          # Lista todos os comandos
make up            # Sobe serviços
make down          # Para serviços
make build         # Build das imagens
make rebuild       # Build sem cache
make logs          # Logs de todos
make logs-api      # Logs da API
make logs-worker   # Logs do worker
make shell         # Shell no container API
make db-shell      # psql no Postgres
make redis-cli     # redis-cli
make lint          # Ruff check
make format        # Ruff format
```

---

## Modelos de Dados

### Enums

- **LinhaNegocio**: VENDA, ALUGUEL, TEMPORADA
- **Canal**: WHATSAPP, TELEGRAM, INSTAGRAM, WEBCHAT
- **Provedor**: UAZAPI, EVOLUTION, MANUAL
- **AcaoRoteamento**: ABRIR_CHAT, ENCAMINHAR_HUMANO, IGNORAR
- **StatusChat**: ABERTO, ABERTO_IA, AGUARDANDO_HUMANO, EM_ATENDIMENTO, ENCERRADO
- **DirecaoMensagem**: ENTRADA, SAIDA
- **AutorTipo**: CONTATO, IA, HUMANO, SISTEMA
- **TipoMensagem**: TEXTO, IMAGEM, AUDIO, VIDEO, DOCUMENTO, LOCALIZACAO, BOTAO, LISTA
- **StatusEnvio**: PENDENTE, ENVIADA, ENTREGUE, LIDA, FALHA
- **StatusOportunidade**: NOVO, QUALIFICANDO, QUALIFICADO, VISITANDO, PROPOSTA, FECHADO_GANHO, FECHADO_PERDIDO
- **GrauInteresse**: BAIXO, MEDIO, ALTO, MUITO_ALTO

---

## Licença

Projeto proprietário — Salu Imóveis.
