'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone, MessageSquare, Globe, MapPin, Plus, X, ChevronRight,
  Search, Download, RefreshCw, Star, Calendar, CheckCircle,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string
  business_name: string
  category: string | null
  city: string | null
  phone: string | null
  website: string | null
  address: string | null
  google_maps_url: string | null
  rating: number | null
  review_count: number | null
  lead_score: number
  status: string
  last_contacted_at: string | null
  next_follow_up_at: string | null
  created_at: string
}

interface LeadNote {
  id: string
  note: string
  created_at: string
}

interface LeadActivity {
  id: string
  activity_type: string
  description: string | null
  created_at: string
}

const STATUSES = [
  'New', 'Called', 'No Answer', 'Left Voicemail', 'Texted',
  'Interested', 'Follow Up', 'Booked Call', 'Proposal Sent',
  'Won', 'Lost', 'Not a Fit',
]

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-white/10 text-white/60',
  Called: 'bg-blue-500/20 text-blue-300',
  'No Answer': 'bg-white/8 text-white/40',
  'Left Voicemail': 'bg-purple-500/20 text-purple-300',
  Texted: 'bg-indigo-500/20 text-indigo-300',
  Interested: 'bg-yellow-500/20 text-yellow-300',
  'Follow Up': 'bg-orange-500/20 text-orange-300',
  'Booked Call': 'bg-green-500/20 text-green-400',
  'Proposal Sent': 'bg-cyan-500/20 text-cyan-300',
  Won: 'bg-green-500/25 text-green-300 font-bold',
  Lost: 'bg-red-500/15 text-red-400',
  'Not a Fit': 'bg-white/6 text-white/30',
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-green-400'
  if (s >= 60) return 'text-yellow-400'
  if (s >= 40) return 'text-orange-400'
  return 'text-white/40'
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Drawer ───────────────────────────────────────────────────────────────────

function LeadDrawer({
  lead, onClose, onStatusChange,
}: {
  lead: Lead
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [followUp, setFollowUp] = useState(lead.next_follow_up_at?.slice(0, 10) ?? '')
  const [status, setStatus] = useState(lead.status)

  useEffect(() => {
    fetch(`/api/admin/leads/${lead.id}`)
      .then(r => r.json())
      .then(d => {
        setNotes(d.notes ?? [])
        setActivities(d.activities ?? [])
      })
      .catch(() => {})
  }, [lead.id])

  async function saveNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    await fetch(`/api/admin/leads/${lead.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.note) setNotes(n => [d.note, ...n])
        setNoteText('')
      })
      .catch(() => {})
    setSavingNote(false)
  }

  async function updateStatus(s: string) {
    setStatus(s)
    onStatusChange(lead.id, s)
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s, last_contacted_at: new Date().toISOString() }),
    }).catch(() => {})
  }

  async function saveFollowUp(date: string) {
    setFollowUp(date)
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_follow_up_at: date ? new Date(date).toISOString() : null }),
    }).catch(() => {})
  }

  const quickActions = [
    { label: 'Called', status: 'Called' },
    { label: 'No Answer', status: 'No Answer' },
    { label: 'Voicemail', status: 'Left Voicemail' },
    { label: 'Interested', status: 'Interested' },
    { label: 'Booked', status: 'Booked Call' },
    { label: 'Won', status: 'Won' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0d0d0d] border-l border-white/8 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base truncate">{lead.business_name}</h2>
            <p className="text-white/40 text-xs mt-0.5">{lead.category} · {lead.city}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Score + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Lead Score</p>
              <p className={`text-2xl font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</p>
            </div>
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Status</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-white/10 text-white/50'}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map(a => (
                <button
                  key={a.status}
                  onClick={() => updateStatus(a.status)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    status === a.status
                      ? 'bg-[#FF3B1A] border-[#FF3B1A] text-white'
                      : 'border-white/12 text-white/50 hover:text-white hover:border-white/25'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <p className="text-white/25 text-[10px] uppercase tracking-widest">Contact</p>
            {lead.phone && (
              <div className="flex gap-2">
                <a href={`tel:${lead.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 flex-1 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/70 hover:text-white hover:border-white/20 transition">
                  <Phone size={13} className="text-[#FF3B1A]" /> {lead.phone}
                </a>
                <a href={`sms:${lead.phone.replace(/\D/g, '')}?body=${encodeURIComponent('Hi, this is UGCFire. Interested in consistent short-form video content for your business?')}`}
                  className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/70 hover:text-white hover:border-white/20 transition">
                  <MessageSquare size={13} className="text-[#FF3B1A]" />
                </a>
              </div>
            )}
            {lead.website && (
              <a href={lead.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition truncate">
                <Globe size={13} className="text-[#FF3B1A] shrink-0" />
                <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {lead.google_maps_url && (
              <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition">
                <MapPin size={13} className="text-[#FF3B1A]" /> View on Google Maps
              </a>
            )}
          </div>

          {/* Details */}
          {(lead.rating || lead.address) && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3 space-y-1.5 text-sm">
              {lead.rating && (
                <p className="text-white/50 flex items-center gap-1.5">
                  <Star size={11} className="text-yellow-400" /> {lead.rating} ({lead.review_count ?? 0} reviews)
                </p>
              )}
              {lead.address && <p className="text-white/40 text-xs">{lead.address}</p>}
            </div>
          )}

          {/* Status selector */}
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Change Status</p>
            <select
              value={status}
              onChange={e => updateStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Follow-up date */}
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Next Follow-Up</p>
            <input
              type="date"
              value={followUp}
              onChange={e => saveFollowUp(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            />
          </div>

          {/* Add note */}
          <div>
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Add Note</p>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={3}
              placeholder="Add a note about this lead..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none placeholder:text-white/25"
            />
            <button
              onClick={saveNote}
              disabled={savingNote || !noteText.trim()}
              className="mt-2 w-full bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {savingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>

          {/* Notes list */}
          {notes.length > 0 && (
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Notes</p>
              <div className="space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="bg-white/4 border border-white/6 rounded-xl p-3">
                    <p className="text-white/70 text-xs leading-relaxed">{n.note}</p>
                    <p className="text-white/25 text-[10px] mt-1.5">{fmtDate(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          {activities.length > 0 && (
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Activity</p>
              <div className="space-y-1.5">
                {activities.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs text-white/40">
                    <CheckCircle size={11} className="text-[#FF3B1A] mt-0.5 shrink-0" />
                    <span>{a.activity_type}{a.description ? ` — ${a.description}` : ''}</span>
                    <span className="ml-auto shrink-0">{fmtDate(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importQuery, setImportQuery] = useState('')
  const [importResult, setImportResult] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'All') params.set('status', statusFilter)
    if (search) params.set('search', search)
    params.set('limit', '500')

    const res = await fetch(`/api/admin/leads?${params}`).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    setLeads(data.leads ?? [])
    setLoading(false)
  }, [statusFilter, search])

  useEffect(() => { loadLeads() }, [loadLeads])

  async function handleImport() {
    if (!importQuery.trim()) return
    setImporting(true)
    setImportResult(null)
    const res = await fetch('/api/admin/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: importQuery.trim() }),
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    if (data.success) {
      setImportResult(`Found ${data.found} — Imported ${data.imported} new · ${data.duplicatesSkipped} duplicates skipped`)
      await loadLeads()
    } else {
      setImportResult(`Error: ${data.error ?? 'Unknown error'}`)
    }
    setImporting(false)
  }

  function handleStatusChange(id: string, status: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
    if (selectedLead?.id === id) setSelectedLead(l => l ? { ...l, status } : l)
  }

  // Stats
  const total = leads.length
  const newCount = leads.filter(l => l.status === 'New').length
  const followUps = leads.filter(l =>
    l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date()
  ).length
  const booked = leads.filter(l => l.status === 'Booked Call').length
  const won = leads.filter(l => l.status === 'Won').length

  const exampleSearches = [
    'med spas in Dallas TX',
    'marketing agencies in Frisco TX',
    'restaurants in Plano TX',
    'video production in Fort Worth TX',
  ]

  return (
    <div className="space-y-6 min-w-0">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase">UGCFIRE LEADS</h1>
        <p className="text-white/35 text-sm mt-1">
          Pull local business leads, skip duplicates, track calls, add notes, and turn DFW businesses into UGCFire clients.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Leads', value: total },
          { label: 'New Leads', value: newCount, accent: true },
          { label: 'Follow Ups Due', value: followUps, highlight: followUps > 0 },
          { label: 'Booked Calls', value: booked },
          { label: 'Won Clients', value: won },
        ].map(s => (
          <div
            key={s.label}
            className={`bg-[#111] border rounded-xl p-4 ${s.highlight ? 'border-[#FF3B1A]/40' : 'border-white/8'}`}
          >
            <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent || s.highlight ? 'text-[#FF3B1A]' : 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Import */}
      <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-3">
        <p className="text-white font-semibold text-sm">Pull Leads</p>
        <p className="text-white/35 text-xs">Use the Google Places API to find local businesses. Type a search or paste a location query.</p>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            value={importQuery}
            onChange={e => setImportQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            placeholder='e.g. "med spas in Dallas TX" or "marketing agencies in Frisco TX"'
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF3B1A] focus:outline-none placeholder:text-white/25"
          />
          <button
            onClick={handleImport}
            disabled={importing || !importQuery.trim()}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-bold px-5 py-2.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            <Download size={14} /> {importing ? 'Pulling…' : 'Pull Leads'}
          </button>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2">
          {exampleSearches.map(q => (
            <button
              key={q}
              onClick={() => setImportQuery(q)}
              className="text-[11px] px-3 py-1 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {importResult && (
          <p className={`text-xs px-3 py-2 rounded-lg ${importResult.startsWith('Error') ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
            {importResult}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search business name..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none placeholder:text-white/25"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
        >
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={loadLeads}
          className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-white hover:border-white/25 px-4 py-2 rounded-lg text-sm transition"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/30 text-sm">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30 text-sm">No leads yet.</p>
            <p className="text-white/20 text-xs mt-1">Use the import box above to pull your first leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-white/8">
                  {['Business', 'Category', 'City', 'Phone', 'Rating', 'Score', 'Status', 'Follow-Up', ''].map(h => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-widest text-white/25 px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/3 transition group cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[180px]">{lead.business_name}</p>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs truncate max-w-[120px]">{lead.category ?? '—'}</td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{lead.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone.replace(/\D/g, '')}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-white/60 hover:text-[#FF3B1A] transition text-xs whitespace-nowrap"
                        >
                          <Phone size={11} /> {lead.phone}
                        </a>
                      ) : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                      {lead.rating ? (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-400" /> {lead.rating}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[lead.status] ?? 'bg-white/10 text-white/50'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {lead.next_follow_up_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {fmtDate(lead.next_follow_up_at)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                        {lead.phone && (
                          <>
                            <a href={`tel:${lead.phone.replace(/\D/g, '')}`}
                              title="Call"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF3B1A]/20 text-white/40 hover:text-[#FF3B1A] transition">
                              <Phone size={12} />
                            </a>
                            <a href={`sms:${lead.phone.replace(/\D/g, '')}?body=${encodeURIComponent('Hi, this is UGCFire. Interested in consistent short-form video content for your business?')}`}
                              title="Text"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF3B1A]/20 text-white/40 hover:text-[#FF3B1A] transition">
                              <MessageSquare size={12} />
                            </a>
                          </>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer"
                            title="Website"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition">
                            <Globe size={12} />
                          </a>
                        )}
                        {lead.google_maps_url && (
                          <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer"
                            title="Maps"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition">
                            <MapPin size={12} />
                          </a>
                        )}
                        <button
                          title="Open detail"
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition">
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-white/20 text-xs text-right">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>

      {/* Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
