export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function daysSince(date: Date | string): number {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getUrgencyColor(daysInStage: number): 'green' | 'yellow' | 'red' {
  if (daysInStage <= 3) return 'green'
  if (daysInStage <= 7) return 'yellow'
  return 'red'
}

export function getServiceLabel(type: string): string {
  const labels: Record<string, string> = {
    site: 'Site Institucional',
    landing_page: 'Landing Page',
    agente_ia: 'Agente de IA',
  }
  return labels[type] || type
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    lead_novo: 'Lead Novo',
    qualificacao: 'Qualificação',
    proposta_enviada: 'Proposta Enviada',
    negociacao: 'Negociação',
    fechado_ganho: 'Fechado (Ganho)',
    fechado_perdido: 'Fechado (Perdido)',
  }
  return labels[stage] || stage
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    lead: 'Lead',
    ativo: 'Cliente Ativo',
    inativo: 'Cliente Inativo',
    'ex-cliente': 'Ex-Cliente',
  }
  return labels[status] || status
}

export function getLeadSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    indicacao: 'Indicação',
    google: 'Google',
    linkedin: 'LinkedIn',
    outro: 'Outro',
  }
  return labels[source] || source
}

export function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    follow_up: 'Follow-up',
    envio_proposta: 'Envio de Proposta',
    ligacao: 'Ligação',
    reuniao: 'Reunião',
    entrega: 'Entrega de Projeto',
  }
  return labels[type] || type
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
  }
  return labels[priority] || priority
}

export const STAGES = [
  'lead_novo',
  'qualificacao',
  'proposta_enviada',
  'negociacao',
  'fechado_ganho',
  'fechado_perdido',
] as const

export const SERVICE_TYPES = [
  { value: 'site', label: 'Site Institucional' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'agente_ia', label: 'Agente de IA' },
]

export const LEAD_SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'outro', label: 'Outro' },
]

export const TASK_TYPES = [
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'envio_proposta', label: 'Envio de Proposta' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'entrega', label: 'Entrega de Projeto' },
]

export const PRIORITIES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]
