'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { enterDemoMode } from '@/lib/demoData'

export default function SignupPage() {
  const [tab, setTab]           = useState<'signup' | 'login'>('signup')
  const [mode, setMode]         = useState<'form' | 'reset' | 'reset-sent'>('form')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: 'client' } },
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
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setMode('reset-sent')
    setLoading(false)
  }

  async function handleGoogleAuth() {
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  function handleDemoLogin(role: 'admin' | 'client') {
    // No passwords, no Supabase, no service role key required.
    // Sets demo cookies + localStorage then redirects immediately.
    enterDemoMode(role)
    window.location.href = role === 'admin' ? '/admin' : '/dashboard'
  }

  const inputStyle = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A] text-sm'
  const btnPrimary = 'w-full bg-[#FF3B1A] text-white font-bold py-3 rounded-lg text-sm hover:bg-[#e02e10] transition disabled:opacity-50'

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">

      {/* Fire background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ opacity: 0.35 }}
        src="https://yawgvntvhpgittvntihx.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128__--ar_9151_--bs_1_--motion_high_--video_1_9a3a1ff2-5c55-4a2a-bc02-824ad4a0d14d_0.mp4"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.78) 100%)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/images/UGCfirelog.png"
              alt="UGCFire"
              width={140}
              height={56}
              className="mx-auto"
              unoptimized
            />
          </Link>
          <p className="text-white/40 text-sm mt-2">Monthly AI-assisted UGC content</p>
        </div>

        <div className="bg-[#111]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8">

          {/* ── Forgot password view ── */}
          {mode === 'reset' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Reset your password</h2>
                <p className="text-white/40 text-sm mt-1">Enter your email and we'll send a reset link.</p>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  className={inputStyle}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <button
                onClick={() => { setMode('form'); setError('') }}
                className="w-full text-center text-white/40 text-xs hover:text-white transition"
              >
                ← Back to Log In
              </button>
            </div>
          )}

          {/* ── Reset sent confirmation ── */}
          {mode === 'reset-sent' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto">
                <span className="text-green-400 text-2xl">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold">Check your inbox</p>
                <p className="text-white/40 text-sm mt-1">A password reset link was sent to <span className="text-white/70">{email}</span>.</p>
              </div>
              <button
                onClick={() => { setMode('form'); setTab('login'); setError('') }}
                className="text-[#FF3B1A] text-sm hover:underline"
              >
                Back to Log In
              </button>
            </div>
          )}

          {/* ── Main sign-up / log-in form ── */}
          {mode === 'form' && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
                {(['signup', 'login'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError('') }}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                      tab === t ? 'bg-[#FF3B1A] text-white' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {t === 'signup' ? 'Sign Up' : 'Log In'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 bg-white text-[#1f1f1f] text-sm font-semibold py-3 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 mb-4 shadow-sm"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Launching Google…' : tab === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={tab === 'signup' ? handleSignup : handleLogin} className="space-y-4">
                {tab === 'signup' && (
                  <input
                    className={inputStyle}
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                )}
                <input
                  className={inputStyle}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <div className="space-y-1">
                  <input
                    className={inputStyle}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  {tab === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => { setMode('reset'); setError('') }}
                        className="text-white/40 text-xs hover:text-[#FF3B1A] transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? 'Loading…' : tab === 'signup' ? 'Create Account' : 'Log In'}
                </button>
              </form>

              {tab === 'signup' && (
                <p className="text-white/25 text-xs text-center mt-4 leading-relaxed">
                  By creating an account you agree to our{' '}
                  <Link href="/terms" className="text-white/50 hover:text-white underline underline-offset-2">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-white/50 hover:text-white underline underline-offset-2">Privacy Policy</Link>.
                </p>
              )}

              {/* Demo access — no passwords, no seeds, instant redirect */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                <p className="text-center text-white/30 text-xs mb-3">Try the demo</p>
                <button
                  onClick={() => handleDemoLogin('client')}
                  className="w-full border border-white/10 text-white/60 py-2.5 rounded-lg text-sm hover:border-[#FF3B1A] hover:text-white transition"
                >
                  Demo Client Login
                </button>
                <button
                  onClick={() => handleDemoLogin('admin')}
                  className="w-full border border-white/10 text-white/60 py-2.5 rounded-lg text-sm hover:border-[#FF3B1A] hover:text-white transition"
                >
                  Demo Admin Login
                </button>
              </div>
            </>
          )}
        </div>

        {/* Terms & Privacy footer — always visible */}
        <p className="text-center text-white/20 text-xs mt-6">
          <Link href="/terms" className="hover:text-white/50 transition underline underline-offset-2">Terms of Service</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-white/50 transition underline underline-offset-2">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
