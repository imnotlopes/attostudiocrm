'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Kanban,
  Users,
  FileText,
  ScrollText,
  CheckSquare,
  LogOut,
  Menu,
  X,
  Handshake,
  PhoneCall,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/partners', label: 'Parceiros', icon: Handshake },
  { href: '/leads', label: 'Cold Calls', icon: PhoneCall },
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/contracts', label: 'Contratos', icon: ScrollText },
  { href: '/tasks', label: 'Tarefas', icon: CheckSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[var(--color-sidebar)] text-white p-2 rounded-lg border border-white/10"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[var(--color-sidebar)] text-white z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Atto Studio" width={36} height={36} className="rounded-lg object-contain" />
              <div>
                <h1 className="text-sm font-semibold tracking-tight">Atto CRM</h1>
                <p className="text-[11px] text-white/45">Atto Studio</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-white/60 hover:text-white"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r" style={{ background: 'var(--color-primary)' }} />
                )}
                <Icon size={16} style={active ? { color: 'var(--color-primary)' } : {}} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/55 hover:text-[var(--color-danger)] hover:bg-white/[0.04] w-full transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
