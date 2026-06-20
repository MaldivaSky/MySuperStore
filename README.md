<div align="center">

# 🛒 MySuperStore

### Marketplace multi-vendedor headless — pagamentos reais, split automático e arquitetura de produção

[![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-A30000?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Connect-635BFF?logo=stripe&logoColor=white)](https://stripe.com/connect)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

*Um marketplace de verdade: vários vendedores, um carrinho, pagamento dividido automaticamente entre as lojas, PIX e cartão, com estorno e cancelamento.*

</div>

---

## 📖 Sobre

O **MySuperStore** é um marketplace **multi-vendedor** (estilo Mercado Livre / Amazon) construído com arquitetura **headless**: um backend Django REST desacoplado de um frontend Next.js 15. Diferente de uma loja simples, aqui **qualquer pessoa pode cadastrar sua loja, anunciar produtos e receber pagamentos** — e a plataforma retém uma comissão automaticamente sobre cada venda.

> Projeto de conclusão do curso de Análise e Desenvolvimento de Sistemas (IFSP-GRU), evoluído para um produto real.

---

## 🏗️ Arquitetura

```
                          ┌──────────────────────────┐
                          │   Next.js 15 (Frontend)  │
                          │  Loja · Lojista · Admin  │
                          └────────────┬─────────────┘
                                       │ REST + JWT
                          ┌────────────▼─────────────┐
                          │   Django REST Framework  │
                          │  catalog · orders · cart │
                          │  sellers · payments      │
                          └──┬───────┬───────┬───────┘
                             │       │       │
              ┌──────────────▼─┐ ┌───▼────┐ ┌▼──────────────┐
              │  PostgreSQL 16 │ │ Redis  │ │ Stripe Connect│
              │   (dados)      │ │(cache, │ │  + PIX BR Code│
              └────────────────┘ │ broker)│ └───────────────┘
                                 └───┬────┘
                          ┌──────────▼──────────┐
                          │  Celery + Beat      │
                          │ e-mails · webhooks  │
                          └─────────────────────┘
```

---

## ⚙️ Stack

| Camada | Tecnologias |
|---|---|
| **Backend** | Django 5.1 · Django REST Framework · SimpleJWT · django-filter · drf-spectacular |
| **Frontend** | Next.js 15 (App Router) · React · TypeScript · Tailwind CSS · Zustand · Framer Motion · Recharts |
| **Pagamentos** | Stripe Connect (split) · Stripe Elements · PIX (BR Code EMV nativo) |
| **Dados / Infra** | PostgreSQL 16 · Redis 7 · Celery · Meilisearch · Docker Compose |
| **Mídia** | Pillow · django-storages (S3/R2 em produção) |

---

## ✨ Funcionalidades

<table>
<tr><td width="50%" valign="top">

**🛍️ Loja (cliente)**
- Catálogo com categorias hierárquicas, marcas e busca
- Variantes de produto (tamanho, etc.) e estoque por SKU
- **Promoções relâmpago** (flash sales) com contagem regressiva
- Carrinho multi-loja, cupons globais e por vendedor
- Avaliações com nota e filtro de conteúdo
- Lista de desejos

</td><td width="50%" valign="top">

**🏪 Lojista (vendedor)**
- Onboarding via **Stripe Connect** (Express)
- CRUD de produtos, variantes e imagens
- Promoções relâmpago self-service
- Gestão de pedidos e devoluções
- Painel financeiro (vendas, comissões, repasses)

</td></tr>
<tr><td width="50%" valign="top">

**💳 Pagamentos (Fase 4)**
- **PIX** com BR Code EMV válido + QR Code
- **Cartão de crédito e débito** via Stripe Elements
- **Split automático** por vendedor (comissão retida)
- **Estorno** total e parcial (reverte transfer + comissão)
- **Cancelamento** com devolução de estoque

</td><td width="50%" valign="top">

**🛡️ Super Admin (plataforma)**
- Dashboard executivo (GMV, churn, métricas)
- Gestão de lojistas e comissões
- Moderação de produtos e avaliações
- Visão consolidada do ecossistema

</td></tr>
</table>

---

## 💸 Fluxo de Pagamento (Fase 4 em detalhe)

O coração do marketplace é o **split de pagamento**: quando um carrinho tem produtos de várias lojas, o valor é dividido e cada vendedor recebe sua parte, descontada a comissão da plataforma.

```
Carrinho (Loja A + Loja B)
        │
        ▼
   Pedido (Order)  ──>  SubOrder Loja A  ──> comissão + repasse
        │               SubOrder Loja B  ──> comissão + repasse
        ▼
   Pagamento
   ├── 1 vendedor onboardado  → Destination Charge (split automático no Stripe)
   ├── vários vendedores      → Separate Transfers (repasse pós-confirmação)
   └── PIX                    → BR Code EMV + baixa via webhook do banco
        │
        ▼
   Webhook / confirmação autoritativa
        │
        ▼
   Order CONFIRMED · CommissionEntry · Payout · e-mail (Celery)
```

| Capacidade | Como funciona |
|---|---|
| **PIX** | `PixService` gera o payload *Copia e Cola* (EMV/BR Code com CRC16) e o QR Code em base64 — sem dependência externa. A baixa é feita pelo webhook do banco/PSP (simulável em dev). |
| **Cartão** | `PaymentIntent` do Stripe + Stripe Elements no front. Crédito e débito usam cartões de teste. |
| **Split** | Comissão por vendedor calculada na criação do pedido; Destination Charge (1 loja) ou Separate Transfers (N lojas). |
| **Estorno** | `Refund` do Stripe com `reverse_transfer` + `refund_application_fee` quando há split; restaura estoque e marca pedido como `refunded`. |
| **Cancelamento** | Cancela o `PaymentIntent` não capturado e devolve o estoque reservado. |

---

## 🚀 Começando

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose
- Chaves de **teste** do Stripe ([dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys))

### 1. Clonar e configurar variáveis

```bash
git clone https://github.com/MaldivaSky/MySuperStore.git
cd MySuperStore
cp .env.example .env          # preencha as chaves (Stripe TEST, e-mail, etc.)
```

> ⚠️ **Nunca** use chaves `sk_live_` em desenvolvimento — elas cobram cartões de verdade. Use sempre `sk_test_` / `pk_test_`.

Defina também `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

### 2. Subir a infraestrutura

```bash
docker compose up -d --build
docker compose exec api python manage.py migrate
docker compose exec api python manage.py seed_demo   # popula dados de demonstração
```

### 3. Rodar o frontend

```bash
cd frontend
npm install
npm run dev
```

| Serviço | URL |
|---|---|
| Loja | http://localhost:3000/store |
| Painel do Lojista | http://localhost:3000/seller |
| Super Admin | http://localhost:3000/admin |
| API | http://localhost:8000/api/v1/ |
| Docs (Swagger) | http://localhost:8000/api/docs/ |

---

## 🌱 Seed & Credenciais

`python manage.py seed_demo` cria um marketplace completo: admin, 4 vendedores, 5 clientes (com telefone e endereço), ~100 produtos com variantes/imagens/avaliações, promoções relâmpago, banners, cupons e pedidos.

| Papel | E-mail | Senha |
|---|---|---|
| Admin | `admin@mysuperstore.com` | `admin123` |
| Vendedor | `tech_seller@mysuperstore.com` | `seller123` |
| Cliente | `joao.silva@gmail.com` | `cliente123` |

> Flags úteis: `--reset` (recria tudo) · `--skip-images` (mais rápido, sem download).

---

## 🧪 Testando pagamentos

### PIX
No checkout, escolha **PIX** → o QR Code e o Copia-e-Cola são gerados. Em desenvolvimento, clique em **"Já paguei (simular confirmação)"** para simular a baixa do banco.

### Cartão (crédito/débito)
Use os cartões de teste do Stripe:

| Cartão | Número | Resultado |
|---|---|---|
| Visa (crédito) | `4242 4242 4242 4242` | ✅ Aprovado |
| Visa (débito) | `4000 0566 5566 5556` | ✅ Aprovado |
| Recusado | `4000 0000 0000 0002` | ❌ Recusado |

Validade: qualquer data futura · CVC: qualquer 3 dígitos.

### Webhook do Stripe (opcional, para produção fiel)
```bash
stripe listen --forward-to localhost:8000/api/v1/payments/webhook/
# copie o whsec_... exibido para STRIPE_WEBHOOK_SECRET no .env
```
> Em dev, a confirmação autoritativa (`POST /payments/{id}/confirm/`) já cobre o fluxo sem o webhook.

---

## 🔌 Principais endpoints

```
POST   /api/v1/auth/login/                      Login (JWT)
GET    /api/v1/catalog/products/                 Catálogo (filtros: categoria, marca, flash_sale_only…)
PATCH  /api/v1/catalog/products/{slug}/set-promo/  Promoção relâmpago (lojista)
GET    /api/v1/sellers/me/products/              CRUD de produtos do lojista
POST   /api/v1/orders/                           Criar pedido a partir do carrinho
POST   /api/v1/payments/create-intent/           Iniciar pagamento (pix | credit_card | debit_card)
POST   /api/v1/payments/{id}/confirm/            Confirmação autoritativa (cartão)
POST   /api/v1/payments/{id}/simulate-pix/       Simular baixa PIX (dev)
POST   /api/v1/payments/{id}/cancel/             Cancelar pedido não pago
POST   /api/v1/payments/{id}/refund/             Estorno (total ou parcial)
POST   /api/v1/payments/webhook/                 Webhook do Stripe
```

Documentação interativa completa em **`/api/docs/`**.

---

## 📁 Estrutura

```
MySuperStore/
├── backend/
│   ├── apps/
│   │   ├── catalog/     Produtos, categorias, marcas, promoções, avaliações, banners
│   │   ├── carts/       Carrinho e cupons
│   │   ├── orders/      Pedidos, sub-pedidos, devoluções
│   │   ├── payments/    Stripe Connect, PIX, split, estorno, payouts
│   │   ├── sellers/     Lojas, onboarding Connect, CRUD de produtos
│   │   └── users/       Autenticação, endereços, afiliados
│   ├── config/          Settings (base/dev/prod), Celery, URLs
│   └── requirements/
├── frontend/
│   └── src/
│       ├── app/         Rotas (store, seller, admin, checkout, dashboard…)
│       ├── components/  Header, Footer, ProductModal…
│       ├── lib/         Cliente da API, Stripe
│       └── store/       Estado global (Zustand)
└── docker-compose.yml
```

---

## 🗺️ Roadmap

- [x] **Fase 1–2** — Catálogo, carrinho, autenticação, painel do lojista
- [x] **Fase 3** — Promoções relâmpago e filtros de desconto
- [x] **Fase 4** — Checkout real: Stripe split, PIX, cartão, estorno e cancelamento
- [ ] **Fase 5** — Rastreio de pedidos, repasses agendados, e-mails transacionais
- [ ] **Fase 6** — Storefront público otimizado (SEO, SSR, performance)
- [ ] **Fase 7** — Testes automatizados, CI/CD, LGPD, deploy

---

## 🔒 Segurança

- O arquivo `.env` **nunca** é versionado (`.gitignore`); use `.env.example` como referência.
- Apenas chaves Stripe **de teste** em desenvolvimento.
- Senhas com hash, autenticação JWT com blacklist de refresh tokens.
- Webhooks validados por assinatura.

---

<div align="center">

Feito com 💜 por **Rafael Maldivas** — IFSP Guarulhos

</div>
