import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Clock, DollarSign, CreditCard, Zap } from 'lucide-react'

export default async function ProposalViewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const proposal = await prisma.proposal.findUnique({
    where: { shareToken: token },
    include: { client: true },
  })

  if (!proposal) {
    notFound()
  }

  // Mark as viewed
  if (proposal.status === 'enviada') {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'visualizada' },
    })
  }

  const serviceLabels: Record<string, string> = {
    site: 'Site Institucional',
    landing_page: 'Landing Page',
    agente_ia: 'Agente de IA',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{proposal.title}</h1>
          <p className="text-slate-500 mt-2">
            Proposta v{proposal.version} • {serviceLabels[proposal.serviceType] || proposal.serviceType}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Preparada para: {proposal.client.name} {proposal.client.company ? `(${proposal.client.company})` : ''}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {proposal.summary && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Resumo do Projeto</h2>
              <p className="text-slate-600 leading-relaxed">{proposal.summary}</p>
            </section>
          )}

          {proposal.scope && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Escopo Detalhado</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line">{proposal.scope}</div>
            </section>
          )}

          {/* Investment section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposal.timeline && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <Clock size={24} className="text-indigo-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-wider">Prazo</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{proposal.timeline}</p>
              </div>
            )}
            {proposal.investment && (
              <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl p-6 shadow-lg text-center text-white">
                <DollarSign size={24} className="mx-auto mb-2 opacity-80" />
                <p className="text-xs uppercase tracking-wider opacity-80">Investimento</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(proposal.investment)}</p>
              </div>
            )}
            {proposal.paymentTerms && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <CreditCard size={24} className="text-violet-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 uppercase tracking-wider">Pagamento</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{proposal.paymentTerms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-400">
            Proposta gerada por Atto CRM • {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}
