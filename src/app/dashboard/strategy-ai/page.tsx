'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Brain, Send, ChevronRight, ChevronDown, Folder, Target, Users,
  Flame, Link2, TrendingUp, Plus, X, Zap, ArrowRight, Lightbulb,
  FileText, CheckCircle2, Copy, Check, BookOpen, Play, BarChart2,
  Star, AlignLeft, Mic2, Pencil, Trash2, RefreshCw, User,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey   = 'brandMemory' | 'competitorNotes' | 'contentLibrary' | 'strategyIdeas' | 'growthSignals'
type MemoryStatus = 'new' | 'learning' | 'saved' | 'ready'
type AccordionId  = 'summary' | 'hooks' | 'captions' | 'cta' | 'ideas' | 'briefs' | 'tasks' | 'growth'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  text: string
  memories?: number
}

interface Hook         { text: string; type: string; useCase?: string }
interface Caption      { text: string; platform: string; cta: string }
interface CtaItem      { cta: string; bestUseCase: string; whyItWorks: string }
interface ContentIdea  { title: string; angle: string; platform: string; goal?: string; whyItWorks?: string }
interface Brief        { title: string; hook: string; angle: string; script: string; shotList: string[]; cta: string; platforms: string[]; goal?: string; whyItWorks: string; fireCreatorNotes?: string; status?: string }
interface FireTask     { task: string; priority: string; status: string; relatedBrief?: string }
interface GrowthPlan   { whereToPost: string[]; weeklyPostingPlan: string[]; whatToTest: string[]; whatToMeasure: string[]; whatToDoubleDownOn: string[]; nextSevenDays: string[] }

interface Strategy {
  strategySummary: { mainDirection: string; thisWeeksFocus: string; bestOpportunity: string; whyThisMatters: string }
  hooks: Hook[]
  captions: Caption[]
  ctaStrategy: CtaItem[]
  contentIdeas: ContentIdea[]
  ugcVideoBriefs: Brief[]
  fireCreatorTasks: FireTask[]
  growthPlan: GrowthPlan
}

// ─── Super Brain sections ─────────────────────────────────────────────────────

const BRAIN_SECTIONS: { key: SectionKey; stage: string; Icon: React.ElementType; title: string; desc: string }[] = [
  { key: 'brandMemory',     stage: 'brand',       Icon: Folder,     title: 'Brand Memory',     desc: 'Core identity, mission, positioning' },
  { key: 'competitorNotes', stage: 'competitors', Icon: Users,      title: 'Competitor Notes', desc: 'Competitor landscape and content gaps' },
  { key: 'contentLibrary',  stage: 'content',     Icon: Lightbulb,  title: 'Content Library',  desc: 'Hooks, ideas, angles, and references' },
  { key: 'strategyIdeas',   stage: 'strategy',    Icon: Target,     title: 'Strategy Ideas',   desc: 'Angles, offers, and positioning' },
  { key: 'growthSignals',   stage: 'growth',      Icon: TrendingUp, title: 'Growth Signals',   desc: "What's working and opportunities" },
]

const STATUS_STYLES: Record<MemoryStatus, string> = {
  new:      'bg-white/8 text-white/35',
  learning: 'bg-[#FF3B1A]/15 text-[#FF3B1A]',
  saved:    'bg-green-500/15 text-green-400',
  ready:    'bg-blue-500/15 text-blue-300',
}

const STARTER_CHIPS = [
  'Build my brand strategy',
  'Analyze my competitors',
  'Create hooks and captions',
  'Make UGC video briefs',
  'Create my growth plan',
]

const ALL_ACCORDION_IDS: AccordionId[] = ['summary', 'hooks', 'captions', 'cta', 'ideas', 'briefs', 'tasks', 'growth']
const STORAGE_KEY = 'ugcfire_strategy_v3'

// ─── Small helpers ────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1600) }}
      title="Copy"
      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg border transition ${done ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/35 hover:text-white hover:border-white/20'}`}
    >
      {done ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
    </button>
  )
}

function PriorityBadge({ p }: { p: string }) {
  const s = p === 'High' ? 'bg-[#FF3B1A]/15 text-[#FF3B1A]' : p === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/8 text-white/35'
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s}`}>{p}</span>
}

function ActionBtn({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg border transition ${danger ? 'border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-400/30' : 'border-white/10 text-white/35 hover:text-white hover:border-white/20'}`}
    >
      <Icon size={9} /> {label}
    </button>
  )
}

interface AccordionProps {
  id: AccordionId; title: string; Icon: React.ElementType
  isOpen: boolean; onToggle: () => void; children: React.ReactNode
}
function AccordionSection({ title, Icon, isOpen, onToggle, children }: AccordionProps) {
  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#FF3B1A]/15 flex items-center justify-center shrink-0">
            <Icon size={13} className="text-[#FF3B1A]" />
          </div>
          <p className="text-white font-semibold text-sm">{title}</p>
        </div>
        <ChevronDown size={15} className={`text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="border-t border-white/6 px-5 py-5">{children}</div>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StrategyAIPage() {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Auth ──
  const [userId, setUserId] = useState<string | null>(null)

  // ── Chat ──
  const [messages,    setMessages]    = useState<ChatMsg[]>([
    { id: 'init', role: 'assistant', text: "Hi! I'm Strategy AI. Tell me about your business, offer, audience, or competitors. I'll organize it all into your Super Brain and build your content strategy." }
  ])
  const [input,       setInput]       = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError,   setChatError]   = useState('')

  // ── Super Brain ──
  const [brainStatus,  setBrainStatus]  = useState<Record<string, MemoryStatus>>({
    brand: 'new', competitors: 'new', content: 'new', strategy: 'new', growth: 'new',
  })
  const [memoryCounts, setMemoryCounts] = useState<Record<string, number>>({})

  // ── Strategy output ──
  const [strategy,     setStrategy]     = useState<Strategy | null>(null)
  const [running,      setRunning]      = useState(false)
  const [openSections, setOpenSections] = useState<Set<AccordionId>>(new Set())
  const [successMsg,   setSuccessMsg]   = useState(false)
  const [runError,     setRunError]     = useState('')

  // ── Editing ──
  const [editingCell,  setEditingCell]  = useState<{ section: string; index: number } | null>(null)
  const [editDraft,    setEditDraft]    = useState<Record<string, string>>({})
  const [savedCell,    setSavedCell]    = useState<string | null>(null)
  const [briefModal,   setBriefModal]   = useState<Brief | null>(null)
  const [editBrief,    setEditBrief]    = useState<Brief | null>(null)

  // ── Modals ──
  const [showAddMemory, setShowAddMemory] = useState(false)
  const [showAddLink,   setShowAddLink]   = useState(false)
  const [memStage,      setMemStage]      = useState('brand')
  const [memTitle,      setMemTitle]      = useState('')
  const [memContent,    setMemContent]    = useState('')
  const [linkUrl,       setLinkUrl]       = useState('')
  const [linkNotes,     setLinkNotes]     = useState('')
  const [linkStage,     setLinkStage]     = useState('brand')
  const [modalSaving,   setModalSaving]   = useState(false)

  // ── Hydrate ──
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s.messages?.length)  setMessages(s.messages)
      if (s.brainStatus)       setBrainStatus(s.brainStatus)
      if (s.strategy)          { setStrategy(s.strategy); setOpenSections(new Set(ALL_ACCORDION_IDS)) }
      if (s.memoryCounts)      setMemoryCounts(s.memoryCounts)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  const persist = useCallback((patch: object) => {
    try {
      const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }))
    } catch { /* ignore */ }
  }, [])

  // ── Send chat message ──
  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || chatLoading) return

    const userMsg: ChatMsg = { id: `u${Date.now()}`, role: 'user', text: msg }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setChatLoading(true)
    setChatError('')

    try {
      const res = await fetch('/api/strategy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, userId, currentStatus: brainStatus }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setChatError(data.error ?? 'Strategy AI could not respond right now. Please try again.')
        setChatLoading(false)
        return
      }

      const aiMsg: ChatMsg = {
        id: `a${Date.now()}`,
        role: 'assistant',
        text: data.assistantMessage,
        memories: data.extractedMemories?.length ?? 0,
      }
      const updatedMsgs = [...newMsgs, aiMsg]
      setMessages(updatedMsgs)

      // Update brain status
      if (data.superBrainStatus) {
        const newStatus = { ...brainStatus, ...data.superBrainStatus }
        setBrainStatus(newStatus)
        persist({ brainStatus: newStatus })
      }

      // Update memory counts
      if (data.extractedMemories?.length) {
        const newCounts = { ...memoryCounts }
        for (const m of data.extractedMemories) {
          newCounts[m.stage] = (newCounts[m.stage] ?? 0) + 1
        }
        setMemoryCounts(newCounts)
        persist({ memoryCounts: newCounts })
      }

      persist({ messages: updatedMsgs })
    } catch {
      setChatError('Strategy AI could not respond right now. Please try again.')
    } finally {
      setChatLoading(false)
    }
  }

  // ── Run Strategy AI ──
  async function runStrategy() {
    setRunning(true)
    setRunError('')

    try {
      const res = await fetch('/api/strategy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setRunError(data.error ?? 'Strategy AI could not generate right now. Please try again.')
        setRunning(false)
        return
      }

      setStrategy(data as Strategy)
      setOpenSections(new Set(ALL_ACCORDION_IDS))
      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 4500)
      persist({ strategy: data })

      // Mark all as ready
      const allReady: Record<string, MemoryStatus> = { brand: 'ready', competitors: 'ready', content: 'ready', strategy: 'ready', growth: 'ready' }
      setBrainStatus(allReady)
      persist({ brainStatus: allReady })

      document.getElementById('strategy-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setRunError('Strategy AI could not generate right now. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  function toggleSection(id: AccordionId) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Editing helpers ──
  function startEdit(section: string, index: number, item: Record<string, string>) {
    setEditingCell({ section, index })
    setEditDraft(item)
  }

  function saveEdit() {
    if (!editingCell || !strategy) return
    const { section, index } = editingCell
    const updated = structuredClone(strategy) as Strategy

    if (section === 'hooks')         (updated.hooks[index] as Record<string, string>) = { ...updated.hooks[index], ...editDraft }
    if (section === 'captions')      (updated.captions[index] as Record<string, string>) = { ...updated.captions[index], ...editDraft }
    if (section === 'ctaStrategy')   (updated.ctaStrategy[index] as Record<string, string>) = { ...updated.ctaStrategy[index], ...editDraft }
    if (section === 'contentIdeas')  (updated.contentIdeas[index] as Record<string, string>) = { ...updated.contentIdeas[index], ...editDraft }
    if (section === 'fireCreatorTasks') (updated.fireCreatorTasks[index] as Record<string, string>) = { ...updated.fireCreatorTasks[index], ...editDraft }
    if (section === 'summary') updated.strategySummary = { ...updated.strategySummary, ...editDraft as Partial<typeof updated.strategySummary> }

    setStrategy(updated)
    persist({ strategy: updated })
    setEditingCell(null)
    setEditDraft({})
    setSavedCell(`${section}-${index}`)
    setTimeout(() => setSavedCell(null), 2000)
  }

  function cancelEdit() { setEditingCell(null); setEditDraft({}) }

  function deleteItem(section: keyof Strategy, index: number) {
    if (!strategy) return
    const updated = structuredClone(strategy) as Strategy
    const arr = updated[section]
    if (Array.isArray(arr)) { arr.splice(index, 1) }
    setStrategy(updated)
    persist({ strategy: updated })
  }

  function saveBriefEdit() {
    if (!editBrief || !strategy) return
    const updated = structuredClone(strategy) as Strategy
    const idx = updated.ugcVideoBriefs.findIndex(b => b.title === briefModal?.title)
    if (idx >= 0) updated.ugcVideoBriefs[idx] = editBrief
    setStrategy(updated)
    persist({ strategy: updated })
    setBriefModal(editBrief)
    setEditBrief(null)
  }

  function updateBriefStatus(title: string, status: string) {
    if (!strategy) return
    const updated = structuredClone(strategy) as Strategy
    const idx = updated.ugcVideoBriefs.findIndex(b => b.title === title)
    if (idx >= 0) updated.ugcVideoBriefs[idx] = { ...updated.ugcVideoBriefs[idx], status }
    setStrategy(updated)
    persist({ strategy: updated })
  }

  function updateTaskStatus(index: number, status: string) {
    if (!strategy) return
    const updated = structuredClone(strategy) as Strategy
    updated.fireCreatorTasks[index].status = status
    setStrategy(updated)
    persist({ strategy: updated })
  }

  // ── Save memory modal ──
  async function saveMemory() {
    if (!memTitle.trim() || !memContent.trim()) return
    setModalSaving(true)
    try {
      const supabase = createClient()
      if (userId) {
        await supabase.from('strategy_memories').insert({
          user_id: userId,
          stage: memStage,
          memory_type: 'manual',
          title: memTitle,
          summary: memContent,
          data: {},
        })
      }
      const newCounts = { ...memoryCounts, [memStage]: (memoryCounts[memStage] ?? 0) + 1 }
      setMemoryCounts(newCounts)
      setBrainStatus(prev => ({ ...prev, [memStage]: 'saved' }))
      persist({ memoryCounts: newCounts })
    } finally {
      setMemTitle(''); setMemContent(''); setShowAddMemory(false); setModalSaving(false)
    }
  }

  async function saveLink() {
    if (!linkUrl.trim()) return
    setModalSaving(true)
    try {
      const supabase = createClient()
      if (userId) {
        await supabase.from('strategy_memories').insert({
          user_id: userId,
          stage: linkStage,
          memory_type: 'link',
          title: linkUrl,
          summary: linkNotes || linkUrl,
          data: { url: linkUrl, notes: linkNotes },
        })
      }
    } finally {
      setLinkUrl(''); setLinkNotes(''); setShowAddLink(false); setModalSaving(false)
    }
  }

  // ── Inline edit row (text + textarea) ──
  function isEditing(section: string, index: number) {
    return editingCell?.section === section && editingCell?.index === index
  }

  function EditControls({ section, index, item }: { section: string; index: number; item: Record<string, string> }) {
    const key = `${section}-${index}`
    if (savedCell === key) return <span className="flex items-center gap-1 text-green-400 text-[10px]"><Check size={10} /> Saved</span>
    if (isEditing(section, index)) return null
    return (
      <ActionBtn icon={Pencil} label="Edit" onClick={() => startEdit(section, index, item)} />
    )
  }

  function InlineEditArea({ field }: { field: string }) {
    return (
      <textarea
        value={editDraft[field] ?? ''}
        onChange={e => setEditDraft(prev => ({ ...prev, [field]: e.target.value }))}
        rows={3}
        className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none resize-none"
        autoFocus
      />
    )
  }

  function SaveCancelRow() {
    return (
      <div className="flex gap-2 mt-2">
        <button onClick={saveEdit}   className="text-[10px] font-semibold bg-[#FF3B1A] text-white px-3 py-1.5 rounded-lg">Save</button>
        <button onClick={cancelEdit} className="text-[10px] font-semibold border border-white/10 text-white/40 hover:text-white px-3 py-1.5 rounded-lg transition">Cancel</button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy AI</h1>
          <p className="text-white/40 text-sm mt-0.5">Talk to Strategy AI. It builds your Super Brain, content strategy, hooks, captions, briefs, and growth plan.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAddLink(true)}   className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-3.5 py-2 rounded-lg transition"><Link2 size={12} /> Add Link</button>
          <button onClick={() => setShowAddMemory(true)} className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-3.5 py-2 rounded-lg transition"><Plus size={12} /> Add Memory</button>
          <button onClick={runStrategy} disabled={running} className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition">
            {running ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</> : <><Sparkles size={13} /> Run Strategy AI</>}
          </button>
        </div>
      </div>

      {/* ── Toasts ── */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 size={15} /> Strategy generated from Super Brain.
        </div>
      )}
      {runError && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <span>{runError}</span>
          <button onClick={() => setRunError('')}><X size={14} /></button>
        </div>
      )}

      {/* ── Funnel Stepper (visual) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['Brand', 'Competitors', 'Content', 'Strategy', 'Growth'].map((step, i, arr) => {
          const stage = step.toLowerCase()
          const status = brainStatus[stage] ?? 'new'
          const isDone = status === 'saved' || status === 'ready'
          return (
            <div key={step} className="flex items-center gap-1.5 shrink-0">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm ${isDone ? 'border-green-500/25 bg-green-500/6 text-green-400' : 'border-white/8 bg-[#0d0d0d] text-white/40'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/8 text-white/30'}`}>{i + 1}</span>
                {step}
                {status !== 'new' && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>{status}</span>}
              </div>
              {i < arr.length - 1 && <ArrowRight size={12} className="text-white/15 shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* ── 2-Column: Chat + Super Brain ── */}
      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

        {/* ── Chat ── */}
        <div className="flex-1 min-w-0 bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#FF3B1A]" />
              <p className="text-white font-semibold text-sm">Talk to Strategy AI</p>
            </div>
            <p className="text-white/28 text-xs mt-0.5 pl-5">Tell me about your business, offer, audience, competitors, content goals, or paste links. I'll organize it into your Super Brain and build your strategy.</p>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto p-5 space-y-3" style={{ minHeight: 260, maxHeight: 380 }}>
            {messages.map(msg => (
              <div key={msg.id}>
                {msg.role === 'assistant' ? (
                  <div className="flex items-start gap-2.5 max-w-[95%]">
                    <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={11} className="text-[#FF3B1A]" />
                    </div>
                    <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3 space-y-1">
                      <p className="text-white/80 text-sm leading-relaxed">{msg.text}</p>
                      {msg.memories && msg.memories > 0 ? (
                        <p className="text-[10px] text-green-400 flex items-center gap-1">
                          <CheckCircle2 size={9} /> {msg.memories} {msg.memories === 1 ? 'memory' : 'memories'} saved to Super Brain
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="flex items-start gap-2 max-w-[90%]">
                      <div className="bg-[#FF3B1A]/10 border border-[#FF3B1A]/18 rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-white/90 text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={11} className="text-white/50" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0">
                  <Sparkles size={11} className="text-[#FF3B1A]" />
                </div>
                <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {chatError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg">
                {chatError}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Starter chips */}
          {messages.length <= 1 && (
            <div className="px-5 pb-2 flex flex-wrap gap-2">
              {STARTER_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  disabled={chatLoading}
                  className="text-[11px] font-medium border border-white/10 text-white/45 hover:text-white hover:border-[#FF3B1A]/40 px-3 py-1.5 rounded-full transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/6">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Tell Strategy AI about your business, paste a website, add competitor links, or describe what you need..."
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/22 focus:outline-none focus:border-[#FF3B1A] resize-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || chatLoading}
                className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Super Brain Panel ── */}
        <div className="w-full lg:w-60 shrink-0 bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex items-center gap-2 mb-0.5">
              <Brain size={14} className="text-[#FF3B1A]" />
              <p className="text-white font-semibold text-sm">Super Brain</p>
              <span className="ml-auto text-[8px] font-bold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full">Live</span>
            </div>
            <p className="text-white/28 text-[11px]">Living memory used across the whole funnel.</p>
          </div>
          <div className="divide-y divide-white/5">
            {BRAIN_SECTIONS.map(({ key, stage, Icon, title, desc }) => {
              const status = (brainStatus[stage] ?? 'new') as MemoryStatus
              const count  = memoryCounts[stage] ?? 0
              return (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-white/65 text-xs font-semibold">{title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>{status}</span>
                    </div>
                    <p className="text-white/25 text-[10px] truncate">{count > 0 ? `${count} memor${count === 1 ? 'y' : 'ies'} saved` : desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="m-3 bg-white/3 border border-white/6 rounded-xl p-3">
            <p className="text-white/30 text-[10px] leading-relaxed">Memory grows as you chat. All insights are connected and reused to generate stronger ideas and results.</p>
            <button onClick={() => setShowAddMemory(true)} className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-semibold border border-white/10 text-white/35 hover:text-white rounded-lg py-1.5 transition">
              <Plus size={9} /> Add Memory
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GENERATED STRATEGY OUTPUT
      ═══════════════════════════════════════════════════════════════════════ */}
      <div id="strategy-output" className="space-y-4 pt-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white font-semibold text-base">Generated AI Strategy</p>
            <p className="text-white/35 text-sm mt-0.5">Hooks, captions, CTAs, content ideas, briefs, and growth direction — AI drafts it, you control it.</p>
          </div>
          {strategy && (
            <div className="flex gap-2">
              <button onClick={() => setOpenSections(new Set(ALL_ACCORDION_IDS))} className="text-xs text-white/35 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition">Expand all</button>
              <button onClick={() => setOpenSections(new Set())}                  className="text-xs text-white/35 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition">Collapse all</button>
            </div>
          )}
        </div>

        {/* Running — premium Brain animation */}
        {running && (
          <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-10 text-center space-y-8">

            {/* Brain + spinning ring */}
            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
              {/* Outer slow spin */}
              <div className="animate-spin" style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#FF3B1A',
                borderRightColor: 'rgba(255,59,26,0.35)',
                animationDuration: '1.6s',
              }} />
              {/* Inner counter-spin (segmented feel) */}
              <div className="animate-spin" style={{
                position: 'absolute', inset: 8, borderRadius: '50%',
                border: '1.5px solid transparent',
                borderBottomColor: '#FF3B1A',
                borderLeftColor: 'rgba(255,59,26,0.25)',
                animationDuration: '2.4s',
                animationDirection: 'reverse',
              }} />
              {/* Brain icon with glow */}
              <div style={{
                position: 'absolute', inset: 16, borderRadius: '50%',
                background: 'rgba(255,59,26,0.08)',
                boxShadow: '0 0 28px rgba(255,59,26,0.25), 0 0 8px rgba(255,59,26,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Brain size={26} style={{ color: '#FF3B1A' }} />
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-2">
              <p className="text-white font-semibold text-base">Building your strategy…</p>
              <p className="text-white/45 text-sm">Generating hooks, captions, CTAs, briefs, and growth plan</p>
              <p className="text-white/25 text-xs">This may take a few moments</p>
            </div>

            {/* Prompt cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { title: 'Hooks Prompt',    desc: 'Write 10 scroll-stopping hooks for this brand and offer.' },
                { title: 'CTAs Prompt',     desc: 'Write 10 clear CTAs that drive clicks, calls, signups, or purchases.' },
                { title: 'Captions Prompt', desc: 'Write 10 engaging captions that build trust and drive action.' },
                { title: 'UGC Brief Prompt',desc: 'Create a UGC brief with angle, audience, deliverables, and tone.' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-white/3 border border-white/8 rounded-xl p-4 text-left space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white/70 text-xs font-semibold">{title}</p>
                    <span className="flex items-center gap-1 text-[9px] font-bold bg-[#FF3B1A]/15 text-[#FF3B1A] px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-[#FF3B1A] animate-pulse" />
                      Generating
                    </span>
                  </div>
                  <p className="text-white/30 text-[11px] leading-relaxed">{desc}</p>
                  <div className="space-y-1.5">
                    {[75, 55, 85].map((w, i) => (
                      <div key={i} className="h-1 bg-white/6 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF3B1A]/25 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 200}ms` }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!running && !strategy && (
          <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF3B1A]/10 flex items-center justify-center mx-auto">
              <Sparkles size={24} className="text-[#FF3B1A]" />
            </div>
            <div>
              <p className="text-white font-semibold">Run Strategy AI to generate your plan</p>
              <p className="text-white/35 text-sm mt-1.5 max-w-sm mx-auto">Talk to Strategy AI above to build your Super Brain, then click Run Strategy AI to generate hooks, captions, briefs, CTAs, and your full growth plan.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
              {([['Hooks', Zap], ['Captions', AlignLeft], ['Briefs', FileText], ['Growth Plan', TrendingUp]] as [string, React.ElementType][]).map(([label, Icon]) => (
                <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3 text-center">
                  <div className="w-6 h-6 rounded-lg bg-[#FF3B1A]/12 flex items-center justify-center mx-auto mb-2"><Icon size={12} className="text-[#FF3B1A]" /></div>
                  <p className="text-white/40 text-[11px] font-semibold">{label}</p>
                  <div className="mt-2 space-y-1">{[70, 50, 80].map((w, i) => <div key={i} className="h-1 bg-white/6 rounded-full mx-auto" style={{ width: `${w}%` }} />)}</div>
                </div>
              ))}
            </div>
            <button onClick={runStrategy} className="inline-flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition">
              <Play size={13} /> Run Strategy AI
            </button>
          </div>
        )}

        {/* ── Accordions ── */}
        {!running && strategy && (
          <div className="space-y-3">

            {/* 1. Strategy Summary */}
            <AccordionSection id="summary" title="Strategy Summary" Icon={Star} isOpen={openSections.has('summary')} onToggle={() => toggleSection('summary')}>
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  ['mainDirection',    'Main Direction',              strategy.strategySummary.mainDirection],
                  ['thisWeeksFocus',   "This Week's Focus",          strategy.strategySummary.thisWeeksFocus],
                  ['bestOpportunity',  'Best Opportunity',            strategy.strategySummary.bestOpportunity],
                  ['whyThisMatters',   'Why This Strategy Matters',   strategy.strategySummary.whyThisMatters],
                ] as [string, string, string][]).map(([field, label, value]) => (
                  <div key={field} className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                      <EditControls section="summary" index={0} item={{ [field]: value }} />
                    </div>
                    {isEditing('summary', 0) && editDraft[field] !== undefined ? (
                      <><InlineEditArea field={field} /><SaveCancelRow /></>
                    ) : (
                      <p className="text-white/75 text-sm leading-relaxed">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 2. Hooks */}
            <AccordionSection id="hooks" title={`Hooks (${strategy.hooks.length})`} Icon={Zap} isOpen={openSections.has('hooks')} onToggle={() => toggleSection('hooks')}>
              <div className="space-y-2">
                {strategy.hooks.map((h, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        {isEditing('hooks', i) ? (
                          <><InlineEditArea field="text" /><SaveCancelRow /></>
                        ) : (
                          <p className="text-white/80 text-sm leading-relaxed italic">&ldquo;{h.text}&rdquo;</p>
                        )}
                      </div>
                    </div>
                    {!isEditing('hooks', i) && (
                      <div className="flex items-center gap-1.5 flex-wrap pl-8">
                        <span className="text-[9px] font-semibold bg-white/6 text-white/35 px-2 py-0.5 rounded-full">{h.type}</span>
                        <CopyBtn text={h.text} />
                        <EditControls section="hooks" index={i} item={{ text: h.text, type: h.type }} />
                        <ActionBtn icon={BookOpen} label="Brief" onClick={() => { /* future: create brief from hook */ }} />
                        <ActionBtn icon={Trash2} label="Delete" danger onClick={() => deleteItem('hooks', i)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 3. Captions */}
            <AccordionSection id="captions" title={`Captions (${strategy.captions.length})`} Icon={AlignLeft} isOpen={openSections.has('captions')} onToggle={() => toggleSection('captions')}>
              <div className="space-y-3">
                {strategy.captions.map((c, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
                    {isEditing('captions', i) ? (
                      <>
                        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">Caption</p>
                        <InlineEditArea field="text" />
                        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mt-2">Platform</p>
                        <input value={editDraft.platform ?? ''} onChange={e => setEditDraft(p => ({ ...p, platform: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none" />
                        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mt-2">CTA</p>
                        <input value={editDraft.cta ?? ''} onChange={e => setEditDraft(p => ({ ...p, cta: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none" />
                        <SaveCancelRow />
                      </>
                    ) : (
                      <>
                        <p className="text-white/80 text-sm leading-relaxed">{c.text}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] bg-[#FF3B1A]/10 text-[#FF3B1A] px-2 py-0.5 rounded-full font-medium">{c.platform}</span>
                          <span className="text-[10px] bg-white/6 text-white/35 px-2 py-0.5 rounded-full">CTA: {c.cta}</span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <CopyBtn text={c.text} />
                            <EditControls section="captions" index={i} item={{ text: c.text, platform: c.platform, cta: c.cta }} />
                            <ActionBtn icon={Trash2} label="Delete" danger onClick={() => deleteItem('captions', i)} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 4. CTA Strategy */}
            <AccordionSection id="cta" title="CTA Strategy" Icon={Target} isOpen={openSections.has('cta')} onToggle={() => toggleSection('cta')}>
              <div className="grid sm:grid-cols-2 gap-3">
                {strategy.ctaStrategy.map((c, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
                    {isEditing('ctaStrategy', i) ? (
                      <>
                        {(['cta', 'bestUseCase', 'whyItWorks'] as const).map(field => (
                          <div key={field}>
                            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{field === 'cta' ? 'CTA Text' : field === 'bestUseCase' ? 'Best Use Case' : 'Why It Works'}</p>
                            <input value={editDraft[field] ?? ''} onChange={e => setEditDraft(p => ({ ...p, [field]: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none" />
                          </div>
                        ))}
                        <SaveCancelRow />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-white font-semibold text-sm">{c.cta}</p>
                          <div className="flex gap-1">
                            <CopyBtn text={c.cta} />
                            <EditControls section="ctaStrategy" index={i} item={{ cta: c.cta, bestUseCase: c.bestUseCase, whyItWorks: c.whyItWorks }} />
                            <ActionBtn icon={Trash2} label="" danger onClick={() => deleteItem('ctaStrategy', i)} />
                          </div>
                        </div>
                        <p className="text-white/40 text-[11px]"><span className="text-white/25">Use case:</span> {c.bestUseCase}</p>
                        <p className="text-white/40 text-[11px]"><span className="text-white/25">Why:</span> {c.whyItWorks}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 5. Content Ideas */}
            <AccordionSection id="ideas" title={`Content Ideas (${strategy.contentIdeas.length})`} Icon={Lightbulb} isOpen={openSections.has('ideas')} onToggle={() => toggleSection('ideas')}>
              <div className="space-y-2">
                {strategy.contentIdeas.map((idea, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 space-y-2">
                    {isEditing('contentIdeas', i) ? (
                      <>
                        {(['title', 'angle', 'platform'] as const).map(field => (
                          <div key={field}>
                            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</p>
                            <input value={editDraft[field] ?? ''} onChange={e => setEditDraft(p => ({ ...p, [field]: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none" />
                          </div>
                        ))}
                        <SaveCancelRow />
                      </>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium">{idea.title}</p>
                          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{idea.angle}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] bg-[#FF3B1A]/10 text-[#FF3B1A] px-2 py-0.5 rounded-full font-medium">{idea.platform}</span>
                            <EditControls section="contentIdeas" index={i} item={{ title: idea.title, angle: idea.angle, platform: idea.platform }} />
                            <ActionBtn icon={FileText} label="Create Brief" onClick={() => setBriefModal({
                              title: idea.title, hook: `Hook for: ${idea.title}`, angle: idea.angle,
                              script: '', shotList: [], cta: 'Book a call',
                              platforms: [idea.platform], whyItWorks: idea.whyItWorks ?? '',
                            })} />
                            <ActionBtn icon={Trash2} label="Delete" danger onClick={() => deleteItem('contentIdeas', i)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 6. UGC Video Briefs */}
            <AccordionSection id="briefs" title={`UGC Video Briefs (${strategy.ugcVideoBriefs.length})`} Icon={FileText} isOpen={openSections.has('briefs')} onToggle={() => toggleSection('briefs')}>
              <div className="space-y-4">
                {strategy.ugcVideoBriefs.map((b, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{b.title}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {(b.platforms ?? []).map(p => <span key={p} className="text-[10px] bg-[#FF3B1A]/10 text-[#FF3B1A] px-2 py-0.5 rounded-full font-medium">{p}</span>)}
                          {b.status === 'Sent to Fire Creator' && <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium">Sent to Fire Creator</span>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap shrink-0">
                        <button onClick={() => { setBriefModal(b); setEditBrief(null) }} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition">
                          <Pencil size={9} /> Edit
                        </button>
                        <button
                          onClick={() => updateBriefStatus(b.title, 'Sent to Fire Creator')}
                          disabled={b.status === 'Sent to Fire Creator'}
                          className="flex items-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:bg-white/10 disabled:text-white/30 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <Flame size={10} /> Send to Fire Creator
                        </button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {([['Hook', b.hook], ['Angle', b.angle], ['Script', b.script], ['Why This Works', b.whyItWorks]] as [string, string][]).map(([label, text]) => (
                        <div key={label} className="space-y-1">
                          <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                          <p className="text-white/60 text-xs leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>
                    {b.shotList?.length ? (
                      <div className="space-y-1">
                        <p className="text-white/25 text-[10px] font-semibold uppercase tracking-wide">Shot List</p>
                        <div className="flex flex-wrap gap-2">
                          {b.shotList.map((s, si) => <span key={si} className="text-[10px] bg-white/5 border border-white/8 text-white/50 px-2.5 py-1 rounded-lg">{s}</span>)}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-3">
                      <span className="text-white/25 text-[10px] font-semibold uppercase tracking-wide">CTA:</span>
                      <span className="text-[#FF3B1A] text-xs font-semibold">{b.cta}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <ActionBtn icon={Trash2} label="Delete" danger onClick={() => deleteItem('ugcVideoBriefs', i)} />
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 7. Fire Creator Tasks */}
            <AccordionSection id="tasks" title={`Fire Creator Tasks (${strategy.fireCreatorTasks.length})`} Icon={Flame} isOpen={openSections.has('tasks')} onToggle={() => toggleSection('tasks')}>
              <div className="space-y-2">
                {strategy.fireCreatorTasks.map((t, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 space-y-2">
                    {isEditing('fireCreatorTasks', i) ? (
                      <>
                        <div>
                          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Task</p>
                          <input value={editDraft.task ?? ''} onChange={e => setEditDraft(p => ({ ...p, task: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none" />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Priority</p>
                            <select value={editDraft.priority ?? 'Medium'} onChange={e => setEditDraft(p => ({ ...p, priority: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none">
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Status</p>
                            <input value={editDraft.status ?? ''} onChange={e => setEditDraft(p => ({ ...p, status: e.target.value }))} className="w-full bg-white/5 border border-[#FF3B1A]/40 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none" />
                          </div>
                        </div>
                        <SaveCancelRow />
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-white/80 text-sm flex-1">{t.task}</p>
                        <PriorityBadge p={t.priority} />
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'Done' ? 'bg-green-500/15 text-green-400' : t.status === 'Sent to Fire Creator' ? 'bg-blue-500/15 text-blue-300' : 'bg-white/6 text-white/30'}`}>{t.status}</span>
                        <div className="flex gap-1">
                          <EditControls section="fireCreatorTasks" index={i} item={{ task: t.task, priority: t.priority, status: t.status }} />
                          <ActionBtn icon={CheckCircle2} label="Done" onClick={() => updateTaskStatus(i, 'Done')} />
                          <ActionBtn icon={Flame} label="Send" onClick={() => updateTaskStatus(i, 'Sent to Fire Creator')} />
                          <ActionBtn icon={Trash2} label="" danger onClick={() => deleteItem('fireCreatorTasks', i)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 8. Growth Plan */}
            <AccordionSection id="growth" title="Growth Plan" Icon={TrendingUp} isOpen={openSections.has('growth')} onToggle={() => toggleSection('growth')}>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    ['Where to Post',        BarChart2,    strategy.growthPlan.whereToPost,         'text-[#FF3B1A]'],
                    ['Weekly Posting Plan',   CheckCircle2, strategy.growthPlan.weeklyPostingPlan,    'text-green-400'],
                    ['What to Test',          Mic2,         strategy.growthPlan.whatToTest,            'text-[#FF3B1A]'],
                    ['What to Measure',       BarChart2,    strategy.growthPlan.whatToMeasure,         'text-white/30'],
                  ] as [string, React.ElementType, string[], string][]).map(([label, Icon, items]) => (
                    <div key={label} className="space-y-2">
                      <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                      {items.map((item, ii) => (
                        <div key={ii} className="flex items-start gap-2 bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                          <Icon size={11} className="text-[#FF3B1A] mt-0.5 shrink-0" />
                          <p className="text-white/60 text-xs flex-1">{item}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {strategy.growthPlan.whatToDoubleDownOn?.length ? (
                  <div className="bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl p-4">
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-2">Double Down On</p>
                    {strategy.growthPlan.whatToDoubleDownOn.map((item, i) => <p key={i} className="text-white/70 text-sm leading-relaxed">{item}</p>)}
                  </div>
                ) : null}
                {strategy.growthPlan.nextSevenDays?.length ? (
                  <div className="space-y-2">
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">Next 7-Day Action Plan</p>
                    {strategy.growthPlan.nextSevenDays.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                        <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-white/70 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </AccordionSection>

          </div>
        )}
      </div>

      {/* ── Brief View/Edit Modal ── */}
      {briefModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setBriefModal(null); setEditBrief(null) }}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl space-y-4 my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">{editBrief ? 'Edit Brief' : 'UGC Video Brief'}</p>
              <div className="flex gap-2">
                {!editBrief && <button onClick={() => setEditBrief({ ...briefModal })} className="flex items-center gap-1 text-[10px] font-semibold border border-white/10 text-white/40 hover:text-white px-2.5 py-1.5 rounded-lg transition"><Pencil size={9} /> Edit</button>}
                <button onClick={() => { setBriefModal(null); setEditBrief(null) }}><X size={16} className="text-white/30 hover:text-white" /></button>
              </div>
            </div>

            {editBrief ? (
              <div className="space-y-3">
                {([
                  ['title', 'Title'], ['hook', 'Hook'], ['angle', 'Angle'], ['script', 'Script (talking points)'],
                  ['cta', 'CTA'], ['whyItWorks', 'Why This Works'], ['fireCreatorNotes', 'Creator Notes'],
                ] as [keyof Brief, string][]).map(([field, label]) => (
                  <div key={field}>
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</p>
                    {field === 'script' || field === 'whyItWorks' || field === 'fireCreatorNotes' ? (
                      <textarea
                        value={(editBrief[field] as string) ?? ''}
                        onChange={e => setEditBrief(prev => prev ? ({ ...prev, [field]: e.target.value }) : null)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A] resize-none"
                      />
                    ) : (
                      <input
                        value={(editBrief[field] as string) ?? ''}
                        onChange={e => setEditBrief(prev => prev ? ({ ...prev, [field]: e.target.value }) : null)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A]"
                      />
                    )}
                  </div>
                ))}
                <div>
                  <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Shot List (one per line)</p>
                  <textarea
                    value={editBrief.shotList?.join('\n') ?? ''}
                    onChange={e => setEditBrief(prev => prev ? ({ ...prev, shotList: e.target.value.split('\n').filter(Boolean) }) : null)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A] resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveBriefEdit} className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm py-2.5 rounded-xl transition">Save Brief</button>
                  <button onClick={() => setEditBrief(null)} className="flex-1 border border-white/10 text-white/40 hover:text-white text-sm py-2.5 rounded-xl transition">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {([
                  ['Hook', briefModal.hook], ['Angle', briefModal.angle],
                  ['Script', briefModal.script], ['Why This Works', briefModal.whyItWorks],
                  ['CTA', briefModal.cta],
                ] as [string, string][]).filter(([, v]) => v).map(([label, text]) => (
                  <div key={label}>
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
                {briefModal.shotList?.length ? (
                  <div>
                    <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-2">Shot List</p>
                    <div className="flex flex-wrap gap-2">
                      {briefModal.shotList.map((s, i) => <span key={i} className="text-[10px] bg-white/5 border border-white/8 text-white/50 px-2.5 py-1 rounded-lg">{s}</span>)}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Memory Modal ── */}
      {showAddMemory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowAddMemory(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Add Memory</p>
              <button onClick={() => setShowAddMemory(false)}><X size={16} className="text-white/30 hover:text-white" /></button>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Stage</p>
              <select value={memStage} onChange={e => setMemStage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                {['brand', 'competitors', 'content', 'strategy', 'growth'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Title</p>
              <input value={memTitle} onChange={e => setMemTitle(e.target.value)} placeholder="e.g. Brand differentiator" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] placeholder:text-white/20" />
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Notes</p>
              <textarea value={memContent} onChange={e => setMemContent(e.target.value)} rows={4} placeholder="What should Strategy AI remember?" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] resize-none placeholder:text-white/20" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveMemory} disabled={!memTitle.trim() || !memContent.trim() || modalSaving} className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition">
                {modalSaving ? 'Saving…' : 'Save Memory'}
              </button>
              <button onClick={() => setShowAddMemory(false)} className="flex-1 border border-white/10 text-white/40 hover:text-white text-sm py-2.5 rounded-xl transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Link Modal ── */}
      {showAddLink && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowAddLink(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Add Link</p>
              <button onClick={() => setShowAddLink(false)}><X size={16} className="text-white/30 hover:text-white" /></button>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Stage</p>
              <select value={linkStage} onChange={e => setLinkStage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                {['brand', 'competitors', 'content', 'strategy', 'growth'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">URL</p>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://…" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] placeholder:text-white/20" />
            </div>
            <div>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Notes (optional)</p>
              <textarea value={linkNotes} onChange={e => setLinkNotes(e.target.value)} rows={3} placeholder="What's this link for?" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A] resize-none placeholder:text-white/20" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveLink} disabled={!linkUrl.trim() || modalSaving} className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition">
                {modalSaving ? 'Saving…' : 'Save Link'}
              </button>
              <button onClick={() => setShowAddLink(false)} className="flex-1 border border-white/10 text-white/40 hover:text-white text-sm py-2.5 rounded-xl transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
