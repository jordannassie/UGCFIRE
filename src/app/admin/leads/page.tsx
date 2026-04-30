'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone, MessageSquare, Globe, MapPin, Plus, X, Star,
  Search, Download, RefreshCw, Calendar, CheckCircle,
  ClipboardList, PhoneCall, FileText, ChevronRight,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

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

interface CallScript {
  id: string
  name: string
  category: string | null
  script: string
  is_default: boolean
}

const STATUSES = [
  'New', 'Called', 'No Answer', 'Left Voicemail', 'Texted',
  'Interested', 'Follow Up', 'Booked Call', 'Proposal Sent',
  'Won', 'Lost', 'Not a Fit',
]

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-white/10 text-white/60',
  Called: 'bg-blue-500/20 text-blue-300',
  'No Answer': 'bg-white/8 text-white/35',
  'Left Voicemail': 'bg-purple-500/20 text-purple-300',
  Texted: 'bg-indigo-500/20 text-indigo-300',
  Interested: 'bg-yellow-500/20 text-yellow-300',
  'Follow Up': 'bg-orange-500/20 text-orange-300',
  'Booked Call': 'bg-green-500/20 text-green-400',
  'Proposal Sent': 'bg-cyan-500/20 text-cyan-300',
  Won: 'bg-green-500/25 text-green-300',
  Lost: 'bg-red-500/15 text-red-400',
  'Not a Fit': 'bg-white/6 text-white/25',
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

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const ic = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none placeholder:text-white/25'

// ── Shared helpers ─────────────────────────────────────────────────────────

async function apiPatch(id: string, patch: Record<string, unknown>) {
  return fetch(`/api/admin/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).then(r => r.json()).catch(() => ({}))
}

async function apiSaveNote(
  id: string,
  note: string,
  outcome?: string,
  next_follow_up_at?: string
) {
  return fetch(`/api/admin/leads/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, outcome, next_follow_up_at }),
  }).then(r => r.json()).catch(() => ({}))
}

// ── Tab 1: Import ──────────────────────────────────────────────────────────

function ImportTab({ onImported }: { onImported: () => void }) {
  const [query, setQuery] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ found: number; imported: number; duplicatesSkipped: number; errors: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const examples = [
    'med spas in Dallas TX',
    'marketing agencies in Frisco TX',
    'restaurants in Plano TX',
    'video production in Fort Worth TX',
    'dentists in Plano TX',
    'gyms in Frisco TX',
  ]

  async function handleImport() {
    if (!query.trim()) return
    setImporting(true)
    setResult(null)
    setError(null)
    const res = await fetch('/api/admin/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    if (data.success) {
      setResult(data)
      onImported()
    } else {
      setError(data.error ?? 'Unknown error')
    }
    setImporting(false)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-[#111] border border-white/8 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-white font-semibold text-sm mb-1">Search Google Places</p>
          <p className="text-white/35 text-xs">Search by business type and city. Uses the official Google Places API — no scraping.</p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            placeholder='e.g. "med spas in Dallas TX"'
            className={`flex-1 ${ic}`}
          />
          <button
            onClick={handleImport}
            disabled={importing || !query.trim()}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-bold px-5 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap"
          >
            <Download size={14} /> {importing ? 'Pulling…' : 'Pull Leads'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {examples.map(q => (
            <button key={q} onClick={() => setQuery(q)}
              className="text-[11px] px-3 py-1 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition">
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm font-semibold">Import failed</p>
          <p className="text-red-400/70 text-xs mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-5">
          <p className="text-green-400 font-semibold text-sm mb-3">Import complete</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Found', value: result.found },
              { label: 'Imported', value: result.imported, accent: true },
              { label: 'Duplicates Skipped', value: result.duplicatesSkipped },
              { label: 'Errors', value: result.errors, warn: result.errors > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white/4 rounded-lg p-3 text-center">
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.accent ? 'text-green-400' : s.warn ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Pipeline ────────────────────────────────────────────────────────

function PipelineTab({ leads, loading, onRefresh, onSelect }: {
  leads: Lead[]
  loading: boolean
  onRefresh: () => void
  onSelect: (l: Lead) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = leads.filter(l => {
    const matchStatus = statusFilter === 'All' || l.status === statusFilter
    const matchSearch = !search || l.business_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search business name…"
            className={`pl-8 ${ic}`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={onRefresh}
          className="flex items-center gap-2 border border-white/10 text-white/45 hover:text-white hover:border-white/25 px-4 py-2 rounded-lg text-sm transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/30 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/30 text-sm">No leads match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-white/8">
                  {['Business', 'Category', 'City', 'Phone', 'Score', 'Status', 'Last Contact', 'Follow-Up', ''].map(h => (
                    <th key={h} className="text-left text-[10px] uppercase tracking-widest text-white/25 px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-white/3 transition group cursor-pointer" onClick={() => onSelect(lead)}>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium truncate max-w-[180px]">{lead.business_name}</p>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs truncate max-w-[120px]">{lead.category ?? '—'}</td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{lead.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      {lead.phone
                        ? <a href={`tel:${lead.phone.replace(/\D/g,'')}`} onClick={e=>e.stopPropagation()}
                            className="flex items-center gap-1 text-white/55 hover:text-[#FF3B1A] text-xs whitespace-nowrap transition">
                            <Phone size={11}/> {lead.phone}
                          </a>
                        : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[lead.status] ?? 'bg-white/10 text-white/50'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{fmtDate(lead.last_contacted_at)}</td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {lead.next_follow_up_at
                        ? <span className="flex items-center gap-1 text-orange-400"><Calendar size={10}/> {fmtDate(lead.next_follow_up_at)}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e=>e.stopPropagation()}>
                        {lead.phone && <>
                          <a href={`tel:${lead.phone.replace(/\D/g,'')}`} title="Call"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF3B1A]/20 text-white/40 hover:text-[#FF3B1A] transition"><Phone size={12}/></a>
                          <a href={`sms:${lead.phone.replace(/\D/g,'')}?body=${encodeURIComponent('Hi, this is Jordan with UGC Fire. Are you open to a quick call?')}`} title="Text"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF3B1A]/20 text-white/40 hover:text-[#FF3B1A] transition"><MessageSquare size={12}/></a>
                        </>}
                        {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" title="Website"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><Globe size={12}/></a>}
                        {lead.google_maps_url && <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" title="Maps"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><MapPin size={12}/></a>}
                        <button onClick={() => onSelect(lead)} title="Open"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><Plus size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-white/20 text-xs text-right">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ── Tab 3: Call Queue ──────────────────────────────────────────────────────

function CallQueueTab({ leads, scripts, onLeadUpdated }: {
  leads: Lead[]
  scripts: CallScript[]
  onLeadUpdated: (l: Lead) => void
}) {
  const [queueFilter, setQueueFilter] = useState('New')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null)
  const [noteText, setNoteText] = useState('')
  const [outcome, setOutcome] = useState('Called')
  const [followUp, setFollowUp] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])

  const QUEUE_FILTERS = [
    { label: 'New Leads', filter: (l: Lead) => l.status === 'New' },
    { label: 'Follow Ups Due', filter: (l: Lead) => l.status === 'Follow Up' || (!!l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date()) },
    { label: 'Interested', filter: (l: Lead) => l.status === 'Interested' },
    { label: 'No Answer', filter: (l: Lead) => l.status === 'No Answer' || l.status === 'Left Voicemail' },
    { label: 'All Leads', filter: () => true },
  ]

  const filteredQueue = leads.filter(
    QUEUE_FILTERS.find(f => f.label === queueFilter)?.filter ?? (() => true)
  )

  const defaultScript = scripts.find(s => s.is_default) ?? scripts[0] ?? null

  useEffect(() => {
    if (!selectedScript && defaultScript) setSelectedScript(defaultScript)
  }, [scripts, defaultScript, selectedScript])

  useEffect(() => {
    if (!selectedLead) return
    fetch(`/api/admin/leads/${selectedLead.id}/notes`)
      .then(r => r.json())
      .then(d => setNotes(d.notes ?? []))
      .catch(() => {})
    setNoteText('')
    setOutcome('Called')
    setFollowUp('')
    setSaveMsg(null)
  }, [selectedLead?.id])

  async function saveCall() {
    if (!selectedLead || !noteText.trim()) return
    setSaving(true)
    setSaveMsg(null)
    const data = await apiSaveNote(selectedLead.id, noteText, outcome, followUp || undefined)
    if (data.success) {
      if (data.note) setNotes(n => [data.note, ...n])
      if (data.lead) {
        setSelectedLead(data.lead)
        onLeadUpdated(data.lead)
      }
      setNoteText('')
      setFollowUp('')
      setSaveMsg('Saved.')
      setTimeout(() => setSaveMsg(null), 3000)
    } else {
      setSaveMsg(`Error: ${data.error}`)
    }
    setSaving(false)
  }

  async function quickStatus(s: string) {
    if (!selectedLead) return
    const data = await apiPatch(selectedLead.id, { status: s, last_contacted_at: new Date().toISOString() })
    if (data.lead) { setSelectedLead(data.lead); onLeadUpdated(data.lead) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-4 min-h-[600px]">

      {/* LEFT — queue */}
      <div className="bg-[#111] border border-white/8 rounded-xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-2">Queue Filter</p>
          <div className="space-y-0.5">
            {QUEUE_FILTERS.map(f => (
              <button key={f.label} onClick={() => setQueueFilter(f.label)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${queueFilter === f.label ? 'bg-[#FF3B1A]/15 text-white border border-[#FF3B1A]/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                {f.label}
                <span className="ml-1 text-white/25 text-[10px]">
                  ({leads.filter(QUEUE_FILTERS.find(x => x.label === f.label)?.filter ?? (() => true)).length})
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredQueue.length === 0
            ? <p className="p-4 text-white/25 text-xs text-center">No leads in this queue.</p>
            : filteredQueue.map(lead => (
              <button key={lead.id} onClick={() => setSelectedLead(lead)}
                className={`w-full text-left px-4 py-3 transition ${selectedLead?.id === lead.id ? 'bg-[#FF3B1A]/10 border-l-2 border-[#FF3B1A]' : 'hover:bg-white/4'}`}>
                <p className="text-white text-xs font-semibold truncate">{lead.business_name}</p>
                <p className="text-white/35 text-[10px] mt-0.5 truncate">{lead.city} · {lead.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-white/10 text-white/40'}`}>{lead.status}</span>
                  <span className={`text-[10px] font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                </div>
              </button>
            ))
          }
        </div>
      </div>

      {/* CENTER — business detail */}
      <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
        {!selectedLead ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <PhoneCall size={28} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Select a lead from the queue to start calling.</p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-white font-bold text-lg">{selectedLead.business_name}</h2>
              <p className="text-white/40 text-xs mt-0.5">{selectedLead.category} · {selectedLead.city}</p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              {selectedLead.phone && (
                <>
                  <a href={`tel:${selectedLead.phone.replace(/\D/g,'')}`}
                    className="flex items-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
                    <Phone size={13}/> Call
                  </a>
                  <a href={`sms:${selectedLead.phone.replace(/\D/g,'')}?body=${encodeURIComponent('Hi, this is Jordan with UGC Fire. Are you open to a quick call about monthly video content for your business?')}`}
                    className="flex items-center gap-1.5 border border-white/12 text-white/60 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                    <MessageSquare size={13}/> Text
                  </a>
                </>
              )}
              {selectedLead.website && (
                <a href={selectedLead.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-white/12 text-white/60 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                  <Globe size={13}/> Website
                </a>
              )}
              {selectedLead.google_maps_url && (
                <a href={selectedLead.google_maps_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-white/12 text-white/60 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                  <MapPin size={13}/> Maps
                </a>
              )}
            </div>

            {/* Quick status buttons */}
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Mark As</p>
              <div className="flex flex-wrap gap-2">
                {['Called','No Answer','Interested','Booked Call','Lost'].map(s => (
                  <button key={s} onClick={() => quickStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${selectedLead.status === s ? 'bg-[#FF3B1A] border-[#FF3B1A] text-white' : 'border-white/12 text-white/45 hover:text-white hover:border-white/25'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Phone', selectedLead.phone],
                ['Status', selectedLead.status],
                ['Lead Score', String(selectedLead.lead_score)],
                ['Rating', selectedLead.rating ? `${selectedLead.rating} (${selectedLead.review_count ?? 0} reviews)` : null],
                ['Last Contact', fmtTime(selectedLead.last_contacted_at)],
                ['Next Follow-Up', fmtDate(selectedLead.next_follow_up_at)],
                ['Address', selectedLead.address],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} className="bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                  <p className="text-white/30 text-[10px] mb-0.5">{label}</p>
                  <p className="text-white/70 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Recent notes */}
            {notes.length > 0 && (
              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Recent Notes</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notes.slice(0, 5).map(n => (
                    <div key={n.id} className="bg-white/3 border border-white/6 rounded-lg p-2.5">
                      <p className="text-white/60 text-xs">{n.note}</p>
                      <p className="text-white/25 text-[10px] mt-1">{fmtTime(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* RIGHT — script + notes */}
      <div className="bg-[#111] border border-white/8 rounded-xl flex flex-col overflow-hidden">
        {/* Script selector */}
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-2">Call Script</p>
          <select
            value={selectedScript?.id ?? ''}
            onChange={e => setSelectedScript(scripts.find(s => s.id === e.target.value) ?? null)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-[#FF3B1A] focus:outline-none"
          >
            {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Script text */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {selectedScript ? (
            <pre className="text-white/55 text-xs leading-relaxed font-sans whitespace-pre-wrap break-words">
              {selectedScript.script}
            </pre>
          ) : (
            <p className="text-white/25 text-xs">No script selected.</p>
          )}
        </div>

        {/* Call notes */}
        <div className="px-4 py-3 border-t border-white/8 space-y-3">
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Call Notes</p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={3}
            placeholder="What happened on this call?"
            className={`resize-none ${ic}`}
          />
          <select value={outcome} onChange={e => setOutcome(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#FF3B1A] focus:outline-none">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)}
            className={ic} />
          <button onClick={saveCall} disabled={saving || !noteText.trim() || !selectedLead}
            className="w-full bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-bold py-2.5 rounded-lg transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Call Notes'}
          </button>
          {saveMsg && (
            <p className={`text-xs text-center ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>
          )}
        </div>
      </div>

    </div>
  )
}

// ── Tab 4: Scripts ─────────────────────────────────────────────────────────

function ScriptsTab({ scripts, onUpdate }: { scripts: CallScript[]; onUpdate: () => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<CallScript>>({})
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newScript, setNewScript] = useState({ name: '', category: '', script: '' })

  async function saveEdit(id: string) {
    setSaving(true)
    await fetch(`/api/admin/leads/scripts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editData, updated_at: new Date().toISOString() }),
    })
    setSaving(false)
    setEditing(null)
    onUpdate()
  }

  async function addScript() {
    if (!newScript.name.trim() || !newScript.script.trim()) return
    setSaving(true)
    await fetch('/api/admin/leads/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newScript),
    })
    setNewScript({ name: '', category: '', script: '' })
    setAdding(false)
    setSaving(false)
    onUpdate()
  }

  async function deleteScript(id: string) {
    if (!confirm('Delete this script?')) return
    await fetch(`/api/admin/leads/scripts/${id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">{scripts.length} script{scripts.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
          <Plus size={13}/> Add Script
        </button>
      </div>

      {adding && (
        <div className="bg-[#111] border border-[#FF3B1A]/20 rounded-xl p-5 space-y-3">
          <p className="text-white font-semibold text-sm">New Script</p>
          <input value={newScript.name} onChange={e => setNewScript(s => ({...s, name: e.target.value}))}
            placeholder="Script name" className={ic}/>
          <input value={newScript.category} onChange={e => setNewScript(s => ({...s, category: e.target.value}))}
            placeholder="Category (optional)" className={ic}/>
          <textarea value={newScript.script} onChange={e => setNewScript(s => ({...s, script: e.target.value}))}
            rows={8} placeholder="Script text…" className={`resize-none ${ic}`}/>
          <div className="flex gap-2">
            <button onClick={addScript} disabled={saving}
              className="bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Script'}
            </button>
            <button onClick={() => setAdding(false)} className="border border-white/12 text-white/45 hover:text-white text-xs px-4 py-2 rounded-lg transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {scripts.map(script => (
          <div key={script.id} className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold text-sm truncate">{script.name}</p>
                  {script.is_default && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF3B1A]/20 text-[#FF3B1A] font-bold">DEFAULT</span>
                  )}
                </div>
                {script.category && <p className="text-white/35 text-xs mt-0.5">{script.category}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setEditing(script.id); setEditData({ name: script.name, category: script.category ?? '', script: script.script }) }}
                  className="text-xs border border-white/12 text-white/45 hover:text-white px-3 py-1.5 rounded-lg transition">
                  Edit
                </button>
                <button onClick={() => deleteScript(script.id)}
                  className="text-xs border border-red-500/20 text-red-500/50 hover:text-red-400 px-3 py-1.5 rounded-lg transition">
                  Delete
                </button>
              </div>
            </div>

            {editing === script.id ? (
              <div className="px-5 pb-5 space-y-3 border-t border-white/6">
                <div className="pt-3">
                  <input value={String(editData.name ?? '')} onChange={e => setEditData(d => ({...d, name: e.target.value}))}
                    placeholder="Script name" className={ic}/>
                </div>
                <input value={String(editData.category ?? '')} onChange={e => setEditData(d => ({...d, category: e.target.value}))}
                  placeholder="Category" className={ic}/>
                <textarea value={String(editData.script ?? '')} onChange={e => setEditData(d => ({...d, script: e.target.value}))}
                  rows={10} className={`resize-none ${ic}`}/>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(script.id)} disabled={saving}
                    className="bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="border border-white/12 text-white/45 hover:text-white text-xs px-4 py-2 rounded-lg transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-4 border-t border-white/6 pt-3 max-h-32 overflow-hidden relative">
                <pre className="text-white/35 text-xs font-sans whitespace-pre-wrap leading-relaxed line-clamp-4">{script.script}</pre>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#111] to-transparent"/>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Lead Drawer (Pipeline) ─────────────────────────────────────────────────

function LeadDrawer({ lead, onClose, onUpdate }: {
  lead: Lead
  onClose: () => void
  onUpdate: (l: Lead) => void
}) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [noteText, setNoteText] = useState('')
  const [outcome, setOutcome] = useState(lead.status)
  const [followUp, setFollowUp] = useState(lead.next_follow_up_at?.slice(0, 10) ?? '')
  const [saving, setSaving] = useState(false)
  const [currentLead, setCurrentLead] = useState(lead)

  useEffect(() => {
    fetch(`/api/admin/leads/${lead.id}/notes`)
      .then(r => r.json())
      .then(d => setNotes(d.notes ?? []))
      .catch(() => {})
  }, [lead.id])

  async function save() {
    if (!noteText.trim()) return
    setSaving(true)
    const data = await apiSaveNote(lead.id, noteText, outcome, followUp || undefined)
    if (data.success) {
      if (data.note) setNotes(n => [data.note, ...n])
      if (data.lead) { setCurrentLead(data.lead); onUpdate(data.lead) }
      setNoteText('')
    }
    setSaving(false)
  }

  async function quickStatus(s: string) {
    const data = await apiPatch(lead.id, { status: s, last_contacted_at: new Date().toISOString() })
    if (data.lead) { setCurrentLead(data.lead); onUpdate(data.lead) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose}/>
      <div className="w-full max-w-md bg-[#0d0d0d] border-l border-white/8 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base truncate">{currentLead.business_name}</h2>
            <p className="text-white/40 text-xs mt-0.5">{currentLead.category} · {currentLead.city}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition shrink-0 mt-0.5"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Lead Score</p>
              <p className={`text-2xl font-bold ${scoreColor(currentLead.lead_score)}`}>{currentLead.lead_score}</p>
            </div>
            <div className="bg-white/4 border border-white/8 rounded-xl p-3 text-center">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Status</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[currentLead.status] ?? 'bg-white/10 text-white/50'}`}>{currentLead.status}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Called','No Answer','Interested','Booked Call','Won','Lost'].map(s => (
              <button key={s} onClick={() => quickStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${currentLead.status === s ? 'bg-[#FF3B1A] border-[#FF3B1A] text-white' : 'border-white/12 text-white/45 hover:text-white hover:border-white/25'}`}>
                {s}
              </button>
            ))}
          </div>
          {currentLead.phone && (
            <div className="flex gap-2">
              <a href={`tel:${currentLead.phone.replace(/\D/g,'')}`}
                className="flex items-center gap-2 flex-1 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition">
                <Phone size={13} className="text-[#FF3B1A]"/> {currentLead.phone}
              </a>
              <a href={`sms:${currentLead.phone.replace(/\D/g,'')}?body=${encodeURIComponent('Hi, this is Jordan with UGC Fire. Are you open to a quick call?')}`}
                className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition">
                <MessageSquare size={13} className="text-[#FF3B1A]"/>
              </a>
            </div>
          )}
          {currentLead.website && (
            <a href={currentLead.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:border-white/20 transition truncate">
              <Globe size={13} className="text-[#FF3B1A] shrink-0"/>
              <span className="truncate">{currentLead.website.replace(/^https?:\/\//,'')}</span>
            </a>
          )}
          {currentLead.rating && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/50 flex items-center gap-1.5 text-xs">
                <Star size={11} className="text-yellow-400"/> {currentLead.rating} ({currentLead.review_count ?? 0} reviews)
              </p>
              {currentLead.address && <p className="text-white/35 text-xs mt-1">{currentLead.address}</p>}
            </div>
          )}
          <div>
            <label className="block text-white/25 text-[10px] uppercase tracking-widest mb-1.5">Status</label>
            <select value={outcome} onChange={e => setOutcome(e.target.value)} className={ic}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/25 text-[10px] uppercase tracking-widest mb-1.5">Next Follow-Up</label>
            <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className={ic}/>
          </div>
          <div>
            <label className="block text-white/25 text-[10px] uppercase tracking-widest mb-1.5">Add Note</label>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
              placeholder="Add a note…" className={`resize-none ${ic}`}/>
            <button onClick={save} disabled={saving || !noteText.trim()}
              className="mt-2 w-full bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
          {notes.length > 0 && (
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Notes</p>
              <div className="space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="bg-white/4 border border-white/6 rounded-xl p-3">
                    <p className="text-white/60 text-xs leading-relaxed">{n.note}</p>
                    <p className="text-white/25 text-[10px] mt-1.5">{fmtTime(n.created_at)}</p>
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

// ── Main Page ──────────────────────────────────────────────────────────────

type Tab = 'import' | 'pipeline' | 'queue' | 'scripts'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'import',   label: 'Import Leads',  icon: Download },
  { id: 'pipeline', label: 'Lead Pipeline', icon: ClipboardList },
  { id: 'queue',    label: 'Call Queue',    icon: PhoneCall },
  { id: 'scripts',  label: 'Scripts',       icon: FileText },
]

export default function AdminLeadsPage() {
  const [tab, setTab] = useState<Tab>('pipeline')
  const [leads, setLeads] = useState<Lead[]>([])
  const [scripts, setScripts] = useState<CallScript[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true)
    const res = await fetch('/api/admin/leads?limit=500').catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    setLeads(data.leads ?? [])
    setLoadingLeads(false)
  }, [])

  const loadScripts = useCallback(async () => {
    const res = await fetch('/api/admin/leads/scripts').catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    setScripts(data.scripts ?? [])
  }, [])

  useEffect(() => { loadLeads(); loadScripts() }, [loadLeads, loadScripts])

  function handleLeadUpdated(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    if (selectedLead?.id === updated.id) setSelectedLead(updated)
  }

  // Stats
  const total = leads.length
  const newCount = leads.filter(l => l.status === 'New').length
  const followUps = leads.filter(l =>
    l.status === 'Follow Up' || (!!l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date())
  ).length
  const booked = leads.filter(l => l.status === 'Booked Call').length
  const won = leads.filter(l => l.status === 'Won').length

  return (
    <div className="space-y-5 min-w-0">

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
          <div key={s.label} className={`bg-[#111] border rounded-xl p-4 ${s.highlight ? 'border-[#FF3B1A]/40' : 'border-white/8'}`}>
            <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.accent || s.highlight ? 'text-[#FF3B1A]' : 'text-white'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-[#FF3B1A] text-white shadow' : 'text-white/45 hover:text-white'
              }`}>
              <Icon size={14}/> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'import' && <ImportTab onImported={loadLeads}/>}
      {tab === 'pipeline' && (
        <PipelineTab
          leads={leads}
          loading={loadingLeads}
          onRefresh={loadLeads}
          onSelect={setSelectedLead}
        />
      )}
      {tab === 'queue' && (
        <CallQueueTab
          leads={leads}
          scripts={scripts}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
      {tab === 'scripts' && <ScriptsTab scripts={scripts} onUpdate={loadScripts}/>}

      {/* Pipeline drawer */}
      {selectedLead && tab === 'pipeline' && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdated}
        />
      )}

      {/* Pipeline quick-nav icon */}
      {tab === 'pipeline' && !selectedLead && leads.length > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <button onClick={() => setTab('queue')}
            className="flex items-center gap-2 bg-[#FF3B1A] text-white text-xs font-bold px-4 py-3 rounded-full shadow-lg shadow-[#FF3B1A]/30 transition">
            <PhoneCall size={15}/> Call Queue
          </button>
        </div>
      )}

    </div>
  )
}
