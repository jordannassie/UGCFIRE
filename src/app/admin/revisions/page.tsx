'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity, statusColor } from '@/lib/data'
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

  async function markCompleted(id: string, contentItemId: string, companyId: string) {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('content_revisions').update({ status: 'completed', completed_at: now }).eq('id', id)
    await supabase.from('content_items').update({ status: 'ready_for_review' }).eq('id', contentItemId)
    setRevisions(prev => prev.map(r => r.id === id ? { ...r, status: 'completed', completed_at: now } : r))
    await logActivity({ company_id: companyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'revision_marked_completed', event_message: 'Revision completed — content ready for review' })
  }

  const filtered = filterStatus === 'all' ? revisions : revisions.filter(r => r.status === filterStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Revisions</h1>
        <p className="text-white/40 text-sm mt-1">{revisions.filter(r => r.status === 'open').length} open revision requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'open', 'in_progress', 'completed'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === s ? 'bg-[#FF3B1A] text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {s !== 'all' && (
              <span className="ml-2 text-xs opacity-70">({revisions.filter(r => r.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading revisions...</div>
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
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-white/30">No revisions found</td></tr>
                )}
                {filtered.map(r => (
                  <>
                    <tr key={r.id} className="hover:bg-white/2">
                      <td className="py-3 border-b border-white/5 text-white/70 px-6">{r.company_name}</td>
                      <td className="py-3 border-b border-white/5 text-white font-medium px-4 max-w-xs truncate">{r.content_title}</td>
                      <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{r.media_type}</td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <button
                          onClick={() => setRevisions(prev => prev.map(rev => rev.id === r.id ? { ...rev, expanded: !rev.expanded } : rev))}
                          className="text-white/60 text-xs hover:text-white text-left max-w-xs"
                        >
                          <span className="line-clamp-1">{r.revision_note}</span>
                          <span className="text-[#FF3B1A] hover:underline ml-1">{r.expanded ? 'less' : 'more'}</span>
                        </button>
                      </td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-3 border-b border-white/5 px-6 flex gap-2">
                        {r.status === 'open' && (
                          <button onClick={() => markInProgress(r.id, r.company_id)}
                            className="text-xs border border-white/10 px-2 py-1 rounded text-white/60 hover:text-white hover:border-[#FF3B1A] transition whitespace-nowrap">
                            In Progress
                          </button>
                        )}
                        {r.status !== 'completed' && (
                          <button onClick={() => markCompleted(r.id, r.content_item_id, r.company_id)}
                            className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded hover:bg-green-500/30 transition whitespace-nowrap">
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                    {r.expanded && (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={7} className="px-6 py-3 bg-white/5 text-white/70 text-sm border-b border-white/5">
                          <p className="font-medium text-white/40 text-xs mb-1 uppercase tracking-wider">Full Revision Note</p>
                          {r.revision_note}
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
