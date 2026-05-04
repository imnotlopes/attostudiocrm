import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')

    const where: Record<string, unknown> = {}
    if (stage) where.stage = stage

    const deals = await prisma.deal.findMany({
      where,
      include: {
        client: true,
        tasks: { where: { completed: false } },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        proposal: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Deals GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar deals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const deal = await prisma.deal.create({
      data: {
        clientId: body.clientId,
        serviceType: body.serviceType,
        estimatedValue: parseFloat(body.estimatedValue),
        stage: body.stage || 'lead_novo',
      },
      include: { client: true },
    })

    await prisma.activity.create({
      data: {
        type: 'nota',
        content: `Novo negócio criado: ${deal.client.name}`,
        clientId: deal.clientId,
        dealId: deal.id,
      },
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Deals POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar deal' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const existingDeal = await prisma.deal.findUnique({ where: { id } })
    const stageChanged = existingDeal && existingDeal.stage !== data.stage

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...data,
        estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : undefined,
        lastActivityAt: new Date(),
        ...(stageChanged ? { stageEnteredAt: new Date() } : {}),
      },
      include: { client: true },
    })

    if (stageChanged) {
      await prisma.activity.create({
        data: {
          type: 'nota',
          content: `Negócio movido para: ${data.stage}`,
          clientId: deal.clientId,
          dealId: deal.id,
        },
      })

      // If closed as won, update client status
      if (data.stage === 'fechado_ganho') {
        await prisma.client.update({
          where: { id: deal.clientId },
          data: { status: 'ativo' },
        })
      }
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Deals PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar deal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deals DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir deal' }, { status: 500 })
  }
}
