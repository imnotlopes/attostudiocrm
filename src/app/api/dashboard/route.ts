import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Active leads in pipeline
    const activeLeads = await prisma.deal.count({
      where: {
        stage: { notIn: ['fechado_ganho', 'fechado_perdido'] },
      },
    })

    // Revenue closed this month
    const closedDeals = await prisma.deal.findMany({
      where: {
        stage: 'fechado_ganho',
        updatedAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })
    const monthRevenue = closedDeals.reduce((sum, d) => sum + d.estimatedValue, 0)

    // MRR from active contracts
    const activeContracts = await prisma.contract.findMany({
      where: { status: 'ativo', type: 'recorrente' },
    })
    const mrr = activeContracts.reduce((sum, c) => sum + (c.monthlyValue || 0), 0)

    // Pending follow-ups for today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const pendingTasks = await prisma.task.count({
      where: {
        completed: false,
        dueDate: { lte: todayEnd },
      },
    })

    // Contracts expiring in 30 days
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'ativo',
        endDate: { lte: in30Days, gte: now },
      },
      include: { client: true },
      orderBy: { endDate: 'asc' },
    })

    // Last 5 activities
    const recentActivities = await prisma.activity.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    })

    // Conversion rate
    const totalDeals = await prisma.deal.count()
    const wonDeals = await prisma.deal.count({ where: { stage: 'fechado_ganho' } })
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

    // Overdue tasks count
    const overdueTasks = await prisma.task.count({
      where: {
        completed: false,
        dueDate: { lt: todayStart },
      },
    })

    // Top clients by LTV
    const clients = await prisma.client.findMany({
      include: {
        contracts: true,
        deals: { where: { stage: 'fechado_ganho' } },
      },
      take: 5,
    })

    const topClients = clients
      .map((c) => {
        const contractValue = c.contracts.reduce((sum, ct) => sum + (ct.totalValue || 0) + (ct.monthlyValue || 0) * 12, 0)
        const dealValue = c.deals.reduce((sum, d) => sum + d.estimatedValue, 0)
        return { name: c.name, company: c.company, ltv: contractValue + dealValue }
      })
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 5)

    return NextResponse.json({
      activeLeads,
      monthRevenue,
      mrr,
      pendingTasks,
      overdueTasks,
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
