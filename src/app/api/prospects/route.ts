import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stage = searchParams.get('stage')

  const prospects = await prisma.prospect.findMany({
    where: stage ? { stage } : undefined,
    orderBy: { stageEnteredAt: 'desc' },
  })
  return NextResponse.json(prospects)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const prospect = await prisma.prospect.create({
    data: {
      name: data.name,
      company: data.company || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      niche: data.niche || null,
      city: data.city || null,
      source: data.source || null,
      stage: data.stage || 'visualizaram',
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
      meetingAt: data.meetingAt ? new Date(data.meetingAt) : null,
      notes: data.notes || null,
    },
  })
  return NextResponse.json(prospect, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const data = await req.json()
  const { id, ...rest } = data

  const current = await prisma.prospect.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Stage-only move (drag-and-drop) — reset stageEnteredAt when stage changes
  if (rest.stage && Object.keys(rest).length === 1) {
    const prospect = await prisma.prospect.update({
      where: { id },
      data: {
        stage: rest.stage,
        stageEnteredAt: rest.stage !== current.stage ? new Date() : current.stageEnteredAt,
      },
    })
    return NextResponse.json(prospect)
  }

  const prospect = await prisma.prospect.update({
    where: { id },
    data: {
      name: rest.name,
      company: rest.company || null,
      whatsapp: rest.whatsapp || null,
      email: rest.email || null,
      niche: rest.niche || null,
      city: rest.city || null,
      source: rest.source || null,
      stage: rest.stage,
      estimatedValue: rest.estimatedValue ? parseFloat(rest.estimatedValue) : null,
      meetingAt: rest.meetingAt ? new Date(rest.meetingAt) : null,
      notes: rest.notes || null,
      stageEnteredAt: rest.stage !== current.stage ? new Date() : current.stageEnteredAt,
    },
  })
  return NextResponse.json(prospect)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.prospect.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
