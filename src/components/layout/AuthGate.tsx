'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/proposal-view')) {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-success)] animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    if (typeof window !== 'undefined') {
      router.push('/login')
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
