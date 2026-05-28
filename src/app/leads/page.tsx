'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Phone, Edit2, Trash2, PhoneCall, PhoneOff,
  PhoneMissed, Clock, CheckCircle2, Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Lead {
  id: string
  name: string
  company: string | null
  whatsapp: string | null
  email: string | null
  niche: string | null
  city: string | null
  source: string | null
  callStatus: string
  lastCallAt: string | null
  nextFollowUpAt: string | null
  notes: string | null
  callNotes: string | null
  createdAt: string
}

const CALL_STATUSES = [
  { value: 'nao_contatado', label: 'Não Contatado', variant: 'default' as const },
  { value: 'ligado',        label: 'Ligado',         variant: 'info' as const },
  { value: 'interessado',   label: 'Interessado',    variant: 'success' as const },
  { value: 'retornar',      label: 'Retornar',       variant: 'warning' as const },
  { value: 'sem_interesse', label: 'Sem Interesse',  variant: 'danger' as const },
  { value: 'fechado',       label: 'Fechado',        variant: 'success' as const },
]

const statusIcon: Record<string, React.ReactNode> = {
  nao_contatado: <Phone size={14} />,
  ligado:        <PhoneCall size={14} />,
  interessado:   <CheckCircle2 size={14} />,
  retornar:      <Clock size={14} />,
  sem_interesse: <PhoneOff size={14} />,
  fechado:       <CheckCircle2 size={14} />,
}

const emptyForm = {
  name: '', company: '', whatsapp: '', email: '',
  niche: '', city: '', source: '',
  callStatus: 'nao_contatado',
  lastCallAt: '', nextFollowUpAt: '',
  notes: '', callNotes: '',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState(emptyForm)

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('callStatus', statusFilter)
      const res = await fetch(`/api/leads?${params}`)
      setLeads(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  function openNew() {
    setEditingLead(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(l: Lead) {
    setEditingLead(l)
    setForm({
      name: l.name,
      company: l.company || '',
      whatsapp: l.whatsapp || '',
      email: l.email || '',
      niche: l.niche || '',
      city: l.city || '',
      source: l.source || '',
      callStatus: l.callStatus,
      lastCallAt: l.lastCallAt ? l.lastCallAt.split('T')[0] : '',
      nextFollowUpAt: l.nextFollowUpAt ? l.nextFollowUpAt.split('T')[0] : '',
      notes: l.notes || '',
      callNotes: l.callNotes || '',
    })
    setShowForm(true)
  }

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function saveLead() {
    if (!form.name.trim()) return
    if (editingLead) {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLead.id, ...form }),
      })
    } else {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    fetchLeads()
  }

  async function deleteLead(id: string) {
    if (!confirm('Excluir este lead?')) return
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
    fetchLeads()
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const overdueFollowUps = leads.filter(
    l => l.nextFollowUpAt && l.nextFollowUpAt.split('T')[0] < todayStr && l.callStatus !== 'fechado' && l.callStatus !== 'sem_interesse'
  ).length

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
          <h1 className="text-2xl font-semibold tracking-tight">Leads para Cold Call</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
            {overdueFollowUps > 0 && (
              <span className="ml-2 text-[var(--color-warning)]">· {overdueFollowUps} follow-up{overdueFollowUps !== 1 ? 's' : ''} atrasado{overdueFollowUps !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        >
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Todos' }, ...CALL_STATUSES].map(s => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className="h-8 px-3 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: statusFilter === s.value ? 'var(--color-text)' : 'var(--color-surface)',
              color: statusFilter === s.value ? 'var(--color-bg)' : 'var(--color-text-muted)',
              borderColor: statusFilter === s.value ? 'var(--color-text)' : 'var(--color-border)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Leads list */}
      {leads.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <PhoneMissed size={36} className="text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Nenhum lead encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => {
            const status = CALL_STATUSES.find(s => s.value === lead.callStatus)
            const isOverdue =
              lead.nextFollowUpAt &&
              lead.nextFollowUpAt.split('T')[0] < todayStr &&
              lead.callStatus !== 'fechado' &&
              lead.callStatus !== 'sem_interesse'

            return (
              <div
                key={lead.id}
                className="rounded-xl border bg-[var(--color-surface)] px-4 py-3.5"
                style={{ borderColor: isOverdue ? 'var(--color-warning)' : 'var(--color-border)' }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{lead.name}</span>
                      {lead.company && (
                        <span className="text-xs text-[var(--color-text-muted)]">({lead.company})</span>
                      )}
                      {status && (
                        <Badge variant={status.variant}>
                          <span className="flex items-center gap-1">
                            {statusIcon[lead.callStatus]}
                            {status.label}
                          </span>
                        </Badge>
                      )}
                      {isOverdue && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}
                        >
                          <Clock size={10} /> Follow-up atrasado
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                      {lead.whatsapp && (
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1"
                        >
                          <Phone size={11} /> {lead.whatsapp}
                        </a>
                      )}
                      {lead.niche && <span className="text-xs text-[var(--color-text-muted)]">{lead.niche}</span>}
                      {lead.city && <span className="text-xs text-[var(--color-text-muted)]">{lead.city}</span>}
                      {lead.source && <span className="text-xs text-[var(--color-text-muted)]">via {lead.source}</span>}
                    </div>

                    {lead.nextFollowUpAt && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: isOverdue ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                        <Calendar size={11} /> Follow-up: {formatDate(lead.nextFollowUpAt)}
                      </p>
                    )}

                    {lead.callNotes && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1.5 border-l-2 pl-2 italic" style={{ borderColor: 'var(--color-border)' }}>
                        {lead.callNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <ActionBtn title="Editar" onClick={() => openEdit(lead)}>
                      <Edit2 size={14} />
                    </ActionBtn>
                    <ActionBtn title="Excluir" onClick={() => deleteLead(lead.id)} accent="danger">
                      <Trash2 size={14} />
                    </ActionBtn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lead Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingLead ? 'Editar Lead' : 'Novo Lead'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome *">
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Nome do contato" className={inp} />
            </Field>
            <Field label="Empresa">
              <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="Nome da empresa" className={inp} />
            </Field>
            <Field label="WhatsApp">
              <input type="text" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999" className={inp} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@empresa.com" className={inp} />
            </Field>
            <Field label="Nicho">
              <input type="text" value={form.niche} onChange={e => set('niche', e.target.value)}
                placeholder="Ex: Dedetizadora, Advocacia..." className={inp} />
            </Field>
            <Field label="Cidade">
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Cidade" className={inp} />
            </Field>
            <Field label="Origem do Lead">
              <input type="text" value={form.source} onChange={e => set('source', e.target.value)}
                placeholder="Ex: Instagram, Indicação..." className={inp} />
            </Field>
            <Field label="Status da Ligação">
              <select value={form.callStatus} onChange={e => set('callStatus', e.target.value)} className={inp}>
                {CALL_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Última Ligação">
              <input type="date" value={form.lastCallAt} onChange={e => set('lastCallAt', e.target.value)} className={inp} />
            </Field>
            <Field label="Próximo Follow-up">
              <input type="date" value={form.nextFollowUpAt} onChange={e => set('nextFollowUpAt', e.target.value)} className={inp} />
            </Field>
            <Field label="Notas da Ligação" className="sm:col-span-2">
              <textarea value={form.callNotes} onChange={e => set('callNotes', e.target.value)}
                rows={2} className={`${inp} resize-none`}
                placeholder="O que foi discutido na ligação, objeções, interesse..." />
            </Field>
            <Field label="Observações Gerais" className="sm:col-span-2">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={2} className={`${inp} resize-none`}
                placeholder="Informações adicionais sobre o lead..." />
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
              Cancelar
            </button>
            <button onClick={saveLead}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90">
              {editingLead ? 'Salvar' : 'Criar Lead'}
            </button>
          </div>
        </div>
      </Modal>
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

function ActionBtn({ children, title, onClick, accent }: {
  children: React.ReactNode; title: string; onClick: () => void; accent?: 'danger'
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-1.5 rounded-md transition-colors text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
      onMouseEnter={e => {
        if (accent === 'danger') {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'
          ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-danger-soft)'
        } else {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)'
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
