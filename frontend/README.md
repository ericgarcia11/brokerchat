# WWP Frontend — CRM Imobiliário WhatsApp

Frontend completo para o sistema WWP (WhatsApp Property Platform), um CRM imobiliário integrado ao WhatsApp via UazAPI e agentes LangGraph.

## Stack

| Camada          | Tecnologia                              |
| --------------- | --------------------------------------- |
| Framework       | Next.js 14 (App Router, standalone)     |
| Linguagem       | TypeScript 5.6                          |
| UI              | Tailwind CSS 3.4, shadcn/ui (manual)   |
| Estado servidor | TanStack React Query 5                  |
| Estado local    | Zustand 4                               |
| Formulários     | React Hook Form 7 + Zod 3              |
| Ícones          | Lucide React                            |
| Datas           | date-fns 3                              |
| Tema            | next-themes (light/dark)                |
| Container       | Docker (multi-stage, node:20-alpine)    |

## Estrutura

```
src/
├── app/                    # App Router pages
│   ├── (auth)/login/       # Página de login (API key)
│   └── (dashboard)/        # Layout autenticado
│       ├── page.tsx        # Dashboard com KPIs
│       ├── chats/          # Inbox principal (3 painéis)
│       ├── contacts/       # Contatos (lista + detalhe)
│       ├── opportunities/  # Oportunidades (tabela + pipeline)
│       ├── properties/     # Imóveis
│       ├── connections/    # Conexões WhatsApp
│       ├── routing/        # Regras de roteamento
│       ├── agents/         # Agentes IA
│       ├── admin/          # Filiais, equipes, usuários
│       │   ├── branches/
│       │   ├── teams/
│       │   └── users/
│       ├── webhooks/       # Eventos webhook (placeholder)
│       └── settings/       # Saúde do sistema, ambiente
├── components/
│   ├── ui/                 # Componentes shadcn/ui (17)
│   ├── shared/             # Componentes compartilhados
│   ├── layout/             # Sidebar, header, app-shell
│   └── chats/              # Componentes do inbox
├── features/               # Hooks por domínio (TanStack Query)
├── lib/
│   ├── api/                # HTTP client + endpoints tipados
│   ├── auth/               # Sessão (localStorage)
│   ├── env/                # Variáveis de ambiente
│   ├── formatters/         # Formatação (data, moeda, telefone)
│   └── utils/              # cn() helper
├── providers/              # React Query + Theme providers
├── stores/                 # Zustand stores
└── types/                  # Enums + interfaces TypeScript
```

## Telas

1. **Login** — Autenticação por API key (validação contra `GET /admin/empresas`)
2. **Dashboard** — KPIs (chats ativos, contatos, oportunidades, conexões), saúde do sistema, lista de chats aguardando humano
3. **Inbox/Chats** — Layout 3 painéis: lista de chats com filtro/busca, conversa com mensagens e compositor, painel lateral com contato/oportunidade
4. **Contatos** — Tabela paginada, criação via dialog, detalhe com chats e oportunidades vinculadas
5. **Oportunidades** — Tabela + visão pipeline/kanban por status, criação com seletor de contato
6. **Imóveis** — Catálogo com filtros, criação completa (preço, quartos, área, etc.)
7. **Conexões** — Status WhatsApp, criação de conexão e instância UazAPI, verificação de status
8. **Regras de roteamento** — Formulário guiado + modo JSON avançado para condições
9. **Agentes IA** — Lista com detalhes (prompt, config, graph), criação
10. **Filiais** — CRUD simples
11. **Equipes** — CRUD com seleção de filial e linha de negócio
12. **Usuários** — CRUD com papel (admin/gestor/atendente) e equipe
13. **Webhooks** — Placeholder (endpoint backend não disponível)
14. **Configurações** — Health checks, readiness, informações de ambiente

## Autenticação

O backend não expõe endpoint de login. A autenticação é feita via **API Key** enviada no header `X-API-Key`. O frontend valida a chave testando `GET /admin/empresas?limit=1`.

A chave é armazenada no `localStorage` e enviada em todas as requisições pelo HTTP client centralizado.

## Integração com Backend

- **Base URL**: Configurável via `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000`)
- **Proxy**: Next.js rewrites `/api/backend/*` para o backend
- **Polling**: Chats e mensagens usam polling configurável (`NEXT_PUBLIC_POLL_INTERVAL_MS`, default 5000ms)
- **Sem WebSocket/SSE**: O backend não implementa — polling é a estratégia

### Limitações conhecidas

- **Sem PUT/PATCH**: O backend CRUD só implementa GET, POST, DELETE — não há atualização de registros
- **Sem listagem de webhooks**: `GET /admin/eventos-webhook` não existe — tela marcada como placeholder
- **Sem login por usuário**: Autenticação é apenas por API key global

## Como rodar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Iniciar em modo dev
npm run dev
```

O app ficará disponível em `http://localhost:3000`.

### Variáveis de ambiente

| Variável                       | Default                                  | Descrição                          |
| ------------------------------ | ---------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`     | `http://localhost:8000`                  | URL base da API backend            |
| `NEXT_PUBLIC_APP_NAME`         | `SALU Chat AI`                               | Nome exibido na UI                 |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | `5000`                                   | Intervalo de polling em ms         |
| `NEXT_PUBLIC_EMPRESA_ID`       | `00000000-0000-0000-0000-000000000001`   | ID da empresa (determinístico)     |

### Docker

```bash
# Build
docker build -t wwp-frontend .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://api:8000 \
  wwp-frontend
```

### Docker Compose (full stack)

```bash
# Na raiz do projeto, com backend e frontend
docker compose -f wwp-backend/docker-compose.yml -f wwp-frontend/docker-compose.yml up --build
```

## Testes

```bash
npm test
```

## Decisões de arquitetura

1. **shadcn/ui manual**: Componentes copiados diretamente (sem CLI) para controle total e zero dependência do registry
2. **Feature hooks**: Cada domínio tem seus hooks TanStack Query isolados — colocação por feature, não por tipo
3. **HTTP client centralizado**: Um único `apiClient` com interceptors de auth, timeout e tratamento de 401
4. **Zustand mínimo**: Apenas estado de UI (chat selecionado, sidebar) — todo estado de servidor via React Query
5. **Polling ao invés de WebSocket**: Backend não suporta — polling configurável como trade-off pragmático
6. **App Router**: Colocation de pages com route groups `(auth)` e `(dashboard)` para layouts separados
7. **standalone output**: Build otimizado para Docker com output standalone do Next.js
