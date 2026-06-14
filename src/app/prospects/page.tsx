'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, X, Phone, Mail, Trash2, Edit2, Calendar,
} from 'lucide-react'
import { formatCurrency, formatDate, daysSince } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface Prospect {
  id: string
  name: string
  company: string | null
  whatsapp: string | null
  email: string | null
  niche: string | null
  city: string | null
  source: string | null
  stage: string
  estimatedValue: number | null
  meetingAt: string | null
  notes: string | null
  stageEnteredAt: string
  createdAt: string
}

const STAGES = [
  { value: 'visualizaram',     label: 'Visualizaram',     color: 'var(--color-text-muted)' },
  { value: 'interessados',     label: 'Interessados',     color: 'var(--color-info)' },
  { value: 'reuniao_agendada', label: 'Reunião Agendada', color: 'var(--color-warning)' },
  { value: 'proposta_enviada', label: 'Proposta Enviada', color: 'var(--color-success)' },
]

const stageLabel = (s: string) => STAGES.find(st => st.value === s)?.label || s
const stageColor = (s: string) => STAGES.find(st => st.value === s)?.color || 'var(--color-text-muted)'

const emptyForm = {
  name: '', company: '', whatsapp: '', email: '',
  niche: '', city: '', source: '',
  stage: 'visualizaram',
  estimatedValue: '', meetingAt: '', notes: '',
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Prospect | null>(null)
  const [selected, setSelected] = useState<Prospect | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch('/api/prospects')
      setProspects(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProspects() }, [fetchProspects])

  function openNew(stage = 'visualizaram') {
    setEditing(null)
    setForm({ ...emptyForm, stage })
    setShowForm(true)
  }

  function openEdit(p: Prospect) {
    setEditing(p)
    setForm({
      name: p.name,
      company: p.company || '',
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      niche: p.niche || '',
      city: p.city || '',
      source: p.source || '',
      stage: p.stage,
      estimatedValue: p.estimatedValue?.toString() || '',
      meetingAt: p.meetingAt ? p.meetingAt.split('T')[0] : '',
      notes: p.notes || '',
    })
    setShowForm(true)
  }

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function saveProspect() {
    if (!form.name.trim()) return
    if (editing) {
      await fetch('/api/prospects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      })
    } else {
      await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setSelected(null)
    fetchProspects()
  }

  async function moveProspect(id: string, stage: string) {
    await fetch('/api/prospects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    })
    fetchProspects()
  }

  async function deleteProspect(id: string) {
    if (!confirm('Excluir este prospect?')) return
    await fetch(`/api/prospects?id=${id}`, { method: 'DELETE' })
    setSelected(null)
    fetchProspects()
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStage !== stage) setDragOverStage(stage)
  }
  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault()
    if (draggedId) moveProspect(draggedId, stage)
    setDraggedId(null)
    setDragOverStage(null)
  }

  const stageProspects = (stage: string) => prospects.filter(p => p.stage === stage)
  const stageTotal = (stage: string) =>
    stageProspects(stage).reduce((sum, p) => sum + (p.estimatedValue || 0), 0)

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
          <h1 className="text-2xl font-semibold tracking-tight">Prospecção</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {prospects.length} lead{prospects.length !== 1 ? 's' : ''} · arraste os cards entre as etapas
          </p>
        </div>
        <button
          onClick={() => openNew()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
        >
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1" style={{ minHeight: '70vh' }}>
        {STAGES.map(stage => {
          const items = stageProspects(stage.value)
          const total = stageTotal(stage.value)
          const isOver = dragOverStage === stage.value

          return (
            <div
              key={stage.value}
              className="flex-shrink-0 w-64 flex flex-col rounded-lg border bg-[var(--color-surface)]"
              style={{
                borderColor: isOver ? 'var(--color-success)' : 'var(--color-border)',
                transition: 'border-color 0.15s ease',
              }}
              onDragOver={e => handleDragOver(e, stage.value)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => handleDrop(e, stage.value)}
            >
              {/* Column header */}
              <div className="px-3 py-3 flex items-center justify-between border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: stage.color }}>
                    {stage.label}
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)] tabular-nums">{items.length}</span>
                </div>
                {total > 0 && (
                  <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums whitespace-nowrap">
                    {formatCurrency(total)}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {items.map(p => {
                  const days = daysSince(p.stageEnteredAt)
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={e => handleDragStart(e, p.id)}
                      onClick={() => setSelected(p)}
                      className="rounded-lg p-3 cursor-pointer border bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        {p.company && (
                          <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">{p.company}</p>
                        )}
                      </div>

                      {(p.niche || p.city) && (
                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {p.niche && <span className="text-[11px] text-[var(--color-text-muted)]">{p.niche}</span>}
                          {p.niche && p.city && <span className="text-[10px] text-[var(--color-text-muted)]">·</span>}
                          {p.city && <span className="text-[11px] text-[var(--color-text-muted)]">{p.city}</span>}
                        </div>
                      )}

                      {p.stage === 'reuniao_agendada' && p.meetingAt && (
                        <div className="mt-2 flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-warning)' }}>
                          <Calendar size={11} /> {formatDate(p.meetingAt)}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        {p.estimatedValue ? (
                          <span className="text-sm font-semibold tabular-nums">{formatCurrency(p.estimatedValue)}</span>
                        ) : <span />}
                        <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">{days}d</span>
                      </div>
                    </div>
                  )
                })}
                {items.length === 0 && (
                  <button
                    onClick={() => openNew(stage.value)}
                    className="w-full h-full min-h-[120px] flex items-center justify-center py-8 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg border border-dashed border-[var(--color-border)] transition-colors"
                  >
                    + Adicionar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Editar Lead' : 'Novo Lead'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nome *">
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Nome do contato" className={inp} />
            </Field>
            <Field label="Empresa">
              <input type="text" value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="Nome da empresa" className={inp} />
            </Field>
            <Field label="WhatsApp">
              <input type="text" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999" className={inp} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@empresa.com" className={inp} />
            </Field>
            <Field label="Nicho">
              <input type="text" value={form.niche} onChange={e => set('niche', e.target.value)}
                placeholder="Ex: Dedetizadora..." className={inp} />
            </Field>
            <Field label="Cidade">
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="Cidade" className={inp} />
            </Field>
            <Field label="Origem">
              <input type="text" value={form.source} onChange={e => set('source', e.target.value)}
                placeholder="Ex: Instagram, Indicação..." className={inp} />
            </Field>
            <Field label="Etapa">
              <select value={form.stage} onChange={e => set('stage', e.target.value)} className={inp}>
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Valor estimado (R$)">
              <input type="number" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)}
                placeholder="1997" className={inp} />
            </Field>
            <Field label="Data da reunião">
              <input type="date" value={form.meetingAt} onChange={e => set('meetingAt', e.target.value)} className={inp} />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                rows={3} className={`${inp} resize-none`}
                placeholder="Anotações sobre o lead, o que foi conversado, próximos passos..." />
            </Field>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-1 h-9 rounded-lg text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
              Cancelar
            </button>
            <button onClick={saveProspect}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90">
              {editing ? 'Salvar' : 'Criar Lead'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-bg)] text-[var(--color-text)] z-50 border-l border-[var(--color-border)] overflow-y-auto">
            <header className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-bg)] z-10">
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate">{selected.name}</h2>
                {selected.company && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{selected.company}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(selected)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  title="Editar">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => deleteProspect(selected.id)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  title="Excluir">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setSelected(null)}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]">
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="p-5 space-y-6">
              {/* Stage badge */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: stageColor(selected.stage) }} />
                <span className="text-sm font-medium" style={{ color: stageColor(selected.stage) }}>
                  {stageLabel(selected.stage)}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">· há {daysSince(selected.stageEnteredAt)} dia(s)</span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {selected.estimatedValue ? (
                  <InfoTile label="Valor estimado" value={formatCurrency(selected.estimatedValue)} />
                ) : null}
                {selected.source && <InfoTile label="Origem" value={selected.source} />}
                {selected.niche && <InfoTile label="Nicho" value={selected.niche} />}
                {selected.city && <InfoTile label="Cidade" value={selected.city} />}
                {selected.meetingAt && (
                  <InfoTile label="Reunião" value={formatDate(selected.meetingAt)} highlight="warning" />
                )}
              </div>

              {/* Contact */}
              {(selected.whatsapp || selected.email) && (
                <div className="flex gap-2">
                  {selected.whatsapp && (
                    <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                      <Phone size={12} /> WhatsApp
                    </a>
                  )}
                  {selected.email && (
                    <a href={`mailto:${selected.email}`}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
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
                  {STAGES.filter(s => s.value !== selected.stage).map(s => (
                    <button
                      key={s.value}
                      onClick={() => { moveProspect(selected.id, s.value); setSelected({ ...selected, stage: s.value }) }}
                      className="px-2.5 h-7 text-[11px] font-medium rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                      style={{ color: s.color }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                    Observações
                  </p>
                  <p className="text-sm whitespace-pre-wrap rounded-lg px-3 py-2.5 border border-[var(--color-border)] bg-[var(--color-surface)]">
                    {selected.notes}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
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

function InfoTile({ label, value, highlight }: {
  label: string; value: string; highlight?: 'success' | 'warning'
}) {
  const color = highlight === 'success' ? 'var(--color-success)' : highlight === 'warning' ? 'var(--color-warning)' : undefined
  const bg = highlight === 'success' ? 'var(--color-success-soft)' : highlight === 'warning' ? 'var(--color-warning-soft)' : undefined
  return (
    <div className="rounded-lg px-3 py-2.5 border border-[var(--color-border)]" style={bg ? { background: bg } : undefined}>
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="text-sm font-medium mt-0.5 truncate" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}
