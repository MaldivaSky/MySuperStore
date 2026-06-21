# 🚀 MySuperStore — Guia de Deploy

## Arquitetura de Produção

```
[Usuário] → [Vercel — Next.js] → [Railway — Django API] → [Neon — PostgreSQL]
                                                         → [Redis — Celery]
                                                         → [Stripe — Pagamentos]
```

---

## 1. RAILWAY (Backend Django)

### Variáveis de Ambiente Obrigatórias

Acesse **Railway → Seu Projeto → Variables** e adicione:

```env
# Django
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=<gere com: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=<sua-url.railway.app>,mysuperstore-lime.vercel.app

# Banco de dados (Neon já configurado no .env local)
DATABASE_URL=postgresql://neondb_owner:npg_T4BdoCZsE1wf@ep-orange-hall-acbq3bui-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis (adicione serviço Redis no Railway)
CELERY_BROKER_URL=redis://<railway-redis-url>:6379/0
CELERY_RESULT_BACKEND=redis://<railway-redis-url>:6379/1

# Stripe — CHAVES DE PRODUÇÃO (não as de teste!)
STRIPE_SECRET_KEY=sk_live_<sua-chave-live>
STRIPE_PUBLIC_KEY=pk_live_<sua-chave-live>
STRIPE_WEBHOOK_SECRET=whsec_<gerado-pelo-stripe-depois-do-deploy>

# CORS — permite o frontend Vercel chamar o backend
CORS_ALLOWED_ORIGINS=https://mysuperstore-lime.vercel.app

# E-mail (Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=<senha-de-app-16-chars>
MAIL_USE_TLS=True
MAIL_DEFAULT_SENDER=MySuperStore <seu-email@gmail.com>

# Frontend URL (para links nos e-mails)
FRONTEND_URL=https://mysuperstore-lime.vercel.app

# Sentry (opcional mas recomendado)
SENTRY_DSN=<seu-dsn-do-sentry>

# Meilisearch (opcional agora)
MEILI_MASTER_KEY=<sua-chave>
MEILI_HOST=<sua-url-meilisearch>
```

### ⚠️ Atenção: Stripe Webhook

Após o primeiro deploy Railway, você terá uma URL como `https://xxx.railway.app`.

Registre o webhook no Stripe:
1. Acesse https://dashboard.stripe.com/webhooks
2. **Add endpoint**: `https://xxx.railway.app/api/v1/payments/webhook/`
3. Eventos para assinar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copie o **Signing Secret** (whsec_...) e cole em `STRIPE_WEBHOOK_SECRET` no Railway

---

## 2. VERCEL (Frontend Next.js)

### Variáveis de Ambiente

Acesse **Vercel → Seu Projeto → Settings → Environment Variables**:

```env
# URL do backend Railway (substitua pela URL real após deploy)
NEXT_PUBLIC_API_URL=https://xxx.railway.app/api/v1

# Stripe — chave PÚBLICA de produção
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_<sua-chave-live>

# Deixe False em produção (oculta botão "simular PIX")
NEXT_PUBLIC_IS_DEBUG=false
```

> **IMPORTANTE:** Em desenvolvimento local, crie `frontend/.env.local` com:
> ```
> NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
> NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
> NEXT_PUBLIC_IS_DEBUG=true
> ```

---

## 3. Sequência de Deploy (primeira vez)

```bash
# 1. Suba o código para o GitHub
git add -A
git commit -m "chore: sprint 0 - production fixes"
git push origin main

# Railway faz deploy automático ao detectar o push (se configurado)
# Vercel faz deploy automático ao detectar o push (se configurado)

# 2. Após o deploy Railway, pegue a URL e:
#    - Configure NEXT_PUBLIC_API_URL no Vercel
#    - Configure DJANGO_ALLOWED_HOSTS no Railway com a URL Railway
#    - Registre o webhook do Stripe

# 3. Teste o fluxo completo:
#    - Criar conta → Adicionar produto ao carrinho → Checkout com cartão de teste
#    - Use o cartão: 4242 4242 4242 4242, CVC: qualquer 3 dígitos, validade: qualquer data futura
```

---

## 4. Checklist Pré-Produção (Stripe Live)

Antes de mudar para chaves `live` do Stripe:

- [ ] URL pública do backend configurada e funcionando
- [ ] Webhook registrado e testado com chaves de TESTE
- [ ] E-mails de confirmação funcionando (teste com um pedido real em modo teste)
- [ ] Pelo menos 1 produto cadastrado com lojista aprovado manualmente
- [ ] SSL ativo (Vercel e Railway já proveem SSL automático)

---

## 5. Stripe Connect — Onboarding de Lojistas

Para que lojistas recebam repasse, eles precisam completar o onboarding do Stripe Connect:

1. Lojista acessa `/seller/onboarding` no frontend
2. O sistema redireciona para o Stripe para preenchimento de dados bancários
3. Após completar, o lojista volta e fica com `stripe_onboarding_complete=True`
4. A partir daí, pagamentos feitos por compradores dos produtos dele são divididos automaticamente

> **Em modo TESTE:** o Stripe Connect Express Account funciona com dados fictícios.
> **Em produção:** o lojista precisa informar CPF/CNPJ, dados bancários reais.
