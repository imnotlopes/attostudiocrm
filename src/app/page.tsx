'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, DollarSign, TrendingUp, CheckSquare, AlertTriangle, Clock,
  Activity, RefreshCw, Zap
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

interface DashboardData {
  activeLeads: number
  monthRevenue: number
  mrr: number
  pendingTasks: number
  overdueTasks: number
  expiringContracts: Array<{
    id: string
    service: string
    endDate: string
    client: { name: string; company: string | null }
  }>
  recentActivities: Array<{
    id: string
    type: string
    content: string
    createdAt: string
    client: { name: string } | null
  }>
  conversionRate: number
  totalDeals: number
  wonDeals: number
  topClients: Array<{ name: string; company: string | null; ltv: number }>
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

  // Run automations on load
  useEffect(() => {
    fetch('/api/automations', { method: 'POST' }).catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = [
    {
      label: 'Leads Ativos',
      value: data.activeLeads.toString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Receita do Mês',
      value: formatCurrency(data.monthRevenue),
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'MRR Ativo',
      value: formatCurrency(data.mrr),
      icon: TrendingUp,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      label: 'Follow-ups Pendentes',
      value: data.pendingTasks.toString(),
      icon: CheckSquare,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      alert: data.overdueTasks > 0 ? `${data.overdueTasks} atrasadas` : undefined,
    },
  ]

  const activityIcons: Record<string, string> = {
    nota: '📝',
    email: '📧',
    ligacao: '📞',
    reuniao: '🤝',
    proposta: '📄',
    contrato: '📋',
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Visão geral do seu negócio</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData() }}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon size={20} className={stat.textColor} />
                </div>
                {stat.alert && (
                  <Badge variant="danger">{stat.alert}</Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion Rate + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" />
            Taxa de Conversão
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                <circle
                  cx="60" cy="60" r="50"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - data.conversionRate / 100)}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{data.conversionRate}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Total de negócios</span>
                <span className="text-sm font-semibold text-slate-700">{data.totalDeals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Fechados (ganho)</span>
                <span className="text-sm font-semibold text-emerald-600">{data.wonDeals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Em andamento</span>
                <span className="text-sm font-semibold text-blue-600">{data.activeLeads}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Clients by LTV */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Top Clientes por LTV
          </h3>
          {data.topClients.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum cliente encontrado</p>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{client.name}</p>
                      {client.company && <p className="text-xs text-slate-400">{client.company}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(client.ltv)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Contratos a Vencer (30 dias)
          </h3>
          {data.expiringContracts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Nenhum contrato vencendo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.expiringContracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{contract.client.name}</p>
                    <p className="text-xs text-slate-500">{contract.service}</p>
                  </div>
                  <Badge variant="warning">Vence {formatDate(contract.endDate)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-indigo-500" />
            Últimas Atividades
          </h3>
          {data.recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentActivities.map((activity, i) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">{activityIcons[activity.type] || '📌'}</span>
                    {i < data.recentActivities.length - 1 && (
                      <div className="w-px h-full bg-slate-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm text-slate-700">{activity.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.client && (
                        <span className="text-xs text-indigo-500 font-medium">{activity.client.name}</span>
                      )}
                      <span className="text-xs text-slate-400">{formatDateTime(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
