import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Active deals (not closed)
    const activeDeals = await prisma.deal.findMany({
      where: { stage: { notIn: ['fechado_ganho', 'fechado_perdido', 'em_andamento'] } },
      include: { client: true },
    })
    const activeLeads = activeDeals.length

    // Leads ativos por nicho
    const nicheCounts = new Map<string, number>()
    for (const d of activeDeals) {
      const key = d.client.niche?.trim() || 'Sem nicho'
      nicheCounts.set(key, (nicheCounts.get(key) || 0) + 1)
    }
    const leadsByNiche = Array.from(nicheCounts.entries())
      .map(([niche, count]) => ({ niche, count }))
      .sort((a, b) => b.count - a.count)

    // Conversão por canal de aquisição (todos os deals)
    const allDeals = await prisma.deal.findMany({ include: { client: true } })
    const channelStats = new Map<string, { total: number; won: number }>()
    for (const d of allDeals) {
      const key = d.client.acquisitionChannel?.trim() || 'Sem canal'
      const cur = channelStats.get(key) || { total: 0, won: 0 }
      cur.total += 1
      if (d.stage === 'fechado_ganho') cur.won += 1
      channelStats.set(key, cur)
    }
    const conversionByChannel = Array.from(channelStats.entries())
      .map(([channel, s]) => ({
        channel,
        total: s.total,
        won: s.won,
        rate: s.total > 0 ? Math.round((s.won / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)

    // Receita do mês: deals fechados no mês + MRR de contratos recorrentes ativos
    const wonDealsThisMonth = await prisma.deal.findMany({
      where: {
        stage: 'fechado_ganho',
        stageEnteredAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })
    const setupRevenue = wonDealsThisMonth.reduce((sum, d) => sum + d.estimatedValue, 0)

    const activeRecurring = await prisma.contract.findMany({
      where: { status: 'ativo', type: 'recorrente' },
    })
    const mrr = activeRecurring.reduce((sum, c) => sum + (c.monthlyValue || 0), 0)
    const recurringRevenue = mrr

    const monthRevenue = setupRevenue + recurringRevenue

    // Follow-ups atrasados (tasks de tipo follow_up vencidas)
    const overdueFollowUps = await prisma.task.count({
      where: {
        completed: false,
        type: 'follow_up',
        dueDate: { lt: todayStart },
      },
    })

    // Pendentes para hoje (qualquer tipo)
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const pendingTasks = await prisma.task.count({
      where: { completed: false, dueDate: { lte: todayEnd } },
    })

    // Contratos a vencer em 30 dias
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringContracts = await prisma.contract.findMany({
      where: { status: 'ativo', endDate: { lte: in30Days, gte: now } },
      include: { client: true },
      orderBy: { endDate: 'asc' },
    })

    // Atividades recentes
    const recentActivities = await prisma.activity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    })

    // Conversão geral
    const totalDeals = allDeals.length
    const wonDeals = allDeals.filter((d) => d.stage === 'fechado_ganho').length
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

    // Top clientes por LTV
    const clients = await prisma.client.findMany({
      include: {
        contracts: true,
        deals: { where: { stage: 'fechado_ganho' } },
      },
    })
    const topClients = clients
      .map((c) => {
        const contractValue = c.contracts.reduce(
          (sum, ct) =>
            sum + (ct.totalValue || 0) + (ct.setupValue || 0) + (ct.monthlyValue || 0) * 12,
          0,
        )
        const dealValue = c.deals.reduce((sum, d) => sum + d.estimatedValue, 0)
        return { name: c.name, company: c.company, ltv: contractValue + dealValue }
      })
      .filter((c) => c.ltv > 0)
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 5)

    return NextResponse.json({
      activeLeads,
      monthRevenue,
      revenueBreakdown: { setup: setupRevenue, recurring: recurringRevenue },
      mrr,
      pendingTasks,
      overdueFollowUps,
      leadsByNiche,
      conversionByChannel,
      expiringContracts,
      recentActivities,
      conversionRate,
      totalDeals,
      wonDeals,
      topClients,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 })
  }
}
