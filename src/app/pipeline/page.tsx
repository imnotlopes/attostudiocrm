'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Clock, X, Send, MessageSquare,
  Phone
} from 'lucide-react'
import { formatCurrency, daysSince, getUrgencyColor, getServiceLabel, getStageLabel, SERVICE_TYPES, STAGES } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Deal {
  id: string
  clientId: string
  client: { id: string; name: string; company: string | null; whatsapp: string | null; email: string | null }
  serviceType: string
  estimatedValue: number
  stage: string
  lastActivityAt: string
  stageEnteredAt: string
  lostReason: string | null
  activities: Array<{ id: string; type: string; content: string; createdAt: string }>
  tasks: Array<{ id: string; title: string; completed: boolean; dueDate: string }>
  proposal: { id: string; title: string; status: string } | null
}

interface Client {
  id: string
  name: string
  company: string | null
}

const stageConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  lead_novo: { label: 'Lead Novo', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  qualificacao: { label: 'Qualificação', color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'text-violet-600', bgColor: 'bg-violet-50 border-violet-200' },
  negociacao: { label: 'Negociação', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  fechado_ganho: { label: 'Fechado (Ganho)', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  fechado_perdido: { label: 'Fechado (Perdido)', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [showLostModal, setShowLostModal] = useState(false)
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null)

  const [newDeal, setNewDeal] = useState({
    clientId: '',
    serviceType: 'site',
    estimatedValue: '',
  })

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch('/api/deals')
      const data = await res.json()
      setDeals(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchDeals()
    fetchClients()
  }, [fetchDeals, fetchClients])

  async function createDeal() {
    if (!newDeal.clientId || !newDeal.estimatedValue) return
    await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal),
    })
    setShowNewDeal(false)
    setNewDeal({ clientId: '', serviceType: 'site', estimatedValue: '' })
    fetchDeals()
  }

  async function moveDeal(dealId: string, newStage: string) {
    if (newStage === 'fechado_perdido') {
      setPendingLostDealId(dealId)
      setShowLostModal(true)
      return
    }

    await fetch('/api/deals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dealId, stage: newStage }),
    })
    fetchDeals()
  }

  async function confirmLost() {
    if (!pendingLostDealId) return
    await fetch('/api/deals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pendingLostDealId, stage: 'fechado_perdido', lostReason }),
    })
    setShowLostModal(false)
    setLostReason('')
    setPendingLostDealId(null)
    fetchDeals()
  }

  async function addActivity() {
    if (!selectedDeal || !newActivity.trim()) return
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'nota',
        content: newActivity,
        clientId: selectedDeal.clientId,
        dealId: selectedDeal.id,
      }),
    })
    setNewActivity('')
    fetchDeals()
    // Refresh selected deal
    const res = await fetch('/api/deals')
    const data = await res.json()
    const updated = data.find((d: Deal) => d.id === selectedDeal.id)
    if (updated) setSelectedDeal(updated)
  }

  function handleDragStart(e: React.DragEvent, dealId: string) {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault()
    if (draggedDealId) {
      moveDeal(draggedDealId, stage)
      setDraggedDealId(null)
    }
  }

  const getStageDeals = (stage: string) => deals.filter((d) => d.stage === stage)
  const getStageTotal = (stage: string) =>
    getStageDeals(stage).reduce((sum, d) => sum + d.estimatedValue, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pipeline de Vendas</h1>
          <p className="text-slate-500 mt-1">Arraste os cards para mover entre etapas</p>
        </div>
        <button
          onClick={() => setShowNewDeal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25"
        >
          <Plus size={18} />
          Novo Negócio
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {STAGES.map((stage) => {
          const config = stageConfig[stage]
          const stageDeals = getStageDeals(stage)
          const total = getStageTotal(stage)

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-72 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div className={`p-4 rounded-t-2xl border-t-2 ${config.bgColor}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                  <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full">
                    {stageDeals.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(total)}</p>
              </div>

              {/* Cards */}
              <div className="flex-1 bg-slate-50/50 rounded-b-2xl p-2 space-y-2 min-h-[200px]">
                {stageDeals.map((deal) => {
                  const days = daysSince(deal.stageEnteredAt)
                  const urgency = getUrgencyColor(days)
                  const urgencyColors = {
                    green: 'bg-emerald-400',
                    yellow: 'bg-amber-400',
                    red: 'bg-red-500 pulse-urgency-red',
                  }

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => setSelectedDeal(deal)}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {deal.client.name}
                          </p>
                          {deal.client.company && (
                            <p className="text-xs text-slate-400 mt-0.5">{deal.client.company}</p>
                          )}
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${urgencyColors[urgency]} flex-shrink-0 mt-1`} />
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant={deal.serviceType === 'agente_ia' ? 'purple' : deal.serviceType === 'landing_page' ? 'info' : 'default'}>
                          {getServiceLabel(deal.serviceType)}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">
                          {formatCurrency(deal.estimatedValue)}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {days}d
                        </span>
                      </div>

                      {deal.tasks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-xs text-amber-600 font-medium">
                            {deal.tasks.length} tarefa{deal.tasks.length > 1 ? 's' : ''} pendente{deal.tasks.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* New Deal Modal */}
      <Modal open={showNewDeal} onClose={() => setShowNewDeal(false)} title="Novo Negócio">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
            <select
              value={newDeal.clientId}
              onChange={(e) => setNewDeal({ ...newDeal, clientId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Serviço</label>
            <select
              value={newDeal.serviceType}
              onChange={(e) => setNewDeal({ ...newDeal, serviceType: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Estimado (R$)</label>
            <input
              type="number"
              value={newDeal.estimatedValue}
              onChange={(e) => setNewDeal({ ...newDeal, estimatedValue: e.target.value })}
              placeholder="5000"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowNewDeal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={createDeal}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25"
            >
              Criar Negócio
            </button>
          </div>
        </div>
      </Modal>

      {/* Lost Reason Modal */}
      <Modal open={showLostModal} onClose={() => { setShowLostModal(false); setPendingLostDealId(null) }} title="Motivo da Perda">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Qual o motivo do negócio ter sido perdido?</p>
          <textarea
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            placeholder="Ex: Preço acima do orçamento, optou por outra empresa..."
          />
          <div className="flex gap-3">
            <button onClick={() => { setShowLostModal(false); setPendingLostDealId(null) }} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200">Cancelar</button>
            <button onClick={confirmLost} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">Confirmar Perda</button>
          </div>
        </div>
      </Modal>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedDeal(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selectedDeal.client.name}</h2>
                {selectedDeal.client.company && (
                  <p className="text-sm text-slate-500">{selectedDeal.client.company}</p>
                )}
              </div>
              <button onClick={() => setSelectedDeal(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Deal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Serviço</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{getServiceLabel(selectedDeal.serviceType)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Valor</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{formatCurrency(selectedDeal.estimatedValue)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Etapa</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{getStageLabel(selectedDeal.stage)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500">Dias na Etapa</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{daysSince(selectedDeal.stageEnteredAt)} dias</p>
                </div>
              </div>

              {/* Contact Info */}
              {(selectedDeal.client.whatsapp || selectedDeal.client.email) && (
                <div className="flex gap-2">
                  {selectedDeal.client.whatsapp && (
                    <a href={`https://wa.me/${selectedDeal.client.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-medium hover:bg-emerald-100 transition-all">
                      <Phone size={14} /> WhatsApp
                    </a>
                  )}
                  {selectedDeal.client.email && (
                    <a href={`mailto:${selectedDeal.client.email}`} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-all">
                      <Send size={14} /> Email
                    </a>
                  )}
                </div>
              )}

              {/* Move Stage */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter(s => s !== selectedDeal.stage).map(stage => (
                    <button
                      key={stage}
                      onClick={() => { moveDeal(selectedDeal.id, stage); setSelectedDeal(null) }}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-all"
                    >
                      {getStageLabel(stage)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pending Tasks */}
              {selectedDeal.tasks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Tarefas Pendentes</p>
                  <div className="space-y-2">
                    {selectedDeal.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                        <div className="w-2 h-2 bg-amber-400 rounded-full" />
                        <span className="text-xs text-slate-700 flex-1">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposal */}
              {selectedDeal.proposal && (
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <p className="text-xs text-violet-500 font-medium">Proposta Vinculada</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{selectedDeal.proposal.title}</p>
                  <Badge variant="purple">{selectedDeal.proposal.status}</Badge>
                </div>
              )}

              {/* Activity History */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Histórico de Interações</p>

                {/* Add Activity */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                    placeholder="Registrar atividade..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addActivity}
                    className="px-3 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedDeal.activities.map(activity => (
                    <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                      <MessageSquare size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-700">{activity.content}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(activity.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
