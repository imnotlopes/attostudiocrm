import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: true,
        payments: { orderBy: { dueDate: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Contracts GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar contratos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const contract = await prisma.contract.create({
      data: {
        clientId: body.clientId,
        service: body.service,
        type: body.type,
        monthlyValue: body.monthlyValue ? parseFloat(body.monthlyValue) : null,
        totalValue: body.totalValue ? parseFloat(body.totalValue) : null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status || 'ativo',
        notes: body.notes || null,
      },
      include: { client: true },
    })

    await prisma.activity.create({
      data: {
        type: 'contrato',
        content: `Contrato criado: ${contract.service} para ${contract.client.name}`,
        clientId: contract.clientId,
      },
    })

    // Update client status
    await prisma.client.update({
      where: { id: contract.clientId },
      data: { status: 'ativo' },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Contracts POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar contrato' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...data,
        monthlyValue: data.monthlyValue ? parseFloat(data.monthlyValue) : undefined,
        totalValue: data.totalValue ? parseFloat(data.totalValue) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: { client: true },
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Contracts PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar contrato' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.contract.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contracts DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir contrato' }, { status: 500 })
  }
}
