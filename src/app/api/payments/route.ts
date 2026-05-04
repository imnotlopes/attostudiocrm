import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payment = await prisma.payment.create({
      data: {
        contractId: body.contractId,
        amount: parseFloat(body.amount),
        dueDate: new Date(body.dueDate),
        status: body.status || 'pendente',
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidAt: data.paidAt ? new Date(data.paidAt) : data.status === 'pago' ? new Date() : undefined,
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Payments PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
  }
}
