'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Clock,
  X,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Trash2,
} from 'lucide-react'
import {
  formatCurrency,
  daysSince,
  getUrgencyColor,
  getServiceLabel,
  getStageLabel,
  getPackageLabel,
  SERVICE_TYPES,
  STAGES,
} from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface Deal {
  id: string
  clientId: string
  client: {
    id: string
    name: string
    company: string | null
    whatsapp: string | null
    email: string | null
    niche: string | null
    packageTier: string | null
  }
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

type StageTone = 'success' | 'danger' | 'neutral'

const stageTone: Record<string, StageTone> = {
  prospeccao: 'neutral',
  primeiro_contato: 'neutral',
  diagnostico: 'neutral',
  proposta_enviada: 'neutral',
  negociacao: 'neutral',
  fechado_ganho: 'success',
  fechado_perdido: 'danger',
  em_andamento: 'success',
}

function toneColor(tone: StageTone) {
  if (tone === 'success') return 'var(--color-success)'
  if (tone === 'danger') return 'var(--color-danger)'
  return 'var(--color-text-muted)'
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDeal, setShowNewDeal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [newActivity, setNewActivity] = useState('')
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [showLostModal, setShowLostModal] = useState(false)
  const [pendingLostDealId, setPendingLostDealId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [newDeal, setNewDeal] = useState({
    clientId: '',
    serviceType: 'gmn',
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
    setNewDeal({ clientId: '', serviceType: 'gmn', estimatedValue: '' })
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
      body: JSON.stringify({
        id: pendingLostDealId,
        stage: 'fechado_perdido',
        lostReason,
      }),
    })
    setShowLostModal(false)
    setLostReason('')
    setPendingLostDealId(null)
    fetchDeals()
  }

  async function deleteDeal() {
    if (!selectedDeal) return
    await fetch(`/api/deals?id=${selectedDeal.id}`, { method: 'DELETE' })
    setSelectedDeal(null)
    setConfirmDelete(false)
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
    const res = await fetch('/api/deals')
    const data = await res.json()
    const updated = data.find((d: Deal) => d.id === selectedDeal.id)
    if (updated) setSelectedDeal(updated)
  }

  function handleDragStart(e: React.DragEvent, dealId: string) {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStage !== stage) setDragOverStage(stage)
  }
  function handleDragLeave() {
    setDragOverStage(null)
  }
  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault()
    if (draggedDealId) moveDeal(draggedDealId, stage)
    setDraggedDealId(null)
    setDragOverStage(null)
  }

  const getStageDeals = (stage: string) => deals.filter((d) => d.stage === stage)
  const getStageTotal = (stage: string) =>
    getStageDeals(stage).reduce((sum, d) => sum + d.estimatedValue, 0)

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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Arraste os cards para mover entre etapas
          </p>
        </div>
        <button
          onClick={() => setShowNewDeal(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        >
          <Plus size={16} />
          Novo Negócio
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1" style={{ minHeight: '70vh' }}>
        {STAGES.map((stage) => {
          const tone = stageTone[stage]
          const stageDeals = getStageDeals(stage)
          const total = getStageTotal(stage)
          const isOver = dragOverStage === stage
          const labelColor = toneColor(tone)

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-64 flex flex-col rounded-lg border bg-[var(--color-surface)]"
              style={{
                borderColor: isOver ? 'var(--color-success)' : 'var(--color-border)',
                transition: 'border-color 0.15s ease',
              }}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div className="px-3 py-3 flex items-center justify-between border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: labelColor }}
                  />
                  <h3
                    className="text-xs font-semibold uppercase tracking-wide truncate"
                    style={{ color: labelColor }}
                  >
                    {getStageLabel(stage)}
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {stageDeals.map((deal) => {
                  const days = daysSince(deal.stageEnteredAt)
                  const urgency = getUrgencyColor(days)
                  const urgencyBg =
                    urgency === 'red'
                      ? 'var(--color-danger)'
                      : urgency === 'yellow'
                      ? 'var(--color-warning)'
                      : 'var(--color-success)'

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => setSelectedDeal(deal)}
                      className="rounded-lg p-3 cursor-pointer border bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{deal.client.name}</p>
                          {deal.client.company && (
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                              {deal.client.company}
                            </p>
                          )}
                        </div>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{ background: urgencyBg }}
                          title={`${days} dia(s) na etapa`}
                        />
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {getServiceLabel(deal.serviceType)}
                        </span>
                        {deal.client.niche && (
                          <>
                            <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                            <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                              {deal.client.niche}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(deal.estimatedValue)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {deal.client.packageTier && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                              style={{
                                background: 'var(--color-success-soft)',
                                color: 'var(--color-success)',
                              }}
                            >
                              {getPackageLabel(deal.client.packageTier)}
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 tabular-nums">
                            <Clock size={11} />
                            {days}d
                          </span>
                        </div>
                      </div>

                      {deal.tasks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                          <p
                            className="text-[11px] font-medium"
                            style={{ color: 'var(--color-warning)' }}
                          >
                            {deal.tasks.length} tarefa{deal.tasks.length > 1 ? 's' : ''} pendente
                            {deal.tasks.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
                {stageDeals.length === 0 && (
                  <div className="h-full flex items-center justify-center py-8">
                    <p className="text-[11px] text-[var(--color-text-muted)]">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* New Deal Modal */}
      <Modal open={showNewDeal} onClose={() => setShowNewDeal(false)} title="Novo Negócio">
        <div className="space-y-4">
          <Field label="Cliente">
            <select
              value={newDeal.clientId}
              onChange={(e) => setNewDeal({ ...newDeal, clientId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serviço">
            <select
              value={newDeal.serviceType}
              onChange={(e) => setNewDeal({ ...newDeal, serviceType: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor estimado (R$)">
            <input
              type="number"
              value={newDeal.estimatedValue}
              onChange={(e) => setNewDeal({ ...newDeal, estimatedValue: e.target.value })}
              placeholder="1997"
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowNewDeal(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            >
              Cancelar
            </button>
            <button
              onClick={createDeal}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
            >
              Criar negócio
            </button>
          </div>
        </div>
      </Modal>

      {/* Lost Reason Modal */}
      <Modal
        open={showLostModal}
        onClose={() => {
          setShowLostModal(false)
          setPendingLostDealId(null)
        }}
        title="Motivo da perda"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Qual o motivo do negócio ter sido perdido?
          </p>
          <textarea
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)] resize-none"
            placeholder="Ex.: preço acima do orçamento, optou por outra empresa..."
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowLostModal(false)
                setPendingLostDealId(null)
              }}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            >
              Cancelar
            </button>
            <button
              onClick={confirmLost}
              className="flex-1 h-9 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--color-danger)' }}
            >
              Confirmar perda
            </button>
          </div>
        </div>
      </Modal>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedDeal(null)} />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-bg)] text-[var(--color-text)] z-50 border-l border-[var(--color-border)] animate-slide-in-right overflow-y-auto">
            <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-bg)] z-10">
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate">{selectedDeal.client.name}</h2>
                {selectedDeal.client.company && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {selectedDeal.client.company}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  title="Excluir negócio"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="p-5 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                <InfoTile label="Serviço" value={getServiceLabel(selectedDeal.serviceType)} />
                <InfoTile label="Valor" value={formatCurrency(selectedDeal.estimatedValue)} />
                <InfoTile label="Etapa" value={getStageLabel(selectedDeal.stage)} />
                <InfoTile
                  label="Dias na etapa"
                  value={`${daysSince(selectedDeal.stageEnteredAt)} dias`}
                />
                {selectedDeal.client.niche && (
                  <InfoTile label="Nicho" value={selectedDeal.client.niche} />
                )}
                {selectedDeal.client.packageTier && (
                  <InfoTile
                    label="Pacote"
                    value={getPackageLabel(selectedDeal.client.packageTier)}
                    highlight="success"
                  />
                )}
              </div>

              {/* Lost reason */}
              {selectedDeal.lostReason && (
                <div
                  className="rounded-lg px-3 py-2.5 border text-sm"
                  style={{
                    borderColor: 'var(--color-danger)',
                    background: 'var(--color-danger-soft)',
                    color: 'var(--color-danger)',
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">
                    Motivo da perda
                  </p>
                  {selectedDeal.lostReason}
                </div>
              )}

              {/* Contact */}
              {(selectedDeal.client.whatsapp || selectedDeal.client.email) && (
                <div className="flex gap-2">
                  {selectedDeal.client.whatsapp && (
                    <a
                      href={`https://wa.me/${selectedDeal.client.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                    >
                      <Phone size={12} /> WhatsApp
                    </a>
                  )}
                  {selectedDeal.client.email && (
                    <a
                      href={`mailto:${selectedDeal.client.email}`}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                    >
                      <Mail size={12} /> Email
                    </a>
                  )}
                </div>
              )}

              {/* Move stage */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                  Mover para
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.filter((s) => s !== selectedDeal.stage).map((stage) => {
                    const tone = stageTone[stage]
                    return (
                      <button
                        key={stage}
                        onClick={() => {
                          moveDeal(selectedDeal.id, stage)
                          setSelectedDeal(null)
                        }}
                        className="px-2.5 h-7 text-[11px] font-medium rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                        style={{
                          color:
                            tone === 'success'
                              ? 'var(--color-success)'
                              : tone === 'danger'
                              ? 'var(--color-danger)'
                              : 'var(--color-text)',
                        }}
                      >
                        {getStageLabel(stage)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tasks */}
              {selectedDeal.tasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                    Tarefas pendentes
                  </p>
                  <div className="space-y-1.5">
                    {selectedDeal.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-border)]"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: 'var(--color-warning)' }}
                        />
                        <span className="text-xs flex-1 truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposal */}
              {selectedDeal.proposal && (
                <div className="rounded-lg p-3 border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    Proposta vinculada
                  </p>
                  <p className="text-sm font-medium mt-1">{selectedDeal.proposal.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">
                    {selectedDeal.proposal.status}
                  </p>
                </div>
              )}

              {/* Activity */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                  Histórico
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                    placeholder="Registrar atividade..."
                    className="flex-1 px-3 py-2 rounded-md text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
                  />
                  <button
                    onClick={addActivity}
                    className="h-9 px-3 rounded-md bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedDeal.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-2 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                      <MessageSquare
                        size={12}
                        className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs">{activity.content}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {new Date(activity.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Confirm delete modal */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Excluir negócio?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Isso removerá o negócio e todo o histórico vinculado. Essa ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            >
              Cancelar
            </button>
            <button
              onClick={deleteDeal}
              className="flex-1 h-9 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--color-danger)' }}
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoTile({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'success' | 'danger'
}) {
  return (
    <div
      className="rounded-lg px-3 py-2.5 border border-[var(--color-border)]"
      style={
        highlight
          ? {
              background:
                highlight === 'success'
                  ? 'var(--color-success-soft)'
                  : 'var(--color-danger-soft)',
            }
          : undefined
      }
    >
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p
        className="text-sm font-medium mt-0.5 truncate"
        style={
          highlight
            ? {
                color:
                  highlight === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              }
            : undefined
        }
      >
        {value}
      </p>
    </div>
  )
}
