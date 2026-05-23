import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        _count: { select: { clients: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(partners)
  } catch (error) {
    console.error('Partners GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar parceiros' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const partner = await prisma.partner.create({
      data: {
        name: body.name,
        company: body.company || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        niche: body.niche || null,
        notes: body.notes || null,
        status: body.status || 'ativo',
      },
    })
    return NextResponse.json(partner, { status: 201 })
  } catch (error) {
    console.error('Partners POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar parceiro' }, { status: 500 })
  }
}
