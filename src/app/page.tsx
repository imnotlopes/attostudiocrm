'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Wallet,
  PieChart,
  Target,
  Calendar,
  Trophy,
  CheckSquare,
  Activity,
  Percent,
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import ThemeToggle from '@/components/ui/ThemeToggle'

interface DashboardData {
  activeLeads: number
  monthRevenue: number
  revenueBreakdown: { setup: number; recurring: number }
  mrr: number
  overdueFollowUps: number
  pendingTasks: number
  conversionRate: number
  totalDeals: number
  wonDeals: number
  leadsByNiche: Array<{ niche: string; count: number }>
  conversionByChannel: Array<{ channel: string; total: number; won: number; rate: number }>
  expiringContracts: Array<{
    id: string
    service: string
    endDate: string
    client: { name: string; company: string | null }
  }>
  topClients: Array<{ name: string; company: string | null; ltv: number }>
  recentActivities: Array<{
    id: string
    type: string
    content: string
    createdAt: string
    client: { name: string } | null
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetch('/api/automations', { method: 'POST' }).catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-success)] animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const overdue = data.overdueFollowUps > 0

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Visão geral · Atto Studio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => { setLoading(true); fetchData() }}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium hover:bg-[var(--color-surface-2)]"
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stat cards — row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={18} />}
          label="MRR Ativo"
          value={formatCurrency(data.mrr)}
          accent={data.mrr > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          icon={<Wallet size={18} />}
          label="Receita do Mês"
          value={formatCurrency(data.monthRevenue)}
          hint={`Setup ${formatCurrency(data.revenueBreakdown.setup)} · Mensal ${formatCurrency(data.revenueBreakdown.recurring)}`}
          accent={data.monthRevenue > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          icon={<Percent size={18} />}
          label="Taxa de Conversão"
          value={`${data.conversionRate}%`}
          hint={`${data.wonDeals} ganhos de ${data.totalDeals} deals`}
          accent={data.conversionRate >= 30 ? 'success' : data.conversionRate === 0 ? 'neutral' : 'neutral'}
        />
      </div>

      {/* Stat cards — row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={18} />}
          label="Leads Ativos"
          value={data.activeLeads.toString()}
        />
        <StatCard
          icon={<CheckSquare size={18} />}
          label="Tarefas Pendentes Hoje"
          value={data.pendingTasks.toString()}
          accent={data.pendingTasks > 0 ? 'neutral' : 'neutral'}
        />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Follow-ups Atrasados"
          value={data.overdueFollowUps.toString()}
          accent={overdue ? 'danger' : 'neutral'}
          highlight={overdue}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Leads ativos por nicho" icon={<PieChart size={16} />}>
          {data.leadsByNiche.length === 0 ? (
            <Empty>Nenhum lead ativo no momento</Empty>
          ) : (
            <BarList
              items={data.leadsByNiche.map((n) => ({
                label: n.niche,
                value: n.count,
                display: n.count.toString(),
              }))}
            />
          )}
        </Card>

        <Card title="Conversão por canal" icon={<Target size={16} />}>
          {data.conversionByChannel.length === 0 ? (
            <Empty>Sem dados de canal</Empty>
          ) : (
            <ChannelList items={data.conversionByChannel} />
          )}
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Contratos a vencer em 30 dias" icon={<Calendar size={16} />}>
          {data.expiringContracts.length === 0 ? (
            <Empty>Nenhum contrato vencendo</Empty>
          ) : (
            <ul className="space-y-2">
              {data.expiringContracts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[var(--color-border)]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.client.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{c.service}</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap"
                    style={{
                      background: 'var(--color-warning-soft)',
                      color: 'var(--color-warning)',
                    }}
                  >
                    Vence {formatDate(c.endDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top clientes por LTV" icon={<Trophy size={16} />}>
          {data.topClients.length === 0 ? (
            <Empty>Nenhum cliente com receita</Empty>
          ) : (
            <ul className="space-y-1">
              {data.topClients.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-2)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold tabular-nums bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      {c.company && (
                        <p className="text-xs text-[var(--color-text-muted)] truncate">
                          {c.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: 'var(--color-success)' }}
                  >
                    {formatCurrency(c.ltv)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Row 4 — Atividades recentes */}
      {data.recentActivities.length > 0 && (
        <Card title="Atividades recentes" icon={<Activity size={16} />}>
          <ul className="space-y-1">
            {data.recentActivities.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-2)]"
              >
                <span
                  className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--color-success)', marginTop: '6px' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{a.content}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {a.client?.name && <span className="font-medium">{a.client.name} · </span>}
                    {formatDateTime(a.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

/* ─────────────── helpers ─────────────── */

function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'neutral',
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  accent?: 'success' | 'danger' | 'neutral'
  highlight?: boolean
}) {
  const valueColor =
    accent === 'success'
      ? 'var(--color-success)'
      : accent === 'danger'
      ? 'var(--color-danger)'
      : 'var(--color-text)'

  const bg = highlight ? 'var(--color-danger-soft)' : 'var(--color-surface)'
  const borderColor = highlight ? 'var(--color-danger)' : 'var(--color-border)'

  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: bg, borderColor }}
    >
      <div className="flex items-center justify-between text-[var(--color-text-muted)]">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <span style={{ color: highlight ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          {icon}
        </span>
      </div>
      <p
        className="mt-3 text-2xl font-semibold tabular-nums"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)] truncate">{hint}</p>
      )}
    </div>
  )
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <span className="text-[var(--color-text-muted)]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-[var(--color-text-muted)]">{children}</p>
    </div>
  )
}

function BarList({
  items,
}: {
  items: Array<{ label: string; value: number; display: string }>
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => {
        const pct = (item.value / max) * 100
        return (
          <li key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="truncate pr-3">{item.label}</span>
              <span className="tabular-nums text-[var(--color-text-muted)]">
                {item.display}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--color-surface-2)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: 'var(--color-success)',
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ChannelList({
  items,
}: {
  items: Array<{ channel: string; total: number; won: number; rate: number }>
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="truncate pr-3">{item.channel}</span>
            <span className="flex items-center gap-2 text-[var(--color-text-muted)] tabular-nums">
              <span className="text-[11px]">
                {item.won}/{item.total}
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    item.rate >= 30
                      ? 'var(--color-success)'
                      : item.rate === 0
                      ? 'var(--color-danger)'
                      : 'var(--color-text)',
                }}
              >
                {item.rate}%
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.rate}%`,
                background:
                  item.rate >= 30
                    ? 'var(--color-success)'
                    : item.rate === 0
                    ? 'var(--color-danger)'
                    : 'var(--color-neutral)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
