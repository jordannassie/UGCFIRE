'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: 'client' } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('companies').insert({
        name: name + "'s Brand",
        owner_user_id: data.user.id,
        onboarding_status: 'needs_plan',
      })
      await supabase.from('activity_logs').insert({
        company_id: null,
        actor_user_id: data.user.id,
        actor_role: 'client',
        event_type: 'user_signed_up',
        event_message: `${name} signed up.`,
      })
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard')
    setLoading(false)
  }

  async function handleDemoLogin(role: 'admin' | 'client') {
    setLoading(true); setError('')
    const supabase = createClient()
    const demoEmail = role === 'admin' ? 'admin@ugcfire.com' : 'demo@ugcfire.com'
    const { error: err } = await supabase.auth.signInWithPassword({ email: demoEmail, password: 'UGCfire2026!' })
    if (err) { setError('Demo login failed. Run demo seeding from /admin/demo first.'); setLoading(false); return }
    router.push(role === 'admin' ? '/admin' : '/dashboard')
    setLoading(false)
  }

  const inputStyle = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A] text-sm'
  const btnPrimary = 'w-full bg-[#FF3B1A] text-white font-bold py-3 rounded-lg text-sm hover:bg-[#e02e10] transition disabled:opacity-50'

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png" alt="UGCFire" width={140} height={56} className="mx-auto" unoptimized />
          </Link>
          <p className="text-white/40 text-sm mt-2">Monthly AI-assisted UGC content</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
          <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
            {(['signup', 'login'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-[#FF3B1A] text-white' : 'text-white/50 hover:text-white'}`}>
                {t === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={tab === 'signup' ? handleSignup : handleLogin} className="space-y-4">
            {tab === 'signup' && (
              <input className={inputStyle} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            )}
            <input className={inputStyle} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? 'Loading…' : tab === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
            <p className="text-center text-white/30 text-xs mb-3">Demo Access</p>
            <button onClick={() => handleDemoLogin('client')} disabled={loading} className="w-full border border-white/10 text-white/60 py-2 rounded-lg text-sm hover:border-[#FF3B1A] hover:text-white transition">
              Demo Client Login
            </button>
            <button onClick={() => handleDemoLogin('admin')} disabled={loading} className="w-full border border-white/10 text-white/60 py-2 rounded-lg text-sm hover:border-[#FF3B1A] hover:text-white transition">
              Demo Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
