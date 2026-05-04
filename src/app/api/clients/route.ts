import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const source = searchParams.get('source')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (source) where.leadSource = source
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
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
        segment: body.segment || null,
        leadSource: body.leadSource || null,
        status: body.status || 'lead',
        notes: body.notes || null,
      },
    })

    // Create activity for new client
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
