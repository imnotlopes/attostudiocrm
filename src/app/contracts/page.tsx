'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, ScrollText, DollarSign, AlertTriangle,
  CheckCircle, Clock, XCircle, Edit2, Trash2, TrendingUp,
} from 'lucide-react'
import { formatCurrency, formatDate, getServiceLabel, SERVICE_TYPES } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Payment {
  id: string
  amount: number
  dueDate: string
  status: string
  paidAt: string | null
}

interface Contract {
  id: string
  clientId: string
  client: { id: string; name: string; company: string | null }
  service: string
  type: string
  monthlyValue: number | null
  setupValue: number | null
  totalValue: number | null
  startDate: string
  endDate: string | null
  status: string
  notes: string | null
  payments: Payment[]
  createdAt: string
}

interface Client {
  id: string
  name: string
  company: string | null
}

const CONTRACT_STATUS = [
  { value: 'ativo',     label: 'Ativo' },
  { value: 'renovacao', label: 'Em Renovação' },
  { value: 'encerrado', label: 'Encerrado' },
]

function paymentHealth(payments: Payment[]): 'em_dia' | 'atrasado' | 'sem_pagamentos' {
  if (payments.length === 0) return 'sem_pagamentos'
  const hasOverdue = payments.some(
    p => p.status !== 'pago' && new Date(p.dueDate) < new Date()
  )
  return hasOverdue ? 'atrasado' : 'em_dia'
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPayments, setShowPayments] = useState<Contract | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  const [form, setForm] = useState({
    clientId: '', service: '', type: 'recorrente',
    monthlyValue: '', setupValue: '', totalValue: '',
    startDate: '', endDate: '', notes: '', status: 'ativo',
  })
  const [paymentForm, setPaymentForm] = useState({ amount: '', dueDate: '', status: 'pendente' })

  const fetchContracts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/contracts?${params}`)
      setContracts(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchContracts()
    fetch('/api/clients').then(r => r.json()).then(setClients)
  }, [fetchContracts])

  function openNew() {
    setEditingContract(null)
    setForm({
      clientId: '', service: '', type: 'recorrente',
      monthlyValue: '', setupValue: '', totalValue: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '', notes: '', status: 'ativo',
    })
    setShowForm(true)
  }

  function openEdit(c: Contract) {
    setEditingContract(c)
    setForm({
      clientId: c.clientId,
      service: c.service,
      type: c.type,
      monthlyValue: c.monthlyValue?.toString() || '',
      setupValue: c.setupValue?.toString() || '',
      totalValue: c.totalValue?.toString() || '',
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate?.split('T')[0] || '',
      notes: c.notes || '',
      status: c.status,
    })
    setShowForm(true)
  }

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function saveContract() {
    if (!form.clientId || !form.service) return
    const payload = { ...form }
    if (editingContract) {
      await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingContract.id, ...payload }),
      })
    } else {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setShowForm(false)
    fetchContracts()
  }

  async function deleteContract(id: string) {
    if (!confirm('Excluir este contrato?')) return
    await fetch(`/api/contracts?id=${id}`, { method: 'DELETE' })
    fetchContracts()
  }

  async function refreshPayments(contractId: string) {
    const res = await fetch('/api/contracts')
    const data = await res.json()
    const updated = data.find((c: Contract) => c.id === contractId)
    if (updated) setShowPayments(updated)
    fetchContracts()
  }

  async function addPayment() {
    if (!showPayments || !paymentForm.amount || !paymentForm.dueDate) return
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: showPayments.id, ...paymentForm }),
    })
    setPaymentForm({ amount: '', dueDate: '', status: 'pendente' })
    refreshPayments(showPayments.id)
  }

  async function updatePaymentStatus(paymentId: string, status: string, contractId: string) {
    await fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentId, status, paidAt: status === 'pago' ? new Date().toISOString() : null }),
    })
    refreshPayments(contractId)
  }

  const activeRecurring = contracts.filter(c => c.status === 'ativo' && c.type === 'recorrente')
  const totalMRR = activeRecurring.reduce((sum, c) => sum + (c.monthlyValue || 0), 0)

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
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {contracts.length} contrato{contracts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        >
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* MRR banner */}
      {totalMRR > 0 && (
        <div
          className="rounded-xl border px-5 py-4 flex items-center justify-between"
          style={{ borderColor: 'var(--color-success)', background: 'var(--color-success-soft)' }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={18} style={{ color: 'var(--color-success)' }} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-success)' }}>
                MRR Total Ativo
              </p>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--color-success)' }}>
                {formatCurrency(totalMRR)}
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            {activeRecurring.length} contrato{activeRecurring.length !== 1 ? 's' : ''} recorrente{activeRecurring.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Todos' }, ...CONTRACT_STATUS].map(s => (
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

      {/* Contracts list */}
      {contracts.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <ScrollText size={36} className="text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => {
            const expiringSoon =
              contract.endDate &&
              contract.status === 'ativo' &&
              new Date(contract.endDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
            const health = paymentHealth(contract.payments)

            return (
              <div
                key={contract.id}
                className="rounded-xl border bg-[var(--color-surface)] px-4 py-3.5"
                style={{
                  borderColor: expiringSoon
                    ? 'var(--color-warning)'
                    : 'var(--color-border)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{contract.client.name}</span>
                      {contract.client.company && (
                        <span className="text-xs text-[var(--color-text-muted)]">({contract.client.company})</span>
                      )}
                      <Badge variant={contract.status === 'ativo' ? 'success' : contract.status === 'renovacao' ? 'warning' : 'default'}>
                        {CONTRACT_STATUS.find(s => s.value === contract.status)?.label || contract.status}
                      </Badge>
                      <Badge variant={contract.type === 'recorrente' ? 'info' : 'default'}>
                        {contract.type === 'recorrente' ? 'Recorrente' : 'Único'}
                      </Badge>
                      {/* Payment health */}
                      {health === 'atrasado' && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
                        >
                          <AlertTriangle size={10} /> Pagamento atrasado
                        </span>
                      )}
                      {health === 'em_dia' && contract.payments.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
                        >
                          <CheckCircle size={10} /> Em dia
                        </span>
                      )}
                      {expiringSoon && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}
                        >
                          <Clock size={10} /> Vence em breve
                        </span>
                      )}
                    </div>

                    {/* Service + dates */}
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{contract.service}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatDate(contract.startDate)}
                      {contract.endDate ? ` → ${formatDate(contract.endDate)}` : ' → Sem prazo definido'}
                    </p>
                  </div>

                  {/* Values + actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-0.5">
                      {contract.monthlyValue ? (
                        <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-success)' }}>
                          {formatCurrency(contract.monthlyValue)}<span className="text-xs font-normal text-[var(--color-text-muted)]">/mês</span>
                        </p>
                      ) : null}
                      {contract.setupValue ? (
                        <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                          Setup: {formatCurrency(contract.setupValue)}
                        </p>
                      ) : contract.totalValue ? (
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(contract.totalValue)}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-0.5">
                      <ActionBtn title="Pagamentos" onClick={() => setShowPayments(contract)}>
                        <DollarSign size={14} />
                      </ActionBtn>
                      <ActionBtn title="Editar" onClick={() => openEdit(contract)}>
                        <Edit2 size={14} />
                      </ActionBtn>
                      <ActionBtn title="Excluir" onClick={() => deleteContract(contract.id)} accent="danger">
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

      {/* Contract Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingContract ? 'Editar Contrato' : 'Novo Contrato'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cliente *">
              <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={inp}>
                <option value="">Selecione</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Serviço *">
              <select value={form.service} onChange={e => set('service', e.target.value)} className={inp}>
                <option value="">Selecione</option>
                {SERVICE_TYPES.map(s => (
                  <option key={s.value} value={s.label}>{s.label}</option>
                ))}
                <option value="Pacote Completo">Pacote Completo</option>
              </select>
            </Field>
            <Field label="Tipo de contrato">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inp}>
                <option value="recorrente">Recorrente (Mensal)</option>
                <option value="unico">Projeto Único</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inp}>
                {CONTRACT_STATUS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Mensalidade (R$)">
              <input type="number" value={form.monthlyValue} onChange={e => set('monthlyValue', e.target.value)}
                placeholder={form.type === 'recorrente' ? '1997' : '—'} className={inp} />
            </Field>
            <Field label="Setup / Implantação (R$)">
              <input type="number" value={form.setupValue} onChange={e => set('setupValue', e.target.value)}
                placeholder="0" className={inp} />
            </Field>
            <Field label="Data de início">
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inp} />
            </Field>
            <Field label="Data de renovação / término">
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inp} />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={2} className={`${inp} resize-none`} placeholder="Observações sobre o contrato..." />
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
              Cancelar
            </button>
            <button onClick={saveContract}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90">
              {editingContract ? 'Salvar' : 'Criar Contrato'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Payments Modal */}
      <Modal
        open={!!showPayments}
        onClose={() => setShowPayments(null)}
        title={`Pagamentos — ${showPayments?.client.name}`}
        size="lg"
      >
        {showPayments && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)]">
              <p className="text-sm font-medium">{showPayments.service}</p>
              {showPayments.monthlyValue && (
                <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-success)' }}>
                  {formatCurrency(showPayments.monthlyValue)}/mês
                </p>
              )}
            </div>

            {/* Add payment */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
              <Field label="Valor (R$)">
                <input type="number" value={paymentForm.amount}
                  onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder={showPayments.monthlyValue?.toString() || '0'}
                  className={inp} />
              </Field>
              <Field label="Vencimento">
                <input type="date" value={paymentForm.dueDate}
                  onChange={e => setPaymentForm(f => ({ ...f, dueDate: e.target.value }))}
                  className={inp} />
              </Field>
              <Field label="Status">
                <select value={paymentForm.status}
                  onChange={e => setPaymentForm(f => ({ ...f, status: e.target.value }))}
                  className={inp}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </Field>
              <button onClick={addPayment}
                className="h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90 mb-0">
                Adicionar
              </button>
            </div>

            {/* Payment list */}
            <div className="space-y-2">
              {showPayments.payments.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Nenhum pagamento registrado</p>
              ) : (
                showPayments.payments.map(payment => {
                  const isOverdue = payment.status !== 'pago' && new Date(payment.dueDate) < new Date()
                  const effectiveStatus = isOverdue ? 'atrasado' : payment.status
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--color-border)]"
                    >
                      <div className="flex items-center gap-3">
                        <span style={{
                          color: effectiveStatus === 'pago' ? 'var(--color-success)' : effectiveStatus === 'atrasado' ? 'var(--color-danger)' : 'var(--color-warning)'
                        }}>
                          {effectiveStatus === 'pago' ? <CheckCircle size={16} /> : effectiveStatus === 'atrasado' ? <XCircle size={16} /> : <Clock size={16} />}
                        </span>
                        <div>
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Vence {formatDate(payment.dueDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={effectiveStatus === 'pago' ? 'success' : effectiveStatus === 'atrasado' ? 'danger' : 'warning'}>
                          {effectiveStatus === 'pago' ? 'Pago' : effectiveStatus === 'atrasado' ? 'Atrasado' : 'Pendente'}
                        </Badge>
                        {effectiveStatus !== 'pago' && (
                          <button
                            onClick={() => updatePaymentStatus(payment.id, 'pago', showPayments.id)}
                            className="h-7 px-2.5 text-xs font-medium rounded-md"
                            style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
                          >
                            Marcar pago
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
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
