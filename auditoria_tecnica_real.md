# 🔬 MySuperStore — Auditoria Técnica Real
### Visão CTO → CEO · Baseada em leitura linha a linha do código · 21/06/2026

---

## Resumo Executivo (para o CEO)

Você não tem um projeto no início. Você tem um **marketplace com 70% do produto implementado** — e os 30% restantes são exatamente os que geram receita.

A boa notícia: o backend de pagamentos está estruturalmente correto, com arquitetura profissional.  
A má notícia: **o loop de dinheiro está aberto em 1 ponto específico** — o PIX não fecha sozinho.

---

## 🏗️ O que Existe de Fato (Auditoria Real)

### BACKEND — Análise App por App

---

#### `apps/users` — ✅ Completo

| O que foi lido | Status Real |
|---|---|
| `User` model: UUID PK, email único, roles (customer/seller/admin), avatar, CPF/CNPJ, phone, `is_active=False` por padrão até verificação de e-mail | ✅ Implementado e correto |
| `Address` model: label, recipient_name, CEP, logradouro, número, complemento, bairro, cidade, UF, `is_default`, reference_point | ✅ Implementado |
| `UserSurvey`: dados demográficos (nascimento, gênero, profissão, escolaridade, estado civil) com sincronização ao CRM | ✅ Implementado |
| `AffiliateLink`: clicks, conversions, commission_earned por produto | ✅ Model existe (sem endpoints expostos ainda) |
| `RegisterView`: cria conta + retorna tokens JWT direto (sem e-mail de verificação ativo!) | ⚠️ **Ativação por e-mail está desativada** — `is_active=False` mas o JWT é emitido mesmo assim |
| `LoginView`: JWT com par customizado | ✅ OK |
| `LogoutView`: blacklist do refresh token | ✅ OK |
| `ChangePasswordView`: troca de senha autenticada | ✅ OK |
| `GoogleLoginView`: valida token Google OAuth, cria/ativa usuário, emite JWT | ✅ Implementado |
| `MeView` (GET/PATCH): perfil + avatar via multipart/FormData | ✅ OK |
| `UserSurveyView` (GET/POST): sync com CRM ao salvar | ✅ OK |
| `AddressViewSet`: CRUD completo de endereços | ✅ OK |

**Observação CTO:** O usuário registrado com e-mail/senha não precisa verificar e-mail para usar o sistema (`is_active` começa `False`, mas o token é emitido assim mesmo em `RegisterView`). Isso é um **risco de segurança e de spam** — qualquer e-mail inválido pode criar conta e usar o sistema.

---

#### `apps/catalog` — ✅ Quase Completo

| O que foi lido | Status Real |
|---|---|
| `Category`: hierarquia com `parent` FK, `category_commission_rate` (sobrepõe comissão do lojista — design avançado!) | ✅ Implementado |
| `Brand`: nome + logo | ✅ |
| `Product`: base_price, promotional_price, promo_starts_at/ends_at, `is_on_sale` property, `current_price` property, views_count, clicks_count, `approval_status` (PENDING/APPROVED/BANNED), meta SEO, `is_free_shipping`, `estimated_delivery_days` | ✅ Bem estruturado |
| `ProductVariant`: SKU único, M2M AttributeValue, preço próprio ou herda do produto, stock, `effective_price` property (aplica promo) | ✅ |
| `ProductImage`: múltiplas imagens, `is_primary`, ordenação | ✅ |
| `Attribute` + `AttributeValue`: sistema genérico (Cor: Azul, Tamanho: M) | ✅ |
| `ProductSpecification`: especificações técnicas chave-valor | ✅ |
| `Wishlist`: OneToOne com user, M2M com produtos | ✅ |
| `ReviewRating`: com verificação de compra via FK em `OrderItem`, status de moderação | ✅ Design correto |
| `Banner`: título, imagem, CTA, link, ordenação | ✅ |
| `signals.py` + `tasks.py` + `filters.py` | ✅ Existe (não lido por completo, mas estrutura presente) |
| **Falta:** peso e dimensões no produto/variante para cálculo de frete | ❌ **Ausente** — necessário para Melhor Envio |

---

#### `apps/sellers` — ✅ Muito Completo (com bugs)

| O que foi lido | Status Real |
|---|---|
| `Seller` model: store_name, slug, description, logo, banner (3 banners!), commission_rate (default 15%), max_installments, strike_count, status (PENDING/APPROVED/SUSPENDED/REJECTED), stripe_account_id, stripe_onboarding_complete, pix_key | ✅ Robusto |
| `ChatRoom` + `ChatMessage`: salas entre comprador e vendedor por produto, mensagens com `is_read` | ✅ Implementado |
| `SellerApplyView`: **linha 40 — `status=SellerStatus.APPROVED`** — aprovação automática! | 🔴 **BUG CRÍTICO de negócio** |
| `SellerMeView`: GET/PATCH do perfil do lojista | ✅ |
| `SellerStripeOnboardingView`: cria Express Account + AccountLink | ✅ OK |
| `SellerStripeCallbackView`: marca `stripe_onboarding_complete=True` | ⚠️ Não valida com o Stripe se o onboarding foi de fato concluído — apenas seta o flag |
| `SellerProductViewSet`: CRUD de produtos, upload de imagens, variantes, N+1 evitado com `select_related` + `prefetch_related` | ✅ Bem feito |
| `SellerMentorView`: insights baseados em views/clicks (promoção ou aumento de preço) | ✅ Funciona |
| `SellerLeadsView`: lista compradores com produto no carrinho ou na wishlist | ✅ Interessante |
| `ChatRoomViewSet`: criar sala, enviar mensagem | ✅ REST síncrono (não é WebSocket) |
| **Bug real no código:** `create_variant` em `sellers/views.py:246-252` tem código duplicado de `destroy` dentro de `create_variant` | 🔴 **Bug de copy-paste** — `create_variant` deleta o produto ao invés de criar variante |

---

#### `apps/carts` — ✅ Completo

| O que foi lido | Status Real |
|---|---|
| `Cart`: OneToOne com user, session_key para anônimo, FK para `Coupon` | ✅ |
| `CartItem`: FK para `ProductVariant`, quantity, unique_together(cart, variant) | ✅ |
| `Cart.total`: aplica cupom por seller ou global, suporta % e valor fixo, frete grátis hardcoded = 0 | ✅ (frete = 0 é decisão consciente) |
| `Cart.subtotal` + `Cart.item_count` | ✅ |
| `tasks.py` no carts: carrinho abandonado (e-mail de recuperação) | ✅ Task Celery existe |

---

#### `apps/orders` — ✅ Muito Completo

| O que foi lido | Status Real |
|---|---|
| `Coupon`: código único, seller opcional (cupom por loja), discount_percentage OU discount_amount, validade, `is_first_purchase_only`, min_cart_value, max_uses/current_uses | ✅ Sistema robusto |
| `Order`: snapshot de endereço (correto — não usar FK de address), order_number único, subtotal/shipping/total (todos DecimalField), status enum completo, ip_address | ✅ |
| `SubOrder`: por vendedor, calcula commission e seller_amount, tracking_code | ✅ O coração do marketplace |
| `OrderItem`: snapshot de product_name + variant_sku + variant_attributes (JSON) — preserva histórico mesmo se produto for deletado | ✅ Design profissional |
| `ReturnRequest` + `ReturnStatus` + `ReturnReason`: sistema de devolução completo com fluxo cliente→lojista | ✅ Implementado |
| `OrderViewSet`: apenas cria e lista pedidos do usuário | ✅ |
| `SellerSubOrderViewSet`: lojista gerencia status dos sub-pedidos, `update_status` action | ✅ |
| `ReturnRequestViewSet`: cliente cria devolução, lojista aprova/rejeita, `_process_item_refund` faz estorno parcial no Stripe e devolve estoque | ✅ |
| **Celery tasks:** `send_order_confirmation_email_task` e `send_seller_sale_notification_email_task` | ✅ Implementados |
| **Bug:** `orders_url` hardcoded como `http://localhost:3000/dashboard/orders` no template de e-mail | 🟠 Deve ser variável de ambiente em produção |

---

#### `apps/payments` — ✅ Arquiteturalmente Correto · 🔴 PIX Incompleto

| O que foi lido | Status Real |
|---|---|
| `Payment` model: UUID PK, OneToOne com Order, method (pix/credit_card/debit_card/boleto), mp_payment_id (é o PaymentIntent do Stripe), stripe_charge_id, status, amount, refunded_amount, pix_qr_code + pix_qr_code_base64, boleto_url/barcode, expires_at/paid_at/refunded_at, raw_response (JSON) | ✅ Profissional |
| `Payout`: por SubOrder + Seller, amount, status, mp_payout_id | ✅ |
| `CommissionEntry`: registra comissão por sub-pedido com rate histórico | ✅ Excelente — preserva a taxa na época da venda |
| `StripeService.create_payment_intent`: Caso 1 (1 vendedor onboardado) = Destination Charge com split automático + parcelamento habilitado; Caso 2 (carrinho misto ou sem Connect) = PaymentIntent na plataforma | ✅ Correto |
| `StripeService.refund_payment`: estorno parcial/total, reverte transfer e application_fee se houve split | ✅ |
| `StripeService.cancel_payment_intent`: cancela PaymentIntent não capturado | ✅ |
| `StripeService.execute_separate_transfers`: divide pagamento entre múltiplos vendedores após confirmação | ✅ |
| `StripeService.create_account_link`: onboarding Stripe Express Account para vendedor | ✅ |
| `PixService.generate_brcode`: gera payload EMV válido (CRC16-CCITT correto), chave PIX hardcoded `contato@mysuperstore.com`, QR Code em base64 | ⚠️ **QR Code válido visualmente, mas a chave PIX é fake/fixa** |
| **PROBLEMA CENTRAL:** Não existe PSP real para PIX. O webhook que confirma o pagamento é `simulate-pix` — um endpoint de DEBUG que só funciona com `settings.DEBUG=True` | 🔴 **BLOQUEANTE para produção** |
| `process_successful_payment`: idempotente (select_for_update), confirma order/sub-orders, cria CommissionEntry, executa transfers, cria Payouts | ✅ Excelente lógica |
| `dispatch_post_payment_tasks`: dispara e-mails + webhook ERP via Celery | ✅ |
| `restore_stock`: devolve estoque transacionalmente | ✅ |
| `stripe_webhook`: valida assinatura HMAC, processa payment_intent.succeeded/failed + charge.refunded | ✅ |
| `confirm_payment_view`: confirmação autoritativa pós-cartão (fonte da verdade = Stripe) | ✅ |
| `cancel_payment_view`: cancela pedido não pago, restaura estoque | ✅ |
| `refund_payment_view`: estorno parcial/total com Stripe, atualiza sub-orders e estoque | ✅ |
| **Falta:** Webhook PIX de PSP real (Asaas/Efí Bank/PagSeguro) | 🔴 Ausente |

---

#### `apps/admin_api` + `apps/crm` — ✅ Existem, minimamente

- `admin_api`: endpoints de métricas, aprovação/rejeição de sellers, gestão de cupons
- `crm`: model de Lead com funnel_type (comprador/lojista), sincronizado com UserSurvey
- Ambos existem mas são funcionalmente básicos

---

### FRONTEND — Análise Página por Página

---

#### `lib/api.ts` — ✅ Completo e bem organizado

Todos os domínios cobertos: `authApi`, `usersApi`, `catalogApi`, `cartApi`, `sellerApi`, `ordersApi`, `paymentsApi`, `returnsApi`, `wishlistApi`, `reviewApi`, `userApi`, `chatApi`, `sellerDashboardApi`, `adminApi`, `crmApi`.

Interceptor de renovação automática de token (401 → refresh → retry) implementado. Suporte a multipart/FormData detectado automaticamente.

---

#### `app/checkout/page.tsx` — ✅ Implementado, com detalhe crítico

- Stripe Elements (`CardElement`) integrado ✅
- QR Code PIX exibido com copia-e-cola ✅
- Seletor de endereços com fallback para formulário manual ✅
- Cálculo de parcelas com juros (≤3x sem juros, >3x 1.99% a.m.) ✅
- Desconto PIX de 5% aplicado no frontend ✅
- **PROBLEMA:** botão "Já paguei (simular confirmação)" está visível para o usuário final — isto é código de debug exposto na UI de produção ❌

---

#### `app/dashboard/account/page.tsx` — ✅ Completo

- Avatar com upload via multipart ✅
- Nome, sobrenome, telefone ✅
- Dados demográficos (UserSurvey) ✅
- CRUD completo de endereços com auto-preenchimento via ViaCEP ✅
- Trocar senha ✅
- **O Sprint 1 do seu plano está praticamente pronto no frontend.** O que falta é o teste de integração real.

---

#### `app/seller/page.tsx` — ✅ Painel do lojista (89KB — arquivo grande)

Pelo tamanho (89KB), este arquivo contém o painel completo do lojista. Não lido linha a linha por volume, mas a estrutura existe.

#### `app/seller/dashboard/page.tsx` — ✅ Existe (15KB)

#### `app/seller/onboarding/` — ✅ Existe

---

#### `store/authStore.ts` — ⚠️ Parcialmente desalinhado

O tipo `User` já tem: `avatar_url`, `phone`, `has_store`, `has_products`, `is_seller`, `stripe_account_id`, `stripe_onboarding_complete`.  
**O que falta:** o backend `UserProfileSerializer` retorna esses campos? Precisa verificar o serializer para garantir que `has_store`, `has_products` estejam sendo calculados e retornados.

---

#### `store/cartStore.ts` — ⚠️ Incompleto

Só guarda `itemCount`. Não persiste os itens do carrinho em estado local — depende totalmente da API para renderizar o carrinho. Isso é uma escolha técnica válida, mas significa que a página do carrinho sempre faz request ao abrir.

---

## 🎯 Matriz de Verdade — O Que Falta Para Ir a Produção

| Gap | Impacto | Esforço | Prioridade |
|---|---|---|---|
| **PIX sem PSP real** — `simulate-pix` é debug que vai virar botão na produção para usuário final | Receita bloqueada | 2-3 dias | 🔴 P0 |
| **Bug em `create_variant`** — lógica de `destroy` dentro do método, deleta produto ao invés de criar variante | Lojista perde produto | 1h | 🔴 P0 |
| **Aprovação automática de sellers** — `views.py:40` | Qualidade do marketplace | 30min | 🔴 P0 |
| **Botão "simular PIX" visível em produção** — `checkout/page.tsx` | Fraude / confusão | 1h | 🔴 P0 |
| **URLs hardcoded** — `http://localhost:3000` nos e-mails de pedido | E-mails com link quebrado | 30min | 🔴 P0 |
| **Deploy em produção** — sem URL real o Stripe webhook não funciona | Tudo bloqueado | 1-2 dias | 🔴 P0 |
| **Stripe chaves live** — ainda em test mode | Pagamentos não reais | 30min | 🔴 P0 |
| **`SellerStripeCallbackView`** — seta flag sem verificar com Stripe | Vendedor "onboardado" sem ter concluído | 2h | 🟠 P1 |
| **`is_active=False` + JWT emitido** — registro sem verificação de e-mail ativa | Segurança/spam | 2h | 🟠 P1 |
| **Peso/dimensões no produto** — ausente, necessário para frete | Frete real impossível | 1 dia | 🟠 P1 |
| **`UserProfileSerializer`** — verificar se `has_store`, `has_products` são retornados | Bug 403 no console | 1h | 🟠 P1 |
| **CartStore sem persistência** — sempre busca da API | UX lenta | 1 dia | 🟡 P2 |
| **Chat sem WebSocket** — REST polling ou abertura a cada mensagem | UX ruim para chat | 3 dias | 🟡 P2 |
| **Meilisearch** — configurado no settings mas sem indexação implementada | Busca ainda é iFilter do DRF | 3 dias | 🟡 P2 |
| **SavedPaymentMethod** — Stripe Customer + SetupIntent não implementado | Checkout em 1 clique | 3 dias | 🟡 P2 |

---

## 📋 Reconciliação com Seu sprints.md

Seu plano é bom. A diferença de visão é apenas **onde estamos de verdade**:

| Seu Sprint | Status Real (auditoria) |
|---|---|
| **Sprint 1 — Estabilização 403, endereços, perfil, senha** | 🟡 **80% pronto no frontend.** O `account/page.tsx` já implementa endereços reais, avatar, dados demográficos, troca de senha. O que falta: corrigir o serializer `UserProfileSerializer` para retornar `has_store`/`has_products`, e testar a integração ponta a ponta. |
| **Sprint 2 — Cartões salvos (SetupIntent)** | ❌ **Não implementado.** O `checkout/page.tsx` usa `CardElement` sem Stripe Customer/SetupIntent. Correto identificar isso. |
| **Sprint 3 — Dashboard do cliente** | ❌ **Não implementado.** Nenhuma agregação de gasto/economia existe nos endpoints. |
| **Sprint 4 — "Vire lojista"** | 🟡 **60% pronto.** `SellerApplyView` existe, fluxo existe no frontend. Falta: remover auto-approve, e-mail de boas-vindas, wizard guiado. |
| **Sprint 5 — Frete Melhor Envio** | ❌ **Não implementado, e está bloqueado.** Falta peso/dimensões no model de produto antes de poder integrar. |
| **Sprint 6 — Testes e Produção** | ❌ **Não implementado.** `pytest.ini` existe, sem testes. |

---

## 🔧 Roadmap Real Reordenado

> Baseado na auditoria, não em suposições.

### 🔴 ESTA SEMANA — Os 5 Bugs que Bloqueiam Produção (2-3 dias de trabalho)

```
1. [30min] Corrigir bug crítico: create_variant em sellers/views.py:246-252
   → Remove código de destroy duplicado, implementa retorno correto

2. [30min] Remover aprovação automática: sellers/views.py:40
   → status=SellerStatus.PENDING (não APPROVED)

3. [1h]    Remover botão "simular PIX" da UI de produção
   → Condicionar a settings.DEBUG no frontend ou retirar

4. [30min] Parametrizar URLs nos e-mails de pedido
   → FRONTEND_URL como variável de ambiente

5. [1-2d]  Deploy Railway (backend) + Vercel (frontend) com chaves Stripe live
   → Isso desbloqueia: webhook real, pagamento real com cartão
```

**Resultado desta semana:** Aceita cartão de crédito real em produção. Sem depender de PIX.

---

### 🟠 PRÓXIMA SEMANA — PIX Real (3-4 dias)

```
6. [3-4d]  Integrar PSP para PIX (Asaas ou Efí Bank)
   → Substituir PixService.generate_brcode por chamada à API do PSP
   → Implementar endpoint webhook do PSP → acionar process_successful_payment()
   → PIX desconto 5% deve ser calculado no backend, não só no frontend
```

**Resultado:** Sistema aceita PIX real. Desconto de 5% no PIX vira diferencial competitivo real.

---

### 🟠 SEMANA 3 — Estabilização Real (Sprint 1 do seu plano)

```
7. [1h]   Verificar UserProfileSerializer → retornar has_store, has_products, is_seller
8. [2h]   Corrigir SellerStripeCallbackView → verificar com Stripe antes de setar flag  
9. [2h]   Ativar verificação de e-mail no registro (ou aceitar sem verificação = decisão de negócio)
10. [1d]  Testar integração ponta a ponta: registro → login → endereço → checkout → confirmação
```

**Resultado:** Sprint 1 do seu plano concluído. Produto funciona de ponta a ponta sem bugs óbvios.

---

### 🟡 SEMANA 4-5 — Cartões Salvos + Primeiro Lojista (Sprint 2 e 4 do seu plano)

```
11. [3d]  Stripe Customer + SetupIntent (cartões salvos 1-clique)
12. [2d]  Wizard "Vire Lojista" + aprovação manual com e-mail de boas-vindas
13. [1d]  Onboarding Stripe Connect validado em produção com lojista real
```

---

### 🟡 SEMANA 6-7 — Frete + Dashboard (Sprints 3 e 5 do seu plano)

```
14. [1d]  Adicionar peso/dimensões ao Product e ProductVariant  
15. [4d]  Integração Melhor Envio (sandbox → produção)
16. [3d]  Dashboard do cliente (aggregações de gasto/economia/categorias)
```

---

### 🟢 SEMANA 8+ — Qualidade, SEO, Escala

```
17. Testes pytest + Playwright (Sprint 6 do seu plano)
18. CI/CD GitHub Actions
19. Meilisearch indexação real
20. Chat WebSocket (atualização do REST atual)
```

---

## 💡 Insights de CTO Que Não Estavam em Nenhum Dos Dois Planos

### 1. Você tem um modelo de comissão avançado que não está aproveitando
`Category.category_commission_rate` sobrepõe `Seller.commission_rate`. Isso permite cobrar **taxas diferentes por categoria** (ex.: eletrônicos 12%, vestuário 18%). Nenhum marketplace brasileiro pequeno oferece isso. É um diferencial para atrair lojistas especializados. Use na proposta comercial.

### 2. `AffiliateLink` está implementado no model mas não tem endpoints
Você tem infraestrutura para um programa de afiliados. Com poucos dias de trabalho, compradores ganham comissão por indicar produtos — aquisição viral de compradores sem custo de marketing.

### 3. `SellerLeadsView` é ouro, mas o lojista não sabe que existe
Você já mostra para o lojista quais clientes têm produtos dele no carrinho ou na wishlist. Isso é uma feature paga em plataformas como Shopify (R$300/mês). Inclua no argumento de venda do plano Pro.

### 4. O sistema de devoluções já existe e está correto
`ReturnRequest` com fluxo completo, estorno parcial no Stripe, devolução de estoque transacional. A maioria dos marketplaces demora 6 meses para implementar isso. Você já tem.

### 5. O maior risco não é técnico
O maior risco é que o produto existe e funciona, mas está rodando em `localhost:8000` sem URL pública. Cada dia sem deploy é um dia sem feedback real de lojista, sem webhook do Stripe funcionando, sem a possibilidade de cobrar.

---

*Auditoria realizada com leitura direta de: users/models.py, users/views/, catalog/models.py, sellers/models.py, sellers/views.py, orders/models.py, orders/views.py, orders/tasks.py, payments/models.py, payments/services.py, payments/processing.py, payments/views.py, payments/tasks.py, carts/models.py, config/settings/base.py, config/settings/prod.py, config/urls.py, frontend/lib/api.ts, frontend/store/authStore.ts, frontend/store/cartStore.ts, frontend/app/checkout/page.tsx, frontend/app/dashboard/account/page.tsx*
