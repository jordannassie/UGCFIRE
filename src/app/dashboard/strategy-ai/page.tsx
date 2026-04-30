'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany } from '@/lib/data'
import { isDemoMode, DEMO_BRAND_BRIEF, DEMO_COMPANY } from '@/lib/demoData'
import { calcBrandContext } from '@/lib/brandCompletion'
import {
  Sparkles, Brain, Send, Copy, Check, X, ChevronDown, ChevronUp,
  Target, Users, Video, Layers, Film, Star, Shield, RefreshCw, User,
  CheckCircle2, Zap,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface UgcAngle { title: string; whyItWorks: string; bestUseCase: string; exampleCommercialIdea: string }
interface Scene {
  category: string; sceneTitle: string; purpose: string; whatToShow: string
  location: string; propsNeeded: string[]; talentDirection: string
  suggestedSpokenMoment: string; whyItWorks: string
}
interface ReusableScene { sceneTitle: string; whyReusable: string; usedInCommercialIdeas: string[] }
interface CommercialIdea {
  title: string; goal: string; productionType: string; difficulty: string
  bestFor: string; priority: string; openingMoment: string; sceneDescription: string
  shotList: string[]; aiVideoPrompt: string; voiceoverSpokenDirection: string
  ctaDirection: string; editingStyle: string; propsLocationTalent: string[]
  variationIdeas: string[]; ugcFireProductionNotes: string; doNotInclude: string[]
}
interface VideoRecipe {
  recipeName: string; length: string; bestFor: string; sceneSequence: string[]
  openingMoment: string; shotOrder: string[]; voiceoverSpokenDirection: string
  ctaDirection: string; editingNotes: string; aiVideoPrompt: string; doNotInclude: string[]
}
interface FirstBatchItem {
  title: string; whyMakeThisFirst: string; difficulty: string; productionType: string
  priority: string; assetsNeeded: string[]; sceneBankScenesUsed: string[]
}
interface CreativeRules {
  brandRules: string[]; productionRules: string[]; claimsToAvoid: string[]
  doNotIncludeRules: string[]; qualityNotes: string[]
  whatMakesThisWork: string[]; creativeAvoidList: string[]
}
interface FactoryOutput {
  brandProductRead: string
  contentIngredients: string[]
  bestOpportunities: string[]
  ugcMarketingAngles: UgcAngle[]
  sceneBank: Scene[]
  reusableScenesToCaptureFirst: ReusableScene[]
  commercialIdeas: CommercialIdea[]
  videoRecipes: VideoRecipe[]
  firstBatchRecommendation: FirstBatchItem[]
  creativeRules: CreativeRules
}

interface ChatMsg { id: string; role: 'user' | 'assistant'; text: string }

const STORAGE_KEY = 'ugcfire_factory_v1'

const IDEA_COUNTS = ['8 ideas', '20 ideas', '40 ideas']
const COMMERCIAL_STYLES = ['Mixed', 'Authentic UGC', 'Product Demo', 'Lifestyle', 'Founder-Led', 'Reaction-Style', 'Testimonial-Style', 'Sensory / ASMR', 'Direct Response']
const PRODUCTION_TYPES = ['Mixed Production', 'AI Video', 'Real Creator', 'Product B-Roll', 'Founder-Led', 'Photo-to-Video', 'Voiceover Only']
const OUTPUT_TABS = ['Overview', 'Angles', 'Scene Bank', 'Commercial Ideas', 'Video Recipes', 'First Batch', 'Creative Rules'] as const
type OutputTab = typeof OUTPUT_TABS[number]

const CHAT_CHIPS = [
  'Give me more commercial ideas', 'Generate more scenes', 'Make this more premium',
  'Make this more fun', 'Make this more direct response', 'Create more AI video prompts',
  'Create more lifestyle concepts', 'Create more product demo concepts',
]

// ── Small helpers ──────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1800) }}
      className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${done ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/35 hover:text-white hover:border-white/20'}`}
    >
      {done ? <><Check size={9} /> Copied</> : <><Copy size={9} /> {label}</>}
    </button>
  )
}

function PriorityBadge({ p }: { p: string }) {
  const s = p === 'High' ? 'bg-[#FF3B1A]/15 text-[#FF3B1A]' : p === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/8 text-white/35'
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s}`}>{p}</span>
}

function DiffBadge({ d }: { d: string }) {
  const s = d === 'Easy' ? 'bg-green-500/15 text-green-400' : d === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s}`}>{d}</span>
}

function ListItems({ items, className = '' }: { items: string[]; className?: string }) {
  if (!items?.length) return <p className="text-white/25 text-xs italic">None specified</p>
  return (
    <ul className={`space-y-1 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
          <span className="mt-1 w-1 h-1 rounded-full bg-[#FF3B1A]/60 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  )
}

// ── Commercial Idea Card ───────────────────────────────────────────────────

function CommercialIdeaCard({ idea, index }: { idea: CommercialIdea; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left hover:bg-white/2 transition"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{index + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{idea.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-[9px] bg-white/6 text-white/40 px-2 py-0.5 rounded-full">{idea.productionType}</span>
              <DiffBadge d={idea.difficulty} />
              <PriorityBadge p={idea.priority} />
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-white/30 shrink-0 mt-1" /> : <ChevronDown size={14} className="text-white/30 shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="border-t border-white/6 px-4 py-5 space-y-5">
          {/* Goal / Best For */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[['Goal', idea.goal], ['Best For', idea.bestFor]].map(([label, val]) => (
              <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-white/70 text-xs leading-relaxed">{val}</p>
              </div>
            ))}
          </div>

          {/* Opening Moment + Scene Description */}
          {[['Opening Moment', idea.openingMoment], ['Scene Description', idea.sceneDescription]].map(([label, val]) => val ? (
            <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-white/70 text-xs leading-relaxed">{val}</p>
            </div>
          ) : null)}

          {/* Shot List */}
          {idea.shotList?.length > 0 && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">Shot List</p>
                <CopyBtn text={idea.shotList.join('\n')} label="Copy Shot List" />
              </div>
              <ListItems items={idea.shotList} />
            </div>
          )}

          {/* AI Video Prompt */}
          {idea.aiVideoPrompt && (
            <div className="bg-[#FF3B1A]/5 border border-[#FF3B1A]/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#FF3B1A] text-[10px] font-semibold uppercase tracking-wide">Copy/Paste AI Video Prompt</p>
                <CopyBtn text={idea.aiVideoPrompt} label="Copy AI Prompt" />
              </div>
              <p className="text-white/65 text-xs leading-relaxed whitespace-pre-wrap">{idea.aiVideoPrompt}</p>
            </div>
          )}

          {/* Voiceover / CTA / Editing */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              ['Voiceover / Spoken Direction', idea.voiceoverSpokenDirection],
              ['CTA Direction', idea.ctaDirection],
              ['Editing Style', idea.editingStyle],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-3">
                <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</p>
                <p className="text-white/65 text-xs leading-relaxed">{val}</p>
              </div>
            ))}
          </div>

          {/* Props / Location / Talent */}
          {idea.propsLocationTalent?.length > 0 && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-2">Props / Location / Talent</p>
              <ListItems items={idea.propsLocationTalent} />
            </div>
          )}

          {/* Variation Ideas */}
          {idea.variationIdeas?.length > 0 && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-2">Variation Ideas</p>
              <ListItems items={idea.variationIdeas} />
            </div>
          )}

          {/* Production Notes */}
          {idea.ugcFireProductionNotes && (
            <div className="bg-white/3 border border-white/6 rounded-xl p-3">
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide mb-1">Production Notes</p>
              <p className="text-white/55 text-xs leading-relaxed">{idea.ugcFireProductionNotes}</p>
            </div>
          )}

          {/* Do Not Include */}
          {idea.doNotInclude?.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
              <p className="text-red-400/70 text-[10px] font-semibold uppercase tracking-wide mb-2">Do Not Include</p>
              <ListItems items={idea.doNotInclude} />
            </div>
          )}

          {/* Copy full brief */}
          <div className="flex gap-2">
            <CopyBtn label="Copy Production Brief" text={[
              `COMMERCIAL IDEA: ${idea.title}`,
              `Goal: ${idea.goal}`, `Production Type: ${idea.productionType}`,
              `Opening Moment: ${idea.openingMoment}`,
              `Scene Description: ${idea.sceneDescription}`,
              `Shot List:\n${idea.shotList?.map(s => `- ${s}`).join('\n')}`,
              `AI Video Prompt:\n${idea.aiVideoPrompt}`,
              `Voiceover: ${idea.voiceoverSpokenDirection}`,
              `CTA: ${idea.ctaDirection}`,
              `Do Not Include:\n${idea.doNotInclude?.map(s => `- ${s}`).join('\n')}`,
            ].filter(Boolean).join('\n\n')} />
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

  // Generation controls
  const [ideaCount, setIdeaCount] = useState('8 ideas')
  const [commercialStyle, setCommercialStyle] = useState('Mixed')
  const [productionType, setProductionType] = useState('Mixed Production')

  // Factory output
  const [factory, setFactory] = useState<FactoryOutput | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState('')
  const [approved, setApproved] = useState(false)
  const [activeTab, setActiveTab] = useState<OutputTab>('Overview')

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'init', role: 'assistant', text: "Ask me for more commercial ideas, new scenes, different styles, or creative direction changes. I'll use your brand context to help." }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Load brand brief + restore cached factory ──────────────────────────
  useEffect(() => {
    // Restore factory from localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.factory) { setFactory(saved.factory); setApproved(saved.approved ?? false) }
      }
    } catch { /* ignore */ }

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

  // ── Run factory ──────────────────────────────────────────────────────────
  async function runFactory() {
    setRunning(true)
    setRunError('')
    setApproved(false)

    const ERROR_MESSAGES: Record<string, string> = {
      MISSING_OPENAI_KEY: 'Strategy AI is not configured yet. Please contact support.',
      OPENAI_REQUEST_FAILED: 'Strategy AI could not generate right now. Check your OpenAI key, API route logs, or JSON response format.',
      OPENAI_GENERATION_FAILED: 'Strategy AI could not connect to OpenAI. Please try again in a moment.',
      OPENAI_JSON_PARSE_FAILED: 'Strategy AI returned an unexpected response format. Please try again.',
      JSON_PARSE_FAILED: 'Strategy AI returned an unexpected response. Please try again.',
      SUPABASE_SAVE_FAILED: 'Strategy was generated but could not be saved. Your results are still shown below.',
    }

    try {
      const payload = {
        userId,
        setupLevel: context.setupLevel,
        completionPercentage: context.completionPercentage,
        confidenceLabel: context.confidenceLabel,
        brandBrief,
        selectedIdeaCount: ideaCount,
        selectedCommercialStyle: commercialStyle,
        selectedProductionType: productionType,
      }
      console.log('[runFactory] Calling /api/strategy/run', { setupLevel: payload.setupLevel, ideaCount })

      const res = await fetch('/api/strategy/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('[runFactory] Response status:', res.status)
      const data = await res.json()
      console.log('[runFactory] Response body keys:', Object.keys(data ?? {}).join(', '))

      if (!res.ok || data.ok === false) {
        const code = data.error as string | undefined
        const details = (data.details ?? data.detail ?? '') as string
        const msg = (code && ERROR_MESSAGES[code]) ?? code ?? 'Strategy AI could not generate right now. Please try again.'
        console.error('[runFactory] API error code:', code)
        console.error('[runFactory] API error details:', details)
        if (data.truncated) console.warn('[runFactory] Output was truncated by OpenAI (token limit hit)')
        setRunError(msg)
        return
      }

      // Unwrap { ok, factory } envelope; fall back to data itself for backward compat
      const factoryOutput = (data.factory ?? data) as FactoryOutput
      console.log('[runFactory] Factory received. Ideas:', factoryOutput.commercialIdeas?.length ?? 0)

      setFactory(factoryOutput)
      setActiveTab('Overview')
      persist({ factory: factoryOutput, approved: false })
      document.getElementById('factory-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e) {
      console.error('[runFactory] Fetch error:', (e as Error).message)
      setRunError('Strategy AI could not generate right now. Please try again.')
    } finally {
      setRunning(false)
    }
  }

  function handleApprove() {
    setApproved(true)
    persist({ approved: true })
  }

  // ── Chat ─────────────────────────────────────────────────────────────────
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

  // ── Confidence color ─────────────────────────────────────────────────────
  const confColor = context.confidenceLabel === 'High' ? 'text-green-400' : context.confidenceLabel === 'Medium' ? 'text-yellow-400' : 'text-white/40'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy AI</h1>
          <p className="text-white/40 text-sm mt-0.5">Generate commercial ideas, scenes, hooks, video recipes, and production prompts from your brand setup.</p>
        </div>
      </div>

      {/* ── Error ── */}
      {runError && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          <span>{runError}</span>
          <button onClick={() => setRunError('')}><X size={14} /></button>
        </div>
      )}

      {/* ── Brand Context Card ── */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 space-y-4 overflow-hidden max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Brand Context</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
              <span className="text-white/40">Setup: <span className="text-white font-semibold">{context.setupLevel}</span></span>
              <span className="text-white/20">·</span>
              <span className="text-white/40">Completion: <span className="text-white font-semibold">{context.completionPercentage}%</span></span>
              <span className="text-white/20">·</span>
              <span className="text-white/40">Confidence: <span className={`font-semibold ${confColor}`}>{context.confidenceLabel}</span></span>
            </div>
            {brandBrief && (
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/35">
                {brandBrief.offer && <span className="break-words max-w-full"><span className="text-white/20">Offer:</span> {String(brandBrief.offer).slice(0, 60)}{String(brandBrief.offer).length > 60 ? '…' : ''}</span>}
                {(brandBrief as Record<string, unknown> & { notes?: string }).notes?.includes('"main_goal"') && (
                  <span><span className="text-white/20">Goal:</span> {(JSON.parse((brandBrief as Record<string, unknown> & { notes?: string }).notes ?? '{}') as Record<string, string>).main_goal}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
            <Link href="/dashboard/your-brand" className="flex items-center justify-center gap-1.5 text-xs font-semibold border border-white/12 text-white/50 hover:text-white hover:border-white/25 px-3.5 py-2.5 rounded-lg transition w-full sm:w-auto">
              <Target size={11} /> Improve Your Brand
            </Link>
            <button
              onClick={runFactory}
              disabled={running}
              className="flex items-center justify-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition w-full sm:w-auto"
            >
              {running ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" /> : <Sparkles size={13} className="shrink-0" />}
              <span className="truncate">{running ? 'Building…' : 'Generate UGC Commercial Factory'}</span>
            </button>
          </div>
        </div>
        <p className="text-white/25 text-xs">Strategy AI can run anytime. The more details you add, the better the ideas get.</p>
      </div>

      {/* ── What Strategy AI Will Use ── */}
      <div>
        <p className="text-white font-semibold text-sm mb-3">What Strategy AI Will Use</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              Icon: Target, label: 'Business',
              items: [
                brandBrief?.company_name ? `Business: ${brandBrief.company_name}` : 'Business name missing',
                brandBrief?.website ? `Website: ${String(brandBrief.website).replace('https://', '')}` : 'Website missing',
                brandBrief?.offer ? String(brandBrief.offer).slice(0, 50) + '…' : 'What you sell: missing',
              ],
            },
            {
              Icon: Layers, label: 'Product & Offer',
              items: [
                brandBrief?.offer ? `Offer: ${String(brandBrief.offer).slice(0, 40)}…` : 'Main offer: missing',
                brandBrief?.target_customer ? `Customer: ${String(brandBrief.target_customer).slice(0, 40)}…` : 'Target customer: missing',
              ],
            },
            {
              Icon: Users, label: 'Audience',
              items: [
                brandBrief?.target_customer ? String(brandBrief.target_customer).slice(0, 60) + '…' : 'Ideal customer: missing',
              ],
            },
            {
              Icon: Film, label: 'Creative Direction',
              items: [
                brandBrief?.video_styles ? `Style: ${String(brandBrief.video_styles).slice(0, 40)}…` : 'Video styles: missing',
                brandBrief?.examples ? `Examples: added` : 'Example links: missing',
              ],
            },
          ].map(({ Icon, label, items }) => (
            <div key={label} className="bg-[#0d0d0d] border border-white/8 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FF3B1A]/12 flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-[#FF3B1A]" />
                </div>
                <p className="text-white/70 text-xs font-semibold">{label}</p>
              </div>
              {items.map((item, i) => (
                <p key={i} className="text-white/35 text-[11px] leading-relaxed">{item}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Generation Controls ── */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 space-y-5">
        <div>
          <p className="text-white font-semibold text-sm">Generate UGC Commercial Factory</p>
          <p className="text-white/35 text-xs mt-0.5">Create commercial ideas your team can produce using AI video tools, creators, product B-roll, or editing tools.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-white/40 text-xs mb-1.5">Number of Commercial Ideas</label>
            <div className="flex gap-1.5 flex-wrap">
              {IDEA_COUNTS.map(c => (
                <button key={c} type="button" onClick={() => setIdeaCount(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${ideaCount === c ? 'bg-[#FF3B1A]/18 border-[#FF3B1A]/50 text-white' : 'border-white/10 text-white/40 hover:border-white/25'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1.5">Commercial Style</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A]" value={commercialStyle} onChange={e => setCommercialStyle(e.target.value)}>
              {COMMERCIAL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1.5">Production Type</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF3B1A]" value={productionType} onChange={e => setProductionType(e.target.value)}>
              {PRODUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {context.setupLevel === 'Empty' && (
          <p className="text-white/30 text-xs">Strategy will be generated with the context available. Add more brand details later to improve future versions.</p>
        )}

        <button
          onClick={runFactory}
          disabled={running}
          className="flex items-center justify-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-bold text-sm px-6 py-3 rounded-xl transition w-full sm:w-auto"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" /> : <Sparkles size={14} className="shrink-0" />}
          <span className="truncate">{running ? 'Building your UGC Commercial Factory…' : 'Generate UGC Commercial Factory'}</span>
        </button>
      </div>

      {/* ── Loading State ── */}
      {running && (
        <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-10 text-center space-y-6">
          <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto' }}>
            <div className="animate-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#FF3B1A', borderRightColor: 'rgba(255,59,26,0.35)', animationDuration: '1.6s' }} />
            <div className="animate-spin" style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: '#FF3B1A', borderLeftColor: 'rgba(255,59,26,0.25)', animationDuration: '2.4s', animationDirection: 'reverse' }} />
            <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', background: 'rgba(255,59,26,0.08)', boxShadow: '0 0 28px rgba(255,59,26,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={26} style={{ color: '#FF3B1A' }} />
            </div>
          </div>
          <div>
            <p className="text-white font-semibold">Strategy AI is building your UGC Commercial Factory…</p>
            <p className="text-white/35 text-sm mt-1">Generating commercial ideas, scenes, video recipes, and AI prompts</p>
            <p className="text-white/20 text-xs mt-1">This may take a few moments</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {['Commercial Ideas', 'Scene Bank', 'Video Recipes', 'AI Prompts'].map(label => (
              <div key={label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center space-y-2">
                <p className="text-white/55 text-xs font-semibold">{label}</p>
                <span className="flex items-center justify-center gap-1 text-[9px] font-bold bg-[#FF3B1A]/15 text-[#FF3B1A] px-2 py-0.5 rounded-full mx-auto w-fit">
                  <span className="w-1 h-1 rounded-full bg-[#FF3B1A] animate-pulse" /> Generating
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Factory Output ── */}
      {!running && factory && (
        <div id="factory-output" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-white font-semibold">Your UGC Commercial Factory</p>
              <p className="text-white/35 text-sm">{factory.commercialIdeas?.length ?? 0} commercial ideas · {factory.sceneBank?.length ?? 0} scenes · {factory.videoRecipes?.length ?? 0} video recipes</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!approved ? (
                <button onClick={handleApprove} className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-500/20 transition">
                  <CheckCircle2 size={13} /> Approve Strategy
                </button>
              ) : (
                <span className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-semibold px-4 py-2 rounded-lg">
                  <Check size={13} /> Approved
                </span>
              )}
              <button onClick={runFactory} className="flex items-center gap-2 border border-white/10 text-white/40 hover:text-white text-sm px-3 py-2 rounded-lg transition">
                <RefreshCw size={12} /> Regenerate
              </button>
            </div>
          </div>

          {/* Output Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {OUTPUT_TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition shrink-0 ${activeTab === t ? 'bg-[#FF3B1A] text-white' : 'bg-white/4 border border-white/8 text-white/45 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              {factory.brandProductRead && (
                <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-5">
                  <p className="text-white font-semibold text-sm mb-2">Brand & Product Read</p>
                  <p className="text-white/65 text-sm leading-relaxed">{factory.brandProductRead}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                {factory.contentIngredients?.length > 0 && (
                  <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4">
                    <p className="text-white font-semibold text-sm mb-2">Content Ingredients</p>
                    <ListItems items={factory.contentIngredients} />
                  </div>
                )}
                {factory.bestOpportunities?.length > 0 && (
                  <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4">
                    <p className="text-white font-semibold text-sm mb-2">Best Opportunities</p>
                    <ListItems items={factory.bestOpportunities} />
                  </div>
                )}
              </div>
              {factory.firstBatchRecommendation?.length > 0 && (
                <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4">
                  <p className="text-white font-semibold text-sm mb-2">First Batch Summary</p>
                  <div className="space-y-1">
                    {factory.firstBatchRecommendation.slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="w-4 h-4 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span><span className="text-white/80 font-medium">{item.title}</span> — {item.whyMakeThisFirst}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Angles ── */}
          {activeTab === 'Angles' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {(factory.ugcMarketingAngles ?? []).map((angle, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-2">
                  <p className="text-white font-semibold text-sm">{angle.title}</p>
                  <p className="text-white/40 text-xs"><span className="text-white/25">Why it works:</span> {angle.whyItWorks}</p>
                  <p className="text-white/40 text-xs"><span className="text-white/25">Best use case:</span> {angle.bestUseCase}</p>
                  <div className="bg-white/3 border border-white/6 rounded-lg p-2">
                    <p className="text-white/25 text-[10px] uppercase tracking-wide mb-0.5">Example Idea</p>
                    <p className="text-white/60 text-xs">{angle.exampleCommercialIdea}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Scene Bank ── */}
          {activeTab === 'Scene Bank' && (
            <div className="space-y-4">
              {factory.reusableScenesToCaptureFirst?.length > 0 && (
                <div className="bg-[#FF3B1A]/5 border border-[#FF3B1A]/20 rounded-xl p-4">
                  <p className="text-[#FF3B1A] font-semibold text-sm mb-3">Reusable Scenes to Capture First</p>
                  <div className="space-y-2">
                    {factory.reusableScenesToCaptureFirst.map((s, i) => (
                      <div key={i} className="bg-white/3 border border-white/6 rounded-lg p-3">
                        <p className="text-white/80 text-xs font-semibold">{s.sceneTitle}</p>
                        <p className="text-white/40 text-xs mt-0.5">{s.whyReusable}</p>
                        {s.usedInCommercialIdeas?.length > 0 && (
                          <p className="text-white/25 text-[10px] mt-1">Used in: {s.usedInCommercialIdeas.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Group scenes by category */}
              {Array.from(new Set((factory.sceneBank ?? []).map(s => s.category))).map(cat => (
                <div key={cat}>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-2">{cat}</p>
                  <div className="space-y-2">
                    {(factory.sceneBank ?? []).filter(s => s.category === cat).map((scene, i) => (
                      <div key={i} className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-2">
                        <p className="text-white font-semibold text-sm">{scene.sceneTitle}</p>
                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          {[['Purpose', scene.purpose], ['What to Show', scene.whatToShow], ['Location', scene.location], ['Talent Direction', scene.talentDirection]].filter(([, v]) => v).map(([label, val]) => (
                            <div key={label}><p className="text-white/25 mb-0.5">{label}</p><p className="text-white/60">{val}</p></div>
                          ))}
                        </div>
                        {scene.propsNeeded?.length > 0 && <p className="text-white/35 text-xs">Props: {scene.propsNeeded.join(', ')}</p>}
                        {scene.suggestedSpokenMoment && <p className="text-white/35 text-xs italic">&ldquo;{scene.suggestedSpokenMoment}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Commercial Ideas ── */}
          {activeTab === 'Commercial Ideas' && (
            <div className="space-y-3">
              <p className="text-white/35 text-xs">{factory.commercialIdeas?.length ?? 0} commercial ideas generated</p>
              {(factory.commercialIdeas ?? []).map((idea, i) => (
                <CommercialIdeaCard key={i} idea={idea} index={i} />
              ))}
            </div>
          )}

          {/* ── Tab: Video Recipes ── */}
          {activeTab === 'Video Recipes' && (
            <div className="space-y-4">
              {(factory.videoRecipes ?? []).map((recipe, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{recipe.recipeName}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] bg-white/6 text-white/40 px-2 py-0.5 rounded-full">{recipe.length}</span>
                        <span className="text-[9px] bg-white/6 text-white/40 px-2 py-0.5 rounded-full">{recipe.bestFor}</span>
                      </div>
                    </div>
                    {recipe.aiVideoPrompt && <CopyBtn text={recipe.aiVideoPrompt} label="Copy Recipe Prompt" />}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {recipe.sceneSequence?.length > 0 && (
                      <div>
                        <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1">Scene Sequence</p>
                        <ListItems items={recipe.sceneSequence} />
                      </div>
                    )}
                    {recipe.shotOrder?.length > 0 && (
                      <div>
                        <p className="text-white/30 text-[10px] uppercase tracking-wide mb-1">Shot Order</p>
                        <ListItems items={recipe.shotOrder} />
                      </div>
                    )}
                  </div>
                  {recipe.aiVideoPrompt && (
                    <div className="bg-[#FF3B1A]/5 border border-[#FF3B1A]/18 rounded-xl p-3">
                      <p className="text-[#FF3B1A] text-[10px] font-semibold uppercase tracking-wide mb-1">AI Video Prompt</p>
                      <p className="text-white/60 text-xs leading-relaxed">{recipe.aiVideoPrompt}</p>
                    </div>
                  )}
                  {recipe.doNotInclude?.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/12 rounded-xl p-3">
                      <p className="text-red-400/60 text-[10px] uppercase tracking-wide mb-1">Do Not Include</p>
                      <ListItems items={recipe.doNotInclude} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: First Batch ── */}
          {activeTab === 'First Batch' && (
            <div className="space-y-3">
              <p className="text-white font-semibold text-sm">Recommended First Batch</p>
              {(factory.firstBatchRecommendation ?? []).map((item, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-white font-semibold text-sm">{item.title}</p>
                        <DiffBadge d={item.difficulty} />
                        <PriorityBadge p={item.priority} />
                        <span className="text-[9px] bg-white/6 text-white/35 px-2 py-0.5 rounded-full">{item.productionType}</span>
                      </div>
                      <p className="text-white/50 text-xs mt-1">{item.whyMakeThisFirst}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    {item.assetsNeeded?.length > 0 && (
                      <div><p className="text-white/25 mb-1">Assets Needed</p><ListItems items={item.assetsNeeded} /></div>
                    )}
                    {item.sceneBankScenesUsed?.length > 0 && (
                      <div><p className="text-white/25 mb-1">Scene Bank Scenes</p><ListItems items={item.sceneBankScenesUsed} /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Creative Rules ── */}
          {activeTab === 'Creative Rules' && factory.creativeRules && (
            <div className="space-y-4">
          {([
            ['Brand Rules', factory.creativeRules.brandRules, Star] as const,
            ['Production Rules', factory.creativeRules.productionRules, Video] as const,
            ['What Makes This Work', factory.creativeRules.whatMakesThisWork, Zap] as const,
            ['Quality Notes', factory.creativeRules.qualityNotes, CheckCircle2] as const,
          ] as [string, string[], React.ElementType][]).map(([label, items, RuleIcon]) => Array.isArray(items) && items.length > 0 ? (
            <div key={label} className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[#FF3B1A]/12 flex items-center justify-center">
                  <RuleIcon size={12} className="text-[#FF3B1A]" />
                </div>
                <p className="text-white font-semibold text-sm">{label}</p>
              </div>
              <ListItems items={items} />
            </div>
          ) : null)}
              {[
                ['Claims to Avoid', factory.creativeRules.claimsToAvoid],
                ['Creative Avoid List', factory.creativeRules.creativeAvoidList],
                ['Do Not Include Rules', factory.creativeRules.doNotIncludeRules],
              ].map(([label, items]) => Array.isArray(items) && items.length > 0 ? (
                <div key={label as string} className="bg-red-500/5 border border-red-500/12 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={13} className="text-red-400/70" />
                    <p className="text-white/70 font-semibold text-sm">{label as string}</p>
                  </div>
                  <ListItems items={items as string[]} />
                </div>
              ) : null)}
            </div>
          )}

          {/* Expansion buttons */}
          <div className="pt-2">
            <p className="text-white/25 text-xs mb-3">Generate more ideas</p>
            <div className="flex flex-wrap gap-2">
              {['Generate More Commercial Ideas', 'Generate More Scene Ideas', 'Create Product Demo Concepts', 'Create Lifestyle Concepts', 'Create Reaction Concepts', 'Make Ideas More Premium', 'Make Ideas More Fun', 'Make Ideas More Direct Response'].map(action => (
                <button key={action} onClick={() => sendChat(action)}
                  className="text-xs border border-white/8 text-white/35 hover:text-white hover:border-[#FF3B1A]/40 px-3 py-1.5 rounded-full transition">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Secondary Chat ── */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Ask Strategy AI</p>
          </div>
          <p className="text-white/28 text-xs mt-0.5 pl-5">Ask for more commercial ideas, new scenes, script changes, or a different creative direction.</p>
        </div>

        <div className="overflow-y-auto p-4 space-y-3" style={{ minHeight: 180, maxHeight: 300 }}>
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'assistant' ? (
                <div className="flex items-start gap-2.5 max-w-[95%]">
                  <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-[#FF3B1A]" />
                  </div>
                  <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-white/80 text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <div className="bg-[#FF3B1A]/10 border border-[#FF3B1A]/18 rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-white/90 text-sm">{msg.text}</p>
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
                  {[0, 150, 300].map(delay => <span key={delay} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}
                </div>
              </div>
            </div>
          )}
          {chatError && <div className="text-red-400 text-xs px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">{chatError}</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Chips */}
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {CHAT_CHIPS.map(chip => (
            <button key={chip} onClick={() => sendChat(chip)} disabled={chatLoading}
              className="text-[11px] font-medium border border-white/8 text-white/40 hover:text-white hover:border-[#FF3B1A]/40 px-2.5 py-1 rounded-full transition">
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/6">
          <div className="flex gap-2 items-end">
            <textarea ref={textareaRef} value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder="Ask for more ideas, different styles, or creative direction…"
              rows={2}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/22 focus:outline-none focus:border-[#FF3B1A] resize-none" />
            <button onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading}
              className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
