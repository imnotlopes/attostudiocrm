'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, CheckSquare, Calendar, Clock, AlertTriangle, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, getTaskTypeLabel, getPriorityLabel, TASK_TYPES, PRIORITIES } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

interface Task {
  id: string
  title: string
  type: string
  priority: string
  dueDate: string
  completed: boolean
  clientId: string | null
  client: { id: string; name: string } | null
  dealId: string | null
  automated: boolean
  createdAt: string
}

interface Client {
  id: string
  name: string
}

interface Deal {
  id: string
  title: string
  clientId: string
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  outline: 'none',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filterCompleted, setFilterCompleted] = useState<string>('false')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  const [form, setForm] = useState({
    title: '',
    type: 'follow_up',
    priority: 'normal',
    dueDate: new Date().toISOString().split('T')[0],
    clientId: '',
    dealId: '',
  })

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterCompleted !== '') params.set('completed', filterCompleted)
      if (filterPriority) params.set('priority', filterPriority)
      if (filterType) params.set('type', filterType)
      const res = await fetch(`/api/tasks?${params}`)
      setTasks(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [filterCompleted, filterPriority, filterType])

  useEffect(() => {
    fetchTasks()
    fetch('/api/clients').then(r => r.json()).then(setClients)
    fetch('/api/deals').then(r => r.json()).then(setDeals)
  }, [fetchTasks])

  const clientDeals = deals.filter(d => d.clientId === form.clientId)

  async function createTask() {
    if (!form.title.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dealId: form.dealId || null,
        clientId: form.clientId || null,
      }),
    })
    setShowForm(false)
    setForm({ title: '', type: 'follow_up', priority: 'normal', dueDate: new Date().toISOString().split('T')[0], clientId: '', dealId: '' })
    fetchTasks()
  }

  async function toggleTask(id: string, completed: boolean) {
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    })
    fetchTasks()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    fetchTasks()
  }

  const priorityVariant = (p: string): 'danger' | 'warning' | 'default' => {
    if (p === 'urgente') return 'danger'
    if (p === 'normal') return 'warning'
    return 'default'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < today)
  const todayTasks = tasks.filter(t => !t.completed && new Date(t.dueDate).toDateString() === today.toDateString())
  const upcomingTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) > today)
  const completedTasks = tasks.filter(t => t.completed)

  const calendarStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - calendarDate.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calendarStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const getTasksForDate = (date: Date) => tasks.filter(t => new Date(t.dueDate).toDateString() === date.toDateString())

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-text-primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  const selectStyle: React.CSSProperties = { ...inputStyle }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>Tarefas e Follow-ups</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 14 }}>
            {overdueTasks.length > 0 && (
              <span style={{ color: 'var(--color-danger)', fontWeight: 500 }}>{overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''} • </span>
            )}
            {todayTasks.length} para hoje • {upcomingTasks.length} futuras
          </p>
        </div>
        <div className="flex gap-3">
          <div style={{ display: 'flex', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: view === 'list' ? 'var(--color-text-primary)' : 'transparent',
                color: view === 'list' ? 'var(--color-bg)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >Lista</button>
            <button
              onClick={() => setView('calendar')}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: view === 'calendar' ? 'var(--color-text-primary)' : 'transparent',
                color: view === 'calendar' ? 'var(--color-bg)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >Calendário</button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg)',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[
          { value: filterCompleted, onChange: setFilterCompleted, options: [{ value: 'false', label: 'Pendentes' }, { value: 'true', label: 'Concluídas' }, { value: '', label: 'Todas' }] },
        ].map((f, i) => (
          <select key={i} value={f.value} onChange={e => f.onChange(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
          <option value="">Todas as prioridades</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
          <option value="">Todos os tipos</option>
          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          {overdueTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} /> Atrasadas ({overdueTasks.length})
              </h3>
              <TaskSection tasks={overdueTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} isOverdue />
            </div>
          )}

          {todayTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} /> Hoje ({todayTasks.length})
              </h3>
              <TaskSection tasks={todayTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} />
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} /> Próximas ({upcomingTasks.length})
              </h3>
              <TaskSection tasks={upcomingTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} />
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} /> Concluídas ({completedTasks.length})
              </h3>
              <TaskSection tasks={completedTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} />
            </div>
          )}

          {tasks.length === 0 && (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
              <CheckSquare size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma tarefa encontrada</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() - 7); setCalendarDate(d) }}
              style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Semana de {weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </h3>
            <button
              onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() + 7); setCalendarDate(d) }}
              style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid var(--color-border)' }}>
            {weekDays.map((day, i) => {
              const dayTasks = getTasksForDate(day)
              const isToday = day.toDateString() === today.toDateString()
              return (
                <div key={i} style={{ minHeight: 200, padding: 8, background: isToday ? 'var(--color-surface-1)' : 'transparent', borderRight: i < 6 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)' }}>{dayNames[i]}</p>
                    <p style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: isToday ? 'var(--color-bg)' : 'var(--color-text-primary)',
                      background: isToday ? 'var(--color-text-primary)' : 'transparent',
                      width: isToday ? 32 : 'auto',
                      height: isToday ? 32 : 'auto',
                      borderRadius: isToday ? '50%' : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '4px auto 0',
                    }}>
                      {day.getDate()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id, !task.completed)}
                        style={{
                          padding: '4px 6px',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer',
                          background: task.completed
                            ? 'var(--color-surface-1)'
                            : task.priority === 'urgente'
                            ? 'var(--color-danger-soft)'
                            : 'var(--color-surface-2)',
                          color: task.completed
                            ? 'var(--color-text-muted)'
                            : task.priority === 'urgente'
                            ? 'var(--color-danger)'
                            : 'var(--color-text-primary)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.title.length > 28 ? task.title.substring(0, 28) + '…' : task.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nova Tarefa">
        <div className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
              placeholder="O que precisa ser feito?"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={selectStyle}>
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>Prioridade</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={selectStyle}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>Data de vencimento</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>Cliente</label>
            <select
              value={form.clientId}
              onChange={e => setForm({ ...form, clientId: e.target.value, dealId: '' })}
              style={selectStyle}
            >
              <option value="">Nenhum</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {form.clientId && clientDeals.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6 }}>Vincular ao serviço (deal)</label>
              <select value={form.dealId} onChange={e => setForm({ ...form, dealId: e.target.value })} style={selectStyle}>
                <option value="">Nenhum</option>
                {clientDeals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button
              onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: '10px 16px', background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >Cancelar</button>
            <button
              onClick={createTask}
              style={{ flex: 1, padding: '10px 16px', background: 'var(--color-text-primary)', color: 'var(--color-bg)', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >Criar Tarefa</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TaskSection({ tasks, onToggle, onDelete, priorityVariant, isOverdue = false }: {
  tasks: Task[]
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
  priorityVariant: (p: string) => 'danger' | 'warning' | 'default'
  isOverdue?: boolean
}) {
  return (
    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
      {tasks.map((task, i) => (
        <div
          key={task.id}
          className="group animate-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderBottom: i < tasks.length - 1 ? '1px solid var(--color-border)' : 'none',
            background: isOverdue ? 'rgba(239,68,68,0.03)' : 'transparent',
            animationDelay: `${i * 0.02}s`,
          }}
        >
          <button
            onClick={() => onToggle(task.id, !task.completed)}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2px solid ${task.completed ? 'var(--color-success)' : 'var(--color-border)'}`,
              background: task.completed ? 'var(--color-success)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.15s',
            }}
          >
            {task.completed && <Check size={11} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 14,
              fontWeight: 500,
              color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              textDecoration: task.completed ? 'line-through' : 'none',
            }}>
              {task.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <Badge variant={priorityVariant(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{getTaskTypeLabel(task.type)}</span>
              {task.client && <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{task.client.name}</span>}
              {task.automated && <Badge variant="info">Auto</Badge>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
              {formatDate(task.dueDate)}
            </span>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100"
              style={{
                padding: 6,
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-danger-soft)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
