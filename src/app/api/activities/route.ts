import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const dealId = searchParams.get('dealId')

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (dealId) where.dealId = dealId

    const activities = await prisma.activity.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Activities GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar atividades' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const activity = await prisma.activity.create({
      data: {
        type: body.type,
        content: body.content,
        clientId: body.clientId || null,
        dealId: body.dealId || null,
      },
      include: { client: true },
    })

    // Update deal lastActivityAt
    if (body.dealId) {
      await prisma.deal.update({
        where: { id: body.dealId },
        data: { lastActivityAt: new Date() },
      })
    }

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Activities POST error:', error)
    return NextResponse.json({ error: 'Erro ao registrar atividade' }, { status: 500 })
  }
}
