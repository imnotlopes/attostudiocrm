import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import AuthGate from '@/components/layout/AuthGate'

export const metadata: Metadata = {
  title: 'Atto CRM — Gestão de Vendas',
  description: 'CRM completo para gestão de leads, propostas, contratos e tarefas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  )
}
