'use client'

import { useState, useEffect, useRef } from 'react'
import { Flame, Save, Check, UserCircle, Camera, Trash2, Loader2 } from 'lucide-react'

interface FCProfile {
  id?: string
  display_name: string
  title: string
  bio: string
  avatar_url: string | null
}

const DEFAULTS: FCProfile = {
  display_name: 'UGC Fire Team',
  title: 'Fire Creator',
  bio: 'Your UGC Fire creator helping produce and deliver your monthly content.',
  avatar_url: null,
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const ic = 'w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A]'

export default function AdminProfilePage() {
  const [form, setForm] = useState<FCProfile>(DEFAULTS)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load from API on mount
  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.profile) {
          setProfileId(d.profile.id)
          setForm({
            display_name: d.profile.display_name ?? DEFAULTS.display_name,
            title: d.profile.title ?? DEFAULTS.title,
            bio: d.profile.bio ?? DEFAULTS.bio,
            avatar_url: d.profile.avatar_url ?? null,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function setField(key: keyof Omit<FCProfile, 'id'>, value: string) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch('/api/admin/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: form.display_name,
        title: form.title,
        bio: form.bio,
        avatar_url: form.avatar_url,
      }),
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    if (data.success) {
      setSaveMsg('Saved.')
      if (data.profile?.id) setProfileId(data.profile.id)
    } else {
      setSaveMsg(`Error: ${data.error ?? 'Unknown error'}`)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setUploadError('Invalid file type. Use JPG, PNG, or WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)
    setUploadError(null)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/admin/profile/avatar', { method: 'POST', body: fd }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}

    if (data.success && data.avatar_url) {
      setForm(p => ({ ...p, avatar_url: data.avatar_url }))
    } else {
      setUploadError(data.error ?? 'Upload failed. Please try again.')
    }

    setUploading(false)
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removePhoto() {
    setUploading(true)
    setUploadError(null)
    const res = await fetch('/api/admin/profile/avatar', { method: 'DELETE' }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    if (data.success) {
      setForm(p => ({ ...p, avatar_url: null }))
    } else {
      setUploadError(data.error ?? 'Remove failed.')
    }
    setUploading(false)
  }

  const initials = getInitials(form.display_name || 'UGC Fire Team')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={20} className="animate-spin text-white/30" />
      </div>
    )
  }

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
          <div className="shrink-0">
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatar_url}
                alt={form.display_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#FF3B1A]/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#FF3B1A]/20 border-2 border-[#FF3B1A]/30 flex items-center justify-center">
                <span className="text-[#FF3B1A] text-lg font-bold">{initials}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-sm">{form.display_name || 'UGC Fire Team'}</p>
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
            {form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatar_url}
                alt={form.display_name}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0">
                <span className="text-[#FF3B1A] text-[9px] font-bold">{initials}</span>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-white/60">{form.display_name || 'UGC Fire Team'}</span>
                <span className="text-[8px] bg-[#FF3B1A]/20 text-[#FF3B1A] px-1.5 py-0.5 rounded-full font-bold">
                  {form.title || 'Fire Creator'}
                </span>
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

        {/* Avatar upload */}
        <div>
          <label className="block text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">
            Photo / Avatar
          </label>
          <div className="flex items-center gap-4">
            {/* Avatar circle */}
            <div className="relative shrink-0">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatar_url}
                  alt={form.display_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#FF3B1A]/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FF3B1A]/20 border-2 border-[#FF3B1A]/30 flex items-center justify-center">
                  <span className="text-[#FF3B1A] text-xl font-bold">{initials}</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Upload buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-white/6 hover:bg-white/10 border border-white/12 hover:border-white/20 text-white/70 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  <Camera size={13} />
                  {form.avatar_url ? 'Change Photo' : 'Upload Photo'}
                </button>
                {form.avatar_url && (
                  <button
                    onClick={removePhoto}
                    disabled={uploading}
                    className="flex items-center gap-2 border border-red-500/20 text-red-500/50 hover:text-red-400 hover:border-red-500/35 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Remove Photo
                  </button>
                )}
              </div>
              <p className="text-white/25 text-[10px]">
                JPG, PNG, or WebP. Max 5MB. Saved to UGCFire cloud storage.
              </p>
              {uploadError && (
                <p className="text-red-400 text-[11px]">{uploadError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">Display Name</label>
            <input
              value={form.display_name}
              onChange={e => setField('display_name', e.target.value)}
              placeholder="UGC Fire Team"
              className={ic}
            />
            <p className="text-white/25 text-[10px] mt-1">Shown next to your comments and actions.</p>
          </div>

          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 uppercase tracking-wide">Title / Role</label>
            <input
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Fire Creator"
              className={ic}
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
            className={`${ic} resize-none`}
          />
          <p className="text-white/25 text-[10px] mt-1">Optional. Shown on your profile card.</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
              : saveMsg === 'Saved.'
              ? <><Check size={14} /> Saved</>
              : <><Save size={14} /> Save Profile</>
            }
          </button>
          {saveMsg && saveMsg !== 'Saved.' && (
            <p className="text-red-400 text-xs">{saveMsg}</p>
          )}
        </div>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
        <UserCircle size={15} className="text-white/40 mt-0.5 shrink-0" />
        <p className="text-white/45 text-xs leading-relaxed">
          Profile settings and avatar are saved to the UGCFire cloud database and persist across devices and browser sessions.
          {profileId && <span className="text-white/20 ml-1">ID: {profileId.slice(0, 8)}…</span>}
        </p>
      </div>
    </div>
  )
}
