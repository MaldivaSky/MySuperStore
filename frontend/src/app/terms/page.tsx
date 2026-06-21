export const dynamic = "force-dynamic";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Termos de Uso e Política de Privacidade
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: 19 de Junho de 2026
          </p>

          <div className="space-y-8 text-foreground/80 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e utilizar o marketplace <strong>MySuperStore</strong>, você concorda com os presentes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, você não tem permissão para acessar o serviço, seja como cliente ou como lojista parceiro.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Para os Compradores (Clientes)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Você tem o direito inalienável ao <strong>Arrependimento de Compra (7 dias)</strong> contados a partir da data de recebimento do produto, conforme garantido por lei. Nosso sistema de devoluções (RMA) processa estornos integralmente após a devolução.</li>
                <li>Avaliações passam por um <strong>sistema de moderação ativa e inteligência artificial</strong> para banir palavrões ou ofensas.</li>
                <li>Seus dados de pagamento são criptografados de ponta-a-ponta via Stripe; o MySuperStore não armazena o número do seu cartão de crédito.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. Para os Vendedores (Lojistas)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>O cadastro de produtos com teor ilícito, pirataria, armamentos ou substâncias controladas é estritamente proibido. O sistema opera com <strong>Auditoria Ativa e NLP (Natural Language Processing)</strong>. A violação gera "Strikes".</li>
                <li>O Lojista que acumular <strong>3 Strikes</strong> terá a sua conta sumariamente congelada e os repasses financeiros bloqueados.</li>
                <li>A comissão padrão cobrada pelo MySuperStore é de <strong>15%</strong> (com possibilidade de negociação via Administrador por categorias de produtos específicas). O repasse é processado via Split Payment (Stripe Connect).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Política de Privacidade (Uso de Dados)</h2>
              <p>
                As métricas de uso e comportamento, bem como histórico de aquisição e evasão (Churn), são processadas internamente para melhoria da oferta de produtos (Motor de Recomendação). Em hipótese alguma seus dados de contato são vendidos a empresas parceiras externas.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Programa de Afiliados e Links</h2>
              <p>
                O uso indevido de links de Afiliados, spam ou engenharia social fraudulenta resultará em suspensão e retenção do saldo não-pago na carteira do afiliado correspondente.
              </p>
            </section>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border/40 text-center">
            <p className="text-sm font-semibold text-primary">
              MySuperStore — O Centro da Gravidade Comercial
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
