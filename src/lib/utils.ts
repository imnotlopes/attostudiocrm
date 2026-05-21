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
    gmn: 'Google Meu Negócio',
    site: 'Criação de Site',
    seo: 'SEO',
    google_ads: 'Google Ads',
    whatsapp_automation: 'Automação WhatsApp',
    ecommerce: 'Criação de E-commerce',
  }
  return labels[type] || type
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    prospeccao: 'Prospecção',
    primeiro_contato: 'Primeiro Contato',
    diagnostico: 'Diagnóstico',
    proposta_enviada: 'Proposta Enviada',
    negociacao: 'Negociação',
    fechado_ganho: 'Fechado (Ganho)',
    fechado_perdido: 'Fechado (Perdido)',
    em_andamento: 'Em Andamento',
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
    indicacao: 'Indicação',
    prospeccao_ativa: 'Prospecção Ativa',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  }
  return labels[source] || source
}

export function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    follow_up: 'Follow-up',
    reuniao: 'Reunião',
    entrega: 'Entrega',
    cobranca: 'Cobrança',
    ligacao: 'Ligação',
  }
  return labels[type] || type
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    urgente: 'Urgente',
    normal: 'Normal',
    baixa: 'Baixa',
  }
  return labels[priority] || priority
}

export const STAGES = [
  'prospeccao',
  'primeiro_contato',
  'diagnostico',
  'proposta_enviada',
  'negociacao',
  'fechado_ganho',
  'fechado_perdido',
  'em_andamento',
] as const

export const ACTIVE_PIPELINE_STAGES = [
  'prospeccao',
  'primeiro_contato',
  'diagnostico',
  'proposta_enviada',
  'negociacao',
] as const

export const TERMINAL_STAGES = ['fechado_ganho', 'fechado_perdido', 'em_andamento'] as const

export const SERVICE_TYPES = [
  { value: 'gmn', label: 'Google Meu Negócio' },
  { value: 'site', label: 'Criação de Site' },
  { value: 'seo', label: 'SEO' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'whatsapp_automation', label: 'Automação WhatsApp' },
  { value: 'ecommerce', label: 'Criação de E-commerce' },
]

export const LEAD_SOURCES = [
  { value: 'indicacao', label: 'Indicação' },
  { value: 'prospeccao_ativa', label: 'Prospecção Ativa' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
]

export const PACKAGES = [
  { value: 'starter', label: 'Starter — R$ 1.997' },
  { value: 'pro', label: 'Pro — R$ 3.997' },
  { value: 'scale', label: 'Scale — R$ 6.997' },
]

export const PACKAGE_VALUES: Record<string, number> = {
  starter: 1997,
  pro: 3997,
  scale: 6997,
}

export function getPackageLabel(tier: string): string {
  const labels: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    scale: 'Scale',
  }
  return labels[tier] || tier
}

export const TASK_TYPES = [
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'ligacao', label: 'Ligação' },
]

export const PRIORITIES = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'normal', label: 'Normal' },
  { value: 'baixa', label: 'Baixa' },
]
