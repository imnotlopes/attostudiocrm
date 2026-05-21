'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, FileText, Eye, Edit2, Trash2, Copy,
  CheckCircle, XCircle, Clock, Send,
} from 'lucide-react'
import {
  formatCurrency, formatDate, getServiceLabel, getPackageLabel,
  SERVICE_TYPES, PACKAGES,
} from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Proposal {
  id: string
  clientId: string
  client: { id: string; name: string; company: string | null }
  dealId: string | null
  title: string
  serviceType: string
  packageTier: string | null
  summary: string | null
  scope: string | null
  timeline: string | null
  setupValue: number | null
  monthlyValue: number | null
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

const STATUS: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  rascunho:   { label: 'Rascunho',    variant: 'default' },
  enviada:    { label: 'Enviada',     variant: 'info' },
  visualizada:{ label: 'Visualizada', variant: 'warning' },
  aceita:     { label: 'Aceita',      variant: 'success' },
  recusada:   { label: 'Recusada',    variant: 'danger' },
}

const SCOPE_TEMPLATES: Record<string, string> = {
  gmn: `• Criação e otimização completa do perfil Google Meu Negócio
• Configuração de categorias, horários, fotos e descrição
• Publicação de posts semanais no perfil
• Gestão de avaliações e respostas
• Relatórios mensais de desempenho (buscas, cliques, chamadas)
• Configuração de atributos e perguntas frequentes
• Monitoramento de concorrentes locais`,

  site: `• Criação de layout personalizado e responsivo
• Desenvolvimento de até 5 páginas (Home, Sobre, Serviços, Blog, Contato)
• Otimização básica para SEO (meta tags, sitemap, velocidade)
• Integração com Google Analytics e Search Console
• Formulário de contato e WhatsApp integrado
• Design adaptado para mobile, tablet e desktop
• Hospedagem e domínio (1º ano incluso)`,

  seo: `• Auditoria técnica completa do site
• Pesquisa e mapeamento de palavras-chave estratégicas
• Otimização on-page (títulos, meta descriptions, headings)
• Criação de conteúdo otimizado (4 artigos/mês)
• Link building — captação de backlinks qualificados
• Relatório mensal de posicionamento e tráfego
• Otimização de velocidade e Core Web Vitals`,

  google_ads: `• Criação e configuração completa da conta Google Ads
• Pesquisa de palavras-chave e análise da concorrência
• Criação de campanhas de busca e display
• Desenvolvimento de anúncios e extensões
• Configuração de conversões e rastreamento
• Gestão e otimização semanal das campanhas
• Relatório mensal de resultados (CTR, CPC, conversões)`,

  whatsapp_automation: `• Criação de fluxos de atendimento automatizado
• Integração com WhatsApp Business API
• Mensagens de boas-vindas, qualificação e follow-up automático
• Cardápio digital ou catálogo de serviços no WhatsApp
• Notificações e lembretes automáticos para clientes
• Painel de controle e monitoramento de conversas
• Treinamento da equipe para uso da plataforma`,

  ecommerce: `• Criação de loja virtual personalizada e responsiva
• Cadastro de até 50 produtos com fotos e descrições
• Configuração de meios de pagamento (cartão, PIX, boleto)
• Integração com Correios e transportadoras para frete
• Painel administrativo para gestão de pedidos
• Otimização para SEO e velocidade
• Integração com redes sociais e Google Shopping`,
}

const emptyForm = {
  clientId: '', title: '', serviceType: 'gmn', packageTier: '',
  summary: '', scope: SCOPE_TEMPLATES.gmn, timeline: '',
  setupValue: '', monthlyValue: '', paymentTerms: '', status: 'rascunho',
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState<Proposal | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

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
    setForm({ ...emptyForm, paymentTerms: '50% na aprovação + 50% na entrega', timeline: '15 a 20 dias úteis' })
    setShowForm(true)
  }

  function openEdit(p: Proposal) {
    setEditingProposal(p)
    setForm({
      clientId: p.clientId,
      title: p.title,
      serviceType: p.serviceType,
      packageTier: p.packageTier || '',
      summary: p.summary || '',
      scope: p.scope || '',
      timeline: p.timeline || '',
      setupValue: p.setupValue?.toString() || '',
      monthlyValue: p.monthlyValue?.toString() || '',
      paymentTerms: p.paymentTerms || '',
      status: p.status,
    })
    setShowForm(true)
  }

  function handleServiceChange(type: string) {
    setForm(f => ({ ...f, serviceType: type, scope: SCOPE_TEMPLATES[type] || '' }))
  }

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

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
        packageTier: p.packageTier,
        summary: p.summary,
        scope: p.scope,
        timeline: p.timeline,
        setupValue: p.setupValue,
        monthlyValue: p.monthlyValue,
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

  async function acceptAndConvert(p: Proposal) {
    await updateStatus(p.id, 'aceita')
    await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: p.clientId,
        service: getServiceLabel(p.serviceType),
        type: p.monthlyValue ? 'recorrente' : 'unico',
        setupValue: p.setupValue,
        monthlyValue: p.monthlyValue,
        totalValue: p.investment,
        startDate: new Date().toISOString(),
      }),
    })
  }

  function copyShareLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/proposal-view/${token}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-success)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{proposals.length} proposta{proposals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        >
          <Plus size={16} /> Nova Proposta
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(['', ...Object.keys(STATUS)] as string[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="h-8 px-3 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: statusFilter === s ? 'var(--color-text)' : 'var(--color-surface)',
              color: statusFilter === s ? 'var(--color-bg)' : 'var(--color-text-muted)',
              borderColor: statusFilter === s ? 'var(--color-text)' : 'var(--color-border)',
            }}
          >
            {s ? STATUS[s]?.label : 'Todas'}
          </button>
        ))}
      </div>

      {/* List */}
      {proposals.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <FileText size={36} className="text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Nenhuma proposta encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {proposals.map((p) => {
            const canAct = p.status === 'visualizada' || p.status === 'enviada'
            return (
              <div
                key={p.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{p.title}</span>
                      <Badge variant={STATUS[p.status]?.variant || 'default'}>
                        {STATUS[p.status]?.label || p.status}
                      </Badge>
                      {p.version > 1 && (
                        <span className="text-[11px] text-[var(--color-text-muted)]">v{p.version}</span>
                      )}
                      {p.packageTier && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
                        >
                          {getPackageLabel(p.packageTier)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {p.client.name}{p.client.company ? ` (${p.client.company})` : ''} ·{' '}
                      {getServiceLabel(p.serviceType)} · {formatDate(p.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Investment summary */}
                    <div className="hidden sm:block text-right">
                      {p.setupValue ? (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Setup <span className="font-medium text-[var(--color-text)]">{formatCurrency(p.setupValue)}</span>
                          {p.monthlyValue ? (
                            <> · Mensal <span className="font-medium" style={{ color: 'var(--color-success)' }}>{formatCurrency(p.monthlyValue)}</span></>
                          ) : null}
                        </p>
                      ) : p.investment ? (
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(p.investment)}</p>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      <ActionBtn title="Preview" onClick={() => setShowPreview(p)}>
                        <Eye size={14} />
                      </ActionBtn>
                      <ActionBtn title="Editar" onClick={() => openEdit(p)}>
                        <Edit2 size={14} />
                      </ActionBtn>
                      {p.shareToken && (
                        <ActionBtn title="Copiar link" onClick={() => copyShareLink(p.shareToken!)}>
                          <Copy size={14} />
                        </ActionBtn>
                      )}
                      {p.status === 'rascunho' && (
                        <ActionBtn title="Marcar como enviada" onClick={() => updateStatus(p.id, 'enviada')}>
                          <Send size={14} />
                        </ActionBtn>
                      )}
                      {canAct && (
                        <>
                          <ActionBtn title="Aceitar + gerar contrato" onClick={() => acceptAndConvert(p)} accent="success">
                            <CheckCircle size={14} />
                          </ActionBtn>
                          <ActionBtn title="Recusar" onClick={() => updateStatus(p.id, 'recusada')} accent="danger">
                            <XCircle size={14} />
                          </ActionBtn>
                        </>
                      )}
                      <ActionBtn title="Nova versão" onClick={() => createNewVersion(p)}>
                        <Copy size={14} />
                      </ActionBtn>
                      <ActionBtn title="Excluir" onClick={() => deleteProposal(p.id)} accent="danger">
                        <Trash2 size={14} />
                      </ActionBtn>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingProposal ? 'Editar Proposta' : 'Nova Proposta'}
        size="xl"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cliente *">
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={inp}>
                <option value="">Selecione</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Título *">
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="Ex: Proposta Google Meu Negócio" className={inp} />
            </Field>
            <Field label="Serviço">
              <select value={form.serviceType} onChange={e => handleServiceChange(e.target.value)} className={inp}>
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Pacote">
              <select value={form.packageTier} onChange={e => set('packageTier', e.target.value)} className={inp}>
                <option value="">Selecione (opcional)</option>
                {PACKAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Resumo do projeto">
            <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
              rows={2} placeholder="Breve descrição do projeto e problema que resolve..."
              className={`${inp} resize-none`} />
          </Field>

          <Field label="Escopo detalhado">
            <textarea value={form.scope} onChange={e => set('scope', e.target.value)}
              rows={7} className={`${inp} resize-none font-mono text-xs`} />
          </Field>

          {/* Financial */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
              Investimento
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Setup / Implantação (R$)">
                <input type="number" value={form.setupValue} onChange={e => set('setupValue', e.target.value)}
                  placeholder="0" className={inp} />
              </Field>
              <Field label="Mensalidade (R$)">
                <input type="number" value={form.monthlyValue} onChange={e => set('monthlyValue', e.target.value)}
                  placeholder="0 se não recorrente" className={inp} />
              </Field>
              <Field label="Prazo de entrega">
                <input type="text" value={form.timeline} onChange={e => set('timeline', e.target.value)}
                  placeholder="Ex: 15 dias úteis" className={inp} />
              </Field>
              <Field label="Condições de pagamento" className="sm:col-span-3">
                <input type="text" value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}
                  placeholder="Ex: 50% na aprovação + 50% na entrega" className={inp} />
              </Field>
            </div>
          </div>

          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
              Cancelar
            </button>
            <button onClick={saveProposal}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90">
              {editingProposal ? 'Salvar' : 'Criar Proposta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {showPreview && (
        <Modal open={!!showPreview} onClose={() => setShowPreview(null)} title="Preview da Proposta" size="xl">
          <div className="space-y-6">
            <div className="text-center pb-5 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-semibold">{showPreview.title}</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {getServiceLabel(showPreview.serviceType)}
                {showPreview.packageTier ? ` · Pacote ${getPackageLabel(showPreview.packageTier)}` : ''}
                {' · '}v{showPreview.version}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Para: {showPreview.client.name}{showPreview.client.company ? ` (${showPreview.client.company})` : ''}
              </p>
              <Badge variant={STATUS[showPreview.status]?.variant || 'default'} className="mt-2 inline-block">
                {STATUS[showPreview.status]?.label}
              </Badge>
            </div>

            {showPreview.summary && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Resumo</h3>
                <p className="text-sm bg-[var(--color-surface-2)] px-4 py-3 rounded-lg">{showPreview.summary}</p>
              </div>
            )}

            {showPreview.scope && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">Escopo</h3>
                <div className="text-sm bg-[var(--color-surface-2)] px-4 py-3 rounded-lg whitespace-pre-line">
                  {showPreview.scope}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {showPreview.setupValue ? (
                <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-center">
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Setup</p>
                  <p className="text-lg font-semibold mt-1 tabular-nums">{formatCurrency(showPreview.setupValue)}</p>
                </div>
              ) : null}
              {showPreview.monthlyValue ? (
                <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-center"
                  style={{ borderColor: 'var(--color-success)' }}>
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Mensalidade</p>
                  <p className="text-lg font-semibold mt-1 tabular-nums" style={{ color: 'var(--color-success)' }}>
                    {formatCurrency(showPreview.monthlyValue)}/mês
                  </p>
                </div>
              ) : showPreview.investment ? (
                <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-center"
                  style={{ borderColor: 'var(--color-success)' }}>
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Investimento</p>
                  <p className="text-lg font-semibold mt-1 tabular-nums" style={{ color: 'var(--color-success)' }}>
                    {formatCurrency(showPreview.investment)}
                  </p>
                </div>
              ) : null}
              {showPreview.timeline && (
                <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-center">
                  <Clock size={16} className="text-[var(--color-text-muted)] mx-auto mb-1" />
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Prazo</p>
                  <p className="text-sm font-medium mt-0.5">{showPreview.timeline}</p>
                </div>
              )}
              {showPreview.paymentTerms && (
                <div className="rounded-lg border border-[var(--color-border)] px-4 py-3 text-center">
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Pagamento</p>
                  <p className="text-sm font-medium mt-0.5">{showPreview.paymentTerms}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ─── helpers ─── */

const inp = 'w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]'

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ActionBtn({
  children, title, onClick, accent,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  accent?: 'success' | 'danger'
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-md transition-colors"
      style={{
        color: 'var(--color-text-muted)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.color = accent === 'success'
          ? 'var(--color-success)'
          : accent === 'danger'
          ? 'var(--color-danger)'
          : 'var(--color-text)'
        el.style.background = accent === 'success'
          ? 'var(--color-success-soft)'
          : accent === 'danger'
          ? 'var(--color-danger-soft)'
          : 'var(--color-surface-2)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.color = 'var(--color-text-muted)'
        el.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
