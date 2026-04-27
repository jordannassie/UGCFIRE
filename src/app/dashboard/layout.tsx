'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import type { Company } from '@/lib/types'

export const dynamic = 'force-dynamic'

const NAV = [
  { label: 'Home', href: '/dashboard', icon: '🏠' },
  { label: 'Plan', href: '/dashboard/plan', icon: '📋' },
  { label: 'Agreement', href: '/dashboard/agreement', icon: '📝' },
  { label: 'Checkout', href: '/dashboard/checkout', icon: '💳' },
  { label: 'Brand Brief', href: '/dashboard/brand-brief', icon: '🎯' },
  { label: 'My Uploads', href: '/dashboard/uploads', icon: '⬆️' },
  { label: 'Weekly Uploads', href: '/dashboard/weekly-uploads', icon: '📹' },
  { label: 'Content Bins', href: '/dashboard/content-bins', icon: '✅' },
  { label: 'Team Chat', href: '/dashboard/team-chat', icon: '💬' },
  { label: 'Billing', href: '/dashboard/billing', icon: '🧾' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/signup'); return }
      setUserEmail(user.email ?? '')
    })
    getMyCompany().then(setCompany)
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d0d] border-r border-white/5 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/5">
          <Link href="/">
            <Image src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png" alt="UGCFire" width={100} height={40} unoptimized />
          </Link>
          {company && (
            <div className="mt-3">
              <p className="text-white text-sm font-semibold truncate">{company.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${company.billing_status === 'active_mock' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {company.billing_status === 'active_mock' ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-[#FF3B1A] text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <p className="text-white/30 text-xs truncate mb-2">{userEmail}</p>
          <button onClick={signOut} className="w-full text-left text-white/40 text-xs hover:text-white transition">Sign Out</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-[#0d0d0d] border-b border-white/5 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/60 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-white font-semibold text-sm">UGCFire Dashboard</span>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
