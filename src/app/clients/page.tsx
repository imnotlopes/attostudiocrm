'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Search, Download, Users, ChevronRight, Edit2, Trash2,
  AlertCircle, Phone, MapPin,
} from 'lucide-react'
import {
  getStatusLabel, getLeadSourceLabel, getServiceLabel, getPackageLabel,
  LEAD_SOURCES, SERVICE_TYPES, PACKAGES, formatCurrency, formatDate,
} from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  company: string | null
  whatsapp: string | null
  email: string | null
  niche: string | null
  city: string | null
  serviceInterest: string | null
  packageTier: string | null
  acquisitionChannel: string | null
  hasSite: boolean | null
  hasGmn: boolean | null
  nextFollowUpAt: string | null
  objection: string | null
  status: string
  notes: string | null
  createdAt: string
  deals: Array<{ id: string; estimatedValue: number; stage: string }>
  contracts: Array<{ id: string; totalValue: number | null; monthlyValue: number | null }>
}

const emptyForm = {
  name: '', company: '', whatsapp: '', email: '',
  niche: '', city: '', serviceInterest: '', packageTier: '',
  acquisitionChannel: '', hasSite: false, hasGmn: false,
  nextFollowUpAt: '', objection: '', status: 'lead', notes: '',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })

  const fetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (channelFilter) params.set('channel', channelFilter)
      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, channelFilter])

  useEffect(() => { fetchClients() }, [fetchClients])

  function openEdit(client: Client) {
    setEditingClient(client)
    setFormData({
      name: client.name,
      company: client.company || '',
      whatsapp: client.whatsapp || '',
      email: client.email || '',
      niche: client.niche || '',
      city: client.city || '',
      serviceInterest: client.serviceInterest || '',
      packageTier: client.packageTier || '',
      acquisitionChannel: client.acquisitionChannel || '',
      hasSite: client.hasSite ?? false,
      hasGmn: client.hasGmn ?? false,
      nextFollowUpAt: client.nextFollowUpAt
        ? new Date(client.nextFollowUpAt).toISOString().split('T')[0]
        : '',
      objection: client.objection || '',
      status: client.status,
      notes: client.notes || '',
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingClient(null)
    setFormData({ ...emptyForm })
    setShowForm(true)
  }

  async function saveClient() {
    if (!formData.name.trim()) return
    const payload = {
      ...formData,
      nextFollowUpAt: formData.nextFollowUpAt || null,
    }
    if (editingClient) {
      await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setShowForm(false)
    fetchClients()
  }

  async function deleteClient(id: string) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    fetchClients()
  }

  function getLTV(client: Client): number {
    const dealValue = client.deals
      .filter(d => d.stage === 'fechado_ganho')
      .reduce((sum, d) => sum + d.estimatedValue, 0)
    const contractValue = client.contracts.reduce(
      (sum, c) => sum + (c.totalValue || 0) + (c.monthlyValue || 0) * 12, 0
    )
    return dealValue + contractValue
  }

  function isFollowUpOverdue(client: Client): boolean {
    if (!client.nextFollowUpAt) return false
    return new Date(client.nextFollowUpAt) < new Date()
  }

  const statusVariant = (status: string): 'success' | 'info' | 'default' | 'warning' => {
    const map: Record<string, 'success' | 'info' | 'default' | 'warning'> = {
      lead: 'info', ativo: 'success', inativo: 'warning', 'ex-cliente': 'default',
    }
    return map[status] || 'default'
  }

  const set = (field: string, value: unknown) =>
    setFormData(f => ({ ...f, [field]: value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-success)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{clients.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/api/export', '_blank')}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium hover:bg-[var(--color-surface-2)]"
          >
            <Download size={14} /> Exportar
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, empresa, nicho..."
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
        >
          <option value="">Todos os status</option>
          <option value="lead">Lead</option>
          <option value="ativo">Cliente Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="ex-cliente">Ex-Cliente</option>
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
        >
          <option value="">Todos os canais</option>
          {LEAD_SOURCES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={36} className="text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">Nenhum cliente encontrado</p>
            <button
              onClick={openNew}
              className="mt-3 text-sm font-medium"
              style={{ color: 'var(--color-success)' }}
            >
              + Adicionar primeiro cliente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {clients.map((client) => {
              const overdue = isFollowUpOverdue(client)
              const ltv = getLTV(client)
              return (
                <div
                  key={client.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {client.name}
                      </Link>
                      <Badge variant={statusVariant(client.status)}>
                        {getStatusLabel(client.status)}
                      </Badge>
                      {overdue && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
                        >
                          <AlertCircle size={10} />
                          Follow-up vencido
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {client.company && (
                        <span className="text-xs text-[var(--color-text-muted)]">{client.company}</span>
                      )}
                      {client.niche && (
                        <span className="text-xs text-[var(--color-text-muted)]">· {client.niche}</span>
                      )}
                      {client.city && (
                        <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-0.5">
                          <MapPin size={10} />{client.city}
                        </span>
                      )}
                      {client.acquisitionChannel && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          via {getLeadSourceLabel(client.acquisitionChannel)}
                        </span>
                      )}
                      {client.packageTier && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
                        >
                          {getPackageLabel(client.packageTier)}
                        </span>
                      )}
                      {client.serviceInterest && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {getServiceLabel(client.serviceInterest)}
                        </span>
                      )}
                    </div>
                    {client.nextFollowUpAt && (
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}
                      >
                        Follow-up: {formatDate(client.nextFollowUpAt)}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-5 text-sm">
                    {ltv > 0 && (
                      <div className="text-right">
                        <p className="text-[11px] text-[var(--color-text-muted)]">LTV</p>
                        <p className="font-semibold" style={{ color: 'var(--color-success)' }}>
                          {formatCurrency(ltv)}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[11px] text-[var(--color-text-muted)]">Negócios</p>
                      <p className="font-medium">{client.deals.length}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/clients/${client.id}`}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Dados básicos */}
          <Section label="Dados básicos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome *">
                <input type="text" value={formData.name} onChange={e => set('name', e.target.value)}
                  placeholder="Nome completo" className={input} />
              </Field>
              <Field label="Empresa">
                <input type="text" value={formData.company} onChange={e => set('company', e.target.value)}
                  placeholder="Nome da empresa" className={input} />
              </Field>
              <Field label="WhatsApp">
                <input type="text" value={formData.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  placeholder="(11) 99999-9999" className={input} />
              </Field>
              <Field label="E-mail">
                <input type="email" value={formData.email} onChange={e => set('email', e.target.value)}
                  placeholder="email@exemplo.com" className={input} />
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={e => set('status', e.target.value)} className={input}>
                  <option value="lead">Lead</option>
                  <option value="ativo">Cliente Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="ex-cliente">Ex-Cliente</option>
                </select>
              </Field>
              <Field label="Cidade">
                <input type="text" value={formData.city} onChange={e => set('city', e.target.value)}
                  placeholder="Ex: São Paulo - SP" className={input} />
              </Field>
            </div>
          </Section>

          {/* Perfil comercial */}
          <Section label="Perfil comercial">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nicho">
                <input type="text" value={formData.niche} onChange={e => set('niche', e.target.value)}
                  placeholder="Ex: Clínica veterinária, Mecânica..." className={input} />
              </Field>
              <Field label="Canal de aquisição">
                <select value={formData.acquisitionChannel} onChange={e => set('acquisitionChannel', e.target.value)} className={input}>
                  <option value="">Selecione</option>
                  {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Serviço de interesse">
                <select value={formData.serviceInterest} onChange={e => set('serviceInterest', e.target.value)} className={input}>
                  <option value="">Selecione</option>
                  {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Pacote">
                <select value={formData.packageTier} onChange={e => set('packageTier', e.target.value)} className={input}>
                  <option value="">Selecione</option>
                  {PACKAGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* Diagnóstico */}
          <Section label="Diagnóstico">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-4 py-1">
                <Toggle
                  label="Tem site atual?"
                  checked={formData.hasSite}
                  onChange={v => set('hasSite', v)}
                />
                <Toggle
                  label="Tem GMN ativo?"
                  checked={formData.hasGmn}
                  onChange={v => set('hasGmn', v)}
                />
              </div>
              <Field label="Próximo follow-up">
                <input type="date" value={formData.nextFollowUpAt} onChange={e => set('nextFollowUpAt', e.target.value)} className={input} />
              </Field>
              <Field label="Observações de objeção" className="sm:col-span-2">
                <input type="text" value={formData.objection} onChange={e => set('objection', e.target.value)}
                  placeholder="Ex: Achou caro, não tem urgência..." className={input} />
              </Field>
            </div>
          </Section>

          {/* Notas */}
          <Field label="Anotações gerais">
            <textarea value={formData.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Observações sobre o cliente..."
              className={`${input} resize-none`} />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            >
              Cancelar
            </button>
            <button
              onClick={saveClient}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
            >
              {editingClient ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── helpers ─── */

const input = 'w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]'

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
        {label}
      </p>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className="w-9 h-5 rounded-full relative transition-colors"
        style={{ background: checked ? 'var(--color-success)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </button>
  )
}
