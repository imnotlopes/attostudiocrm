import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const callStatus = searchParams.get('callStatus')

  const leads = await prisma.lead.findMany({
    where: callStatus ? { callStatus } : undefined,
    orderBy: [{ nextFollowUpAt: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      company: data.company || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      niche: data.niche || null,
      city: data.city || null,
      source: data.source || null,
      callStatus: data.callStatus || 'nao_contatado',
      lastCallAt: data.lastCallAt ? new Date(data.lastCallAt) : null,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      notes: data.notes || null,
      callNotes: data.callNotes || null,
    },
  })
  return NextResponse.json(lead, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const data = await req.json()
  const { id, ...rest } = data
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      name: rest.name,
      company: rest.company || null,
      whatsapp: rest.whatsapp || null,
      email: rest.email || null,
      niche: rest.niche || null,
      city: rest.city || null,
      source: rest.source || null,
      callStatus: rest.callStatus,
      lastCallAt: rest.lastCallAt ? new Date(rest.lastCallAt) : null,
      nextFollowUpAt: rest.nextFollowUpAt ? new Date(rest.nextFollowUpAt) : null,
      notes: rest.notes || null,
      callNotes: rest.callNotes || null,
    },
  })
  return NextResponse.json(lead)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.lead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
