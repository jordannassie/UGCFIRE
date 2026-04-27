'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity, statusColor } from '@/lib/data'
import type { Company, ClientUpload } from '@/lib/types'
import { Upload, CheckCircle, Link as LinkIcon, FileText, Tag, StickyNote, ExternalLink } from 'lucide-react'

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

function uploadStatusColor(status: string): string {
  const map: Record<string, string> = {
    submitted: 'bg-blue-500/20 text-blue-300 border border-blue-500/20',
    reviewed: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20',
    used: 'bg-green-500/20 text-green-300 border border-green-500/20',
    archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/20',
  }
  return map[status] ?? statusColor(status)
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
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/5">
          <Upload className="text-[#FF3B1A]" size={18} />
          <h2 className="text-white font-bold">Upload New Asset</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
                <FileText size={12} className="text-[#FF3B1A]" />
                Title
              </label>
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
              <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
                <Tag size={12} className="text-[#FF3B1A]" />
                Category
              </label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <LinkIcon size={12} className="text-[#FF3B1A]" />
              File URL or Google Drive / Dropbox link
            </label>
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
            <label className="block text-white/60 text-sm mb-2 flex items-center gap-1.5">
              <StickyNote size={12} className="text-[#FF3B1A]" />
              Notes <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any context for the team..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
            />
          </div>

          {success && (
            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
              <CheckCircle size={16} />
              Asset submitted successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-60 flex items-center gap-2"
          >
            <Upload size={16} />
            {submitting ? 'Submitting...' : 'Submit Upload'}
          </button>
        </form>
      </div>

      {/* Past uploads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Uploaded Assets</h2>
          {uploads.length > 0 && (
            <span className="text-white/30 text-sm">{uploads.length} file{uploads.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {uploads.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-xl p-10 text-center">
            <Upload className="text-white/20 mx-auto mb-3" size={32} />
            <p className="text-white/40 font-medium mb-1">No uploads yet</p>
            <p className="text-white/20 text-sm">Share your first asset using the form above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map(upload => (
              <div key={upload.id} className="bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/20 transition">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-semibold text-sm">{upload.title}</p>
                      <span className="bg-white/5 text-white/40 text-xs px-2 py-0.5 rounded-full border border-white/10">
                        {upload.upload_category}
                      </span>
                    </div>
                    {upload.notes && (
                      <p className="text-white/40 text-xs mt-1 line-clamp-1">{upload.notes}</p>
                    )}
                    <p className="text-white/25 text-xs mt-2">{formatDate(upload.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${uploadStatusColor(upload.status)}`}>
                      {upload.status}
                    </span>
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-white/10 text-white/50 text-xs px-3 py-1.5 rounded-lg hover:border-[#FF3B1A] hover:text-white transition flex items-center gap-1.5"
                    >
                      <ExternalLink size={12} />
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
