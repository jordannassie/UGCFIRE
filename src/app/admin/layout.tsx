'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, UploadCloud, Film, FolderOpen,
  RefreshCcw, MessageCircle, CreditCard, FileText, Activity,
  Settings, Menu,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const NAV = [
  { label: 'Overview',       href: '/admin',               icon: LayoutDashboard },
  { label: 'Clients',        href: '/admin/clients',        icon: Users },
  { label: 'Upload Content', href: '/admin/uploads',        icon: UploadCloud },
  { label: 'All Content',    href: '/admin/content',        icon: Film },
  { label: 'Client Uploads', href: '/admin/client-uploads', icon: FolderOpen },
  { label: 'Revisions',      href: '/admin/revisions',      icon: RefreshCcw },
  { label: 'Messages',       href: '/admin/messages',       icon: MessageCircle },
  { label: 'Billing',        href: '/admin/billing',        icon: CreditCard },
  { label: 'Agreements',     href: '/admin/agreements',     icon: FileText },
  { label: 'Activity',       href: '/admin/activity',       icon: Activity },
  { label: 'Demo Tools',     href: '/admin/demo',           icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const supabase = createClient()

      // Wait for a valid session — retry up to 3× with 400 ms gaps
      // (handles the brief window right after signInWithPassword + window.location.href)
      let user = null
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase.auth.getUser()
        user = data.user
        if (user) break
        await new Promise(r => setTimeout(r, 400))
      }

      if (!user) {
        if (!cancelled) router.push('/login')
        return
      }

      // Fetch profile — retry once if null (trigger might still be running)
      let profile = null
      for (let i = 0; i < 2; i++) {
        const { data } = await supabase.from('profiles').select('role, email').eq('id', user.id).maybeSingle()
        profile = data
        if (profile?.role) break
        await new Promise(r => setTimeout(r, 600))
      }

      if (!cancelled) {
        console.debug('[admin] session exists:', true, '| profile found:', !!profile, '| role:', profile?.role)
      }

      if (!profile || profile.role !== 'admin') {
        if (!cancelled) setDenied(true)
        return
      }

      if (!cancelled) {
        setUserEmail(user.email ?? profile.email ?? '')
        setChecking(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [router])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-sm mb-4">Admin access required. Your account role is not admin.</p>
          <button onClick={() => router.push('/dashboard')} className="text-[#FF3B1A] text-sm underline">Go to client dashboard</button>
        </div>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#FF3B1A] animate-pulse" />
          <span className="text-white/40 text-sm">Loading admin workspace...</span>
        </div>
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
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? 'bg-[#FF3B1A]/15 text-white font-medium border border-[#FF3B1A]/20'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  size={16}
                  className={`flex-shrink-0 transition-all duration-150 group-hover:scale-110 ${active ? 'text-[#FF3B1A]' : 'text-white/30 group-hover:text-[#FF3B1A]'}`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <p className="text-white/30 text-xs truncate mb-2">{userEmail}</p>
          <button onClick={signOut} className="w-full text-left text-white/40 text-xs hover:text-white transition py-1">
            Sign Out
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
            <Menu size={20} />
          </button>
          <span className="text-white font-semibold text-sm">UGCFire Admin</span>
          <span className="text-[10px] font-bold bg-[#FF3B1A] text-white px-1.5 py-0.5 rounded uppercase tracking-widest ml-auto">Admin</span>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
