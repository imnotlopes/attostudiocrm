import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        name: body.name,
        company: body.company || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        niche: body.niche || null,
        notes: body.notes || null,
        status: body.status,
      },
    })
    return NextResponse.json(partner)
  } catch (error) {
    console.error('Partner PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar parceiro' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.partner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Partner DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir parceiro' }, { status: 500 })
  }
}
