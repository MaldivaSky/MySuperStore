🗺️ Roadmap em Sprints
Estimativas em "dias ideais" de dev. Cada sprint termina buildável, testável e commitado.

🔧 Sprint 1 — Estabilização & Conta 360º (fundação — ~4-5 dias)
Objetivo: matar erros e conectar o que já existe. Maior valor, menor esforço.

Eliminar o 403 no console (gating de chamadas + interceptor que ignora 403 esperado)
Painel Lojista no header só para role===seller com loja aprovada e ≥1 produto (novo flag has_store no /users/me/ ou via seller_profile)
Conectar endereços reais (CRUD via /users/me/addresses/) — remover mock
Aba Dados Pessoais completa: telefone, foto de perfil (upload avatar), e bloco de dados demográficos (nascimento, gênero…) via UserSurvey
Trocar senha (expor ChangePasswordSerializer)
Alinhar authStore.User (avatar_url, phone, has_store)
Aceite: cliente edita perfil/foto/telefone, gerencia endereços de verdade, troca senha; zero 403 no console; lojista vê painel só se tiver loja+produto.

💳 Sprint 2 — Formas de Pagamento Salvas (~3 dias)
Objetivo: cartões salvos com segurança (sem guardar número no nosso banco).

Stripe Customer por usuário + SetupIntent para tokenizar cartão
Modelo SavedPaymentMethod (só guarda pm_id, bandeira, últimos 4, validade)
Endpoints: listar / adicionar / remover / definir padrão
UI na conta + seleção no checkout (1-clique)
Aceite: cliente adiciona cartão de teste, ele aparece salvo (•••• 4242), e paga no checkout sem redigitar.

📊 Sprint 3 — Dashboard do Cliente (diferencial) (~3-4 dias)
Objetivo: o cliente ver o quanto economizou — engajamento e retenção.

Endpoint de agregação: total gasto, gasto por categoria, nº de compras, devoluções/trocas, total economizado (somatório de descontos/flash sales), cupons usados
UI com gráficos (Recharts, já instalado): donut por categoria, card "Você economizou R$ X", timeline de compras
Você esqueceu: sugiro incluir → produtos vistos recentemente, lojas seguidas, avaliações escritas, e um nível de fidelidade/cashback (forte gancho de retenção)
Aceite: dashboard mostra métricas reais agregadas dos pedidos do usuário.

🔀 Sprint 4 — Perfis & "Vire Lojista" (~3 dias)
Objetivo: todo comprador pode virar lojista; cada perfil vê seu dashboard.

Fluxo "Quero Vender" (cliente → aplica → vira seller sem recriar conta)
Navegação e dashboards role-aware (comprador vs lojista vs admin)
Onboarding Stripe Connect integrado a esse fluxo
Aceite: um cliente vira lojista pelo painel, sem perder histórico, e passa a ver o painel do lojista.

🚚 Sprint 5 — Cálculo de Frete (~4-5 dias)
Objetivo: frete real por CEP (resposta à sua pergunta #4 — detalho abaixo).

Campos de peso e dimensões no produto/variante
Integração Melhor Envio (sandbox) — agregador que cobre Correios PAC/SEDEX + transportadoras numa API só
Frete por sub-pedido (cada vendedor tem CEP de origem; carrinho multi-loja = múltiplos fretes)
Regra de frete grátis acima de R$ X + fallback (tabela por região/peso) se a API falhar
Aceite: no checkout, informo o CEP e vejo opções/prazos reais; multi-vendedor soma fretes corretamente.

🧪 Sprint 6 — Testes & Produção (~5 dias)
Objetivo: robustez para ir ao ar (sua pergunta #5).

Testes backend: pytest + factory (fluxos críticos: pedido, pagamento, estorno, frete)
Testes frontend/E2E: Playwright (checkout PIX + cartão)
CI/CD (GitHub Actions: lint + test + build em cada PR)
Ambientes staging/prod (settings, secrets, DEBUG=False, webhook Stripe real)
Observabilidade (Sentry já no requirements) + LGPD (exportar/excluir dados)
Aceite: pipeline verde em PR; deploy de staging funcional; cobertura dos fluxos de dinheiro.

🚀 Sprint 7+ — Robustez de Marketplace (sua pergunta #6)
Roadmap de "grandes players", priorizado:

Busca de verdade (Meilisearch já no stack — indexar produtos, filtros facetados)
Mensageria comprador↔lojista (hoje é mock no chat)
Reputação & avaliações de loja (nota do vendedor, selo)
Notificações (e-mail transacional + in-app: pedido, envio, entrega)
Antifraude & moderação (limites, revisão de produtos ilícitos — já há approval_status)
Repasses agendados a lojistas (payouts automáticos pós-entrega)
Logística/fulfillment, cupons avançados, recomendação, app PWA
📌 Resposta direta à pergunta de frete (#4)
Correios direto hoje é inviável para MVP: a API pública de preço foi descontinuada; a atual (CWS) exige contrato comercial e credenciais.

Como ML/Amazon fazem (e minha recomendação): usam agregadores logísticos + regras de negócio. Para nós:

Melhor Envio (sandbox grátis) — uma API REST que devolve PAC, SEDEX e transportadoras com preço+prazo por CEP origem→destino, peso e dimensões. Ideal para TCC e produção.
Regra: produto tem peso/dimensões → vendedor tem CEP de origem → calcula no checkout pelo CEP do cliente → frete grátis acima de um limite (subsídio, como ML Full) → fallback por tabela regional se a API cair.
É 100% testável em sandbox e troca pra produção só mudando credenciais.

▶️ Recomendação de início
Como PM, recomendo começar pelo Sprint 1 (Estabilização & Conta 360º): mata o 403, corrige o gating do painel lojista e conecta endereços/perfil/foto/senha que já existem no backend — é o maior retorno imediato e destrava o resto.

Posso começar o Sprint 1 agora? Se preferir outra ordem (ex.: frete ou dashboard primeiro), me diz que reordeno. Cada sprint eu entrego buildado, testado e commitado no GitHub — como já vínhamos fazendo.