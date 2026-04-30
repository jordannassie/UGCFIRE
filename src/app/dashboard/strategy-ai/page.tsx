'use client'

import { useState, useEffect, useRef, useCallback, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import { isDemoMode, DEMO_BRAND_BRIEF } from '@/lib/demoData'
import { calcBrandContext } from '@/lib/brandCompletion'
import {
  Sparkles, Brain, Send, Copy, Check, X,
  ChevronDown, ChevronUp, User, RotateCcw, RefreshCw,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface Idea {
  title: string
  description: string
  hook: string
  cta: string
  videoLength: string
  productionType: string
  difficulty: string
  ugcPrompt: string
  shotList: string[]
  voiceoverDirection: string
  editingStyle: string
}

interface IdeasOutput { ideas: Idea[] }
interface ChatMsg { id: string; role: 'user' | 'assistant'; text: string }

// ── Normalizer ─────────────────────────────────────────────────────────────

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : []
}

function normalizeIdea(raw: unknown): Idea {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    title: str(d.title, 'Untitled Idea'),
    description: str(d.description || d.sceneDescription || d.goal),
    hook: str(d.hook || d.openingMoment),
    cta: str(d.cta || d.ctaDirection),
    videoLength: str(d.videoLength, ''),
    productionType: str(d.productionType, 'Mixed'),
    difficulty: str(d.difficulty, 'Easy'),
    ugcPrompt: str(d.ugcPrompt || d.aiVideoPrompt),
    shotList: arr(d.shotList),
    voiceoverDirection: str(d.voiceoverDirection || d.voiceoverSpokenDirection),
    editingStyle: str(d.editingStyle),
  }
}

function normalizeOutput(raw: unknown): IdeasOutput {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const rawIdeas = Array.isArray(r.ideas) ? r.ideas
    : Array.isArray(r.commercialIdeas) ? r.commercialIdeas
    : []
  return { ideas: rawIdeas.map(normalizeIdea) }
}

// ── Error boundary ─────────────────────────────────────────────────────────

class OutputErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean; msg: string }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { crashed: false, msg: '' } }
  static getDerivedStateFromError(err: Error) { return { crashed: true, msg: err?.message ?? '' } }
  componentDidCatch(err: Error, info: ErrorInfo) { console.error('[StrategyAI] render error:', err, info) }
  render() {
    if (this.state.crashed) return (
      <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-6 text-center space-y-2">
        <p className="text-red-400 font-semibold text-sm">Output could not render. Please regenerate.</p>
        {process.env.NODE_ENV === 'development' && <p className="text-white/20 text-[10px] font-mono">{this.state.msg}</p>}
      </div>
    )
    return this.props.children
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ugcfire_ideas_v4'
const IDEA_COUNTS = [3, 8, 20, 40] as const
const VIDEO_LENGTHS = ['5 sec', '15 sec', '30 sec', '60 sec'] as const
type VideoLength = typeof VIDEO_LENGTHS[number]

const CHAT_CHIPS = [
  'Give me more ideas', 'Make ideas more premium', 'Make ideas more fun',
  'More direct response ideas', 'More lifestyle ideas', 'More product demo ideas',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${done ? 'border-green-500/30 text-green-400 bg-green-500/8' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
    >
      {done ? <><Check size={11} /> Copied</> : <><Copy size={11} /> {label}</>}
    </button>
  )
}

function DiffBadge({ d }: { d: string }) {
  const s = d === 'Easy' ? 'bg-green-500/12 text-green-400' : d === 'Medium' ? 'bg-yellow-500/12 text-yellow-400' : 'bg-red-500/12 text-red-400'
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s}`}>{d || 'Easy'}</span>
}

function buildCopyText(idea: Idea): string {
  return [
    `Title:\n${idea.title}`,
    idea.videoLength ? `\nVideo Length:\n${idea.videoLength}` : '',
    idea.hook ? `\nHook:\n${idea.hook}` : '',
    idea.ugcPrompt ? `\nUGC Video Prompt:\n${idea.ugcPrompt}` : '',
    idea.shotList?.length ? `\nShot List:\n${idea.shotList.map(s => `- ${s}`).join('\n')}` : '',
    idea.voiceoverDirection ? `\nVoiceover Direction:\n${idea.voiceoverDirection}` : '',
    idea.cta ? `\nCTA:\n${idea.cta}` : '',
    idea.editingStyle ? `\nEditing Style:\n${idea.editingStyle}` : '',
  ].filter(Boolean).join('')
}

// ── Idea Card ──────────────────────────────────────────────────────────────

function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">

      {/* Collapsed preview */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left hover:bg-white/[0.02] transition"
      >
        <div className="flex items-start gap-3 px-4 py-4">
          <span className="w-6 h-6 rounded-full bg-[#FF3B1A]/10 text-[#FF3B1A] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-white font-semibold text-sm leading-snug">{idea.title}</p>
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <DiffBadge d={idea.difficulty} />
                {open ? <ChevronUp size={12} className="text-white/25" /> : <ChevronDown size={12} className="text-white/25" />}
              </div>
            </div>

            {idea.description && (
              <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">{idea.description}</p>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
              {idea.hook && (
                <p className="text-white/30 text-[11px]">
                  <span className="text-white/18 uppercase tracking-widest text-[9px] font-semibold mr-1">Hook</span>
                  <span className="text-white/50 italic">{idea.hook.length > 70 ? idea.hook.slice(0, 70) + '…' : idea.hook}</span>
                </p>
              )}
              {idea.cta && (
                <p className="text-white/30 text-[11px]">
                  <span className="text-white/18 uppercase tracking-widest text-[9px] font-semibold mr-1">CTA</span>
                  <span className="text-white/50">{idea.cta.length > 60 ? idea.cta.slice(0, 60) + '…' : idea.cta}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {idea.videoLength && (
                <span className="text-[9px] bg-white/5 text-white/35 px-2 py-0.5 rounded-full">{idea.videoLength}</span>
              )}
              {idea.productionType && (
                <span className="text-[9px] bg-white/5 text-white/30 px-2 py-0.5 rounded-full">{idea.productionType}</span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/6 px-4 py-5 space-y-4">

          {/* Hook */}
          {idea.hook && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Hook</p>
              <p className="text-white/70 text-sm leading-relaxed italic">&ldquo;{idea.hook}&rdquo;</p>
            </div>
          )}

          {/* UGC Video Prompt */}
          {idea.ugcPrompt && (
            <div className="bg-[#FF3B1A]/5 border border-[#FF3B1A]/20 rounded-xl p-4 space-y-3">
              <p className="text-[#FF3B1A] text-[10px] font-semibold uppercase tracking-widest">UGC Video Prompt</p>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{idea.ugcPrompt}</p>
            </div>
          )}

          {/* Shot List */}
          {idea.shotList?.length > 0 && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest">Shot List</p>
              <ul className="space-y-1.5">
                {idea.shotList.map((shot, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FF3B1A]/40 shrink-0" />
                    {shot}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Voiceover + Editing */}
          <div className="grid sm:grid-cols-2 gap-3">
            {idea.voiceoverDirection && (
              <div className="bg-white/3 border border-white/6 rounded-xl p-3">
                <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Voiceover Direction</p>
                <p className="text-white/60 text-xs leading-relaxed">{idea.voiceoverDirection}</p>
              </div>
            )}
            {idea.editingStyle && (
              <div className="bg-white/3 border border-white/6 rounded-xl p-3">
                <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Editing Style</p>
                <p className="text-white/60 text-xs leading-relaxed">{idea.editingStyle}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          {idea.cta && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest mb-1.5">CTA</p>
              <p className="text-white/60 text-xs leading-relaxed">{idea.cta}</p>
            </div>
          )}

          {/* Copy button */}
          <div className="pt-1">
            <CopyBtn text={buildCopyText(idea)} label="Copy Prompt" />
          </div>

        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function StrategyAIPage() {
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [brandBrief, setBrandBrief] = useState<Record<string, unknown> | null>(null)
  const [context, setContext] = useState(calcBrandContext(null))

  const [ideaCount, setIdeaCount] = useState<3 | 8 | 20 | 40>(3)
  const [videoLength, setVideoLength] = useState<VideoLength>('15 sec')
  const [output, setOutput] = useState<IdeasOutput | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'init', role: 'assistant', text: "Ask me for more ideas, different styles, or creative direction. I'll use your brand context to help." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  // ── Load brand + restore cache ────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.output && typeof saved.output === 'object') {
          setOutput(normalizeOutput(saved.output))
        }
      }
    } catch (e) {
      console.error('[StrategyAI] localStorage restore failed:', e)
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }

    async function load() {
      if (isDemoMode()) {
        setBrandBrief(DEMO_BRAND_BRIEF as unknown as Record<string, unknown>)
        setContext(calcBrandContext(DEMO_BRAND_BRIEF as unknown as Record<string, unknown>))
        return
      }
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const co = await getMyCompany()
      if (co) {
        const { data: brief } = await supabase.from('brand_briefs').select('*').eq('company_id', co.id).single()
        if (brief) {
          setBrandBrief(brief as Record<string, unknown>)
          setContext(calcBrandContext(brief as Record<string, unknown>))
        }
      }
    }
    load()
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, chatLoading])

  const persist = useCallback((patch: object) => {
    try {
      const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }))
    } catch { /* ignore */ }
  }, [])

  // ── Generate ──────────────────────────────────────────────────────────────
  async function generate() {
    setRunning(true)
    setRunError('')

    try {
      const payload = {
        userId,
        setupLevel: context.setupLevel,
        completionPercentage: context.completionPercentage,
        confidenceLabel: context.confidenceLabel,
        brandBrief,
        selectedIdeaCount: `${ideaCount} ideas`,
        selectedVideoLength: videoLength,
        selectedCommercialStyle: 'Mixed',
        selectedProductionType: 'Mixed Production',
      }
      console.log('[generate] Calling /api/strategy/run, ideaCount:', ideaCount, 'videoLength:', videoLength)

      const res = await fetch('/api/strategy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('[generate] Status:', res.status)
      const data = await res.json()

      // Handle both { success, data } and legacy { ok, factory } envelopes
      const failed = data.success === false || data.ok === false || !res.ok
      if (failed) {
        const msg = data.error ?? data.details ?? 'Strategy AI could not generate ideas right now. Please try again.'
        console.error('[generate] API error:', data.error, data.details)
        setRunError(typeof msg === 'string' ? msg : 'Strategy AI could not generate ideas right now. Please try again.')
        return
      }

      // Unwrap envelope: { success, data: { ideas } } or { ok, factory: { ideas } } or bare { ideas }
      const rawPayload = data.data ?? data.factory ?? (Array.isArray(data.ideas) ? data : null) ?? data
      if (!rawPayload || typeof rawPayload !== 'object') {
        setRunError('Strategy AI returned an empty response. Please try again.')
        return
      }

      const normalized = normalizeOutput(rawPayload)
      console.log('[generate] Ideas:', normalized.ideas.length)

      if (normalized.ideas.length === 0) {
        setRunError('Strategy AI did not return any ideas. Please try again.')
        return
      }

      setOutput(normalized)
      persist({ output: rawPayload })
      document.getElementById('ideas-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e) {
      console.error('[generate] Fetch error:', (e as Error).message)
      setRunError('Strategy AI could not generate ideas right now. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  function resetOutput() {
    setOutput(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  async function sendChat(text?: string) {
    const msg = (text ?? chatInput).trim()
    if (!msg || chatLoading) return
    const userMsg: ChatMsg = { id: `u${Date.now()}`, role: 'user', text: msg }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setChatInput('')
    setChatLoading(true)
    setChatError('')
    try {
      const res = await fetch('/api/strategy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, userId, currentStatus: context }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setChatError(data.error ?? 'Could not respond. Try again.'); return }
      const aiMsg: ChatMsg = { id: `a${Date.now()}`, role: 'assistant', text: data.assistantMessage ?? data.message ?? 'Got it.' }
      setMessages([...newMsgs, aiMsg])
    } catch { setChatError('Could not respond. Try again.') }
    finally { setChatLoading(false) }
  }

  const confColor = context.confidenceLabel === 'High' ? 'text-green-400'
    : context.confidenceLabel === 'Medium' ? 'text-yellow-400' : 'text-white/35'
  const businessName = brandBrief?.company_name ? String(brandBrief.company_name) : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Generate UGC Commercial Ideas</h1>
        <p className="text-white/40 text-sm mt-0.5">Strategy AI uses Your Brand to pitch commercial ideas you can create with AI video tools, creators, or editors.</p>
      </div>

      {/* Error banner */}
      {runError && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl gap-3">
          <span>{runError}</span>
          <button onClick={() => setRunError('')} className="shrink-0 hover:text-red-300 transition"><X size={14} /></button>
        </div>
      )}

      {/* Controls card */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 space-y-5">

        {/* Brand context line */}
        <div className="space-y-1">
          <p className="text-white/35 text-xs">
            Using Your Brand:
            <span className="text-white/60 font-medium"> {businessName ?? 'No brand setup'}</span>
            <span className="text-white/18"> · </span>
            <span className="text-white/45">{context.completionPercentage}% complete</span>
            <span className="text-white/18"> · </span>
            <span className={`font-medium ${confColor}`}>{context.confidenceLabel} confidence</span>
          </p>
          {context.setupLevel === 'Empty' ? (
            <p className="text-white/25 text-xs">
              Strategy AI can still generate ideas with the information available.{' '}
              <Link href="/dashboard/your-brand" className="text-white/40 underline hover:text-white/60 transition">Add brand details</Link> for better ideas.
            </p>
          ) : context.completionPercentage < 50 && (
            <p className="text-white/20 text-xs">
              Strategy AI can generate ideas with the information available. Add more brand details later for better ideas.
            </p>
          )}
        </div>

        {/* Controls row */}
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Idea count */}
          <div>
            <p className="text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-2">Number of Ideas</p>
            <div className="flex gap-2 flex-wrap">
              {IDEA_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setIdeaCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${ideaCount === n
                    ? 'bg-[#FF3B1A]/15 border-[#FF3B1A]/40 text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Video length */}
          <div>
            <p className="text-white/35 text-[11px] font-semibold uppercase tracking-widest mb-2">Video Length</p>
            <div className="flex gap-2 flex-wrap">
              {VIDEO_LENGTHS.map(l => (
                <button
                  key={l}
                  onClick={() => setVideoLength(l)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${videoLength === l
                    ? 'bg-[#FF3B1A]/15 border-[#FF3B1A]/40 text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={generate}
            disabled={running}
            className="flex items-center justify-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-semibold text-sm px-7 py-3 rounded-xl transition"
          >
            {running
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
              : <Sparkles size={14} className="shrink-0" />}
            <span>{running ? 'Generating UGC commercial ideas…' : 'Generate Ideas'}</span>
          </button>
          <Link
            href="/dashboard/your-brand"
            className="text-center text-xs text-white/25 hover:text-white/45 transition py-2"
          >
            ↗ Improve Your Brand for better results
          </Link>
        </div>

      </div>

      {/* Loading animation */}
      {running && (
        <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-10 text-center space-y-5">
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
            <div className="animate-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#FF3B1A', borderRightColor: 'rgba(255,59,26,0.3)', animationDuration: '1.5s' }} />
            <div className="animate-spin" style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: '#FF3B1A', animationDuration: '2.2s', animationDirection: 'reverse' }} />
            <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'rgba(255,59,26,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={22} style={{ color: '#FF3B1A' }} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold text-sm">Generating UGC commercial ideas…</p>
            <p className="text-white/25 text-xs">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Ideas output */}
      {!running && output && (
        <div id="ideas-output" className="space-y-3">
          <OutputErrorBoundary>

            {/* Output header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold">UGC Commercial Ideas</p>
                <p className="text-white/30 text-xs mt-0.5">
                  {output.ideas.length} idea{output.ideas.length !== 1 ? 's' : ''} · Click any idea to expand the production prompt.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generate}
                  className="flex items-center gap-1.5 border border-white/10 text-white/35 hover:text-white text-xs px-3 py-2 rounded-lg transition"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
                <button
                  onClick={resetOutput}
                  className="flex items-center gap-1.5 border border-white/8 text-white/20 hover:text-white/40 text-xs px-3 py-2 rounded-lg transition"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
            </div>

            {/* Accordion list */}
            <div className="space-y-2">
              {output.ideas.length === 0 ? (
                <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-8 text-center">
                  <p className="text-white/30 text-sm">No ideas were generated. Try again.</p>
                </div>
              ) : output.ideas.map((idea, i) => (
                <IdeaCard key={i} idea={idea} index={i} />
              ))}
            </div>

          </OutputErrorBoundary>
        </div>
      )}

      {/* Empty state */}
      {!running && !output && !runError && (
        <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-10 text-center space-y-2">
          <p className="text-white/40 font-medium text-sm">Choose your settings and click Generate Ideas</p>
          <p className="text-white/20 text-xs max-w-sm mx-auto">
            Strategy AI will pitch {ideaCount} {videoLength} UGC commercial ideas built for AI video tools.
          </p>
        </div>
      )}

      {/* Chat (secondary) */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Ask Strategy AI</p>
          </div>
          <p className="text-white/25 text-xs mt-0.5 pl-[22px]">Ask for more ideas, different styles, or creative direction.</p>
        </div>

        <div className="overflow-y-auto p-4 space-y-3" style={{ minHeight: 150, maxHeight: 260 }}>
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'assistant' ? (
                <div className="flex items-start gap-2.5 max-w-[95%]">
                  <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={10} className="text-[#FF3B1A]" />
                  </div>
                  <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-white/70 text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <div className="bg-[#FF3B1A]/8 border border-[#FF3B1A]/12 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-white/80 text-sm">{msg.text}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/6 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={10} className="text-white/35" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/15 flex items-center justify-center shrink-0">
                <Sparkles size={10} className="text-[#FF3B1A]" />
              </div>
              <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            </div>
          )}
          {chatError && <p className="text-red-400 text-xs px-3 py-2 bg-red-500/10 border border-red-500/15 rounded-lg">{chatError}</p>}
          <div ref={chatEndRef} />
        </div>

        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {CHAT_CHIPS.map(chip => (
            <button key={chip} onClick={() => sendChat(chip)} disabled={chatLoading}
              className="text-[11px] border border-white/8 text-white/30 hover:text-white hover:border-[#FF3B1A]/30 px-2.5 py-1 rounded-full transition">
              {chip}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/6">
          <div className="flex gap-2 items-end">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder="Ask for more ideas, different styles, or creative direction…"
              rows={2}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/18 focus:outline-none focus:border-[#FF3B1A] resize-none"
            />
            <button
              onClick={() => sendChat()}
              disabled={!chatInput.trim() || chatLoading}
              className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
