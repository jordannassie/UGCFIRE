'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const NAV = [
  { label: 'Overview', href: '/admin', icon: '📊' },
  { label: 'Clients', href: '/admin/clients', icon: '👥' },
  { label: 'Upload Content', href: '/admin/uploads', icon: '⬆️' },
  { label: 'All Content', href: '/admin/content', icon: '🎬' },
  { label: 'Client Uploads', href: '/admin/client-uploads', icon: '📁' },
  { label: 'Revisions', href: '/admin/revisions', icon: '🔄' },
  { label: 'Messages', href: '/admin/messages', icon: '💬' },
  { label: 'Billing', href: '/admin/billing', icon: '💳' },
  { label: 'Agreements', href: '/admin/agreements', icon: '📝' },
  { label: 'Activity', href: '/admin/activity', icon: '📋' },
  { label: 'Demo Tools', href: '/admin/demo', icon: '🛠️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      setUserEmail(user.email ?? '')
      setChecking(false)
    })
  }, [router])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-white/40 text-sm">Verifying admin access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/">
              <Image
                src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                alt="UGCFire"
                width={90}
                height={36}
                unoptimized
              />
            </Link>
            <span className="text-[10px] font-bold bg-[#FF3B1A] text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Admin</span>
          </div>
          <p className="text-white/30 text-xs">Command Center</p>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-[#FF3B1A] text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <p className="text-white/30 text-xs truncate mb-2">{userEmail}</p>
          <button onClick={signOut} className="w-full text-left text-white/40 text-xs hover:text-white transition py-1">
            Sign Out →
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="bg-[#0a0a0a] border-b border-white/5 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">UGCFire Admin</span>
          <span className="text-[10px] font-bold bg-[#FF3B1A] text-white px-1.5 py-0.5 rounded uppercase tracking-widest ml-auto">Admin</span>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
