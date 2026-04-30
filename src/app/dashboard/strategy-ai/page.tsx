'use client'

import { useState, useEffect, useRef, useCallback, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import { isDemoMode, DEMO_BRAND_BRIEF } from '@/lib/demoData'
import { calcBrandContext } from '@/lib/brandCompletion'
import {
  Sparkles, Brain, Send, Copy, Check, X, ChevronDown, ChevronUp,
  User, RotateCcw, RefreshCw, CheckCircle2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface Idea {
  title: string
  description: string
  productionType: string
  difficulty: string
  ugcPrompt: string
  shotList: string[]
  voiceoverDirection: string
  editingStyle: string
  doNotInclude: string[]
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
    productionType: str(d.productionType, 'Mixed'),
    difficulty: str(d.difficulty, 'Easy'),
    ugcPrompt: str(d.ugcPrompt || d.aiVideoPrompt),
    shotList: arr(d.shotList),
    voiceoverDirection: str(d.voiceoverDirection || d.voiceoverSpokenDirection),
    editingStyle: str(d.editingStyle),
    doNotInclude: arr(d.doNotInclude),
  }
}

function normalizeOutput(raw: unknown): IdeasOutput {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  // Support both { ideas: [...] } and legacy { commercialIdeas: [...] }
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

const STORAGE_KEY = 'ugcfire_ideas_v2'
const IDEA_COUNTS = [8, 20, 40] as const

const CHAT_CHIPS = [
  'Give me more ideas', 'Make ideas more premium', 'Make ideas more fun',
  'More direct response ideas', 'More lifestyle ideas', 'More product demo ideas',
]

// ── Copy button ────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${done ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
    >
      {done ? <><Check size={11} /> Copied</> : <><Copy size={11} /> {label}</>}
    </button>
  )
}

function DiffBadge({ d }: { d: string }) {
  const s = d === 'Easy' ? 'bg-green-500/15 text-green-400' : d === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s}`}>{d || 'Easy'}</span>
}

// ── Idea Card ──────────────────────────────────────────────────────────────

function IdeaCard({ idea, index }: { idea: Idea; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
      {/* Preview row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-white/2 transition"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-6 h-6 rounded-full bg-[#FF3B1A]/12 text-[#FF3B1A] text-[10px] font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{idea.title}</p>
            {idea.description && (
              <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{idea.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {idea.productionType && (
            <span className="hidden sm:block text-[9px] bg-white/6 text-white/35 px-2 py-0.5 rounded-full">
              {idea.productionType}
            </span>
          )}
          <DiffBadge d={idea.difficulty} />
          {open ? <ChevronUp size={13} className="text-white/25" /> : <ChevronDown size={13} className="text-white/25" />}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/6 px-4 py-5 space-y-4">
          {/* UGC Prompt — most important */}
          {idea.ugcPrompt && (
            <div className="bg-[#FF3B1A]/5 border border-[#FF3B1A]/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[#FF3B1A] text-[10px] font-semibold uppercase tracking-widest">UGC Prompt</p>
                <CopyBtn text={idea.ugcPrompt} label="Copy Prompt" />
              </div>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{idea.ugcPrompt}</p>
            </div>
          )}

          {/* Shot List */}
          {idea.shotList?.length > 0 && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Shot List</p>
                <CopyBtn text={idea.shotList.join('\n')} label="Copy" />
              </div>
              <ul className="space-y-1.5">
                {idea.shotList.map((shot, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FF3B1A]/50 shrink-0" />
                    {shot}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Voiceover + Editing — side by side on desktop */}
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

          {/* Do Not Include */}
          {idea.doNotInclude?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/12 rounded-xl p-3">
              <p className="text-red-400/60 text-[10px] font-semibold uppercase tracking-widest mb-2">Do Not Include</p>
              <ul className="space-y-1">
                {idea.doNotInclude.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
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

  const [ideaCount, setIdeaCount] = useState<8 | 20 | 40>(8)
  const [output, setOutput] = useState<IdeasOutput | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')
  const [approved, setApproved] = useState(false)

  // Chat
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
          setApproved(saved.approved ?? false)
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
        if (brief) { setBrandBrief(brief as Record<string, unknown>); setContext(calcBrandContext(brief as Record<string, unknown>)) }
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
    setApproved(false)

    const ERROR_MESSAGES: Record<string, string> = {
      MISSING_OPENAI_KEY: 'Strategy AI is not configured. Please contact support.',
      OPENAI_REQUEST_FAILED: 'Strategy AI could not connect to OpenAI. Please try again.',
      OPENAI_JSON_PARSE_FAILED: 'Strategy AI returned an unexpected format. Please try again.',
    }

    try {
      const payload = {
        userId,
        setupLevel: context.setupLevel,
        completionPercentage: context.completionPercentage,
        confidenceLabel: context.confidenceLabel,
        brandBrief,
        selectedIdeaCount: `${ideaCount} ideas`,
        selectedCommercialStyle: 'Mixed',
        selectedProductionType: 'Mixed Production',
      }
      console.log('[generate] Calling /api/strategy/run', { ideaCount })
      const res = await fetch('/api/strategy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      console.log('[generate] Status:', res.status)
      const data = await res.json()

      if (!res.ok || data.ok === false) {
        const code = data.error as string | undefined
        const msg = (code && ERROR_MESSAGES[code]) ?? code ?? 'Strategy AI could not generate right now. Please try again.'
        console.error('[generate] Error:', code, data.details)
        setRunError(msg)
        return
      }

      const rawFactory = data.factory ?? data.data ?? (data.ok !== false ? data : null)
      if (!rawFactory || typeof rawFactory !== 'object') {
        setRunError('Strategy AI returned an empty response. Please try again.')
        return
      }

      const normalized = normalizeOutput(rawFactory)
      console.log('[generate] Ideas:', normalized.ideas.length)
      setOutput(normalized)
      persist({ output: rawFactory, approved: false })
      document.getElementById('ideas-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e) {
      console.error('[generate] Fetch error:', (e as Error).message)
      setRunError('Strategy AI could not generate right now. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  function resetOutput() {
    setOutput(null)
    setApproved(false)
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

  const confColor = context.confidenceLabel === 'High' ? 'text-green-400' : context.confidenceLabel === 'Medium' ? 'text-yellow-400' : 'text-white/35'
  const businessName = brandBrief?.company_name ? String(brandBrief.company_name) : null

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Strategy AI</h1>
        <p className="text-white/40 text-sm mt-0.5">Generate UGC commercial ideas from your brand setup.</p>
      </div>

      {/* ── Error banner ── */}
      {runError && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl gap-3">
          <span>{runError}</span>
          <button onClick={() => setRunError('')} className="shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* ── Controls card ── */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 space-y-5">
        {/* Brand context line */}
        <p className="text-white/35 text-xs">
          Using Your Brand:
          <span className="text-white/60 font-medium"> {businessName ?? 'No brand setup'}</span>
          <span className="text-white/20"> · </span>
          <span className="text-white/50">{context.completionPercentage}% complete</span>
          <span className="text-white/20"> · </span>
          <span className={`font-medium ${confColor}`}>{context.confidenceLabel} confidence</span>
          {context.setupLevel === 'Empty' && (
            <span className="text-white/25"> — <Link href="/dashboard/your-brand" className="underline hover:text-white/50 transition">Set up Your Brand</Link> for better ideas</span>
          )}
        </p>

        {/* Idea count selector */}
        <div>
          <p className="text-white/40 text-xs font-medium mb-2">Number of ideas</p>
          <div className="flex gap-2">
            {IDEA_COUNTS.map(n => (
              <button
                key={n}
                onClick={() => setIdeaCount(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${ideaCount === n ? 'bg-[#FF3B1A]/15 border-[#FF3B1A]/40 text-white' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={running}
          className="flex items-center justify-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-xl transition w-full sm:w-auto"
        >
          {running
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
            : <Sparkles size={14} className="shrink-0" />}
          <span>{running ? 'Generating ideas…' : 'Generate Ideas'}</span>
        </button>

        <Link href="/dashboard/your-brand" className="block text-xs text-white/25 hover:text-white/45 transition">
          ↗ Improve Your Brand for better results
        </Link>
      </div>

      {/* ── Loading state ── */}
      {running && (
        <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-10 text-center space-y-5">
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
            <div className="animate-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#FF3B1A', borderRightColor: 'rgba(255,59,26,0.3)', animationDuration: '1.5s' }} />
            <div className="animate-spin" style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: '#FF3B1A', animationDuration: '2.2s', animationDirection: 'reverse' }} />
            <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'rgba(255,59,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={22} style={{ color: '#FF3B1A' }} />
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Strategy AI is generating your ideas…</p>
            <p className="text-white/30 text-xs mt-1">This may take a few moments</p>
          </div>
        </div>
      )}

      {/* ── Ideas output ── */}
      {!running && output && (
        <div id="ideas-output" className="space-y-4">
          <OutputErrorBoundary>
            {/* Output header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold">UGC Commercial Ideas</p>
                <p className="text-white/35 text-xs mt-0.5">Click any idea to view the production prompt.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {!approved ? (
                  <button
                    onClick={() => { setApproved(true); persist({ approved: true }) }}
                    className="flex items-center gap-1.5 bg-green-500/12 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-500/18 transition"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 bg-green-500/12 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-2 rounded-lg">
                    <Check size={12} /> Approved
                  </span>
                )}
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

            {/* Ideas list */}
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

      {/* ── Empty state (before any generation) ── */}
      {!running && !output && !runError && (
        <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-10 text-center space-y-2">
          <p className="text-white/40 font-medium text-sm">Generate Ideas to get started</p>
          <p className="text-white/20 text-xs">Strategy AI will create specific, production-ready UGC commercial ideas from your brand setup.</p>
        </div>
      )}

      {/* ── Chat (secondary) ── */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Ask Strategy AI</p>
          </div>
          <p className="text-white/25 text-xs mt-0.5 pl-[22px]">Ask for more ideas, different styles, or creative direction.</p>
        </div>

        <div className="overflow-y-auto p-4 space-y-3" style={{ minHeight: 160, maxHeight: 280 }}>
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'assistant' ? (
                <div className="flex items-start gap-2.5 max-w-[95%]">
                  <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/18 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={10} className="text-[#FF3B1A]" />
                  </div>
                  <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-white/75 text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <div className="bg-[#FF3B1A]/8 border border-[#FF3B1A]/15 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-white/85 text-sm">{msg.text}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/6 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={10} className="text-white/40" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/18 flex items-center justify-center shrink-0">
                <Sparkles size={10} className="text-[#FF3B1A]" />
              </div>
              <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            </div>
          )}
          {chatError && <p className="text-red-400 text-xs px-3 py-2 bg-red-500/10 border border-red-500/18 rounded-lg">{chatError}</p>}
          <div ref={chatEndRef} />
        </div>

        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {CHAT_CHIPS.map(chip => (
            <button key={chip} onClick={() => sendChat(chip)} disabled={chatLoading}
              className="text-[11px] border border-white/8 text-white/35 hover:text-white hover:border-[#FF3B1A]/35 px-2.5 py-1 rounded-full transition">
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
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B1A] resize-none"
            />
            <button onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading}
              className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
