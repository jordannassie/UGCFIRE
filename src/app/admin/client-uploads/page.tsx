'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/data'
import type { UploadStatus } from '@/lib/types'
import { isDemoMode, DEMO_CLIENT_UPLOADS, DEMO_COMPANIES } from '@/lib/demoData'

interface UploadRow {
  id: string
  title: string
  upload_category: string
  file_url: string
  status: UploadStatus
  notes: string | null
  created_at: string
  company_name: string
  company_id: string
}

interface Company { id: string; name: string }

const CATEGORIES = ['Logo/Brand Asset', 'Product Photo', 'Raw Video', 'Reference Video', 'Ad Example', 'Other']
const STATUSES: UploadStatus[] = ['submitted', 'reviewed', 'used', 'archived']

function uploadStatusColor(status: UploadStatus): string {
  const map: Record<UploadStatus, string> = {
    submitted: 'bg-blue-500/20 text-blue-300',
    reviewed: 'bg-yellow-500/20 text-yellow-300',
    used: 'bg-green-500/20 text-green-300',
    archived: 'bg-gray-500/20 text-gray-400',
  }
  return map[status] ?? 'bg-gray-500/20 text-gray-400'
}

export default function AdminClientUploadsPage() {
  const [uploads, setUploads] = useState<UploadRow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [adminUserId, setAdminUserId] = useState('')

  const [filterCompany, setFilterCompany] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (isDemoMode()) {
      setCompanies(DEMO_COMPANIES.map(c => ({ id: c.id, name: c.name })))
      setUploads(DEMO_CLIENT_UPLOADS.map(u => ({
        id: u.id,
        title: u.title,
        upload_category: u.upload_category,
        file_url: u.file_url,
        status: u.status as UploadStatus,
        notes: u.notes,
        created_at: u.created_at,
        company_name: DEMO_COMPANIES.find(c => c.id === u.company_id)?.name ?? '—',
        company_id: u.company_id,
      })))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setAdminUserId(user.id)

    const [{ data: comps }, { data: rows }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('client_uploads')
        .select('id, title, upload_category, file_url, status, notes, created_at, company_id, companies(name)')
        .order('created_at', { ascending: false }),
    ])
    setCompanies((comps ?? []) as Company[])
    const mapped = (rows ?? []).map((u: { companies?: { name?: string } | null } & UploadRow) => ({
      ...u,
      company_name: (u.companies as { name?: string } | null)?.name ?? '—',
    }))
    setUploads(mapped as UploadRow[])
    setLoading(false)
  }

  async function updateStatus(id: string, status: UploadStatus, companyId: string) {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status } : u))
    if (isDemoMode()) return
    const supabase = createClient()
    const update: { status: UploadStatus; reviewed_at?: string; archived_at?: string } = { status }
    if (status === 'reviewed') update.reviewed_at = new Date().toISOString()
    if (status === 'archived') update.archived_at = new Date().toISOString()
    await supabase.from('client_uploads').update(update).eq('id', id)
    await logActivity({
      company_id: companyId,
      actor_user_id: adminUserId,
      actor_role: 'admin',
      event_type: 'client_upload_status_changed',
      event_message: `Client upload marked as ${status}`,
    })
  }

  const filtered = uploads.filter(u => {
    if (filterCompany && u.company_id !== filterCompany) return false
    if (filterCategory && u.upload_category !== filterCategory) return false
    if (filterStatus && u.status !== filterStatus) return false
    return true
  })

  const submittedCount = uploads.filter(u => u.status === 'submitted').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Client Uploads</h1>
        <p className="text-white/40 text-sm mt-1">
          All assets submitted by clients
          {submittedCount > 0 && (
            <span className="ml-2 bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full">{submittedCount} awaiting review</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Clients</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        {(filterCompany || filterCategory || filterStatus) && (
          <button onClick={() => { setFilterCompany(''); setFilterCategory(''); setFilterStatus('') }}
            className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
            Clear
          </button>
        )}
        <span className="text-white/40 text-sm self-center ml-auto">{filtered.length} uploads</span>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading uploads...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30 text-sm">
              {uploads.length === 0 ? 'No client uploads yet' : 'No uploads match the current filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Title</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Category</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">File</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Status</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Notes</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Date</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 border-b border-white/5 text-white/70 px-6">{u.company_name}</td>
                    <td className="py-3 border-b border-white/5 text-white font-medium px-4 max-w-[180px] truncate">{u.title}</td>
                    <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{u.upload_category}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <a href={u.file_url} target="_blank" rel="noreferrer" className="text-[#FF3B1A] hover:underline text-xs">View ↗</a>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${uploadStatusColor(u.status)}`}>
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs max-w-[140px] truncate">{u.notes ?? '—'}</td>
                    <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 border-b border-white/5 px-6">
                      <div className="flex gap-2 flex-wrap">
                        {u.status !== 'reviewed' && (
                          <button onClick={() => updateStatus(u.id, 'reviewed', u.company_id)}
                            className="text-xs border border-white/10 px-2 py-1 rounded text-white/60 hover:text-white hover:border-[#FF3B1A] transition whitespace-nowrap">
                            Mark Reviewed
                          </button>
                        )}
                        {u.status !== 'used' && (
                          <button onClick={() => updateStatus(u.id, 'used', u.company_id)}
                            className="text-xs border border-green-500/30 px-2 py-1 rounded text-green-400 hover:bg-green-500/10 transition whitespace-nowrap">
                            Mark Used
                          </button>
                        )}
                        {u.status !== 'archived' && (
                          <button onClick={() => updateStatus(u.id, 'archived', u.company_id)}
                            className="text-xs text-red-400 hover:text-red-300 transition px-1">
                            Archive
                          </button>
                        )}
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
