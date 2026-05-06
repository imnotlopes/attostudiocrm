import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const a = await prisma.deal.updateMany({
    where: { stage: 'lead_novo' },
    data: { stage: 'prospeccao' },
  })
  const b = await prisma.deal.updateMany({
    where: { stage: 'qualificacao' },
    data: { stage: 'diagnostico' },
  })

  const counts = await prisma.deal.groupBy({
    by: ['stage'],
    _count: { stage: true },
    orderBy: { stage: 'asc' },
  })

  console.log(`✅ lead_novo → prospeccao: ${a.count}`)
  console.log(`✅ qualificacao → diagnostico: ${b.count}`)
  console.log('Stages atuais:')
  for (const c of counts) {
    console.log(`  ${c.stage}: ${c._count.stage}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
