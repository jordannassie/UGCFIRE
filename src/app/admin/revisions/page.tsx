'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity, statusColor } from '@/lib/data'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { RevisionStatus } from '@/lib/types'

interface RevisionRow {
  id: string
  revision_note: string
  status: RevisionStatus
  created_at: string
  completed_at: string | null
  content_item_id: string
  company_id: string
  content_title: string
  media_type: string
  company_name: string
  expanded: boolean
}

type FilterStatus = 'all' | RevisionStatus

export default function AdminRevisionsPage() {
  const [revisions, setRevisions] = useState<RevisionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [adminUserId, setAdminUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setAdminUserId(user.id)

    const { data } = await supabase
      .from('content_revisions')
      .select('*, content_items(title, media_type, company_id, companies(name))')
      .order('created_at', { ascending: false })

    const rows = (data ?? []).map((r: {
      id: string
      revision_note: string
      status: RevisionStatus
      created_at: string
      completed_at: string | null
      content_item_id: string
      company_id: string
      content_items?: {
        title?: string
        media_type?: string
        company_id?: string
        companies?: { name?: string } | null
      } | null
    }) => ({
      id: r.id,
      revision_note: r.revision_note,
      status: r.status,
      created_at: r.created_at,
      completed_at: r.completed_at,
      content_item_id: r.content_item_id,
      company_id: r.company_id,
      content_title: r.content_items?.title ?? '—',
      media_type: r.content_items?.media_type ?? '—',
      company_name: r.content_items?.companies?.name ?? '—',
      expanded: false,
    }))
    setRevisions(rows)
    setLoading(false)
  }

  async function markInProgress(id: string, companyId: string) {
    const supabase = createClient()
    await supabase.from('content_revisions').update({ status: 'in_progress' }).eq('id', id)
    setRevisions(prev => prev.map(r => r.id === id ? { ...r, status: 'in_progress' } : r))
    await logActivity({ company_id: companyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'revision_marked_in_progress', event_message: 'Revision marked in progress' })
  }

  async function markResolved(id: string, contentItemId: string, companyId: string) {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('content_revisions').update({ status: 'completed', completed_at: now }).eq('id', id)
    await supabase.from('content_items').update({ status: 'ready_for_review' }).eq('id', contentItemId)
    setRevisions(prev => prev.map(r => r.id === id ? { ...r, status: 'completed', completed_at: now } : r))
    await logActivity({ company_id: companyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'revision_marked_completed', event_message: 'Revision resolved — content ready for review' })
  }

  const filtered = filterStatus === 'all' ? revisions : revisions.filter(r => r.status === filterStatus)

  const openCount = revisions.filter(r => r.status === 'open').length
  const inProgressCount = revisions.filter(r => r.status === 'in_progress').length
  const resolvedCount = revisions.filter(r => r.status === 'completed').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Revisions</h1>
        <div className="flex gap-4 mt-2">
          <span className="text-white/40 text-sm">
            <span className="text-red-300 font-semibold">{openCount}</span> open
          </span>
          <span className="text-white/40 text-sm">
            <span className="text-yellow-300 font-semibold">{inProgressCount}</span> in progress
          </span>
          <span className="text-white/40 text-sm">
            <span className="text-green-300 font-semibold">{resolvedCount}</span> resolved
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in_progress', 'completed'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === s ? 'bg-[#FF3B1A] text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            {s === 'all' ? 'All' : s === 'completed' ? 'Resolved' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {s !== 'all' && (
              <span className="ml-2 text-xs opacity-70">({revisions.filter(r => r.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading revisions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30 text-sm">No revisions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Client</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Content</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Type</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Note</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Status</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Requested</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <>
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 border-b border-white/5 text-white/70 px-6">{r.company_name}</td>
                      <td className="py-3 border-b border-white/5 text-white font-medium px-4 max-w-[160px] truncate">{r.content_title}</td>
                      <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">
                        <span className="bg-white/10 px-2 py-0.5 rounded-full">{r.media_type}</span>
                      </td>
                      <td className="py-3 border-b border-white/5 px-4 max-w-[200px]">
                        <button
                          onClick={() => setRevisions(prev => prev.map(rev => rev.id === r.id ? { ...rev, expanded: !rev.expanded } : rev))}
                          className="text-white/60 text-xs hover:text-white text-left flex items-center gap-1 w-full"
                        >
                          {r.expanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />}
                          <span className="line-clamp-1">{r.revision_note}</span>
                        </button>
                      </td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor(r.status)}`}>
                          {r.status === 'completed' ? 'Resolved' : r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-3 border-b border-white/5 px-6 flex gap-2">
                        {r.status === 'open' && (
                          <button onClick={() => markInProgress(r.id, r.company_id)}
                            className="text-xs border border-white/10 px-2 py-1 rounded text-white/60 hover:text-white hover:border-[#FF3B1A] transition whitespace-nowrap">
                            Mark In Progress
                          </button>
                        )}
                        {r.status !== 'completed' && (
                          <button onClick={() => markResolved(r.id, r.content_item_id, r.company_id)}
                            className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded hover:bg-green-500/30 transition whitespace-nowrap">
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                    {r.expanded && (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={7} className="px-6 py-4 bg-white/[0.03] text-white/70 text-sm border-b border-white/5">
                          <p className="font-medium text-white/40 text-xs mb-2 uppercase tracking-wider">Full Revision Note</p>
                          <p className="leading-relaxed">{r.revision_note}</p>
                          {r.completed_at && (
                            <p className="text-white/30 text-xs mt-2">Resolved on {new Date(r.completed_at).toLocaleString()}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
