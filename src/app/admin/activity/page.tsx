'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'
import { isDemoMode, DEMO_ACTIVITY_LOGS, DEMO_COMPANIES } from '@/lib/demoData'

interface ActivityRow {
  id: string
  created_at: string
  company_name: string
  company_id: string | null
  actor_role: string | null
  event_type: string
  event_message: string
}

interface Company { id: string; name: string }

type DateRange = '7d' | '30d' | 'all'

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityRow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const [filterCompany, setFilterCompany] = useState('')
  const [filterEventType, setFilterEventType] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (isDemoMode()) {
      setCompanies(DEMO_COMPANIES.map(c => ({ id: c.id, name: c.name })))
      setLogs(DEMO_ACTIVITY_LOGS.map(a => ({
        id: a.id,
        created_at: a.created_at,
        company_name: a.company_name,
        company_id: a.company_id,
        actor_role: a.actor_role,
        event_type: a.event_type,
        event_message: a.event_message,
      })))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const [{ data: comps }, { data: activity }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('activity_logs')
        .select('id, created_at, actor_role, event_type, event_message, company_id, companies(name)')
        .order('created_at', { ascending: false })
        .limit(500),
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
      company_id: a.company_id,
      actor_role: a.actor_role,
      event_type: a.event_type,
      event_message: a.event_message,
    }))
    setLogs(rows)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const now = new Date()
    return logs.filter(log => {
      if (filterCompany && log.company_id !== filterCompany) return false
      if (filterEventType && !log.event_type.toLowerCase().includes(filterEventType.toLowerCase())) return false
      if (dateRange === '7d') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (new Date(log.created_at) < cutoff) return false
      } else if (dateRange === '30d') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (new Date(log.created_at) < cutoff) return false
      }
      return true
    })
  }, [logs, filterCompany, filterEventType, dateRange])

  const hasFilters = filterCompany || filterEventType || dateRange !== '30d'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-white/40 text-sm mt-1">Platform-wide event stream</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="text"
          placeholder="Filter by event type..."
          value={filterEventType}
          onChange={e => setFilterEventType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none w-48"
        />
        {/* Date range presets */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {([['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['all', 'All time']] as [DateRange, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDateRange(val)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${dateRange === val ? 'bg-[#FF3B1A] text-white' : 'text-white/60 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <button onClick={() => { setFilterCompany(''); setFilterEventType(''); setDateRange('30d') }}
            className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
            Clear
          </button>
        )}
        <span className="text-white/40 text-sm self-center ml-auto">{filtered.length} events</span>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading activity logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No activity found for the selected filters</div>
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
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
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
                    <td className="py-3 border-b border-white/5 text-white/70 px-6 max-w-xs truncate">{log.event_message}</td>
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
