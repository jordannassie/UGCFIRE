'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity, statusColor } from '@/lib/data'
import type { Company, ClientUpload } from '@/lib/types'

const CATEGORIES = [
  'Logo/Brand Asset',
  'Product Photo',
  'Raw Video',
  'Reference Video',
  'Reference Photo',
  'Testimonial',
  'Founder Clip',
  'Ad Example',
  'Other',
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function UploadsPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [uploads, setUploads] = useState<ClientUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0],
    file_url: '',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      const co = await getMyCompany()
      setCompany(co)
      if (co) await fetchUploads(co.id)
      setLoading(false)
    }
    load()
  }, [])

  async function fetchUploads(companyId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('client_uploads')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    setUploads((data ?? []) as ClientUpload[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company || !form.title.trim() || !form.file_url.trim()) return
    setSubmitting(true)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('client_uploads').insert({
        company_id: company.id,
        uploaded_by: user.id,
        file_url: form.file_url.trim(),
        file_name: form.title.trim(),
        upload_category: form.category,
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        status: 'submitted',
      })

      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: 'client_uploaded_asset',
        event_message: `Client uploaded asset: ${form.title}`,
        metadata: { category: form.category },
      })

      setForm({ title: '', category: CATEGORIES[0], file_url: '', notes: '' })
      setSuccess(true)
      await fetchUploads(company.id)
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Uploads</h1>
        <p className="text-white/40 mt-1 text-sm">Share brand assets, references, or raw files with the UGCFire team.</p>
      </div>

      {/* Upload form */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold mb-5">Upload New Asset</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Brand logo PNG"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-2">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">File URL or Google Drive / Dropbox link</label>
            <input
              type="url"
              required
              value={form.file_url}
              onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
              placeholder="https://drive.google.com/... or https://dropbox.com/..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2">Notes <span className="text-white/30">(optional)</span></label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any context for the team..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
            />
          </div>

          {success && (
            <p className="text-green-400 text-sm">✓ Upload submitted successfully!</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Upload'}
          </button>
        </form>
      </div>

      {/* Past uploads */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">Past Uploads</h2>
        {uploads.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
            <p className="text-white/30">No uploads yet. Share your first asset above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map(upload => (
              <div key={upload.id} className="bg-[#111] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{upload.title}</p>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/40 text-xs">{upload.upload_category}</span>
                    </div>
                    {upload.notes && (
                      <p className="text-white/40 text-xs mt-1 truncate">{upload.notes}</p>
                    )}
                    <p className="text-white/30 text-xs mt-1">{formatDate(upload.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(upload.status)}`}>
                      {upload.status}
                    </span>
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-white/10 text-white/50 text-xs px-3 py-1.5 rounded-lg hover:border-[#FF3B1A] hover:text-white transition"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
