'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone, MessageSquare, Globe, MapPin, Plus, X, Star,
  Search, Download, RefreshCw, Calendar,
  ClipboardList, PhoneCall, FileText, User, Save, Copy, Check,
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
  main_contact: string | null
  contact_title: string | null
  contact_email: string | null
  contact_phone: string | null
  business_notes: string | null
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

async function apiSaveNote(id: string, note: string, outcome?: string, next_follow_up_at?: string) {
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
    'med spas in Dallas TX', 'marketing agencies in Frisco TX',
    'restaurants in Plano TX', 'video production in Fort Worth TX',
    'dentists in Plano TX', 'gyms in Frisco TX',
  ]

  async function handleImport() {
    if (!query.trim()) return
    setImporting(true); setResult(null); setError(null)
    const res = await fetch('/api/admin/leads/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    if (data.success) { setResult(data); onImported() } else setError(data.error ?? 'Unknown error')
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
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleImport()}
            placeholder='e.g. "med spas in Dallas TX"' className={`flex-1 ${ic}`} />
          <button onClick={handleImport} disabled={importing || !query.trim()}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-bold px-5 py-2 rounded-lg transition disabled:opacity-50 whitespace-nowrap">
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
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"><p className="text-red-400 text-sm font-semibold">Import failed</p><p className="text-red-400/70 text-xs mt-1">{error}</p></div>}
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

function PipelineTab({ leads, loading, onRefresh, onOpenInQueue }: {
  leads: Lead[]; loading: boolean; onRefresh: () => void; onOpenInQueue: (l: Lead) => void
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
      <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-lg px-4 py-2.5">
        <PhoneCall size={13} className="text-[#FF3B1A] shrink-0" />
        <p className="text-white/45 text-xs">Click any business to open it in Call Queue — call, add notes, update status, and set follow-up.</p>
      </div>
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business name…" className={`pl-8 ${ic}`} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#FF3B1A] focus:outline-none">
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={onRefresh} className="flex items-center gap-2 border border-white/10 text-white/45 hover:text-white hover:border-white/25 px-4 py-2 rounded-lg text-sm transition">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
        {loading ? <div className="p-10 text-center text-white/30 text-sm">Loading…</div>
          : filtered.length === 0 ? <div className="p-10 text-center text-white/30 text-sm">No leads match your filters.</div>
          : (
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
                    <tr key={lead.id} className="hover:bg-white/3 transition group cursor-pointer" onClick={() => onOpenInQueue(lead)}>
                      <td className="px-4 py-3"><p className="text-white font-medium truncate max-w-[180px]">{lead.business_name}</p></td>
                      <td className="px-4 py-3 text-white/40 text-xs truncate max-w-[120px]">{lead.category ?? '—'}</td>
                      <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{lead.city ?? '—'}</td>
                      <td className="px-4 py-3">
                        {lead.phone
                          ? <a href={`tel:${lead.phone.replace(/\D/g,'')}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-1 text-white/55 hover:text-[#FF3B1A] text-xs whitespace-nowrap transition"><Phone size={11}/> {lead.phone}</a>
                          : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-sm font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span></td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[lead.status] ?? 'bg-white/10 text-white/50'}`}>{lead.status}</span></td>
                      <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{fmtDate(lead.last_contacted_at)}</td>
                      <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                        {lead.next_follow_up_at ? <span className="flex items-center gap-1 text-orange-400"><Calendar size={10}/> {fmtDate(lead.next_follow_up_at)}</span> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e=>e.stopPropagation()}>
                          {lead.phone && <>
                            <a href={`tel:${lead.phone.replace(/\D/g,'')}`} title="Call" className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF3B1A]/20 text-white/40 hover:text-[#FF3B1A] transition"><Phone size={12}/></a>
                            <a href={`sms:${lead.phone.replace(/\D/g,'')}?body=${encodeURIComponent('Hi, this is Jordan with UGC Fire. Are you open to a quick call?')}`} title="Text" className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF3B1A]/20 text-white/40 hover:text-[#FF3B1A] transition"><MessageSquare size={12}/></a>
                          </>}
                          {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" title="Website" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><Globe size={12}/></a>}
                          {lead.google_maps_url && <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer" title="Maps" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition"><MapPin size={12}/></a>}
                          <button onClick={() => onOpenInQueue(lead)} title="Open in Call Queue" className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-[#FF3B1A]/15 hover:bg-[#FF3B1A]/25 text-[#FF3B1A] transition font-semibold whitespace-nowrap"><PhoneCall size={11}/> Call Queue</button>
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

// ── Call Queue Right Panel ─────────────────────────────────────────────────

function CallQueueRightPanel({ selectedLead, scripts, selectedScript, onScriptChange, noteText, setNoteText, outcome, setOutcome, followUp, setFollowUp, onSaveCall, saving, saveMsg }: {
  selectedLead: Lead | null
  scripts: CallScript[]
  selectedScript: CallScript | null
  onScriptChange: (s: CallScript | null) => void
  noteText: string
  setNoteText: (v: string) => void
  outcome: string
  setOutcome: (v: string) => void
  followUp: string
  setFollowUp: (v: string) => void
  onSaveCall: () => void
  saving: boolean
  saveMsg: string | null
}) {
  return (
    <div className="bg-[#111] border border-white/8 rounded-xl flex flex-col overflow-hidden">
      {/* Script selector */}
      <div className="px-4 py-3 border-b border-white/8">
        <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-2">Call Script</p>
        <select value={selectedScript?.id ?? ''}
          onChange={e => onScriptChange(scripts.find(s => s.id === e.target.value) ?? null)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-[#FF3B1A] focus:outline-none">
          {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Script + info scroll area */}
      <div className="flex-1 overflow-y-auto">
        {/* Script text */}
        <div className="px-4 py-3 border-b border-white/6">
          {selectedScript
            ? <pre className="text-white text-sm leading-relaxed font-sans whitespace-pre-wrap break-words">{selectedScript.script}</pre>
            : <p className="text-white/25 text-xs">No script selected.</p>}
        </div>

        {/* Why Creator Content Works */}
        <div className="px-4 py-4 border-b border-white/6 space-y-3">
          <p className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Why Creator Content Works</p>
          {[
            { stat: '2.4x', label: 'more authentic', body: 'Consumers are 2.4x more likely to see creator-style content as authentic compared to brand-created content.' },
            { stat: '84%', label: 'more trust', body: '84% of people are more likely to trust a brand that uses real, creator-style content in its marketing.' },
            { stat: '77%', label: 'more likely to buy', body: '77% of people are more likely to purchase when a brand shares content that feels real and customer-driven.' },
          ].map(s => (
            <div key={s.stat} className="bg-white/3 border border-white/6 rounded-xl p-3">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[#FF3B1A] text-lg font-bold">{s.stat}</span>
                <span className="text-white/55 text-xs font-semibold">{s.label}</span>
              </div>
              <p className="text-white/35 text-[11px] leading-relaxed">{s.body}</p>
            </div>
          ))}
          <p className="text-white/35 text-[11px] leading-relaxed pt-1">
            UGC Fire becomes your content creation team — helping your business show up consistently on social media with creator-style content that builds trust and drives traffic to your product or service.
          </p>
        </div>

        {/* Info sections */}
        <div className="px-4 py-4 space-y-3">
          {[
            {
              label: 'Who We Are',
              body: 'UGC Fire is a monthly content creation team for businesses that need consistent short-form videos, creator-style content, and social media ads without hiring a full-time team.',
            },
            {
              label: 'What We Do',
              body: 'We help plan, create, organize, and deliver social media content every month — including video ideas, hooks, captions, CTAs, creator-style videos, and ad content.',
            },
            {
              label: 'Why It\'s Different',
              body: 'Most businesses know they need content, but they do not have the time, team, or system to create it consistently. UGC Fire gives them a content creation team, a simple strategy process, and an organized Studio where everything can be reviewed, approved, and managed in one place.',
            },
          ].map(s => (
            <div key={s.label} className="space-y-1">
              <p className="text-white/45 text-[10px] uppercase tracking-widest font-bold">{s.label}</p>
              <p className="text-white/35 text-[11px] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call notes — fixed at bottom */}
      <div className="px-4 py-3 border-t border-white/8 space-y-3">
        <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Call Notes</p>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
          placeholder="What happened on this call?"
          className={`resize-none ${ic}`} />
        <select value={outcome} onChange={e => setOutcome(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#FF3B1A] focus:outline-none">
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className={ic} />
        <button onClick={onSaveCall} disabled={saving || !noteText.trim() || !selectedLead}
          className="w-full bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-bold py-2.5 rounded-lg transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Call Notes'}
        </button>
        {saveMsg && <p className={`text-xs text-center ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</p>}
      </div>
    </div>
  )
}

// ── Tab 3: Call Queue ──────────────────────────────────────────────────────

function CallQueueTab({ leads, scripts, onLeadUpdated, preSelectedLead }: {
  leads: Lead[]
  scripts: CallScript[]
  onLeadUpdated: (l: Lead) => void
  preSelectedLead?: Lead | null
}) {
  const [queueFilter, setQueueFilter] = useState('All Leads')
  const [queueSearch, setQueueSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null)

  // When navigating here from Pipeline, load the pre-selected lead
  useEffect(() => {
    if (preSelectedLead) {
      setSelectedLead(preSelectedLead)
      setQueueFilter('All Leads')
    }
  }, [preSelectedLead?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Call notes state
  const [noteText, setNoteText] = useState('')
  const [outcome, setOutcome] = useState('Called')
  const [followUp, setFollowUp] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])

  // Contact fields state
  const [contact, setContact] = useState({ main_contact: '', contact_title: '', contact_email: '', contact_phone: '' })
  const [savingContact, setSavingContact] = useState(false)
  const [contactMsg, setContactMsg] = useState<string | null>(null)

  // Business notes state
  const [bizNotes, setBizNotes] = useState('')
  const [savingBizNotes, setSavingBizNotes] = useState(false)
  const [bizNotesMsg, setBizNotesMsg] = useState<string | null>(null)

  const QUEUE_FILTERS = [
    { label: 'New Leads', filter: (l: Lead) => l.status === 'New' },
    { label: 'Follow Ups Due', filter: (l: Lead) => l.status === 'Follow Up' || (!!l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date()) },
    { label: 'Interested', filter: (l: Lead) => l.status === 'Interested' },
    { label: 'No Answer', filter: (l: Lead) => l.status === 'No Answer' || l.status === 'Left Voicemail' },
    { label: 'All Leads', filter: () => true },
  ]

  const filteredQueue = leads.filter(l => {
    const matchFilter = (QUEUE_FILTERS.find(f => f.label === queueFilter)?.filter ?? (() => true))(l)
    if (!matchFilter) return false
    if (!queueSearch.trim()) return true
    const q = queueSearch.toLowerCase()
    return (
      l.business_name.toLowerCase().includes(q) ||
      (l.city ?? '').toLowerCase().includes(q) ||
      (l.category ?? '').toLowerCase().includes(q) ||
      (l.phone ?? '').replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
      (l.phone ?? '').toLowerCase().includes(q) ||
      (l.website ?? '').toLowerCase().includes(q) ||
      (l.main_contact ?? '').toLowerCase().includes(q) ||
      (l.contact_email ?? '').toLowerCase().includes(q) ||
      (l.contact_phone ?? '').replace(/\D/g,'').includes(q.replace(/\D/g,'')) ||
      (l.business_notes ?? '').toLowerCase().includes(q)
    )
  })

  const defaultScript = scripts.find(s => s.is_default) ?? scripts[0] ?? null

  useEffect(() => {
    if (!selectedScript && defaultScript) setSelectedScript(defaultScript)
  }, [scripts, defaultScript, selectedScript])

  useEffect(() => {
    if (!selectedLead) return
    fetch(`/api/admin/leads/${selectedLead.id}/notes`)
      .then(r => r.json()).then(d => setNotes(d.notes ?? [])).catch(() => {})
    setNoteText('')
    setOutcome('Called')
    setFollowUp('')
    setSaveMsg(null)
    setContactMsg(null)
    setBizNotesMsg(null)
    setContact({
      main_contact: selectedLead.main_contact ?? '',
      contact_title: selectedLead.contact_title ?? '',
      contact_email: selectedLead.contact_email ?? '',
      contact_phone: selectedLead.contact_phone ?? '',
    })
    setBizNotes(selectedLead.business_notes ?? '')
  }, [selectedLead?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCall() {
    if (!selectedLead || !noteText.trim()) return
    setSaving(true); setSaveMsg(null)
    const data = await apiSaveNote(selectedLead.id, noteText, outcome, followUp || undefined)
    if (data.success) {
      if (data.note) setNotes(n => [data.note, ...n])
      if (data.lead) { setSelectedLead(data.lead); onLeadUpdated(data.lead) }
      setNoteText(''); setFollowUp('')
      setSaveMsg('Saved.')
      setTimeout(() => setSaveMsg(null), 3000)
    } else setSaveMsg(`Error: ${data.error}`)
    setSaving(false)
  }

  async function saveContact() {
    if (!selectedLead) return
    setSavingContact(true); setContactMsg(null)
    const data = await apiPatch(selectedLead.id, contact)
    if (data.lead) { setSelectedLead(data.lead); onLeadUpdated(data.lead); setContactMsg('Saved.') }
    else setContactMsg('Error saving contact.')
    setSavingContact(false)
    setTimeout(() => setContactMsg(null), 3000)
  }

  async function saveBizNotes() {
    if (!selectedLead) return
    setSavingBizNotes(true); setBizNotesMsg(null)
    const data = await apiPatch(selectedLead.id, { business_notes: bizNotes })
    if (data.lead) {
      setSelectedLead(data.lead); onLeadUpdated(data.lead)
      // Also log an activity
      await fetch(`/api/admin/leads/${selectedLead.id}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Business notes updated.', activity_type: 'note' }),
      }).catch(() => {})
      setBizNotesMsg('Saved.')
    } else setBizNotesMsg('Error saving notes.')
    setSavingBizNotes(false)
    setTimeout(() => setBizNotesMsg(null), 3000)
  }

  async function quickStatus(s: string) {
    if (!selectedLead) return
    const data = await apiPatch(selectedLead.id, { status: s, last_contacted_at: new Date().toISOString() })
    if (data.lead) { setSelectedLead(data.lead); onLeadUpdated(data.lead) }
  }

  const [copied, setCopied] = useState(false)

  function copyCallback() {
    navigator.clipboard.writeText('9497361560').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">

    {/* Callback number bar */}
    <div className="bg-[#111] border border-[#FF3B1A]/30 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-[0_0_20px_rgba(255,59,26,0.08)]">
      <div className="flex-1 min-w-0">
        <p className="text-[#FF3B1A] text-[10px] uppercase tracking-widest font-bold mb-1">Callback Number</p>
        <p className="text-white font-bold text-3xl tracking-wide">949-736-1560</p>
        <p className="text-white/35 text-xs mt-1">Use this number when leaving a voicemail or asking someone to call back.</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1r9yLOh-Z6nt5dZAgnKaR9iXZ6ea-kOkrJxLqctzq_0C4uLmNgX2FpB6zTQl26FqmN21-zAquz?gv=true"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">
          <Calendar size={13}/> Book Call
        </a>
        <button onClick={copyCallback}
          className={`flex items-center gap-2 border text-xs font-semibold px-4 py-2.5 rounded-lg transition ${copied ? 'border-green-500/40 text-green-400' : 'border-white/12 text-white/50 hover:text-white hover:border-white/25'}`}>
          {copied ? <><Check size={12}/> Copied</> : <><Copy size={12}/> Copy</>}
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_340px] gap-4 min-h-[700px]">

      {/* LEFT — queue list */}
      <div className="bg-[#111] border border-white/8 rounded-xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              placeholder="Search name, city, phone…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-white text-xs focus:border-[#FF3B1A] focus:outline-none placeholder:text-white/25"
            />
          </div>
          {/* Filters */}
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Filter</p>
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
                <p className="text-white text-sm font-semibold truncate">{lead.business_name}</p>
                <p className="text-white/35 text-[11px] mt-0.5 truncate">{lead.city} · {lead.category}</p>
                {lead.main_contact && <p className="text-white/25 text-[10px] mt-0.5 truncate">{lead.main_contact}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[lead.status] ?? 'bg-white/10 text-white/40'}`}>{lead.status}</span>
                  <span className={`text-[10px] font-bold ${scoreColor(lead.lead_score)}`}>{lead.lead_score}</span>
                </div>
              </button>
            ))
          }
        </div>
      </div>

      {/* CENTER — selected lead detail */}
      <div className="bg-[#111] border border-white/8 rounded-xl overflow-y-auto">
        {!selectedLead ? (
          <div className="h-full flex items-center justify-center p-10">
            <div className="text-center">
              <PhoneCall size={28} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Select a lead from the queue to start calling.</p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* 1 — Business name + type + city */}
            <div>
              <h2 className="text-white font-bold text-2xl leading-tight">{selectedLead.business_name}</h2>
              <p className="text-white/40 text-sm mt-0.5">
                {[selectedLead.category, selectedLead.city].filter(Boolean).join(' · ')}
              </p>
            </div>

            {/* 2 — Large phone number */}
            {selectedLead.phone && (
              <div>
                <a href={`tel:${selectedLead.phone.replace(/\D/g,'')}`}
                  className="flex items-center gap-3 group">
                  <Phone size={20} className="text-[#FF3B1A] shrink-0" />
                  <span className="text-2xl font-bold text-white group-hover:text-[#FF3B1A] transition tracking-wide">
                    {selectedLead.phone}
                  </span>
                </a>
              </div>
            )}

            {/* 3 — Call / Text / Website / Maps */}
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

            {/* 4 — Quick status */}
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Mark As</p>
              <div className="flex flex-wrap gap-2">
                {['Called','No Answer','Left Voicemail','Interested','Booked Call','Lost'].map(s => (
                  <button key={s} onClick={() => quickStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${selectedLead.status === s ? 'bg-[#FF3B1A] border-[#FF3B1A] text-white' : 'border-white/12 text-white/45 hover:text-white hover:border-white/25'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 — Contact Info card */}
            <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User size={13} className="text-[#FF3B1A]" />
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Contact Info</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/30 text-[10px] mb-1">Main Contact</label>
                  <input value={contact.main_contact} onChange={e => setContact(c => ({...c, main_contact: e.target.value}))}
                    placeholder="Owner / Manager name" className={ic} />
                </div>
                <div>
                  <label className="block text-white/30 text-[10px] mb-1">Title</label>
                  <input value={contact.contact_title} onChange={e => setContact(c => ({...c, contact_title: e.target.value}))}
                    placeholder="Owner / Marketing Manager" className={ic} />
                </div>
                <div>
                  <label className="block text-white/30 text-[10px] mb-1">Email</label>
                  {contact.contact_email
                    ? <a href={`mailto:${contact.contact_email}`} className="block text-[#FF3B1A] text-xs underline underline-offset-2 mb-1">{contact.contact_email}</a>
                    : null}
                  <input value={contact.contact_email} onChange={e => setContact(c => ({...c, contact_email: e.target.value}))}
                    placeholder="email@business.com" className={ic} />
                </div>
                <div>
                  <label className="block text-white/30 text-[10px] mb-1">Contact Phone</label>
                  {contact.contact_phone
                    ? <a href={`tel:${contact.contact_phone.replace(/\D/g,'')}`} className="flex items-center gap-1 text-[#FF3B1A] text-xs mb-1"><Phone size={10}/> {contact.contact_phone}</a>
                    : null}
                  <input value={contact.contact_phone} onChange={e => setContact(c => ({...c, contact_phone: e.target.value}))}
                    placeholder="(555) 555-5555" className={ic} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveContact} disabled={savingContact}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/12 text-white/70 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                  <Save size={12}/> {savingContact ? 'Saving…' : 'Save Contact'}
                </button>
                {contactMsg && <p className={`text-xs ${contactMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{contactMsg}</p>}
              </div>
            </div>

            {/* 6 — Business details */}
            <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-3">
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Business Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {([
                  ['Status', selectedLead.status],
                  ['Lead Score', String(selectedLead.lead_score)],
                  ['Rating', selectedLead.rating ? `${selectedLead.rating} (${selectedLead.review_count ?? 0} reviews)` : null],
                  ['Last Contact', fmtTime(selectedLead.last_contacted_at)],
                  ['Next Follow-Up', fmtDate(selectedLead.next_follow_up_at)],
                  ['Address', selectedLead.address],
                ] as [string, string | null][]).filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} className="bg-white/3 border border-white/5 rounded-lg px-3 py-2">
                    <p className="text-white/30 text-[10px] mb-0.5">{label}</p>
                    <p className="text-white/70 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 — Business Notes */}
            <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-3">
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Business Notes</p>
              <textarea value={bizNotes} onChange={e => setBizNotes(e.target.value)} rows={4} className={`resize-none ${ic}`}
                placeholder="Add notes about this business, decision maker, content needs, budget, objections, or follow-up details…" />
              <div className="flex items-center gap-3">
                <button onClick={saveBizNotes} disabled={savingBizNotes}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/12 text-white/70 hover:text-white text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                  <Save size={12}/> {savingBizNotes ? 'Saving…' : 'Save Notes'}
                </button>
                {bizNotesMsg && <p className={`text-xs ${bizNotesMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{bizNotesMsg}</p>}
              </div>
            </div>

            {/* Recent call notes */}
            {notes.length > 0 && (
              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Call History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notes.slice(0, 8).map(n => (
                    <div key={n.id} className="bg-white/3 border border-white/5 rounded-lg p-2.5">
                      <p className="text-white/60 text-xs">{n.note}</p>
                      <p className="text-white/25 text-[10px] mt-1">{fmtTime(n.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — script + why it works + call notes */}
      <CallQueueRightPanel
        selectedLead={selectedLead}
        scripts={scripts}
        selectedScript={selectedScript}
        onScriptChange={setSelectedScript}
        noteText={noteText}
        setNoteText={setNoteText}
        outcome={outcome}
        setOutcome={setOutcome}
        followUp={followUp}
        setFollowUp={setFollowUp}
        onSaveCall={saveCall}
        saving={saving}
        saveMsg={saveMsg}
      />

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
    await fetch(`/api/admin/leads/scripts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editData, updated_at: new Date().toISOString() }) })
    setSaving(false); setEditing(null); onUpdate()
  }

  async function addScript() {
    if (!newScript.name.trim() || !newScript.script.trim()) return
    setSaving(true)
    await fetch('/api/admin/leads/scripts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newScript) })
    setNewScript({ name: '', category: '', script: '' }); setAdding(false); setSaving(false); onUpdate()
  }

  async function deleteScript(id: string) {
    if (!confirm('Delete this script?')) return
    await fetch(`/api/admin/leads/scripts/${id}`, { method: 'DELETE' }); onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">{scripts.length} script{scripts.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setAdding(v => !v)} className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition">
          <Plus size={13}/> Add Script
        </button>
      </div>
      {adding && (
        <div className="bg-[#111] border border-[#FF3B1A]/20 rounded-xl p-5 space-y-3">
          <p className="text-white font-semibold text-sm">New Script</p>
          <input value={newScript.name} onChange={e => setNewScript(s => ({...s, name: e.target.value}))} placeholder="Script name" className={ic}/>
          <input value={newScript.category} onChange={e => setNewScript(s => ({...s, category: e.target.value}))} placeholder="Category (optional)" className={ic}/>
          <textarea value={newScript.script} onChange={e => setNewScript(s => ({...s, script: e.target.value}))} rows={8} placeholder="Script text…" className={`resize-none ${ic}`}/>
          <div className="flex gap-2">
            <button onClick={addScript} disabled={saving} className="bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">{saving ? 'Saving…' : 'Save Script'}</button>
            <button onClick={() => setAdding(false)} className="border border-white/12 text-white/45 hover:text-white text-xs px-4 py-2 rounded-lg transition">Cancel</button>
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
                  {script.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF3B1A]/20 text-[#FF3B1A] font-bold">DEFAULT</span>}
                </div>
                {script.category && <p className="text-white/35 text-xs mt-0.5">{script.category}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setEditing(script.id); setEditData({ name: script.name, category: script.category ?? '', script: script.script }) }}
                  className="text-xs border border-white/12 text-white/45 hover:text-white px-3 py-1.5 rounded-lg transition">Edit</button>
                <button onClick={() => deleteScript(script.id)} className="text-xs border border-red-500/20 text-red-500/50 hover:text-red-400 px-3 py-1.5 rounded-lg transition">Delete</button>
              </div>
            </div>
            {editing === script.id ? (
              <div className="px-5 pb-5 space-y-3 border-t border-white/6">
                <div className="pt-3">
                  <input value={String(editData.name ?? '')} onChange={e => setEditData(d => ({...d, name: e.target.value}))} placeholder="Script name" className={ic}/>
                </div>
                <input value={String(editData.category ?? '')} onChange={e => setEditData(d => ({...d, category: e.target.value}))} placeholder="Category" className={ic}/>
                <textarea value={String(editData.script ?? '')} onChange={e => setEditData(d => ({...d, script: e.target.value}))} rows={10} className={`resize-none ${ic}`}/>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(script.id)} disabled={saving} className="bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setEditing(null)} className="border border-white/12 text-white/45 hover:text-white text-xs px-4 py-2 rounded-lg transition">Cancel</button>
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
  lead: Lead; onClose: () => void; onUpdate: (l: Lead) => void
}) {
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [noteText, setNoteText] = useState('')
  const [outcome, setOutcome] = useState(lead.status)
  const [followUp, setFollowUp] = useState(lead.next_follow_up_at?.slice(0, 10) ?? '')
  const [saving, setSaving] = useState(false)
  const [currentLead, setCurrentLead] = useState(lead)
  const [contact, setContact] = useState({
    main_contact: lead.main_contact ?? '',
    contact_title: lead.contact_title ?? '',
    contact_email: lead.contact_email ?? '',
    contact_phone: lead.contact_phone ?? '',
  })
  const [bizNotes, setBizNotes] = useState(lead.business_notes ?? '')
  const [savingContact, setSavingContact] = useState(false)
  const [contactMsg, setContactMsg] = useState<string | null>(null)
  const [savingBizNotes, setSavingBizNotes] = useState(false)
  const [bizNotesMsg, setBizNotesMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/leads/${lead.id}/notes`).then(r => r.json()).then(d => setNotes(d.notes ?? [])).catch(() => {})
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

  async function saveContact() {
    setSavingContact(true); setContactMsg(null)
    const data = await apiPatch(lead.id, contact)
    if (data.lead) { setCurrentLead(data.lead); onUpdate(data.lead); setContactMsg('Saved.') }
    else setContactMsg('Error.')
    setSavingContact(false)
    setTimeout(() => setContactMsg(null), 3000)
  }

  async function saveBizNotes() {
    setSavingBizNotes(true); setBizNotesMsg(null)
    const data = await apiPatch(lead.id, { business_notes: bizNotes })
    if (data.lead) { setCurrentLead(data.lead); onUpdate(data.lead); setBizNotesMsg('Saved.') }
    else setBizNotesMsg('Error.')
    setSavingBizNotes(false)
    setTimeout(() => setBizNotesMsg(null), 3000)
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
            {currentLead.phone && (
              <a href={`tel:${currentLead.phone.replace(/\D/g,'')}`} className="flex items-center gap-1.5 mt-1.5 text-white font-semibold text-sm hover:text-[#FF3B1A] transition">
                <Phone size={12} className="text-[#FF3B1A]"/> {currentLead.phone}
              </a>
            )}
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

          {/* Contact info */}
          <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-3">
            <p className="text-white/45 text-[10px] uppercase tracking-widest font-semibold">Contact Info</p>
            <div className="grid grid-cols-1 gap-2">
              <input value={contact.main_contact} onChange={e => setContact(c => ({...c, main_contact: e.target.value}))} placeholder="Main Contact" className={ic}/>
              <input value={contact.contact_title} onChange={e => setContact(c => ({...c, contact_title: e.target.value}))} placeholder="Title" className={ic}/>
              <input value={contact.contact_email} onChange={e => setContact(c => ({...c, contact_email: e.target.value}))} placeholder="Email" className={ic}/>
              <input value={contact.contact_phone} onChange={e => setContact(c => ({...c, contact_phone: e.target.value}))} placeholder="Contact Phone" className={ic}/>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveContact} disabled={savingContact}
                className="flex items-center gap-1.5 bg-white/6 hover:bg-white/10 border border-white/12 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                <Save size={11}/> {savingContact ? 'Saving…' : 'Save Contact'}
              </button>
              {contactMsg && <p className={`text-xs ${contactMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{contactMsg}</p>}
            </div>
          </div>

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

          {/* Business notes */}
          <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-3">
            <p className="text-white/45 text-[10px] uppercase tracking-widest font-semibold">Business Notes</p>
            <textarea value={bizNotes} onChange={e => setBizNotes(e.target.value)} rows={3}
              placeholder="Add notes about this business…" className={`resize-none ${ic}`}/>
            <div className="flex items-center gap-2">
              <button onClick={saveBizNotes} disabled={savingBizNotes}
                className="flex items-center gap-1.5 bg-white/6 hover:bg-white/10 border border-white/12 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                <Save size={11}/> {savingBizNotes ? 'Saving…' : 'Save Notes'}
              </button>
              {bizNotesMsg && <p className={`text-xs ${bizNotesMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{bizNotesMsg}</p>}
            </div>
          </div>

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
            <label className="block text-white/25 text-[10px] uppercase tracking-widest mb-1.5">Add Call Note</label>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
              placeholder="Add a call note…" className={`resize-none ${ic}`}/>
            <button onClick={save} disabled={saving || !noteText.trim()}
              className="mt-2 w-full bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
          {notes.length > 0 && (
            <div>
              <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2">Call History</p>
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

  function openLeadInQueue(lead: Lead) {
    setSelectedLead(lead)
    setTab('queue')
  }

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

  const total = leads.length
  const newCount = leads.filter(l => l.status === 'New').length
  const followUps = leads.filter(l =>
    l.status === 'Follow Up' || (!!l.next_follow_up_at && new Date(l.next_follow_up_at) <= new Date())
  ).length
  const booked = leads.filter(l => l.status === 'Booked Call').length
  const won = leads.filter(l => l.status === 'Won').length

  return (
    <div className="space-y-5 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase">UGCFIRE LEADS</h1>
        <p className="text-white/35 text-sm mt-1">
          Pull local business leads, track calls, save contacts, take notes, and turn businesses into UGCFire clients.
        </p>
      </div>

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

      <div className="flex gap-1 bg-white/4 border border-white/8 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-[#FF3B1A] text-white shadow' : 'text-white/45 hover:text-white'}`}>
              <Icon size={14}/> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'import' && <ImportTab onImported={loadLeads}/>}
      {tab === 'pipeline' && (
        <PipelineTab
          leads={leads}
          loading={loadingLeads}
          onRefresh={loadLeads}
          onOpenInQueue={openLeadInQueue}
        />
      )}
      {tab === 'queue' && (
        <CallQueueTab
          leads={leads}
          scripts={scripts}
          onLeadUpdated={handleLeadUpdated}
          preSelectedLead={selectedLead}
        />
      )}
      {tab === 'scripts' && <ScriptsTab scripts={scripts} onUpdate={loadScripts}/>}
    </div>
  )
}
