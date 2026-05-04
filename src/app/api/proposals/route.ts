import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const proposals = await prisma.proposal.findMany({
      where,
      include: { client: true, deal: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(proposals)
  } catch (error) {
    console.error('Proposals GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar propostas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const proposal = await prisma.proposal.create({
      data: {
        clientId: body.clientId,
        dealId: body.dealId || null,
        title: body.title,
        serviceType: body.serviceType,
        summary: body.summary || null,
        scope: body.scope || null,
        timeline: body.timeline || null,
        investment: body.investment ? parseFloat(body.investment) : null,
        paymentTerms: body.paymentTerms || null,
        status: body.status || 'rascunho',
        version: body.version || 1,
        shareToken: uuidv4(),
      },
      include: { client: true },
    })

    await prisma.activity.create({
      data: {
        type: 'proposta',
        content: `Proposta criada: ${proposal.title} (v${proposal.version})`,
        clientId: proposal.clientId,
        dealId: proposal.dealId,
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error('Proposals POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar proposta' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        investment: data.investment ? parseFloat(data.investment) : undefined,
      },
      include: { client: true },
    })

    if (data.status && data.status !== 'rascunho') {
      await prisma.activity.create({
        data: {
          type: 'proposta',
          content: `Proposta "${proposal.title}" marcada como: ${data.status}`,
          clientId: proposal.clientId,
          dealId: proposal.dealId,
        },
      })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Proposals PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar proposta' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.proposal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Proposals DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir proposta' }, { status: 500 })
  }
}
