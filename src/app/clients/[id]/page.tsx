'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, Building2, Tag, Send, Clock, FileText, ScrollText, CheckSquare } from 'lucide-react'
import { formatCurrency, formatDateTime, getStatusLabel, getLeadSourceLabel } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'

interface ClientDetail {
  id: string
  name: string
  company: string | null
  whatsapp: string | null
  email: string | null
  segment: string | null
  leadSource: string | null
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

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  async function addActivity() {
    if (!newActivity.trim() || !client) return
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: activityType,
        content: newActivity,
        clientId: client.id,
      }),
    })
    setNewActivity('')
    fetchClient()
  }

  const activityIcons: Record<string, string> = {
    nota: '📝', email: '📧', ligacao: '📞', reuniao: '🤝', proposta: '📄', contrato: '📋'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Cliente não encontrado</p>
        <Link href="/clients" className="text-indigo-500 text-sm mt-2 inline-block">Voltar para lista</Link>
      </div>
    )
  }

  const statusVariant = (s: string) => {
    const map: Record<string, 'success' | 'info' | 'default' | 'warning'> = {
      lead: 'info', ativo: 'success', inativo: 'warning', 'ex-cliente': 'default'
    }
    return map[s] || 'default'
  }

  const ltv = client.deals.filter(d => d.stage === 'fechado_ganho').reduce((sum, d) => sum + d.estimatedValue, 0)
    + client.contracts.reduce((sum, c) => sum + (c.totalValue || 0) + (c.monthlyValue || 0) * 12, 0)

  return (
    <div className="space-y-6 pt-12 lg:pt-0 max-w-5xl">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-all">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">{client.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={statusVariant(client.status)}>{getStatusLabel(client.status)}</Badge>
                {client.company && <span className="text-sm text-slate-500 flex items-center gap-1"><Building2 size={14} />{client.company}</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {client.whatsapp && (
                  <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-all">
                    <Phone size={12} /> {client.whatsapp}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all">
                    <Mail size={12} /> {client.email}
                  </a>
                )}
                {client.segment && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Tag size={12} /> {client.segment}
                  </span>
                )}
                {client.leadSource && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                    Origem: {getLeadSourceLabel(client.leadSource)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">LTV Estimado</p>
            <p className="text-xl font-bold text-indigo-600">{formatCurrency(ltv)}</p>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Negócios', value: client.deals.length, icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Propostas', value: client.proposals.length, icon: Send, color: 'text-violet-600 bg-violet-50' },
          { label: 'Contratos', value: client.contracts.length, icon: ScrollText, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Tarefas', value: client.tasks.filter(t => !t.completed).length, icon: CheckSquare, color: 'text-amber-600 bg-amber-50' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-indigo-500" />
          Linha do Tempo
        </h3>

        {/* Add activity */}
        <div className="flex gap-2 mb-6">
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="nota">📝 Nota</option>
            <option value="email">📧 E-mail</option>
            <option value="ligacao">📞 Ligação</option>
            <option value="reuniao">🤝 Reunião</option>
          </select>
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addActivity()}
            placeholder="Registrar nova atividade..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={addActivity} className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all">
            <Send size={16} />
          </button>
        </div>

        {client.activities.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nenhuma atividade registrada</p>
        ) : (
          <div className="space-y-4">
            {client.activities.map((activity, i) => (
              <div key={activity.id} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex flex-col items-center">
                  <span className="text-lg">{activityIcons[activity.type] || '📌'}</span>
                  {i < client.activities.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-slate-700">{activity.content}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
