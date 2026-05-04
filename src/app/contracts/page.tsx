'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, ScrollText, DollarSign, AlertTriangle, CheckCircle, Clock, XCircle, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPayments, setShowPayments] = useState<Contract | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  const [form, setForm] = useState({
    clientId: '', service: '', type: 'unico', monthlyValue: '', totalValue: '', startDate: '', endDate: '', notes: '', status: 'ativo'
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
    setForm({ clientId: '', service: '', type: 'unico', monthlyValue: '', totalValue: '', startDate: new Date().toISOString().split('T')[0], endDate: '', notes: '', status: 'ativo' })
    setShowForm(true)
  }

  function openEdit(c: Contract) {
    setEditingContract(c)
    setForm({
      clientId: c.clientId,
      service: c.service,
      type: c.type,
      monthlyValue: c.monthlyValue?.toString() || '',
      totalValue: c.totalValue?.toString() || '',
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate?.split('T')[0] || '',
      notes: c.notes || '',
      status: c.status,
    })
    setShowForm(true)
  }

  async function saveContract() {
    if (!form.clientId || !form.service) return
    if (editingContract) {
      await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingContract.id, ...form }),
      })
    } else {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  async function addPayment() {
    if (!showPayments || !paymentForm.amount || !paymentForm.dueDate) return
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: showPayments.id, ...paymentForm }),
    })
    setPaymentForm({ amount: '', dueDate: '', status: 'pendente' })
    fetchContracts()
    const res = await fetch(`/api/contracts`)
    const data = await res.json()
    const updated = data.find((c: Contract) => c.id === showPayments.id)
    if (updated) setShowPayments(updated)
  }

  async function updatePaymentStatus(paymentId: string, status: string) {
    await fetch('/api/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paymentId, status, paidAt: status === 'pago' ? new Date().toISOString() : null }),
    })
    fetchContracts()
    if (showPayments) {
      const res = await fetch('/api/contracts')
      const data = await res.json()
      const updated = data.find((c: Contract) => c.id === showPayments.id)
      if (updated) setShowPayments(updated)
    }
  }

  const totalMRR = contracts.filter(c => c.status === 'ativo' && c.type === 'recorrente').reduce((sum, c) => sum + (c.monthlyValue || 0), 0)

  const statusVariant = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'default'> = { ativo: 'success', renovacao: 'warning', encerrado: 'default' }
    return map[s] || 'default'
  }

  const paymentVariant = (s: string) => {
    const map: Record<string, 'success' | 'warning' | 'danger'> = { pago: 'success', pendente: 'warning', atrasado: 'danger' }
    return map[s] || 'default'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contratos e Recorrência</h1>
          <p className="text-slate-500 mt-1">{contracts.length} contratos • MRR: {formatCurrency(totalMRR)}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25">
          <Plus size={18} /> Novo Contrato
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'ativo', 'renovacao', 'encerrado'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {s === '' ? 'Todos' : s === 'ativo' ? 'Ativo' : s === 'renovacao' ? 'Em Renovação' : 'Encerrado'}
          </button>
        ))}
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
          <ScrollText size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract, i) => {
            const isExpiringSoon = contract.endDate && new Date(contract.endDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 && contract.status === 'ativo'

            return (
              <div key={contract.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all animate-fade-in-up ${isExpiringSoon ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`} style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-700">{contract.client.name}</h3>
                      <Badge variant={statusVariant(contract.status)}>
                        {contract.status === 'ativo' ? 'Ativo' : contract.status === 'renovacao' ? 'Em Renovação' : 'Encerrado'}
                      </Badge>
                      <Badge variant={contract.type === 'recorrente' ? 'purple' : 'info'}>
                        {contract.type === 'recorrente' ? 'Recorrente' : 'Único'}
                      </Badge>
                      {isExpiringSoon && (
                        <Badge variant="warning">
                          <AlertTriangle size={12} className="mr-1" /> Vence em breve
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{contract.service}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(contract.startDate)}
                      {contract.endDate ? ` → ${formatDate(contract.endDate)}` : ' → Sem prazo'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {contract.type === 'recorrente' && contract.monthlyValue && (
                        <p className="text-sm font-semibold text-violet-600">{formatCurrency(contract.monthlyValue)}/mês</p>
                      )}
                      {contract.totalValue && (
                        <p className="text-sm font-semibold text-slate-700">{formatCurrency(contract.totalValue)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => setShowPayments(contract)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all" title="Pagamentos">
                        <DollarSign size={16} />
                      </button>
                      <button onClick={() => openEdit(contract)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteContract(contract.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contract Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingContract ? 'Editar Contrato' : 'Novo Contrato'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente *</label>
            <select value={form.clientId} onChange={(e) => setForm({...form, clientId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Selecione</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Serviço *</label>
            <input type="text" value={form.service} onChange={(e) => setForm({...form, service: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Site Institucional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="unico">Projeto Único</option>
              <option value="recorrente">Recorrente (Mensal)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ativo">Ativo</option>
              <option value="renovacao">Em Renovação</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>
          {form.type === 'recorrente' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Mensal (R$)</label>
              <input type="number" value={form.monthlyValue} onChange={(e) => setForm({...form, monthlyValue: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor Total (R$)</label>
            <input type="number" value={form.totalValue} onChange={(e) => setForm({...form, totalValue: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Início</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Término</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200">Cancelar</button>
          <button onClick={saveContract} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25">
            {editingContract ? 'Salvar' : 'Criar Contrato'}
          </button>
        </div>
      </Modal>

      {/* Payments Modal */}
      <Modal open={!!showPayments} onClose={() => setShowPayments(null)} title={`Pagamentos — ${showPayments?.client.name}`} size="lg">
        {showPayments && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{showPayments.service}</p>

            {/* Add Payment */}
            <div className="flex gap-2 items-end flex-wrap">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Vencimento</label>
                <input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm({...paymentForm, dueDate: e.target.value})} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={addPayment} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600">Adicionar</button>
            </div>

            {/* Payment List */}
            <div className="space-y-2">
              {showPayments.payments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum pagamento registrado</p>
              ) : (
                showPayments.payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${payment.status === 'pago' ? 'bg-emerald-100 text-emerald-600' : payment.status === 'atrasado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {payment.status === 'pago' ? <CheckCircle size={16} /> : payment.status === 'atrasado' ? <XCircle size={16} /> : <Clock size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-slate-400">Vence: {formatDate(payment.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={paymentVariant(payment.status) as 'success' | 'warning' | 'danger'}>
                        {payment.status === 'pago' ? 'Pago' : payment.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                      </Badge>
                      {payment.status !== 'pago' && (
                        <button onClick={() => updatePaymentStatus(payment.id, 'pago')} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all">
                          Marcar Pago
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
