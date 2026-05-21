import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const channel = searchParams.get('channel')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (channel) where.acquisitionChannel = channel
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { niche: { contains: search, mode: 'insensitive' } },
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        deals: true,
        contracts: true,
        _count: { select: { activities: true, tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Clients GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const client = await prisma.client.create({
      data: {
        name: body.name,
        company: body.company || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        niche: body.niche || null,
        city: body.city || null,
        serviceInterest: body.serviceInterest || null,
        packageTier: body.packageTier || null,
        acquisitionChannel: body.acquisitionChannel || null,
        hasSite: body.hasSite ?? null,
        hasGmn: body.hasGmn ?? null,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null,
        objection: body.objection || null,
        status: body.status || 'lead',
        notes: body.notes || null,
      },
    })

    await prisma.activity.create({
      data: {
        type: 'nota',
        content: `Novo cliente cadastrado: ${client.name}`,
        clientId: client.id,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Clients POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
