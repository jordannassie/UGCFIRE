'use client'

import { useState, useEffect } from 'react'
import { Flame, Save, Check, UserCircle } from 'lucide-react'

const PROFILE_KEY = 'ugcfire_fc_profile'

interface FCProfile {
  displayName: string
  title: string
  bio: string
  avatarUrl: string
}

const DEFAULTS: FCProfile = {
  displayName: 'UGC Fire Team',
  title: 'Fire Creator',
  bio: 'Your UGC Fire creator helping produce and deliver your monthly content.',
  avatarUrl: '',
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function AdminProfilePage() {
  const [form, setForm] = useState<FCProfile>(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY)
      if (stored) setForm({ ...DEFAULTS, ...JSON.parse(stored) })
    } catch {}
  }, [])

  function setField(key: keyof FCProfile, value: string) {
    setForm(p => ({ ...p, [key]: value }))
  }

  function save() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function reset() {
    setForm(DEFAULTS)
    localStorage.removeItem(PROFILE_KEY)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = getInitials(form.displayName || 'UGC Fire Team')

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Fire Creator Profile</h1>
        <p className="text-white/40 text-sm mt-1">
          This identity is shown when you comment, upload, or take actions inside a client Studio Drive.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-[#111] border border-white/8 rounded-xl p-5">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-4 font-semibold">Preview</p>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt={form.displayName} className="w-14 h-14 rounded-full object-cover border-2 border-[#FF3B1A]/30" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#FF3B1A]/20 border-2 border-[#FF3B1A]/30 flex items-center justify-center">
                <span className="text-[#FF3B1A] text-lg font-bold">{initials}</span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-sm">{form.displayName || 'UGC Fire Team'}</p>
              <span className="text-[10px] bg-[#FF3B1A]/20 text-[#FF3B1A] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Flame size={9} /> {form.title || 'Fire Creator'}
              </span>
            </div>
            {form.bio && <p className="text-white/45 text-xs mt-1.5 leading-relaxed">{form.bio}</p>}
          </div>
        </div>

        {/* Sample comment bubble */}
        <div className="mt-5 pt-4 border-t border-white/6">
          <p className="text-white/30 text-[10px] mb-3">How your comments appear in Studio:</p>
          <div className="flex gap-2">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt={form.displayName} className="w-6 h-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0">
                <span className="text-[#FF3B1A] text-[9px] font-bold">{initials}</span>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-white/60">{form.displayName || 'UGC Fire Team'}</span>
                <span className="text-[8px] bg-[#FF3B1A]/20 text-[#FF3B1A] px-1.5 py-0.5 rounded-full font-bold">{form.title || 'Fire Creator'}</span>
              </div>
              <div className="bg-[#FF3B1A]/10 border border-[#FF3B1A]/15 px-3 py-2 rounded-xl text-xs text-white/90 max-w-[260px]">
                This batch is ready for your review. Let me know if any changes are needed!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-5">
        <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Profile Settings</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">Display Name</label>
            <input
              value={form.displayName}
              onChange={e => setField('displayName', e.target.value)}
              placeholder="UGC Fire Team"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A]"
            />
            <p className="text-white/25 text-[10px] mt-1">Shown next to your comments and actions.</p>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">Title / Role</label>
            <input
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Fire Creator"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A]"
            />
            <p className="text-white/25 text-[10px] mt-1">Shown as a badge next to your name.</p>
          </div>
        </div>

        <div>
          <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">Bio / Signature</label>
          <textarea
            value={form.bio}
            onChange={e => setField('bio', e.target.value)}
            placeholder="Your UGC Fire creator helping produce and deliver your monthly content."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none"
          />
          <p className="text-white/25 text-[10px] mt-1">Optional. Shown on your profile card.</p>
        </div>

        <div>
          <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">Avatar Image URL</label>
          <input
            value={form.avatarUrl}
            onChange={e => setField('avatarUrl', e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A]"
          />
          <p className="text-white/25 text-[10px] mt-1">Paste any image URL. Leave blank to use initials.</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
          >
            {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Profile</>}
          </button>
          <button
            onClick={reset}
            className="text-white/35 hover:text-white text-sm transition"
          >
            Reset to defaults
          </button>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
        <UserCircle size={15} className="text-white/40 mt-0.5 shrink-0" />
        <p className="text-white/45 text-xs leading-relaxed">
          This profile is saved locally in your browser. It applies to all client Studio Drive sessions.
          In a future update, this will sync across devices via your admin account.
        </p>
      </div>
    </div>
  )
}
