'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import { isDemoMode, getDemoRole, exitDemoMode, DEMO_EMAIL_KEY, DEMO_COMPANY } from '@/lib/demoData'
import type { Company } from '@/lib/types'
import {
  Clapperboard, Target, User, Wallet, FileCheck, Menu, LogOut, Camera, Sparkles, Sun, Moon, LayoutGrid,
} from 'lucide-react'

const THEME_KEY = 'ugcfire_dashboard_theme'

export const dynamic = 'force-dynamic'

const NAV = [
  { label: 'Studio',      href: '/dashboard/studio',        icon: Clapperboard },
  { label: 'Strategy AI', href: '/dashboard/strategy-ai',   icon: Sparkles },
  { label: 'Brand Brief', href: '/dashboard/brand-brief',   icon: Target },
  { label: 'Profile',     href: '/dashboard/profile',       icon: User },
  { label: 'Plans',       href: '/dashboard/plans',         icon: LayoutGrid },
  { label: 'Billing',     href: '/dashboard/billing',       icon: Wallet },
  { label: 'Agreement',   href: '/dashboard/agreement',     icon: FileCheck },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  function toggleTheme(t: 'dark' | 'light') {
    setTheme(t)
    localStorage.setItem(THEME_KEY, t)
  }

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  useEffect(() => {
    // Demo mode: skip Supabase entirely
    if (isDemoMode() && getDemoRole() === 'client') {
      setUserEmail(localStorage.getItem(DEMO_EMAIL_KEY) ?? 'demo@ugcfire.com')
      setCompany(DEMO_COMPANY as unknown as Company)
      return
    }

    // Real auth
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/signup'); return }
      setUserEmail(user.email ?? '')
      setUserId(user.id)
      // Load avatar from profile
      supabase.from('profiles').select('avatar_url').eq('id', user.id).single().then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
    })
    getMyCompany().then(setCompany)
  }, [router])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('UGC Fire').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('UGC Fire').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      setAvatarUrl(publicUrl)
    }
    setAvatarUploading(false)
  }

  async function signOut() {
    exitDemoMode()
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isLight = theme === 'light'

  return (
    <div
      data-theme={theme}
      className="min-h-screen flex"
      style={{ backgroundColor: isLight ? '#f1f5f9' : '#080808' }}
    >
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          backgroundColor: isLight ? '#ffffff' : '#0d0d0d',
          borderRight: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="p-5" style={{ borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)' }}>
          {/* Logo row + logout */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/">
              <Image
                src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
                alt="UGCFire"
                width={100}
                height={40}
                unoptimized
              />
            </Link>
            <button
              onClick={signOut}
              title="Sign out"
              className="hover:text-[#FF3B1A] transition p-1 rounded-lg"
              style={{ color: isLight ? 'rgba(15,23,42,0.35)' : 'rgba(255,255,255,0.30)' }}
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden flex items-center justify-center cursor-pointer group-hover:border-[#FF3B1A]/50 transition relative"
                style={!avatarUrl ? { background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' } : {}}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Brand avatar" fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-2xl font-bold text-white drop-shadow">
                    {company?.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-[#FF3B1A] rounded-full flex items-center justify-center cursor-pointer shadow-lg"
              >
                {avatarUploading
                  ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={11} className="text-white" />
                }
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {company && (
              <div className="text-center">
                <p className="text-base font-bold leading-tight truncate max-w-[180px]"
                   style={{ color: isLight ? '#0f172a' : '#ffffff' }}>{company.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  company.billing_status === 'active_mock'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/10 text-white/40'
                }`}>
                  {company.billing_status === 'active_mock' ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? 'bg-[#FF3B1A]/15 font-medium border border-[#FF3B1A]/20'
                    : 'hover:bg-white/5'
                }`}
                style={{
                  color: active
                    ? (isLight ? '#0f172a' : '#ffffff')
                    : (isLight ? 'rgba(15,23,42,0.50)' : 'rgba(255,255,255,0.40)'),
                }}
              >
                <Icon
                  size={16}
                  className={`flex-shrink-0 transition-all duration-150 group-hover:scale-110 ${
                    active ? 'text-[#FF3B1A]' : 'text-white/30 group-hover:text-[#FF3B1A]'
                  }`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle + email */}
        <div
          className="p-4 space-y-3"
          style={{ borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Light / Dark toggle */}
          <div
            className="flex items-center rounded-lg p-0.5 gap-0.5"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              onClick={() => toggleTheme('light')}
              className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: theme === 'light' ? (isLight ? '#ffffff' : 'rgba(255,255,255,0.12)') : 'transparent',
                color: theme === 'light'
                  ? (isLight ? '#0f172a' : '#ffffff')
                  : (isLight ? 'rgba(15,23,42,0.40)' : 'rgba(255,255,255,0.35)'),
                boxShadow: theme === 'light' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <Sun size={11} /> Light
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: theme === 'dark' ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)') : 'transparent',
                color: theme === 'dark'
                  ? (isLight ? '#0f172a' : '#ffffff')
                  : (isLight ? 'rgba(15,23,42,0.40)' : 'rgba(255,255,255,0.35)'),
                boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              <Moon size={11} /> Dark
            </button>
          </div>

          <p className="text-xs truncate" style={{ color: isLight ? 'rgba(15,23,42,0.35)' : 'rgba(255,255,255,0.30)' }}>
            {userEmail}
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header
          className="px-6 py-4 flex items-center gap-4 lg:hidden"
          style={{
            backgroundColor: isLight ? '#ffffff' : '#0d0d0d',
            borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: isLight ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.60)' }}
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            UGCFire Dashboard
          </span>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
