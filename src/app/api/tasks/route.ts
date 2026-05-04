import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const completed = searchParams.get('completed')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const clientId = searchParams.get('clientId')

    const where: Record<string, unknown> = {}
    if (completed !== null && completed !== '') {
      where.completed = completed === 'true'
    }
    if (priority) where.priority = priority
    if (type) where.type = type
    if (clientId) where.clientId = clientId

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: true,
        deal: true,
      },
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = await prisma.task.create({
      data: {
        title: body.title,
        type: body.type,
        priority: body.priority || 'media',
        dueDate: new Date(body.dueDate),
        clientId: body.clientId || null,
        dealId: body.dealId || null,
        automated: body.automated || false,
      },
      include: { client: true },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { client: true },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Tasks PUT error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tasks DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 })
  }
}
