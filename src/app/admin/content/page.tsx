'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'
import { ExternalLink } from 'lucide-react'
import type { ContentStatus, MediaType } from '@/lib/types'

const ALL_STATUSES: ContentStatus[] = ['in_production', 'ready_for_review', 'revision_requested', 'approved', 'delivered', 'archived']
const ALL_MEDIA: MediaType[] = ['video', 'photo', 'carousel', 'graphic', 'other']

const MEDIA_LABELS: Record<MediaType, string> = {
  video: 'Video',
  photo: 'Photo',
  carousel: 'Carousel',
  graphic: 'Graphic',
  other: 'Other',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  in_production: 'In Production',
  ready_for_review: 'Ready for Review',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  delivered: 'Delivered',
  archived: 'Archived',
}

interface ContentRow {
  id: string
  title: string
  media_type: MediaType
  week_label: string | null
  status: ContentStatus
  can_showcase: boolean
  uploaded_at: string
  company_name: string
  company_id: string
  file_url: string | null
}

interface Company { id: string; name: string }

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentRow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const [filterCompany, setFilterCompany] = useState('')
  const [filterMedia, setFilterMedia] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const [{ data: comps }, { data: items }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('content_items')
        .select('id, title, media_type, week_label, status, can_showcase, uploaded_at, company_id, file_url, companies(name)')
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false }),
    ])
    setCompanies((comps ?? []) as Company[])
    const rows = (items ?? []).map((i: { companies?: { name?: string } | null } & ContentRow) => ({
      ...i,
      company_name: (i.companies as { name?: string } | null)?.name ?? '—',
    }))
    setContent(rows as ContentRow[])
    setLoading(false)
  }

  async function updateStatus(id: string, status: ContentStatus) {
    const supabase = createClient()
    await supabase.from('content_items').update({ status }).eq('id', id)
    setContent(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function toggleShowcase(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('content_items').update({ can_showcase: !current }).eq('id', id)
    setContent(prev => prev.map(c => c.id === id ? { ...c, can_showcase: !current } : c))
  }

  async function archiveItem(id: string) {
    const supabase = createClient()
    await supabase.from('content_items').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', id)
    setContent(prev => prev.filter(c => c.id !== id))
  }

  const filtered = content.filter(c => {
    if (filterCompany && c.company_id !== filterCompany) return false
    if (filterMedia && c.media_type !== filterMedia) return false
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Content</h1>
        <p className="text-white/40 text-sm mt-1">{content.length} total items across all clients</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Clients</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterMedia} onChange={e => setFilterMedia(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Media Types</option>
          {ALL_MEDIA.map(m => <option key={m} value={m}>{MEDIA_LABELS[m]}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {(filterCompany || filterMedia || filterStatus) && (
          <button onClick={() => { setFilterCompany(''); setFilterMedia(''); setFilterStatus('') }}
            className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
            Clear Filters
          </button>
        )}
        <span className="text-white/40 text-sm self-center ml-auto">{filtered.length} items</span>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading content...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30 text-sm mb-2">
              {content.length === 0 ? 'No content has been uploaded yet' : 'No items match the current filters'}
            </p>
            {(filterCompany || filterMedia || filterStatus) && (
              <button onClick={() => { setFilterCompany(''); setFilterMedia(''); setFilterStatus('') }}
                className="text-[#FF3B1A] text-xs hover:underline mt-1">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Title</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Type</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Week</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Status</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-center px-4 pt-5">Showcase</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Uploaded</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 border-b border-white/5 text-white/70 px-6 text-sm">{item.company_name}</td>
                    <td className="py-3 border-b border-white/5 text-white font-medium px-4 max-w-xs truncate">{item.title}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">{MEDIA_LABELS[item.media_type] ?? item.media_type}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/50 px-4 text-xs">{item.week_label ?? '—'}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <select
                        value={item.status}
                        onChange={e => updateStatus(item.id, e.target.value as ContentStatus)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#FF3B1A] focus:outline-none"
                      >
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4 text-center">
                      <button
                        onClick={() => toggleShowcase(item.id, item.can_showcase)}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${item.can_showcase ? 'bg-[#FF3B1A]' : 'bg-white/20'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${item.can_showcase ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(item.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-3 border-b border-white/5 px-6">
                      <div className="flex items-center gap-3">
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noreferrer"
                            className="text-[#FF3B1A] hover:text-[#e02e10] transition flex items-center gap-1 text-xs">
                            <ExternalLink size={12} />
                            View
                          </a>
                        )}
                        <button onClick={() => archiveItem(item.id)} className="text-xs text-red-400 hover:text-red-300 transition">Archive</button>
                      </div>
                    </td>
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
