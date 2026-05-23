'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Phone, Mail, Handshake } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'

interface Partner {
  id: string
  name: string
  company: string | null
  whatsapp: string | null
  email: string | null
  niche: string | null
  notes: string | null
  status: string
  createdAt: string
  _count: { clients: number }
}

const emptyForm = {
  name: '',
  company: '',
  whatsapp: '',
  email: '',
  niche: '',
  notes: '',
  status: 'ativo',
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })

  const fetchPartners = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/partners?${params}`)
      const data = await res.json()
      setPartners(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchPartners() }, [fetchPartners])

  function openEdit(partner: Partner) {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      company: partner.company || '',
      whatsapp: partner.whatsapp || '',
      email: partner.email || '',
      niche: partner.niche || '',
      notes: partner.notes || '',
      status: partner.status,
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingPartner(null)
    setFormData({ ...emptyForm })
    setShowForm(true)
  }

  async function savePartner() {
    if (!formData.name.trim()) return
    if (editingPartner) {
      await fetch(`/api/partners/${editingPartner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    } else {
      await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    }
    setShowForm(false)
    fetchPartners()
  }

  async function deletePartner(id: string) {
    if (!confirm('Tem certeza que deseja excluir este parceiro? Os clientes indicados por ele não serão excluídos.')) return
    await fetch(`/api/partners/${id}`, { method: 'DELETE' })
    fetchPartners()
  }

  const set = (field: string, value: unknown) =>
    setFormData(f => ({ ...f, [field]: value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-success)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parceiros</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {partners.length} {partners.length === 1 ? 'parceiro cadastrado' : 'parceiros cadastrados'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        >
          <Plus size={16} /> Novo Parceiro
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou empresa..."
          className="w-full pl-9 pr-4 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
        />
      </div>

      {/* List */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {partners.length === 0 ? (
          <div className="text-center py-16">
            <Handshake size={36} className="text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">Nenhum parceiro cadastrado</p>
            <button
              onClick={openNew}
              className="mt-3 text-sm font-medium"
              style={{ color: 'var(--color-success)' }}
            >
              + Adicionar primeiro parceiro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors group"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                >
                  {partner.name.charAt(0).toUpperCase()}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{partner.name}</span>
                    <Badge variant={partner.status === 'ativo' ? 'success' : 'default'}>
                      {partner.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {partner.company && (
                      <span className="text-xs text-[var(--color-text-muted)]">{partner.company}</span>
                    )}
                    {partner.niche && (
                      <span className="text-xs text-[var(--color-text-muted)]">· {partner.niche}</span>
                    )}
                    {partner.whatsapp && (
                      <a
                        href={`https://wa.me/55${partner.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-text-muted)] flex items-center gap-0.5 hover:text-[var(--color-success)]"
                      >
                        <Phone size={10} />{partner.whatsapp}
                      </a>
                    )}
                    {partner.email && (
                      <a
                        href={`mailto:${partner.email}`}
                        className="text-xs text-[var(--color-text-muted)] flex items-center gap-0.5 hover:text-[var(--color-success)]"
                      >
                        <Mail size={10} />{partner.email}
                      </a>
                    )}
                  </div>
                  {partner.notes && (
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">{partner.notes}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-[11px] text-[var(--color-text-muted)]">Indicações</p>
                    <Link
                      href={`/clients?partner=${partner.id}`}
                      className="font-semibold text-sm hover:underline"
                      style={{ color: partner._count.clients > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                    >
                      {partner._count.clients}
                    </Link>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(partner)}
                    className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deletePartner(partner.id)}
                    className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome *">
              <input
                type="text"
                value={formData.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Nome do parceiro"
                className={inputCls}
              />
            </Field>
            <Field label="Empresa">
              <input
                type="text"
                value={formData.company}
                onChange={e => set('company', e.target.value)}
                placeholder="Nome da empresa"
                className={inputCls}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className={inputCls}
              />
            </Field>
            <Field label="E-mail">
              <input
                type="email"
                value={formData.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@exemplo.com"
                className={inputCls}
              />
            </Field>
            <Field label="Nicho / Área de atuação">
              <input
                type="text"
                value={formData.niche}
                onChange={e => set('niche', e.target.value)}
                placeholder="Ex: Imóveis, Saúde, Contabilidade..."
                className={inputCls}
              />
            </Field>
            <Field label="Status">
              <select
                value={formData.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </div>
          <Field label="Anotações">
            <textarea
              value={formData.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Observações sobre o parceiro, tipo de indicações que ele traz..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            >
              Cancelar
            </button>
            <button
              onClick={savePartner}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
            >
              {editingPartner ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ─── helpers ─── */

const inputCls = 'w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]'

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}
