'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity, statusColor } from '@/lib/data'
import type { MediaType, ContentStatus } from '@/lib/types'
import { isDemoMode, DEMO_ALL_CONTENT, DEMO_COMPANIES } from '@/lib/demoData'

const DEMO_VIDEO_URL = 'https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/UGC%20Fire/video/alluring_swan_07128_httpss.mj.runVArsopscz9I_slow_motion_pers_c2fb5354-bceb-4ae0-8069-d65e46035d16_1.mp4'

const CONTENT_TYPES = [
  'Talking Head',
  'Product Demo',
  'Lifestyle',
  'Before After',
  'Testimonial',
  'Tutorial',
  'Direct Response',
  'Other',
]

const MEDIA_TYPES: MediaType[] = ['video', 'photo', 'carousel', 'graphic', 'other']
const MEDIA_LABELS: Record<MediaType, string> = {
  video: 'Video',
  photo: 'Photo',
  carousel: 'Carousel',
  graphic: 'Graphic',
  other: 'Other',
}

interface Company { id: string; name: string }
interface RecentUpload {
  id: string
  title: string
  status: ContentStatus
  media_type: MediaType
  content_type: string | null
  uploaded_at: string
  company_name: string
}

export default function AdminUploadsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [form, setForm] = useState({
    company_id: '',
    title: '',
    description: '',
    week_label: '',
    content_type: 'Talking Head',
    media_type: 'video' as MediaType,
    file_url: DEMO_VIDEO_URL,
    thumbnail_url: '',
    status: 'ready_for_review' as ContentStatus,
    can_showcase: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (isDemoMode()) {
      setCompanies(DEMO_COMPANIES.map(c => ({ id: c.id, name: c.name })))
      setRecentUploads(DEMO_ALL_CONTENT.slice(0, 10).map(u => ({
        id: u.id,
        title: u.title,
        status: u.status as ContentStatus,
        media_type: u.media_type as MediaType,
        content_type: (u as { content_type?: string | null }).content_type ?? null,
        uploaded_at: u.uploaded_at,
        company_name: (u as { company_name?: string }).company_name ??
          (DEMO_COMPANIES.find(c => c.id === u.company_id)?.name ?? '—'),
      })))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const [{ data: comps }, { data: uploads }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('content_items')
        .select('id, title, status, media_type, content_type, uploaded_at, company_id, companies(name)')
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false })
        .limit(10),
    ])
    setCompanies((comps ?? []) as Company[])
    const rows = (uploads ?? []).map((u: { companies?: { name?: string } | null } & RecentUpload) => ({
      ...u,
      company_name: (u.companies as { name?: string } | null)?.name ?? '—',
    }))
    setRecentUploads(rows as RecentUpload[])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company_id || !form.title || !form.file_url) return
    setSubmitting(true)

    if (isDemoMode()) {
      const companyName = DEMO_COMPANIES.find(c => c.id === form.company_id)?.name ?? '—'
      const newItem: RecentUpload = {
        id: `demo-upload-${Date.now()}`,
        title: form.title,
        status: form.status,
        media_type: form.media_type,
        content_type: form.content_type || null,
        uploaded_at: new Date().toISOString(),
        company_name: companyName,
      }
      setRecentUploads(prev => [newItem, ...prev].slice(0, 10))
      setSuccessMsg(`"${form.title}" uploaded successfully!`)
      setForm({
        company_id: '',
        title: '',
        description: '',
        week_label: '',
        content_type: 'Talking Head',
        media_type: 'video',
        file_url: DEMO_VIDEO_URL,
        thumbnail_url: '',
        status: 'ready_for_review',
        can_showcase: true,
      })
      setTimeout(() => setSuccessMsg(''), 4000)
      setSubmitting(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('content_items').insert({
      company_id: form.company_id,
      title: form.title,
      description: form.description || null,
      week_label: form.week_label || null,
      content_type: form.content_type || null,
      media_type: form.media_type,
      file_url: form.file_url,
      thumbnail_url: form.thumbnail_url || null,
      status: form.status,
      can_showcase: form.can_showcase,
      uploaded_by: user?.id ?? '',
      uploaded_at: new Date().toISOString(),
    })

    if (!error) {
      await logActivity({
        company_id: form.company_id,
        actor_user_id: user?.id,
        actor_role: 'admin',
        event_type: 'admin_uploaded_video',
        event_message: `Admin uploaded: ${form.title}`,
      })
      setSuccessMsg(`"${form.title}" uploaded successfully!`)
      setForm({
        company_id: '',
        title: '',
        description: '',
        week_label: '',
        content_type: 'Talking Head',
        media_type: 'video',
        file_url: DEMO_VIDEO_URL,
        thumbnail_url: '',
        status: 'ready_for_review',
        can_showcase: true,
      })
      loadData()
      setTimeout(() => setSuccessMsg(''), 4000)
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Content</h1>
        <p className="text-white/40 text-sm mt-1">Upload finished content for a client</p>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-6">New Upload</h2>
        {successMsg && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-300 text-sm px-4 py-3 rounded-lg">{successMsg}</div>
        )}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Client *</label>
            <select
              required
              value={form.company_id}
              onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            >
              <option value="">Select a client...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Founder-style UGC Video"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none" />
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Week Label</label>
            <input type="text" value={form.week_label} onChange={e => setForm(p => ({ ...p, week_label: e.target.value }))}
              placeholder="e.g. Week 1 - May 2026"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none" />
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Content Type</label>
            <select value={form.content_type} onChange={e => setForm(p => ({ ...p, content_type: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
              {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Media Type</label>
            <select value={form.media_type} onChange={e => setForm(p => ({ ...p, media_type: e.target.value as MediaType }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
              {MEDIA_TYPES.map(t => <option key={t} value={t}>{MEDIA_LABELS[t]}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} placeholder="Brief description..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none" />
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">File URL *</label>
            <input required type="text" value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none" />
            <p className="text-white/30 text-xs mt-1">Demo URL pre-filled — replace with actual file URL</p>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Thumbnail URL (optional)</label>
            <input type="text" value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none" />
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider block mb-2">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ContentStatus }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
              <option value="in_production">In Production</option>
              <option value="ready_for_review">Ready for Review</option>
              <option value="approved">Approved</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="can_showcase" checked={form.can_showcase}
              onChange={e => setForm(p => ({ ...p, can_showcase: e.target.checked }))}
              className="w-4 h-4 rounded accent-[#FF3B1A]" />
            <label htmlFor="can_showcase" className="text-white/60 text-sm">Can Showcase</label>
          </div>

          <div className="md:col-span-2 pt-2">
            <button type="submit" disabled={submitting}
              className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50">
              {submitting ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent uploads */}
      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-white font-semibold">Recent Uploads (Last 10)</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
        ) : recentUploads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/30 text-sm">No uploads yet — use the form above to add content</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Title</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Content Type</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Media</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Status</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {recentUploads.map(u => (
                  <tr key={u.id} className="hover:bg-white/2">
                    <td className="py-3 border-b border-white/5 text-white/70 px-6">{u.company_name}</td>
                    <td className="py-3 border-b border-white/5 text-white font-medium px-4 max-w-xs truncate">{u.title}</td>
                    <td className="py-3 border-b border-white/5 text-white/50 px-4 text-xs">{u.content_type ?? '—'}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-full">{u.media_type}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(u.status)}`}>{u.status}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/40 px-6 text-xs">{new Date(u.uploaded_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
