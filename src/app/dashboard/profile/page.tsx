'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode, DEMO_COMPANY } from '@/lib/demoData'
import { User, Building2, Mail, Globe, Camera, Check } from 'lucide-react'

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF3B1A] text-sm'

export default function ProfilePage() {
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [companyName, setCompanyName]   = useState('')
  const [website, setWebsite]           = useState('')
  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [userId, setUserId]             = useState<string | null>(null)
  const [companyId, setCompanyId]       = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isDemoMode()) {
      setFullName('Demo User')
      setEmail('demo@ugcfire.com')
      setCompanyName(DEMO_COMPANY.name)
      setWebsite('https://demobrand.com')
      return
    }
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setFullName(profile.full_name ?? '')
        setAvatarUrl(profile.avatar_url ?? null)
      }

      const { data: co } = await supabase.from('companies').select('*').eq('owner_user_id', user.id).single()
      if (co) {
        setCompanyId(co.id)
        setCompanyName(co.name ?? '')
        setWebsite(co.website ?? '')
      }
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('UGC Fire').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('UGC Fire').getPublicUrl(path)
      const url = urlData.publicUrl
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
      setAvatarUrl(url)
    }
    setAvatarUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (isDemoMode()) { setSaved(true); setTimeout(() => setSaved(false), 2000); return }
    setSaving(true)
    const supabase = createClient()
    if (userId) await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId)
    if (companyId) await supabase.from('companies').update({ name: companyName, website }).eq('id', companyId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account and brand details.</p>
      </div>

      {/* Avatar */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex items-center gap-5">
        <div className="relative">
          <div
            onClick={() => avatarRef.current?.click()}
            className="w-20 h-20 rounded-full border-2 border-white/10 overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#FF3B1A]/50 transition relative"
            style={!avatarUrl ? { background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' } : {}}
          >
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : <User size={32} className="text-white drop-shadow" />
            }
          </div>
          <div
            onClick={() => avatarRef.current?.click()}
            className="absolute bottom-0 right-0 w-6 h-6 bg-[#FF3B1A] rounded-full flex items-center justify-center cursor-pointer shadow"
          >
            {avatarUploading
              ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={11} className="text-white" />}
          </div>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="text-white font-semibold">{fullName || 'Your Name'}</p>
          <p className="text-white/40 text-sm">{email}</p>
          <button onClick={() => avatarRef.current?.click()} className="text-[#FF3B1A] text-xs mt-1 hover:underline">
            Change photo
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
        <p className="text-white font-semibold text-sm">Account Details</p>

        <div>
          <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5"><User size={11} /> Full Name</label>
          <input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
        </div>

        <div>
          <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5"><Mail size={11} /> Email</label>
          <input className={inputCls + ' opacity-50 cursor-not-allowed'} value={email} readOnly />
          <p className="text-white/25 text-xs mt-1">Email cannot be changed here.</p>
        </div>

        <div className="border-t border-white/8 pt-5">
          <p className="text-white font-semibold text-sm mb-4">Brand Details</p>

          <div className="space-y-4">
            <div>
              <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5"><Building2 size={11} /> Brand Name</label>
              <input className={inputCls} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your brand or company name" />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5"><Globe size={11} /> Website</label>
              <input className={inputCls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourbrand.com" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full font-bold py-3 rounded-lg text-sm transition flex items-center justify-center gap-2 ${
            saved ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-[#FF3B1A] text-white hover:bg-[#e02e10] disabled:opacity-50'
          }`}
        >
          {saved ? <><Check size={15} /> Saved</> : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
