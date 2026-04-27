'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'

interface ActivityRow {
  id: string
  created_at: string
  company_name: string
  actor_role: string | null
  event_type: string
  event_message: string
}

interface Company { id: string; name: string }

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityRow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const [filterCompany, setFilterCompany] = useState('')
  const [filterEventType, setFilterEventType] = useState('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const [{ data: comps }, { data: activity }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('activity_logs')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(100),
    ])
    setCompanies((comps ?? []) as Company[])
    const rows = (activity ?? []).map((a: {
      id: string
      created_at: string
      actor_role: string | null
      event_type: string
      event_message: string
      company_id: string | null
      companies?: { name?: string } | null
    }) => ({
      id: a.id,
      created_at: a.created_at,
      company_name: a.companies?.name ?? '—',
      actor_role: a.actor_role,
      event_type: a.event_type,
      event_message: a.event_message,
    }))
    setLogs(rows)
    setLoading(false)
  }

  const filtered = logs.filter(log => {
    if (filterCompany) {
      const company = companies.find(c => c.id === filterCompany)
      if (company && log.company_name !== company.name) return false
    }
    if (filterEventType && !log.event_type.toLowerCase().includes(filterEventType.toLowerCase())) return false
    if (filterDateStart && new Date(log.created_at) < new Date(filterDateStart)) return false
    if (filterDateEnd && new Date(log.created_at) > new Date(filterDateEnd + 'T23:59:59')) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-white/40 text-sm mt-1">Last 100 platform events</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search event type..."
          value={filterEventType}
          onChange={e => setFilterEventType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none w-48"
        />
        <input
          type="date"
          value={filterDateStart}
          onChange={e => setFilterDateStart(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
        />
        <input
          type="date"
          value={filterDateEnd}
          onChange={e => setFilterDateEnd(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
        />
        {(filterCompany || filterEventType || filterDateStart || filterDateEnd) && (
          <button onClick={() => { setFilterCompany(''); setFilterEventType(''); setFilterDateStart(''); setFilterDateEnd('') }}
            className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
            Clear
          </button>
        )}
        <span className="text-white/40 text-sm self-center ml-auto">{filtered.length} events</span>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading activity logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Date/Time</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Actor</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Event Type</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-white/30">No activity found</td></tr>
                )}
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-white/2">
                    <td className="py-3 border-b border-white/5 text-white/40 px-6 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/70 px-4">{log.company_name}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${log.actor_role === 'admin' ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-blue-500/20 text-blue-300'}`}>
                        {log.actor_role ?? 'system'}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(log.event_type)}`}>{log.event_type}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/70 px-6">{log.event_message}</td>
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
