import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.activity.deleteMany()
  await prisma.task.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.proposal.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.client.deleteMany()

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Ana Silva',
        company: 'Studio Beleza Ana',
        whatsapp: '11999887766',
        email: 'ana@studioana.com.br',
        segment: 'Estética e Beleza',
        niche: 'Estética',
        leadSource: 'instagram',
        acquisitionChannel: 'Instagram',
        status: 'ativo',
        notes: 'Interesse em site + agente IA para agendamento.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Roberto Mendes',
        company: 'Mendes Advocacia',
        whatsapp: '11988776655',
        email: 'roberto@mendesadv.com.br',
        segment: 'Jurídico',
        niche: 'Jurídico',
        leadSource: 'google',
        acquisitionChannel: 'Prospecção Ativa',
        status: 'ativo',
        notes: 'Escritório de advocacia com 3 sócios. Quer modernizar presença digital.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Fernanda Costa',
        company: 'Clínica Viver Bem',
        whatsapp: '21977665544',
        email: 'fernanda@clinicaviverbem.com.br',
        segment: 'Saúde',
        niche: 'Clínica Veterinária',
        leadSource: 'indicacao',
        acquisitionChannel: 'Indicação',
        status: 'lead',
        notes: 'Clínica multidisciplinar. Precisa de LP para captação de pacientes.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Carlos Eduardo',
        company: 'CE Consultoria',
        whatsapp: '11966554433',
        email: 'carlos@ceconsultoria.com',
        segment: 'Consultoria',
        niche: 'Consultoria',
        leadSource: 'linkedin',
        acquisitionChannel: 'Prospecção Ativa',
        status: 'lead',
        notes: 'Consultor empresarial. Quer landing page para captar leads B2B.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Mariana Oliveira',
        company: 'Pet Shop Amigo Fiel',
        whatsapp: '31955443322',
        email: 'mariana@amigofiel.com.br',
        segment: 'Pet',
        niche: 'Pet Shop',
        leadSource: 'instagram',
        acquisitionChannel: 'Instagram',
        status: 'ativo',
        notes: 'Pet shop com 2 unidades. Já tem site antigo, quer atualizar e adicionar IA.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Lucas Pereira',
        company: 'LP Fitness',
        whatsapp: '11933221100',
        email: 'lucas@lpfitness.com.br',
        segment: 'Fitness',
        niche: 'Academia',
        leadSource: 'indicacao',
        acquisitionChannel: 'Indicação',
        status: 'inativo',
        notes: 'Academia. Perdemos o projeto por preço. Pode retomar no futuro.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Patricia Duarte',
        company: 'Doce Confeitaria',
        whatsapp: '21944332211',
        email: 'patricia@doceconfeitaria.com.br',
        segment: 'Alimentação',
        niche: 'Confeitaria',
        leadSource: 'google',
        acquisitionChannel: 'WhatsApp',
        status: 'lead',
        notes: 'Confeitaria artesanal. Quer um site com cardápio e pedido online.',
      },
    }),
    prisma.client.create({
      data: {
        name: 'André Machado',
        company: 'Machado Imóveis',
        whatsapp: '11922110099',
        email: 'andre@machadoimoveis.com.br',
        segment: 'Imobiliário',
        niche: 'Imobiliária',
        leadSource: 'linkedin',
        acquisitionChannel: 'Prospecção Ativa',
        status: 'ex-cliente',
        notes: 'Ex-cliente. Fizemos um site em 2023, contrato expirou.',
      },
    }),
  ])

  const [ana, roberto, fernanda, carlos, mariana, lucas, patricia, andre] = clients

  // Create deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        clientId: fernanda.id,
        serviceType: 'landing_page',
        estimatedValue: 2500,
        stage: 'prospeccao',
        lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: carlos.id,
        serviceType: 'landing_page',
        estimatedValue: 3000,
        stage: 'diagnostico',
        lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: patricia.id,
        serviceType: 'site',
        estimatedValue: 4500,
        stage: 'proposta_enviada',
        lastActivityAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: mariana.id,
        serviceType: 'agente_ia',
        estimatedValue: 5000,
        stage: 'negociacao',
        lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: ana.id,
        serviceType: 'site',
        estimatedValue: 5500,
        stage: 'fechado_ganho',
        lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: roberto.id,
        serviceType: 'site',
        estimatedValue: 7000,
        stage: 'fechado_ganho',
        lastActivityAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.deal.create({
      data: {
        clientId: lucas.id,
        serviceType: 'site',
        estimatedValue: 4000,
        stage: 'fechado_perdido',
        lostReason: 'Preço acima do orçamento disponível.',
        lastActivityAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        stageEnteredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  // Create proposals
  await Promise.all([
    prisma.proposal.create({
      data: {
        clientId: patricia.id,
        dealId: deals[2].id,
        title: 'Site Doce Confeitaria',
        serviceType: 'site',
        summary: 'Criação de site institucional com cardápio digital e sistema de pedidos.',
        scope: '• Layout personalizado e responsivo\n• Páginas: Home, Menu, Sobre, Pedidos, Contato\n• Integração com WhatsApp para pedidos\n• Galeria de produtos\n• SEO otimizado',
        timeline: '15 a 20 dias úteis',
        investment: 4500,
        paymentTerms: '50% na aprovação + 50% na entrega',
        status: 'enviada',
        version: 1,
        shareToken: 'demo-token-patricia-001',
      },
    }),
    prisma.proposal.create({
      data: {
        clientId: mariana.id,
        dealId: deals[3].id,
        title: 'Agente IA - Pet Shop Amigo Fiel',
        serviceType: 'agente_ia',
        summary: 'Agente de IA para atendimento automatizado no WhatsApp.',
        scope: '• Agente treinado com FAQ do pet shop\n• Atendimento 24h\n• Agendamento de banho e tosa\n• Informações sobre produtos\n• Encaminhamento para humano quando necessário',
        timeline: '10 a 15 dias úteis',
        investment: 5000,
        paymentTerms: 'R$ 2.000 setup + R$ 500/mês de manutenção',
        status: 'enviada',
        version: 1,
        shareToken: 'demo-token-mariana-001',
      },
    }),
    prisma.proposal.create({
      data: {
        clientId: ana.id,
        title: 'Agente IA - Studio Beleza Ana',
        serviceType: 'agente_ia',
        summary: 'Agente de IA para agendamento e atendimento via WhatsApp.',
        scope: '• Agente de agendamento inteligente\n• Integração com Google Calendar\n• Respostas automáticas fora do horário\n• Confirmação de agendamento\n• Relatórios semanais',
        timeline: '10 dias úteis',
        investment: 3500,
        paymentTerms: 'R$ 1.500 setup + R$ 400/mês',
        status: 'aprovada',
        version: 1,
        shareToken: 'demo-token-ana-002',
      },
    }),
  ])

  // Create contracts
  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        clientId: ana.id,
        service: 'Site Institucional - Studio Beleza Ana',
        type: 'unico',
        totalValue: 5500,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: null,
        status: 'ativo',
        notes: 'Site entregue e aprovado.',
      },
    }),
    prisma.contract.create({
      data: {
        clientId: ana.id,
        service: 'Agente IA - Agendamento WhatsApp',
        type: 'recorrente',
        monthlyValue: 400,
        setupValue: 1500,
        totalValue: 1500,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 362 * 24 * 60 * 60 * 1000),
        status: 'ativo',
        notes: 'Setup concluído. Manutenção mensal ativa.',
      },
    }),
    prisma.contract.create({
      data: {
        clientId: roberto.id,
        service: 'Site Institucional - Mendes Advocacia',
        type: 'unico',
        totalValue: 7000,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        endDate: null,
        status: 'ativo',
        notes: 'Site entregue com 6 páginas.',
      },
    }),
    prisma.contract.create({
      data: {
        clientId: mariana.id,
        service: 'Manutenção de Site - Pet Shop Amigo Fiel',
        type: 'recorrente',
        monthlyValue: 300,
        setupValue: 800,
        totalValue: 3600,
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: 'ativo',
        notes: 'Contrato de manutenção mensal. Vencendo em breve!',
      },
    }),
    prisma.contract.create({
      data: {
        clientId: andre.id,
        service: 'Site - Machado Imóveis',
        type: 'unico',
        totalValue: 6000,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'encerrado',
        notes: 'Contrato encerrado.',
      },
    }),
  ])

  // Create payments
  await Promise.all([
    prisma.payment.create({ data: { contractId: contracts[0].id, amount: 2750, dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'pago', paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    prisma.payment.create({ data: { contractId: contracts[0].id, amount: 2750, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'pago', paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }),
    prisma.payment.create({ data: { contractId: contracts[1].id, amount: 1500, dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), status: 'pago', paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) } }),
    prisma.payment.create({ data: { contractId: contracts[1].id, amount: 400, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'pago', paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }),
    prisma.payment.create({ data: { contractId: contracts[1].id, amount: 400, dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), status: 'pendente' } }),
    prisma.payment.create({ data: { contractId: contracts[2].id, amount: 3500, dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), status: 'pago', paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } }),
    prisma.payment.create({ data: { contractId: contracts[2].id, amount: 3500, dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'pago', paidAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) } }),
    prisma.payment.create({ data: { contractId: contracts[3].id, amount: 300, dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: 'atrasado' } }),
    prisma.payment.create({ data: { contractId: contracts[3].id, amount: 300, dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), status: 'pendente' } }),
  ])

  // Create tasks
  const now = new Date()
  await Promise.all([
    prisma.task.create({ data: { title: 'Follow-up com Fernanda - Clínica Viver Bem', type: 'follow_up', priority: 'alta', dueDate: now, clientId: fernanda.id, dealId: deals[0].id } }),
    prisma.task.create({ data: { title: 'Ligar para Carlos - CE Consultoria', type: 'ligacao', priority: 'media', dueDate: now, clientId: carlos.id, dealId: deals[1].id } }),
    prisma.task.create({ data: { title: 'Enviar proposta revisada - Doce Confeitaria', type: 'envio_proposta', priority: 'alta', dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), clientId: patricia.id, dealId: deals[2].id } }),
    prisma.task.create({ data: { title: 'Reunião com Mariana - Pet Shop Amigo Fiel', type: 'reuniao', priority: 'alta', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), clientId: mariana.id, dealId: deals[3].id } }),
    prisma.task.create({ data: { title: 'Entrega final - Site Studio Beleza Ana', type: 'entrega', priority: 'media', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), clientId: ana.id } }),
    prisma.task.create({ data: { title: 'Contatar Mariana sobre renovação do contrato', type: 'follow_up', priority: 'alta', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), clientId: mariana.id, automated: true } }),
    prisma.task.create({ data: { title: 'Cobrar pagamento atrasado - Pet Shop Amigo Fiel', type: 'follow_up', priority: 'alta', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), clientId: mariana.id } }),
  ])

  // Create activities
  await Promise.all([
    prisma.activity.create({ data: { type: 'nota', content: 'Primeiro contato recebido via Instagram DM. Interesse em site + agente IA.', clientId: ana.id, createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'reuniao', content: 'Reunião de briefing via Google Meet. Definimos escopo do site.', clientId: ana.id, createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'proposta', content: 'Proposta de site enviada. Valor: R$ 5.500', clientId: ana.id, createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'contrato', content: 'Contrato de site aprovado e assinado. Início do projeto.', clientId: ana.id, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'nota', content: 'Site entregue e aprovado pela cliente. Excelente feedback!', clientId: ana.id, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'proposta', content: 'Proposta de Agente IA enviada e aprovada.', clientId: ana.id, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'ligacao', content: 'Ligação inicial. Roberto quer site moderno para o escritório.', clientId: roberto.id, createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'contrato', content: 'Contrato assinado. Projeto iniciado.', clientId: roberto.id, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'email', content: 'E-mail de acompanhamento enviado com progresso do site.', clientId: roberto.id, createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'nota', content: 'Lead recebido via indicação da Ana (Studio Beleza Ana).', clientId: fernanda.id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'nota', content: 'Primeiro contato via LinkedIn. Interesse em LP B2B.', clientId: carlos.id, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'ligacao', content: 'Ligação de qualificação. Orçamento entre R$ 2.000 e R$ 4.000.', clientId: carlos.id, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'proposta', content: 'Proposta de site enviada via e-mail. Aguardando retorno.', clientId: patricia.id, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } }),
    prisma.activity.create({ data: { type: 'nota', content: 'Negociação de escopo em andamento. Mariana quer incluir chatbot no site.', clientId: mariana.id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`   ${clients.length} clients created`)
  console.log(`   ${deals.length} deals created`)
  console.log(`   3 proposals created`)
  console.log(`   ${contracts.length} contracts created`)
  console.log(`   9 payments created`)
  console.log(`   7 tasks created`)
  console.log(`   14 activities created`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
