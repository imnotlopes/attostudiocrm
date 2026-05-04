'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, FileText, Eye, Edit2, Trash2, Copy, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency, formatDate, getServiceLabel, SERVICE_TYPES } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Proposal {
  id: string
  clientId: string
  client: { id: string; name: string; company: string | null }
  dealId: string | null
  title: string
  serviceType: string
  summary: string | null
  scope: string | null
  timeline: string | null
  investment: number | null
  paymentTerms: string | null
  status: string
  version: number
  shareToken: string | null
  createdAt: string
  updatedAt: string
}

interface Client {
  id: string
  name: string
  company: string | null
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' | 'purple' }> = {
  rascunho: { label: 'Rascunho', variant: 'default' },
  enviada: { label: 'Enviada', variant: 'info' },
  visualizada: { label: 'Visualizada', variant: 'warning' },
  aprovada: { label: 'Aprovada', variant: 'success' },
  recusada: { label: 'Recusada', variant: 'danger' },
}

const scopeTemplates: Record<string, string> = {
  site: `• Criação de layout personalizado e responsivo
• Desenvolvimento de até 5 páginas (Home, Sobre, Serviços, Blog, Contato)
• Otimização para SEO (meta tags, sitemap, velocidade)
• Integração com Google Analytics e Search Console
• Formulário de contato funcional
• Design adaptado para mobile, tablet e desktop
• Hospedagem e domínio (1º ano incluso)`,
  landing_page: `• Design de alta conversão em página única
• Copy persuasiva e otimizada para conversão
• Seções: Hero, Benefícios, Depoimentos, Oferta, CTA
• Integração com ferramenta de captura (e-mail / WhatsApp)
• Otimização de velocidade e SEO
• Design responsivo para todos os dispositivos
• Testes A/B de elementos principais`,
  agente_ia: `• Desenvolvimento de agente de IA para atendimento ao cliente
• Treinamento com base de conhecimento do negócio
• Integração com WhatsApp Business / website
• Fluxos de atendimento personalizados
• Painel de monitoramento de conversas
• Escalação automática para atendente humano
• Relatórios de desempenho e satisfação
• Suporte técnico e ajustes mensais`,
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState<Proposal | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)

  const [form, setForm] = useState({
    clientId: '',
    title: '',
    serviceType: 'site',
    summary: '',
    scope: '',
    timeline: '',
    investment: '',
    paymentTerms: '',
    status: 'rascunho',
  })

  const fetchProposals = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/proposals?${params}`)
      setProposals(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/clients')
    setClients(await res.json())
  }, [])

  useEffect(() => {
    fetchProposals()
    fetchClients()
  }, [fetchProposals, fetchClients])

  function openNew() {
    setEditingProposal(null)
    setForm({ clientId: '', title: '', serviceType: 'site', summary: '', scope: scopeTemplates.site, timeline: '15 a 20 dias úteis', investment: '', paymentTerms: '50% na aprovação + 50% na entrega', status: 'rascunho' })
    setShowForm(true)
  }

  function openEdit(p: Proposal) {
    setEditingProposal(p)
    setForm({
      clientId: p.clientId,
      title: p.title,
      serviceType: p.serviceType,
      summary: p.summary || '',
      scope: p.scope || '',
      timeline: p.timeline || '',
      investment: p.investment?.toString() || '',
      paymentTerms: p.paymentTerms || '',
      status: p.status,
    })
    setShowForm(true)
  }

  function handleServiceChange(type: string) {
    setForm({
      ...form,
      serviceType: type,
      scope: scopeTemplates[type] || '',
    })
  }

  async function saveProposal() {
    if (!form.clientId || !form.title) return

    if (editingProposal) {
      await fetch('/api/proposals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProposal.id, ...form }),
      })
    } else {
      await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }

    setShowForm(false)
    fetchProposals()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/proposals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchProposals()
  }

  async function createNewVersion(p: Proposal) {
    await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: p.clientId,
        dealId: p.dealId,
        title: p.title,
        serviceType: p.serviceType,
        summary: p.summary,
        scope: p.scope,
        timeline: p.timeline,
        investment: p.investment,
        paymentTerms: p.paymentTerms,
        version: p.version + 1,
      }),
    })
    fetchProposals()
  }

  async function deleteProposal(id: string) {
    if (!confirm('Excluir esta proposta?')) return
    await fetch(`/api/proposals?id=${id}`, { method: 'DELETE' })
    fetchProposals()
  }

  function copyShareLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/proposal-view/${token}`)
    alert('Link copiado!')
  }

  async function convertToContract(p: Proposal) {
    await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: p.clientId,
        service: `${getServiceLabel(p.serviceType)} - ${p.title}`,
        type: p.serviceType === 'agente_ia' ? 'recorrente' : 'unico',
        totalValue: p.investment,
        monthlyValue: p.serviceType === 'agente_ia' ? p.investment : null,
        startDate: new Date().toISOString(),
      }),
    })
    alert('Contrato criado com sucesso!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Propostas</h1>
          <p className="text-slate-500 mt-1">{proposals.length} propostas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25">
          <Plus size={18} /> Nova Proposta
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'rascunho', 'enviada', 'visualizada', 'aprovada', 'recusada'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s ? statusConfig[s]?.label : 'Todas'}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
            <FileText size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma proposta encontrada</p>
          </div>
        ) : (
          proposals.map((p, i) => (
            <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-700">{p.title}</h3>
                    <Badge variant={statusConfig[p.status]?.variant || 'default'}>{statusConfig[p.status]?.label}</Badge>
                    <span className="text-xs text-slate-400">v{p.version}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.client.name} {p.client.company ? `(${p.client.company})` : ''} • {getServiceLabel(p.serviceType)} • {formatDate(p.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {p.investment && (
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(p.investment)}</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowPreview(p)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all" title="Preview">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    {p.shareToken && (
                      <button onClick={() => copyShareLink(p.shareToken!)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all" title="Copiar link">
                        <Copy size={16} />
                      </button>
                    )}
                    {p.status === 'enviada' && (
                      <button onClick={() => updateStatus(p.id, 'visualizada')} className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all" title="Marcar como visualizada">
                        <Eye size={16} />
                      </button>
                    )}
                    {(p.status === 'visualizada' || p.status === 'enviada') && (
                      <>
                        <button onClick={() => { updateStatus(p.id, 'aprovada'); convertToContract(p) }} className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all" title="Aprovar">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => updateStatus(p.id, 'recusada')} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Recusar">
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button onClick={() => createNewVersion(p)} className="p-2 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 transition-all" title="Nova versão">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => deleteProposal(p.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingProposal ? 'Editar Proposta' : 'Nova Proposta'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente *</label>
              <select value={form.clientId} onChange={(e) => setForm({...form, clientId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Proposta Site Institucional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Serviço</label>
              <select value={form.serviceType} onChange={(e) => handleServiceChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Resumo do Projeto</label>
            <textarea value={form.summary} onChange={(e) => setForm({...form, summary: e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Breve descrição do projeto..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Escopo Detalhado</label>
            <textarea value={form.scope} onChange={(e) => setForm({...form, scope: e.target.value})} rows={8} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Prazo</label>
              <input type="text" value={form.timeline} onChange={(e) => setForm({...form, timeline: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Investimento (R$)</label>
              <input type="number" value={form.investment} onChange={(e) => setForm({...form, investment: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Condições de Pagamento</label>
              <input type="text" value={form.paymentTerms} onChange={(e) => setForm({...form, paymentTerms: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200">Cancelar</button>
            <button onClick={saveProposal} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25">
              {editingProposal ? 'Salvar' : 'Criar Proposta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {showPreview && (
        <Modal open={!!showPreview} onClose={() => setShowPreview(null)} title="Preview da Proposta" size="xl">
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">{showPreview.title}</h2>
              <p className="text-slate-500 mt-1">Proposta v{showPreview.version} • {getServiceLabel(showPreview.serviceType)}</p>
              <p className="text-sm text-slate-400 mt-1">Para: {showPreview.client.name} {showPreview.client.company ? `(${showPreview.client.company})` : ''}</p>
            </div>

            {showPreview.summary && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Resumo do Projeto</h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">{showPreview.summary}</p>
              </div>
            )}

            {showPreview.scope && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Escopo</h3>
                <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl whitespace-pre-line">{showPreview.scope}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {showPreview.timeline && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                  <Clock size={20} className="text-indigo-500 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Prazo</p>
                  <p className="text-sm font-semibold text-slate-700">{showPreview.timeline}</p>
                </div>
              )}
              {showPreview.investment && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-xs text-slate-500">Investimento</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(showPreview.investment)}</p>
                </div>
              )}
              {showPreview.paymentTerms && (
                <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 text-center">
                  <p className="text-xs text-slate-500">Pagamento</p>
                  <p className="text-sm font-semibold text-slate-700">{showPreview.paymentTerms}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
