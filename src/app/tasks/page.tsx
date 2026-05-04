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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filterCompleted, setFilterCompleted] = useState<string>('false')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  const [form, setForm] = useState({
    title: '', type: 'follow_up', priority: 'media', dueDate: new Date().toISOString().split('T')[0], clientId: ''
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
  }, [fetchTasks])

  async function createTask() {
    if (!form.title.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ title: '', type: 'follow_up', priority: 'media', dueDate: new Date().toISOString().split('T')[0], clientId: '' })
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

  const priorityVariant = (p: string) => {
    const map: Record<string, 'danger' | 'warning' | 'default'> = { alta: 'danger', media: 'warning', baixa: 'default' }
    return map[p] || 'default'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < today)
  const todayTasks = tasks.filter(t => !t.completed && new Date(t.dueDate).toDateString() === today.toDateString())
  const upcomingTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) > today)
  const completedTasks = tasks.filter(t => t.completed)

  // Calendar helpers
  const calendarStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), calendarDate.getDate() - calendarDate.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calendarStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => new Date(t.dueDate).toDateString() === date.toDateString())
  }

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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
          <h1 className="text-2xl font-bold text-slate-800">Tarefas e Follow-ups</h1>
          <p className="text-slate-500 mt-1">
            {overdueTasks.length > 0 && (
              <span className="text-red-500 font-medium">{overdueTasks.length} atrasada{overdueTasks.length > 1 ? 's' : ''} • </span>
            )}
            {todayTasks.length} para hoje • {upcomingTasks.length} futuras
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-medium transition-all ${view === 'list' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Lista</button>
            <button onClick={() => setView('calendar')} className={`px-4 py-2 text-sm font-medium transition-all ${view === 'calendar' ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Calendário</button>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25">
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterCompleted} onChange={(e) => setFilterCompleted(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option value="false">Pendentes</option>
          <option value="true">Concluídas</option>
          <option value="">Todas</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option value="">Todas as prioridades</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option value="">Todos os tipos</option>
          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {view === 'list' ? (
        /* List View */
        <div className="space-y-6">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> Atrasadas ({overdueTasks.length})
              </h3>
              <TaskSection tasks={overdueTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} isOverdue />
            </div>
          )}

          {/* Today */}
          {todayTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-2">
                <Clock size={16} /> Hoje ({todayTasks.length})
              </h3>
              <TaskSection tasks={todayTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} />
            </div>
          )}

          {/* Upcoming */}
          {upcomingTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <Calendar size={16} /> Próximas ({upcomingTasks.length})
              </h3>
              <TaskSection tasks={upcomingTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} />
            </div>
          )}

          {/* Completed */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                <Check size={16} /> Concluídas ({completedTasks.length})
              </h3>
              <TaskSection tasks={completedTasks} onToggle={toggleTask} onDelete={deleteTask} priorityVariant={priorityVariant} />
            </div>
          )}

          {tasks.length === 0 && (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100">
              <CheckSquare size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma tarefa encontrada</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <button onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() - 7); setCalendarDate(d) }} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-sm font-semibold text-slate-700">
              Semana de {weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() + 7); setCalendarDate(d) }} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 divide-x divide-slate-100">
            {weekDays.map((day, i) => {
              const dayTasks = getTasksForDate(day)
              const isToday = day.toDateString() === today.toDateString()

              return (
                <div key={i} className={`min-h-[200px] p-2 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                  <div className={`text-center mb-2 ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                    <p className="text-xs font-medium">{dayNames[i]}</p>
                    <p className={`text-lg font-bold ${isToday ? 'bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id, !task.completed)}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                          task.completed
                            ? 'bg-slate-100 text-slate-400 line-through'
                            : task.priority === 'alta'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title}
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="O que precisa ser feito?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridade</label>
              <select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
              <select value={form.clientId} onChange={(e) => setForm({...form, clientId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Nenhum</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200">Cancelar</button>
            <button onClick={createTask} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25">Criar Tarefa</button>
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
      {tasks.map((task, i) => (
        <div key={task.id} className={`flex items-center gap-3 p-4 hover:bg-slate-50/80 transition-all group animate-fade-in-up ${isOverdue ? 'bg-red-50/30' : ''}`} style={{ animationDelay: `${i * 0.02}s` }}>
          <button
            onClick={() => onToggle(task.id, !task.completed)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              task.completed
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 hover:border-indigo-500'
            }`}
          >
            {task.completed && <Check size={12} />}
          </button>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={priorityVariant(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
              <span className="text-xs text-slate-400">{getTaskTypeLabel(task.type)}</span>
              {task.client && <span className="text-xs text-indigo-500 font-medium">{task.client.name}</span>}
              {task.automated && <Badge variant="purple">Auto</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
              {formatDate(task.dueDate)}
            </span>
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
