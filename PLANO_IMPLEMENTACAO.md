# MySuperStore — Plano de Implementação
### Marketplace Multi-Vendedor Profissional

**Versão:** 1.0  
**Data:** Junho de 2026  
**Autor:** Rafael Maldivas  
**Contexto:** Evolução do TCC de ADS (IFSP GRU) para produto de mercado

---

## 1. Resumo Executivo

O MySuperStore é reescrito do zero como um **marketplace multi-vendedor** seguindo arquitetura headless moderna: backend Django REST API + frontend Next.js desacoplado. O objetivo é duplo — produto real em produção e portfólio de nível sênior.

**Diferenciais técnicos do novo sistema:**
- Arquitetura headless (API-first) com documentação OpenAPI automática
- Split de pagamento nativo via Mercado Pago Marketplace (PIX, cartão, boleto)
- Busca instantânea com tolerância a erros (Meilisearch)
- Design system consistente com dark mode e animações (Next.js + shadcn/ui + Framer Motion)
- Conformidade LGPD desde o dia 1
- CI/CD completo com GitHub Actions e deploy ao vivo

---

## 2. Stack Tecnológica

### Backend

| Componente | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework | Django | 5.1 | Você já domina; admin, ORM, migrations prontos |
| API | Django REST Framework | 3.15 | Padrão de mercado para APIs Django |
| Autenticação | SimpleJWT | 5.3 | JWT stateless, sem sessão de servidor |
| Banco de dados | PostgreSQL | 16 | Produção, full-text search, transações ACID |
| Cache/Fila | Redis | 7 | Celery broker, cache de sessão, rate limit |
| Tarefas assíncronas | Celery + Celery Beat | 5.4 | E-mails, webhooks, repasses agendados |
| Busca | Meilisearch | 1.x | Busca "as-you-type" com tolerância a erros |
| Mídia | Cloudflare R2 / AWS S3 | — | CDN, sem ocupar disco do servidor |
| Documentação API | drf-spectacular | 0.27 | OpenAPI 3 + Swagger UI automáticos |
| Monitoramento | Sentry | 2.x | Rastreamento de erros em produção |

### Frontend

| Componente | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| Framework | Next.js 15 (App Router) | 15.1 | SSR/SSG nativo, SEO, Server Components |
| Linguagem | TypeScript | 5 | Type-safety, melhor DX, mais seguro |
| Estilo | Tailwind CSS | 3.4 | Utility-first, consistência, performance |
| Design System | shadcn/ui (Radix UI) | latest | Acessível, personalizável, sem lock-in |
| Animações | Framer Motion | 11 | Transições e micro-interações profissionais |
| Estado global | Zustand | 5 | Simples, performático, sem boilerplate |
| Fetch/Cache | TanStack Query | 5 | Cache inteligente, loading/error states |
| Formulários | React Hook Form + Zod | 7/3 | Validação type-safe, performance |

### Pagamentos

| Método | Integração | Notas |
|---|---|---|
| PIX | Mercado Pago Marketplace API | QR Code dinâmico, webhook de confirmação |
| Cartão de crédito | Mercado Pago | Tokenização client-side (PCI compliant) |
| Boleto bancário | Mercado Pago | Geração de PDF, validade 3 dias |
| Split automático | MP Marketplace (OAuth) | Repasse automático ao vendedor menos comissão |

### Infraestrutura

```
Desenvolvimento:    Docker Compose (API + Postgres + Redis + Meilisearch)
Backend produção:   Render / Railway / Fly.io (container Docker)
Frontend produção:  Vercel (integração nativa Next.js)
CDN de mídia:       Cloudflare R2
CI/CD:              GitHub Actions (lint → test → build → deploy)
```

---

## 3. Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTES                              │
│  Navegador / App Mobile (PWA)                                │
└────────────────┬─────────────────────────────────────────────┘
                 │ HTTPS
┌────────────────▼─────────────────────────────────────────────┐
│                    NEXT.JS (Vercel)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │   Storefront│  │Painel Vendedor│  │  Painel Platform  │   │
│  │ (loja, busca│  │(produtos,    │  │  Admin (métricas, │   │
│  │  checkout)  │  │ pedidos)     │  │  users, comissões)│   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘   │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          └────────────────┼───────────────────┘
                  JWT      │ REST/JSON
┌─────────────────────────▼─────────────────────────────────────┐
│                   DJANGO REST API                              │
│  /api/v1/                                                      │
│  ├── users/         auth, perfis, endereços                    │
│  ├── sellers/       lojas, onboarding, métricas                │
│  ├── catalog/       produtos, variantes, categorias            │
│  ├── search/        busca instantânea (proxy Meilisearch)      │
│  ├── carts/         carrinho multi-loja                        │
│  ├── orders/        pedidos, sub-pedidos, rastreio             │
│  └── payments/      pagamentos, webhooks, repasses             │
└────────┬───────────────────────────────────────────────────────┘
         │
    ┌────┼─────────────────────────────┐
    │    │                             │
┌───▼──┐ ┌──────┐ ┌────────┐ ┌───────▼─────┐
│ PG   │ │Redis │ │Celery  │ │  Webhooks   │
│(dados)│ │(cache│ │(e-mails│ │ Mercado Pago│
│      │ │fila) │ │repasses│ │ → confirma  │
└──────┘ └──────┘ └────────┘ └─────────────┘
```

---

## 4. Modelo de Domínio

### Entidades e relacionamentos

#### `User` (app: users)
| Campo | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| email | EmailField unique | login principal |
| first_name, last_name | CharField | nome |
| phone | CharField | WhatsApp/contato |
| role | CharField | CUSTOMER, SELLER, ADMIN |
| avatar | ImageField | foto de perfil |
| is_active | BooleanField | ativo após verificação de e-mail |
| email_verified_at | DateTimeField null | timestamp da verificação |
| date_joined | DateTimeField | cadastro |

#### `Seller` (app: sellers)
| Campo | Tipo | Descrição |
|---|---|---|
| user | OneToOne(User) | responsável da loja |
| store_name | CharField | nome público da loja |
| slug | SlugField | URL amigável |
| description | TextField | descrição da loja |
| logo, banner | ImageField | identidade visual |
| commission_rate | DecimalField(5,4) | ex: 0.0300 = 3% |
| status | CharField | PENDING, APPROVED, SUSPENDED |
| mp_access_token | CharField | token OAuth do vendedor (split) |
| mp_user_id | CharField | ID no Mercado Pago |
| created_at | DateTimeField | |

#### `Category` (app: catalog)
| Campo | Tipo | Descrição |
|---|---|---|
| name | CharField | nome |
| slug | SlugField | URL |
| parent | FK(self) null | suporte a subcategorias |
| image | ImageField | ícone/banner |
| order | IntegerField | ordenação no menu |
| is_active | BooleanField | |

#### `Product` (app: catalog)
| Campo | Tipo | Descrição |
|---|---|---|
| seller | FK(Seller) | vendedor dono do produto |
| category | FK(Category) | |
| name | CharField | |
| slug | SlugField | URL único do produto |
| description | TextField | |
| base_price | **DecimalField(10,2)** | preço base (variants podem sobrescrever) |
| is_available | BooleanField | publicado/rascunho |
| meta_title, meta_description | CharField/TextField | SEO |
| created_at, updated_at | DateTimeField | |

#### `ProductVariant` (app: catalog)
| Campo | Tipo | Descrição |
|---|---|---|
| product | FK(Product) | |
| sku | CharField unique | código único de estoque |
| attributes | M2M(AttributeValue) | ex: [Cor=Azul, Tamanho=M] |
| price | DecimalField(10,2) | sobrescreve base_price se definido |
| stock | IntegerField | quantidade disponível |
| is_active | BooleanField | |

#### `Order` (app: orders)
| Campo | Tipo | Descrição |
|---|---|---|
| user | FK(User) | comprador |
| address | FK(Address) | endereço de entrega snapshot |
| subtotal, shipping, total | DecimalField(10,2) | valores |
| status | CharField | PENDING → CONFIRMED → SHIPPED → DELIVERED |
| order_number | CharField unique | código legível (ex: 20260619-0001) |
| created_at | DateTimeField | |

#### `SubOrder` (app: orders) — *o coração do marketplace*
| Campo | Tipo | Descrição |
|---|---|---|
| order | FK(Order) | pedido pai |
| seller | FK(Seller) | vendedor responsável |
| subtotal | DecimalField(10,2) | valor dos itens |
| commission | DecimalField(10,2) | comissão da plataforma |
| seller_amount | DecimalField(10,2) | subtotal - commission |
| status | CharField | status de fulfillment deste vendedor |

#### `Payment` (app: payments)
| Campo | Tipo | Descrição |
|---|---|---|
| order | OneToOne(Order) | |
| method | CharField | PIX, CREDIT_CARD, BOLETO |
| mp_payment_id | CharField | ID no Mercado Pago |
| status | CharField | PENDING, APPROVED, REJECTED |
| amount | DecimalField(10,2) | |
| pix_qr_code | TextField null | string EMV |
| pix_qr_code_base64 | TextField null | imagem base64 |
| expires_at | DateTimeField null | validade do PIX/boleto |
| paid_at | DateTimeField null | confirmação do pagamento |

#### `Payout` (app: payments)
| Campo | Tipo | Descrição |
|---|---|---|
| sub_order | FK(SubOrder) | |
| seller | FK(Seller) | |
| amount | DecimalField(10,2) | valor a repassar |
| status | CharField | PENDING, PROCESSING, COMPLETED |
| mp_payout_id | CharField null | ID do repasse no MP |
| processed_at | DateTimeField null | |

---

## 5. API — Catálogo de Endpoints (v1)

```
POST   /api/v1/auth/register/          # cadastro de cliente
POST   /api/v1/auth/login/             # JWT pair
POST   /api/v1/auth/refresh/           # refresh token
POST   /api/v1/auth/verify-email/      # ativar conta
POST   /api/v1/auth/forgot-password/   # solicitar reset
POST   /api/v1/auth/reset-password/    # confirmar reset

GET    /api/v1/users/me/               # perfil do usuário logado
PATCH  /api/v1/users/me/              # atualizar perfil
GET    /api/v1/users/me/addresses/     # endereços
POST   /api/v1/users/me/addresses/     # criar endereço
GET    /api/v1/users/me/orders/        # histórico de pedidos

POST   /api/v1/sellers/apply/          # solicitar ser vendedor
GET    /api/v1/sellers/me/             # perfil da loja
PATCH  /api/v1/sellers/me/            # atualizar loja
GET    /api/v1/sellers/me/products/    # produtos do vendedor
GET    /api/v1/sellers/me/orders/      # pedidos do vendedor
GET    /api/v1/sellers/me/dashboard/   # métricas (GMV, comissão, etc.)
GET    /api/v1/sellers/{slug}/         # perfil público da loja

GET    /api/v1/catalog/categories/     # árvore de categorias
GET    /api/v1/catalog/products/       # listagem com filtros
GET    /api/v1/catalog/products/{slug}/# detalhe do produto
POST   /api/v1/catalog/products/{id}/reviews/  # avaliar produto

GET    /api/v1/search/?q=...           # busca instantânea

GET    /api/v1/cart/                   # ver carrinho
POST   /api/v1/cart/items/            # adicionar item
PATCH  /api/v1/cart/items/{id}/       # alterar quantidade
DELETE /api/v1/cart/items/{id}/       # remover item

POST   /api/v1/orders/                 # criar pedido (checkout)
GET    /api/v1/orders/{number}/        # detalhe do pedido

POST   /api/v1/payments/               # iniciar pagamento (PIX/cartão/boleto)
GET    /api/v1/payments/{id}/status/   # verificar status
POST   /api/v1/payments/webhook/       # receber webhook do Mercado Pago

# Admin endpoints
GET    /api/v1/admin/dashboard/        # métricas da plataforma
GET    /api/v1/admin/sellers/          # gerenciar vendedores
PATCH  /api/v1/admin/sellers/{id}/    # aprovar/suspender
GET    /api/v1/admin/payouts/          # gerenciar repasses
```

---

## 6. Roadmap Detalhado

### Fase 0 — Fundação & Segurança (Semana 1)

- [ ] **URGENTE:** Revogar credenciais expostas no código antigo
  - Token de produção do Mercado Pago (`APP_USR-...` em `orders/views.py`)
  - Senha de app do Gmail (`settings.py`)
  - Recriar client-id do PayPal (exposto em `base.html`)
- [ ] Criar nova SECRET_KEY e gerenciar via `.env`
- [ ] Inicializar repositório Git limpo com `.gitignore` adequado
- [ ] Criar `docker-compose.yml` com Postgres + Redis
- [ ] Configurar estrutura `backend/` e `frontend/`
- [ ] Instalar dependências e testar ambiente rodando

**Entregável:** `docker-compose up` → API rodando em `localhost:8000` com Postgres

### Fase 1 — Backend & Domínio (Semanas 2–3)

- [ ] Criar todos os models do domínio com migrations
- [ ] Configurar `AUTH_USER_MODEL = 'users.User'`
- [ ] Autenticação JWT (`/auth/register`, `/auth/login`, `/auth/refresh`)
- [ ] E-mail de verificação de conta (Celery task)
- [ ] Configurar Django Admin para todos os models
- [ ] Script de seed: importar ~80 produtos do SQLite antigo
- [ ] Configurar drf-spectacular (`/api/docs/` com Swagger UI)

**Entregável:** Admin Django funcional com dados importados + documentação de API ao vivo

### Fase 2 — Catálogo & Busca (Semanas 4–5)

- [ ] Endpoints de categorias (hierarquia)
- [ ] CRUD de produtos com múltiplas imagens (upload para R2/S3)
- [ ] Endpoints de variantes (cor, tamanho, SKU)
- [ ] Filtros: categoria, preço, avaliação, vendedor, estoque
- [ ] Busca instantânea com Meilisearch (indexar ao salvar produto)
- [ ] Paginação cursor-based para performance

**Entregável:** `GET /api/v1/catalog/products/?q=camisa&categoria=roupas` retornando resultados corretos

### Fase 3 — Multi-vendedor (Semanas 6–7)

- [ ] Fluxo de candidatura a vendedor (`POST /sellers/apply/`)
- [ ] Aprovação pelo admin com notificação por e-mail
- [ ] Onboarding do Mercado Pago OAuth (vincular conta do vendedor)
- [ ] CRUD de produtos pelo vendedor (sem acesso a produtos de outros)
- [ ] Painel de métricas do vendedor (GMV, pedidos, avaliação média)
- [ ] Permissões: `IsSeller`, `IsApprovedSeller`, `IsProductOwner`

**Entregável:** Vendedor consegue criar loja, cadastrar produtos e ver suas vendas

### Fase 4 — Checkout & Pagamentos (Semanas 8–9)

- [ ] Carrinho multi-loja (itens de N vendedores numa sessão)
- [ ] Cálculo de frete por vendedor (mock/integração com Correios ou flat rate)
- [ ] Checkout: criar `Order` → N `SubOrder` (um por vendedor)
- [ ] **Split de pagamento Mercado Pago Marketplace**
  - PIX: gerar QR Code dinâmico
  - Cartão: tokenização client-side (Next.js MercadoPago SDK)
  - Boleto: PDF gerado
- [ ] Webhook idempotente: confirmar pagamento → marcar `Order.status = CONFIRMED`
- [ ] **Decremento transacional de estoque** ao confirmar pedido
- [ ] Reserva de estoque durante checkout (Redis, TTL 15min)

**Entregável:** Fluxo completo de compra com PIX gerando QR Code real (sandbox)

### Fase 5 — Pós-venda & Confiança (Semanas 10–11)

- [ ] Rastreio de pedido por status (cliente e vendedor)
- [ ] Task Celery: agendar repasse ao vendedor D+2 após entrega
- [ ] **Payout automático** via Mercado Pago
- [ ] E-mail de confirmação de pedido (HTML responsivo)
- [ ] Avaliações com compra verificada (só quem comprou pode avaliar)
- [ ] Notificações in-app (via WebSocket ou polling)
- [ ] Wishlist / Favoritos

**Entregável:** Ciclo completo: pagamento → entrega → repasse → avaliação

### Fase 6 — Frontend & Design System (Semanas 12–13)

- [ ] Setup Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui)
- [ ] Design tokens: paleta de cores, tipografia, espaçamentos
- [ ] Dark mode nativo (next-themes)
- [ ] Componentes: Button, Card, Badge, Input, Select, Modal, Toast
- [ ] **Storefront:**
  - Home com banner hero animado, categorias, produtos em destaque
  - Grid de produtos com skeleton loaders
  - Detalhe do produto: galeria de imagens, seletor de variantes, avaliações
  - Busca instantânea com Meilisearch (dropdown ao digitar)
  - Carrinho lateral (drawer)
  - Checkout em steps (endereço → pagamento → confirmação)
- [ ] **Painel do vendedor:**
  - Dashboard com métricas e gráfico de vendas
  - Listagem e edição de produtos
  - Pedidos e fulfillment
- [ ] Animações Framer Motion: page transitions, hover effects, loading states
- [ ] SEO: metadata dinâmica, Open Graph, sitemap

**Entregável:** Loja ao vivo com design profissional e responsivo

### Fase 7 — Qualidade & Lançamento (Semanas 14–16)

- [ ] Testes backend: pytest + factory_boy (>80% coverage em models e views)
- [ ] Testes frontend: Playwright E2E (cadastro → checkout → confirmação)
- [ ] GitHub Actions CI: lint (ruff/ESLint) → test → build
- [ ] GitHub Actions CD: deploy automático ao push em `main`
- [ ] **Conformidade LGPD:**
  - Banner de cookies com consentimento granular
  - Endpoint de exclusão de dados do usuário
  - Política de privacidade e termos de uso
  - Retenção de logs por no máximo 6 meses
- [ ] Sentry configurado em produção
- [ ] Rate limiting nas rotas públicas (dj-ratelimit)
- [ ] Headers de segurança (HSTS, CSP, X-Frame-Options)
- [ ] Domínio próprio com SSL (automático via Vercel/Render)

**Entregável:** Produto em produção com URL pública, testes passando, Sentry ativo

---

## 7. Padrões de Desenvolvimento

### Código

```
backend/
├── config/           # settings, urls, celery (não é um app)
├── apps/             # um diretório por domínio de negócio
│   ├── users/
│   │   ├── models.py        # somente models e managers
│   │   ├── serializers.py   # validação e transformação
│   │   ├── views.py         # lógica de apresentação
│   │   ├── services.py      # lógica de negócio (sem misturar com views)
│   │   ├── tasks.py         # Celery tasks
│   │   ├── admin.py         # configuração do Django Admin
│   │   └── urls.py          # rotas do app
│   └── ...
└── core/             # código reutilizável entre apps
    ├── permissions.py
    ├── pagination.py
    └── exceptions.py
```

**Regras:**
- Todo valor monetário: `DecimalField(max_digits=10, decimal_places=2)`, nunca `float`
- UUIDs como PKs nos models expostos pela API (não expor IDs sequenciais)
- Sempre `select_related` / `prefetch_related` para evitar N+1
- Lógica de negócio em `services.py`, não em views nem models
- Um commit por feature, mensagens em inglês seguindo Conventional Commits

### Segurança

- Nunca fazer commit de `.env` (já no `.gitignore`)
- Variáveis sensíveis somente via variáveis de ambiente
- Webhook do Mercado Pago: validar assinatura HMAC antes de processar
- Rate limiting em `POST /auth/login/` e `POST /auth/register/`
- CSRF: dispensado nas views de API (JWT stateless), mantido nas views de admin

### Git Flow

```
main          → produção (auto-deploy)
develop       → staging (branch de integração)
feature/xxx   → feature branches
fix/xxx       → bug fixes
```

---

## 8. Conformidade LGPD

| Requisito | Implementação |
|---|---|
| Consentimento explícito | Banner de cookies com Zustand + localStorage |
| Finalidade | Política de privacidade clara (link no cadastro e rodapé) |
| Acesso aos dados | Endpoint `GET /api/v1/users/me/data-export/` |
| Exclusão de dados | Endpoint `DELETE /api/v1/users/me/` → anonimiza dados |
| Portabilidade | Export em JSON dos dados do usuário |
| Notificação de vazamento | Sentry alertas + procedimento documentado |
| Encarregado (DPO) | E-mail de contato visível na política de privacidade |

---

## 9. Métricas de Sucesso

| Métrica | Meta de Lançamento |
|---|---|
| Tempo de resposta da API (p95) | < 200ms |
| Lighthouse Performance (mobile) | > 85 |
| Lighthouse Accessibility | > 95 |
| Coverage de testes | > 80% |
| Uptime | > 99.5% |
| Tempo até 1º produto ao vivo | < 5 min (onboarding do vendedor) |

---

## 10. Checklist de Lançamento

### Segurança
- [ ] SECRET_KEY em variável de ambiente (≥50 chars, aleatória)
- [ ] DEBUG=False em produção
- [ ] ALLOWED_HOSTS configurado com domínio real
- [ ] HTTPS forçado (HSTS habilitado)
- [ ] Credenciais do MP/Gmail/PayPal rotacionadas (não reutilizar as expostas)
- [ ] Webhook MP com validação de assinatura

### Produto
- [ ] Fluxo de compra testado end-to-end em sandbox do MP
- [ ] E-mails de transação chegando corretamente
- [ ] Imagens servidas via CDN (R2/S3), não pelo servidor
- [ ] SEO: sitemap.xml e robots.txt acessíveis

### Infraestrutura
- [ ] Backups automáticos do banco (Render/Railway incluem)
- [ ] Sentry capturando erros
- [ ] GitHub Actions passando no PR para main
- [ ] Variáveis de ambiente configuradas no painel do Vercel e Render

---

## Apêndice — O que aproveitar do projeto antigo

| Artefato | Status | Ação |
|---|---|---|
| `media/photos/` (80 imagens) | ✅ Manter | Script de seed importa e envia para R2 |
| `db.sqlite3` (dados de produtos) | ✅ Usar como fonte | `scripts/seed_from_legacy.py` lê e migra |
| Lógica de variações (cor/tamanho) | ✅ Aproveitar | Reescrita mais limpa em `catalog/models.py` |
| Fluxo de e-mail de ativação | ✅ Aproveitar | Reescrito como Celery task assíncrona |
| Taxa progressiva (3%/<500, 2%/≥500) | ✅ Virar comissão | `Seller.commission_rate` configurável por loja |
| Templates HTML antigos | ❌ Substituir | Next.js com design completamente novo |
| SQLite e configurações Django antigas | ❌ Descartar | Postgres + settings divididos por ambiente |
| `IPython.display` em `orders/views.py` | ❌ Remover | Era debug, não pertence a views de produção |
