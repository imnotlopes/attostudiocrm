'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Download, Users, Building2, Mail, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { getStatusLabel, getLeadSourceLabel, LEAD_SOURCES, formatCurrency } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'

interface Client {
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
  deals: Array<{ id: string; estimatedValue: number; stage: string }>
  contracts: Array<{ id: string; totalValue: number | null; monthlyValue: number | null }>
  _count: { activities: number; tasks: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '', company: '', whatsapp: '', email: '', segment: '', leadSource: '', status: 'lead', notes: ''
  })

  const fetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (sourceFilter) params.set('source', sourceFilter)

      const res = await fetch(`/api/clients?${params}`)
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sourceFilter])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  function openEdit(client: Client) {
    setEditingClient(client)
    setFormData({
      name: client.name,
      company: client.company || '',
      whatsapp: client.whatsapp || '',
      email: client.email || '',
      segment: client.segment || '',
      leadSource: client.leadSource || '',
      status: client.status,
      notes: client.notes || '',
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingClient(null)
    setFormData({ name: '', company: '', whatsapp: '', email: '', segment: '', leadSource: '', status: 'lead', notes: '' })
    setShowForm(true)
  }

  async function saveClient() {
    if (!formData.name.trim()) return

    if (editingClient) {
      await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  function exportCSV() {
    window.open('/api/export', '_blank')
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

  const statusVariant = (status: string) => {
    const map: Record<string, 'success' | 'info' | 'default' | 'warning'> = {
      lead: 'info', ativo: 'success', inativo: 'warning', 'ex-cliente': 'default'
    }
    return map[status] || 'default'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes e Contatos</h1>
          <p className="text-slate-500 mt-1">{clients.length} registros</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25">
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, empresa ou email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option value="">Todos os status</option>
          <option value="lead">Lead</option>
          <option value="ativo">Cliente Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="ex-cliente">Ex-Cliente</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option value="">Todas as origens</option>
          {LEAD_SOURCES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum cliente encontrado</p>
            <button onClick={openNew} className="mt-3 text-sm text-indigo-500 font-medium hover:text-indigo-600">
              + Adicionar primeiro cliente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map((client, i) => (
              <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-all group animate-fade-in-up" style={{ animationDelay: `${i * 0.02}s` }}>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-indigo-600">{client.name.charAt(0).toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/clients/${client.id}`} className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors truncate">
                      {client.name}
                    </Link>
                    <Badge variant={statusVariant(client.status)}>{getStatusLabel(client.status)}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {client.company && <span className="flex items-center gap-1"><Building2 size={12} />{client.company}</span>}
                    {client.email && <span className="flex items-center gap-1"><Mail size={12} />{client.email}</span>}
                    {client.leadSource && <span>Origem: {getLeadSourceLabel(client.leadSource)}</span>}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">LTV</p>
                    <p className="font-semibold text-slate-700">{formatCurrency(getLTV(client))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Negócios</p>
                    <p className="font-medium text-slate-600">{client.deals.length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(client)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => deleteClient(client.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 size={16} />
                  </button>
                  <Link href={`/clients/${client.id}`} className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingClient ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nome completo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Empresa</label>
            <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nome da empresa" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp</label>
            <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Segmento</label>
            <input type="text" value={formData.segment} onChange={(e) => setFormData({...formData, segment: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Ex: Saúde, Educação..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Origem do Lead</label>
            <select value={formData.leadSource} onChange={(e) => setFormData({...formData, leadSource: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="">Selecione</option>
              {LEAD_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="lead">Lead</option>
              <option value="ativo">Cliente Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="ex-cliente">Ex-Cliente</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Anotações</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Observações sobre o cliente..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all">Cancelar</button>
          <button onClick={saveClient} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25">
            {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
