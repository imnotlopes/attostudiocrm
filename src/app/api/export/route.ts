import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        deals: true,
        contracts: true,
      },
      orderBy: { name: 'asc' },
    })

    // Build CSV
    const headers = [
      'Nome',
      'Empresa',
      'WhatsApp',
      'Email',
      'Segmento',
      'Origem',
      'Status',
      'Total Deals',
      'Total Contratos',
      'LTV Estimado',
      'Data Cadastro',
    ]

    const rows = clients.map((c) => {
      const dealValue = c.deals
        .filter((d) => d.stage === 'fechado_ganho')
        .reduce((sum, d) => sum + d.estimatedValue, 0)
      const contractValue = c.contracts.reduce(
        (sum, ct) => sum + (ct.totalValue || 0) + (ct.monthlyValue || 0) * 12,
        0
      )
      const ltv = dealValue + contractValue

      return [
        c.name,
        c.company || '',
        c.whatsapp || '',
        c.email || '',
        c.segment || '',
        c.leadSource || '',
        c.status,
        c.deals.length.toString(),
        c.contracts.length.toString(),
        ltv.toFixed(2),
        new Date(c.createdAt).toLocaleDateString('pt-BR'),
      ]
    })

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=clientes.csv',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
  }
}
