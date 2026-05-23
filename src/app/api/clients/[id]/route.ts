import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        deals: { orderBy: { createdAt: 'desc' } },
        proposals: { orderBy: { createdAt: 'desc' } },
        contracts: { include: { payments: true }, orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { dueDate: 'asc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Client GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const client = await prisma.client.update({
      where: { id },
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
        status: body.status,
        notes: body.notes || null,
        partnerId: body.partnerId || null,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Client PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Client DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 })
  }
}
