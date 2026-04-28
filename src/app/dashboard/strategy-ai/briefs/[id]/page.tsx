'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Save, Check, Send, CheckCircle2, ArrowLeft, Calendar,
  Copy, Target, Mic, Camera, Type, Eye, Layers, Clock,
} from 'lucide-react'

const BRIEFS_KEY    = 'ugcfire_content_briefs'
const CALENDAR_KEY  = 'ugcfire_calendar'

interface ContentBrief {
  id: string
  title: string
  format: string
  platform: string
  hook: string
  goal: string
  angle: string
  script: string
  shotList: string
  caption: string
  visualDirection: string
  status: 'Draft' | 'Sent to Fire Creator' | 'In Production' | 'Done'
  createdAt: string
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  'Draft':                { label: 'Draft',                 color: 'bg-white/8 text-white/50' },
  'Sent to Fire Creator': { label: 'Sent to Fire Creator',  color: 'bg-[#FF3B1A]/15 text-[#FF3B1A]' },
  'In Production':        { label: 'In Production',         color: 'bg-orange-500/15 text-orange-300' },
  'Done':                 { label: 'Done',                  color: 'bg-green-500/15 text-green-300' },
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy} className="text-white/25 hover:text-white transition p-1 rounded">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

export default function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [brief, setBrief] = useState<ContentBrief | null>(null)
  const [saved, setSaved] = useState(false)
  const [calendarAdded, setCalendarAdded] = useState(false)
  const [calendarDate, setCalendarDate] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BRIEFS_KEY)
      if (stored) {
        const all: ContentBrief[] = JSON.parse(stored)
        const found = all.find(b => b.id === id)
        if (found) setBrief(found)
      }
    } catch {}
  }, [id])

  function updateBrief(updates: Partial<ContentBrief>) {
    if (!brief) return
    setBrief(p => p ? { ...p, ...updates } : p)
  }

  function saveBrief() {
    if (!brief) return
    const stored: ContentBrief[] = JSON.parse(localStorage.getItem(BRIEFS_KEY) ?? '[]')
    const updated = stored.map(b => b.id === id ? brief : b)
    localStorage.setItem(BRIEFS_KEY, JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function sendToFireCreator() {
    if (!brief) return
    const next = { ...brief, status: 'Sent to Fire Creator' as const }
    setBrief(next)
    const stored: ContentBrief[] = JSON.parse(localStorage.getItem(BRIEFS_KEY) ?? '[]')
    localStorage.setItem(BRIEFS_KEY, JSON.stringify(stored.map(b => b.id === id ? next : b)))
  }

  function addToCalendar() {
    if (!brief || !calendarDate) return
    const item = {
      id: `cal-${Date.now()}`,
      briefId: brief.id,
      title: brief.title,
      platform: brief.platform,
      date: calendarDate,
      status: brief.status,
    }
    const existing = JSON.parse(localStorage.getItem(CALENDAR_KEY) ?? '[]')
    localStorage.setItem(CALENDAR_KEY, JSON.stringify([...existing, item]))
    setCalendarAdded(true)
    setShowCalendar(false)
  }

  if (!brief) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-white/40 text-sm">Brief not found.</p>
        <button onClick={() => router.push('/dashboard/strategy-ai/briefs')} className="text-[#FF3B1A] text-sm hover:underline">
          Back to Briefs
        </button>
      </div>
    )
  }

  const meta = STATUS_META[brief.status] ?? STATUS_META['Draft']
  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none'
  const labelCls = 'block text-white/50 text-[10px] font-semibold mb-1.5 uppercase tracking-wide'

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <button
          onClick={() => router.push('/dashboard/strategy-ai/briefs')}
          className="text-white/30 hover:text-white transition mt-1"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-white">{brief.title}</h1>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
          </div>
          <div className="flex items-center gap-2 text-white/35 text-xs flex-wrap">
            {brief.format && <span>{brief.format}</span>}
            {brief.platform && <><span>·</span><span>{brief.platform}</span></>}
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {new Date(brief.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={saveBrief}
          className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
        >
          {saved ? <><Check size={13} className="text-green-400" /> Saved</> : <><Save size={13} /> Save</>}
        </button>

        {brief.status === 'Draft' && (
          <button
            onClick={sendToFireCreator}
            className="flex items-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <Send size={13} /> Send to Fire Creator
          </button>
        )}

        {brief.status === 'Sent to Fire Creator' && (
          <span className="flex items-center gap-1.5 text-[#FF3B1A] text-sm font-semibold px-4 py-2.5">
            <CheckCircle2 size={14} /> Sent to Fire Creator
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setShowCalendar(p => !p)}
            className={`flex items-center gap-1.5 border text-sm px-4 py-2.5 rounded-lg transition ${calendarAdded ? 'border-green-500/40 text-green-400' : 'border-white/10 text-white/50 hover:text-white hover:border-white/25'}`}
          >
            {calendarAdded ? <><CheckCircle2 size={13} /> Added to Calendar</> : <><Calendar size={13} /> Add to Calendar</>}
          </button>
          {showCalendar && (
            <div className="absolute left-0 top-full mt-2 bg-[#1a1a1a] border border-white/12 rounded-xl shadow-2xl p-4 z-20 min-w-[240px]">
              <p className="text-white/60 text-xs mb-2 font-semibold">Pick a publish date</p>
              <input
                type="date"
                value={calendarDate}
                onChange={e => setCalendarDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A] mb-3"
              />
              <button
                onClick={addToCalendar}
                disabled={!calendarDate}
                className="w-full bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-40"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brief fields */}
      <div className="space-y-5">

        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Brief Overview</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title</label>
              <input value={brief.title} onChange={e => updateBrief({ title: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Goal</label>
              <input value={brief.goal} onChange={e => updateBrief({ goal: e.target.value })} placeholder="e.g. Conversion, Awareness…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Format</label>
              <input value={brief.format} onChange={e => updateBrief({ format: e.target.value })} placeholder="e.g. UGC Video, Talking Head…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Platform</label>
              <input value={brief.platform} onChange={e => updateBrief({ platform: e.target.value })} placeholder="e.g. TikTok / Reels…" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Mic size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Hook & Script</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Hook</label>
              {brief.hook && <CopyBtn text={brief.hook} />}
            </div>
            <textarea value={brief.hook} onChange={e => updateBrief({ hook: e.target.value })} rows={2} placeholder="Opening line that stops the scroll…" className={inputCls} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Script / Body</label>
              {brief.script && <CopyBtn text={brief.script} />}
            </div>
            <textarea value={brief.script} onChange={e => updateBrief({ script: e.target.value })} rows={6} placeholder="Write the full script or talking points for this piece of content…" className={inputCls} />
          </div>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Camera size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Shot List & Visuals</p>
          </div>

          <div>
            <label className={labelCls}>Shot List</label>
            <textarea value={brief.shotList} onChange={e => updateBrief({ shotList: e.target.value })} rows={4} placeholder="1. Open on product close-up&#10;2. Creator introduces themselves&#10;3. Show use case…" className={inputCls} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Eye size={14} className="text-white/40" />
              <label className={labelCls}>Visual Direction</label>
            </div>
            <textarea value={brief.visualDirection} onChange={e => updateBrief({ visualDirection: e.target.value })} rows={3} placeholder="Lighting, vibe, wardrobe, location notes…" className={inputCls} />
          </div>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Type size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Caption</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Caption</label>
              {brief.caption && <CopyBtn text={brief.caption} />}
            </div>
            <textarea value={brief.caption} onChange={e => updateBrief({ caption: e.target.value })} rows={4} placeholder="Ready-to-post caption with hashtags…" className={inputCls} />
          </div>
        </div>

        {/* Save + status */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveBrief}
            className="flex items-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
          >
            {saved ? <><Check size={14} className="text-green-400" /> Saved</> : <><Save size={14} /> Save Brief</>}
          </button>
          {brief.status === 'Draft' && (
            <button
              onClick={sendToFireCreator}
              className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-5 py-3 rounded-lg transition"
            >
              <Send size={14} /> Send to Fire Creator
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
