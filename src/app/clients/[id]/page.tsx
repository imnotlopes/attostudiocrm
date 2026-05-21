'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, Mail, Send, Clock, FileText, ScrollText,
  CheckSquare, MapPin, Tag, Calendar, AlertCircle, MessageSquare,
} from 'lucide-react'
import {
  formatCurrency, formatDate, formatDateTime,
  getStatusLabel, getLeadSourceLabel, getServiceLabel,
  getPackageLabel, getStageLabel,
} from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

interface ClientDetail {
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
  deals: Array<{ id: string; serviceType: string; estimatedValue: number; stage: string; createdAt: string }>
  proposals: Array<{ id: string; title: string; status: string; investment: number | null; createdAt: string }>
  contracts: Array<{ id: string; service: string; status: string; monthlyValue: number | null; totalValue: number | null }>
  tasks: Array<{ id: string; title: string; completed: boolean; dueDate: string; type: string }>
  activities: Array<{ id: string; type: string; content: string; createdAt: string }>
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newActivity, setNewActivity] = useState('')
  const [activityType, setActivityType] = useState('nota')

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${params.id}`)
      const data = await res.json()
      setClient(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { fetchClient() }, [fetchClient])

  async function addActivity() {
    if (!newActivity.trim() || !client) return
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activityType, content: newActivity, clientId: client.id }),
    })
    setNewActivity('')
    fetchClient()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-success)] animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Cliente não encontrado</p>
        <Link href="/clients" className="text-sm mt-2 inline-block" style={{ color: 'var(--color-success)' }}>
          Voltar para lista
        </Link>
      </div>
    )
  }

  const ltv =
    client.deals.filter(d => d.stage === 'fechado_ganho').reduce((sum, d) => sum + d.estimatedValue, 0)
    + client.contracts.reduce((sum, c) => sum + (c.totalValue || 0) + (c.monthlyValue || 0) * 12, 0)

  const followUpOverdue = client.nextFollowUpAt && new Date(client.nextFollowUpAt) < new Date()

  const statusVariant = (s: string): 'success' | 'info' | 'default' | 'warning' => {
    const map: Record<string, 'success' | 'info' | 'default' | 'warning'> = {
      lead: 'info', ativo: 'success', inativo: 'warning', 'ex-cliente': 'default',
    }
    return map[s] || 'default'
  }

  return (
    <div className="space-y-5 pt-12 lg:pt-0 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={15} /> Voltar
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={statusVariant(client.status)}>{getStatusLabel(client.status)}</Badge>
                {client.packageTier && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
                  >
                    {getPackageLabel(client.packageTier)}
                  </span>
                )}
              </div>

              {/* Contact / meta pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {client.whatsapp && (
                  <a
                    href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs h-7 px-3 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                  >
                    <Phone size={11} /> {client.whatsapp}
                  </a>
                )}
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1.5 text-xs h-7 px-3 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                  >
                    <Mail size={11} /> {client.email}
                  </a>
                )}
                {client.city && (
                  <span className="inline-flex items-center gap-1.5 text-xs h-7 px-3 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    <MapPin size={11} /> {client.city}
                  </span>
                )}
                {client.niche && (
                  <span className="inline-flex items-center gap-1.5 text-xs h-7 px-3 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    <Tag size={11} /> {client.niche}
                  </span>
                )}
                {client.acquisitionChannel && (
                  <span className="text-xs h-7 px-3 rounded-md border border-[var(--color-border)] inline-flex items-center text-[var(--color-text-muted)]">
                    via {getLeadSourceLabel(client.acquisitionChannel)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {ltv > 0 && (
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">LTV</p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--color-success)' }}>
                {formatCurrency(ltv)}
              </p>
            </div>
          )}
        </div>

        {/* Diagnostic info */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
          {client.serviceInterest && (
            <InfoTile label="Serviço de interesse" value={getServiceLabel(client.serviceInterest)} />
          )}
          {client.hasSite !== null && (
            <InfoTile label="Tem site" value={client.hasSite ? 'Sim' : 'Não'} accent={client.hasSite ? 'success' : undefined} />
          )}
          {client.hasGmn !== null && (
            <InfoTile label="GMN ativo" value={client.hasGmn ? 'Sim' : 'Não'} accent={client.hasGmn ? 'success' : undefined} />
          )}
          {client.nextFollowUpAt && (
            <InfoTile
              label="Próximo follow-up"
              value={formatDate(client.nextFollowUpAt)}
              accent={followUpOverdue ? 'danger' : undefined}
              icon={followUpOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
            />
          )}
        </div>

        {client.objection && (
          <div
            className="mt-3 px-3 py-2.5 rounded-lg text-sm"
            style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide block mb-0.5">Objeção</span>
            {client.objection}
          </div>
        )}

        {client.notes && (
          <div className="mt-3 px-3 py-2.5 rounded-lg text-sm bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
            {client.notes}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Negócios', value: client.deals.length, Icon: FileText },
          { label: 'Propostas', value: client.proposals.length, Icon: Send },
          { label: 'Contratos', value: client.contracts.length, Icon: ScrollText },
          { label: 'Tarefas abertas', value: client.tasks.filter(t => !t.completed).length, Icon: CheckSquare },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <s.Icon size={16} className="text-[var(--color-text-muted)] mb-2" />
            <p className="text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Deals */}
      {client.deals.length > 0 && (
        <Section title="Negócios" icon={<FileText size={15} />}>
          <div className="space-y-2">
            {client.deals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--color-border)]">
                <div>
                  <p className="text-sm font-medium">{getServiceLabel(deal.serviceType)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{getStageLabel(deal.stage)}</p>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: deal.stage === 'fechado_ganho' ? 'var(--color-success)' : deal.stage === 'fechado_perdido' ? 'var(--color-danger)' : 'var(--color-text)' }}
                >
                  {formatCurrency(deal.estimatedValue)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contracts */}
      {client.contracts.length > 0 && (
        <Section title="Contratos" icon={<ScrollText size={15} />}>
          <div className="space-y-2">
            {client.contracts.map(contract => (
              <div key={contract.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--color-border)]">
                <div>
                  <p className="text-sm font-medium">{contract.service}</p>
                  <Badge variant={contract.status === 'ativo' ? 'success' : contract.status === 'encerrado' ? 'default' : 'warning'}>
                    {contract.status}
                  </Badge>
                </div>
                <div className="text-right">
                  {contract.monthlyValue && (
                    <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-success)' }}>
                      {formatCurrency(contract.monthlyValue)}/mês
                    </p>
                  )}
                  {contract.totalValue && (
                    <p className="text-xs text-[var(--color-text-muted)]">{formatCurrency(contract.totalValue)} total</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tasks */}
      {client.tasks.filter(t => !t.completed).length > 0 && (
        <Section title="Tarefas abertas" icon={<CheckSquare size={15} />}>
          <div className="space-y-2">
            {client.tasks.filter(t => !t.completed).map(task => (
              <div key={task.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--color-border)]">
                <p className="text-sm">{task.title}</p>
                <span
                  className="text-xs text-[var(--color-text-muted)] flex items-center gap-1"
                >
                  <Clock size={11} /> {formatDate(task.dueDate)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Activity timeline */}
      <Section title="Linha do tempo" icon={<Clock size={15} />}>
        <div className="flex gap-2 mb-4">
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
          >
            <option value="nota">Nota</option>
            <option value="ligacao">Ligação</option>
            <option value="reuniao">Reunião</option>
            <option value="email">E-mail</option>
          </select>
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addActivity()}
            placeholder="Registrar nova atividade..."
            className="flex-1 px-3 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
          />
          <button
            onClick={addActivity}
            className="h-9 px-3 rounded-lg bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
          >
            <Send size={14} />
          </button>
        </div>

        {client.activities.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Nenhuma atividade registrada</p>
        ) : (
          <div className="space-y-2">
            {client.activities.map((a) => (
              <div
                key={a.id}
                className="flex gap-3 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <MessageSquare size={13} className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm">{a.content}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ─── helpers ─── */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-[var(--color-text-muted)]">
        {icon} <span className="text-[var(--color-text)]">{title}</span>
      </h3>
      {children}
    </div>
  )
}

function InfoTile({
  label, value, accent, icon,
}: {
  label: string
  value: string
  accent?: 'success' | 'danger'
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg px-3 py-2 border border-[var(--color-border)]">
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">{label}</p>
      <p
        className="text-sm font-medium flex items-center gap-1"
        style={accent ? { color: `var(--color-${accent})` } : undefined}
      >
        {icon}{value}
      </p>
    </div>
  )
}
