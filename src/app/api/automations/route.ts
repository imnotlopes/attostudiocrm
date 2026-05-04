import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const now = new Date()
    const results: string[] = []

    // Rule 1: Lead 7 days inactive in "Proposta enviada" → follow-up task
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const staleProposals = await prisma.deal.findMany({
      where: {
        stage: 'proposta_enviada',
        lastActivityAt: { lt: sevenDaysAgo },
      },
      include: { client: true, tasks: { where: { completed: false, type: 'follow_up' } } },
    })

    for (const deal of staleProposals) {
      if (deal.tasks.length === 0) {
        await prisma.task.create({
          data: {
            title: `Follow-up: ${deal.client.name} - Proposta sem resposta há 7 dias`,
            type: 'follow_up',
            priority: 'alta',
            dueDate: now,
            clientId: deal.clientId,
            dealId: deal.id,
            automated: true,
          },
        })
        results.push(`Task criada: follow-up para ${deal.client.name}`)
      }
    }

    // Rule 2: Lead 14 days inactive in any stage → reactivation alert
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const staleDeals = await prisma.deal.findMany({
      where: {
        stage: { notIn: ['fechado_ganho', 'fechado_perdido'] },
        lastActivityAt: { lt: fourteenDaysAgo },
      },
      include: {
        client: true,
        tasks: { where: { completed: false, title: { contains: 'Reaquecimento' } } },
      },
    })

    for (const deal of staleDeals) {
      if (deal.tasks.length === 0) {
        await prisma.task.create({
          data: {
            title: `Reaquecimento: ${deal.client.name} - 14 dias sem atividade`,
            type: 'follow_up',
            priority: 'alta',
            dueDate: now,
            clientId: deal.clientId,
            dealId: deal.id,
            automated: true,
          },
        })
        results.push(`Alerta de reaquecimento: ${deal.client.name}`)
      }
    }

    // Rule 3: Contract expiring in 30 days → renewal task
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'ativo',
        endDate: { lte: thirtyDaysFromNow, gte: now },
      },
      include: { client: true },
    })

    for (const contract of expiringContracts) {
      const existingTask = await prisma.task.findFirst({
        where: {
          clientId: contract.clientId,
          title: { contains: 'Renovação' },
          completed: false,
        },
      })

      if (!existingTask) {
        await prisma.task.create({
          data: {
            title: `Renovação: Contrato de ${contract.client.name} vence em breve`,
            type: 'follow_up',
            priority: 'alta',
            dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            clientId: contract.clientId,
            automated: true,
          },
        })
        results.push(`Task de renovação: ${contract.client.name}`)
      }
    }

    // Rule 4: Proposal marked as "visualizada" → follow-up in 2 days
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const viewedProposals = await prisma.proposal.findMany({
      where: {
        status: 'visualizada',
        updatedAt: { lt: twoDaysAgo },
      },
      include: { client: true },
    })

    for (const proposal of viewedProposals) {
      const existingTask = await prisma.task.findFirst({
        where: {
          clientId: proposal.clientId,
          title: { contains: proposal.title },
          completed: false,
        },
      })

      if (!existingTask) {
        await prisma.task.create({
          data: {
            title: `Follow-up: Proposta "${proposal.title}" visualizada por ${proposal.client.name}`,
            type: 'follow_up',
            priority: 'media',
            dueDate: now,
            clientId: proposal.clientId,
            dealId: proposal.dealId,
            automated: true,
          },
        })
        results.push(`Follow-up proposta visualizada: ${proposal.client.name}`)
      }
    }

    return NextResponse.json({ success: true, actions: results })
  } catch (error) {
    console.error('Automations error:', error)
    return NextResponse.json({ error: 'Erro ao executar automações' }, { status: 500 })
  }
}
