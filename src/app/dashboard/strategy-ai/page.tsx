'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Brain, Send, ChevronRight, Folder, Target, Users,
  Flame, Link2, TrendingUp, Plus, X, Zap, ArrowRight, Lightbulb,
  FileText, CheckCircle2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4 | 5
type SectionKey = 'brandMemory' | 'competitorNotes' | 'contentLibrary' | 'strategyIdeas' | 'growthSignals'
type MemoryStatus = 'New' | 'Learning' | 'Saved' | 'Ready'
type CenterView = 'workspace' | SectionKey
interface ChatMsg { id: string; role: 'ai' | 'user'; text: string }

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: {
  id: StepId; label: string; sectionKey: SectionKey
  intro: string; questions: string[]
}[] = [
  {
    id: 1, label: 'Brand', sectionKey: 'brandMemory',
    intro: "Hi! I'm your AI content strategist. I'll guide us through the Brand step.\nLet's start by learning about your business.",
    questions: [
      'What is your business called?',
      'What do you sell?',
      'Who is your ideal customer?',
      'What makes your brand different?',
    ],
  },
  {
    id: 2, label: 'Competitors', sectionKey: 'competitorNotes',
    intro: "Now let's understand your market. I'll use competitor insights to find gaps, angles, and opportunities your content can own.",
    questions: [
      'Who are your top competitors?',
      'What do they do well?',
      'Where do you think their content is weak?',
      'Do you have competitor links, ads, social pages, or examples?',
    ],
  },
  {
    id: 3, label: 'Content', sectionKey: 'contentLibrary',
    intro: "Next, let's look at your existing content, proof, assets, and examples. This helps Strategy AI know what we can build from.",
    questions: [
      'What content has worked best for you so far?',
      'Do you have testimonials, reviews, photos, or videos?',
      'What content do you want more of?',
      'Are there any examples or links you want us to use as inspiration?',
    ],
  },
  {
    id: 4, label: 'Strategy', sectionKey: 'strategyIdeas',
    intro: "Now I'll turn what we know into strategy: hooks, CTAs, angles, content ideas, and briefs.",
    questions: [
      'What offer or message do you want to push right now?',
      'What objections do customers usually have?',
      'What action do you want viewers to take?',
      'What type of content do you want Strategy AI to create first?',
    ],
  },
  {
    id: 5, label: 'Growth', sectionKey: 'growthSignals',
    intro: "Finally, let's turn the strategy into growth. I'll help decide how to post, test, and improve your content.",
    questions: [
      'Where do you currently post content?',
      'What is your main growth goal?',
      'What results matter most: leads, sales, calls, views, or engagement?',
      'What should we test next?',
    ],
  },
]

// ─── Super Brain sections ─────────────────────────────────────────────────────

const BRAIN_SECTIONS: {
  key: SectionKey; Icon: React.ElementType; title: string; desc: string; stepId: StepId
}[] = [
  { key: 'brandMemory',     Icon: Folder,     title: 'Brand Memory',     desc: 'Core identity, mission, positioning',  stepId: 1 },
  { key: 'competitorNotes', Icon: Users,      title: 'Competitor Notes', desc: 'Competitor landscape + gaps',          stepId: 2 },
  { key: 'contentLibrary',  Icon: Lightbulb,  title: 'Content Library',  desc: 'Hooks, ideas, angles, references',     stepId: 3 },
  { key: 'strategyIdeas',   Icon: Target,     title: 'Strategy Ideas',   desc: 'Angles, offers, positioning',          stepId: 4 },
  { key: 'growthSignals',   Icon: TrendingUp, title: 'Growth Signals',   desc: "What's working & opportunities",       stepId: 5 },
]

// ─── Memory detail content ────────────────────────────────────────────────────

const DETAIL_FIELDS: Record<SectionKey, { label: string; placeholder: string }[]> = {
  brandMemory: [
    { label: 'Business Name',   placeholder: 'e.g. Apex Fitness Co.' },
    { label: 'Main Offer',      placeholder: 'Describe your core product or service…' },
    { label: 'Target Customer', placeholder: 'Who is your ideal customer?' },
    { label: 'Differentiator',  placeholder: 'What makes your brand unique?' },
    { label: 'Brand Voice',     placeholder: 'e.g. Bold, authentic, educational…' },
  ],
  competitorNotes: [
    { label: 'Top Competitors',  placeholder: 'Names, handles, or URLs…' },
    { label: 'Their Strengths',  placeholder: 'What angles or formats work for them?' },
    { label: 'Their Weaknesses', placeholder: 'Gaps or objections they miss…' },
    { label: 'Reference Links',  placeholder: 'Links to their best content…' },
  ],
  contentLibrary: [
    { label: 'Best Content So Far', placeholder: 'What has performed best for you?' },
    { label: 'Assets Available',    placeholder: 'Videos, photos, testimonials, reviews…' },
    { label: 'Inspiration Links',   placeholder: 'Reference content you love…' },
    { label: 'Content Gaps',        placeholder: 'What do you wish you had more of?' },
  ],
  strategyIdeas: [
    { label: 'Current Offer Focus', placeholder: 'What message are you pushing now?' },
    { label: 'Top Objections',      placeholder: "What stops customers from buying?" },
    { label: 'Desired CTA',         placeholder: 'What action should viewers take?' },
    { label: 'Content Priority',    placeholder: 'What type of content first?' },
  ],
  growthSignals: [
    { label: 'Active Platforms', placeholder: 'TikTok, Instagram, YouTube…' },
    { label: 'Growth Goal',      placeholder: 'Leads, sales, calls, awareness, engagement…' },
    { label: 'Key Metrics',      placeholder: 'What numbers matter most to you?' },
    { label: 'Next Experiment',  placeholder: 'What should we test next?' },
  ],
}

// ─── Mock outcomes ────────────────────────────────────────────────────────────

const MOCK_OUTCOMES = {
  hooks:        ["Most brands post content without a strategy. Here's what to do instead.", "Before you make another video, fix this first.", "This is why your content is not converting."],
  ctaIdeas:     ['Book a call', 'DM READY', 'Comment PLAN', 'Tap the link'],
  contentIdeas: ['Founder explains the offer', 'Customer proof video', 'Behind-the-scenes process', 'Common mistake video', 'Transformation story'],
  ugcBriefs:    ['Testimonial-style video', 'Problem/solution short', 'Founder authority video', 'Before/after proof video'],
  fireTasks:    ['Create 5 hooks', 'Write 3 video scripts', 'Build 2 testimonial concepts', 'Prepare content shot list'],
  growthPlan:   ['Post 3 reels per week', 'Test 2 hook styles', 'Use direct CTA in first 10 seconds', 'Double down on highest-saves content'],
}

type OutcomeKey = keyof typeof MOCK_OUTCOMES

const OUTCOME_CARDS: { Icon: React.ElementType; title: string; desc: string; key: OutcomeKey }[] = [
  { Icon: Zap,        title: 'Hooks',              desc: 'Attention-grabbing openers that stop scrolls.',     key: 'hooks'        },
  { Icon: Target,     title: 'CTA Ideas',          desc: 'Calls-to-action that drive clicks and sales.',      key: 'ctaIdeas'     },
  { Icon: Folder,     title: 'Content Ideas',      desc: 'Angles and concepts for short-form content.',       key: 'contentIdeas' },
  { Icon: FileText,   title: 'UGC Briefs',         desc: 'Creator briefs and shot lists that convert.',       key: 'ugcBriefs'    },
  { Icon: Flame,      title: 'Fire Creator Tasks', desc: 'Tasks for creators aligned to your strategy.',      key: 'fireTasks'    },
  { Icon: TrendingUp, title: 'Growth Plan',        desc: 'Growth levers, tests, and next steps to scale.',    key: 'growthPlan'   },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<MemoryStatus, string> = {
  New:      'bg-white/8 text-white/40',
  Learning: 'bg-[#FF3B1A]/15 text-[#FF3B1A]',
  Saved:    'bg-green-500/15 text-green-400',
  Ready:    'bg-blue-500/15 text-blue-300',
}

const STORAGE_KEY = 'ugcfire_strategy_v2'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StrategyAIPage() {
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Step / workspace state ──
  const [activeStep,   setActiveStep]   = useState<StepId>(1)
  const [centerView,   setCenterView]   = useState<CenterView>('workspace')
  const [input,        setInput]        = useState('')
  const [detailInputs, setDetailInputs] = useState<Partial<Record<SectionKey, Record<number, string>>>>({})

  // ── Chat history per step ──
  const [stepChats, setStepChats] = useState<Record<StepId, ChatMsg[]>>({
    1: [{ id: 'intro-1', role: 'ai', text: STEPS[0].intro }],
    2: [{ id: 'intro-2', role: 'ai', text: STEPS[1].intro }],
    3: [{ id: 'intro-3', role: 'ai', text: STEPS[2].intro }],
    4: [{ id: 'intro-4', role: 'ai', text: STEPS[3].intro }],
    5: [{ id: 'intro-5', role: 'ai', text: STEPS[4].intro }],
  })

  // ── Super Brain status ──
  const [brainStatus, setBrainStatus] = useState<Record<SectionKey, MemoryStatus>>({
    brandMemory: 'New', competitorNotes: 'New', contentLibrary: 'New',
    strategyIdeas: 'New', growthSignals: 'New',
  })

  // ── Outcomes + running ──
  const [outcomes,      setOutcomes]      = useState<typeof MOCK_OUTCOMES | null>(null)
  const [running,       setRunning]       = useState(false)
  const [showAddMemory, setShowAddMemory] = useState(false)
  const [showAddLink,   setShowAddLink]   = useState(false)
  const [memoryInput,   setMemoryInput]   = useState('')
  const [linkInput,     setLinkInput]     = useState('')

  // ── Hydrate from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (saved.brainStatus) setBrainStatus(saved.brainStatus)
      if (saved.stepChats)   setStepChats(saved.stepChats)
      if (saved.outcomes)    setOutcomes(saved.outcomes)
      if (saved.detailInputs) setDetailInputs(saved.detailInputs)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stepChats, activeStep])

  function persist(patch: object) {
    try {
      const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }))
    } catch { /* ignore */ }
  }

  // ── Actions ──
  function handleStepClick(id: StepId) {
    setActiveStep(id)
    setCenterView('workspace')
    setInput('')
  }

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    const step = STEPS[activeStep - 1]
    const userMsg: ChatMsg  = { id: `u-${Date.now()}`, role: 'user', text }
    const ackMsg:  ChatMsg  = { id: `a-${Date.now()}`, role: 'ai',   text: `Got it — I've saved that to your ${step.label} memory.` }
    const updated = { ...stepChats, [activeStep]: [...stepChats[activeStep], userMsg, ackMsg] }
    setStepChats(updated)
    const prev   = brainStatus[step.sectionKey]
    const next   = prev === 'New' ? 'Learning' : 'Saved'
    const newStatus = { ...brainStatus, [step.sectionKey]: next as MemoryStatus }
    setBrainStatus(newStatus)
    setInput('')
    persist({ stepChats: updated, brainStatus: newStatus })
  }

  function saveDetailField(key: SectionKey, idx: number, val: string) {
    const updated = { ...detailInputs, [key]: { ...(detailInputs[key] ?? {}), [idx]: val } }
    setDetailInputs(updated)
    persist({ detailInputs: updated })
  }

  function runStrategy() {
    setRunning(true)
    setTimeout(() => {
      setOutcomes(MOCK_OUTCOMES)
      setRunning(false)
      const allDone: Record<SectionKey, MemoryStatus> = {
        brandMemory: 'Saved', competitorNotes: 'Saved', contentLibrary: 'Saved',
        strategyIdeas: 'Ready', growthSignals: 'Ready',
      }
      setBrainStatus(allDone)
      persist({ outcomes: MOCK_OUTCOMES, brainStatus: allDone })
      document.getElementById('strategy-outcomes')?.scrollIntoView({ behavior: 'smooth' })
    }, 1800)
  }

  // ── Derived ──
  const currentStep    = STEPS[activeStep - 1]
  const currentMsgs    = stepChats[activeStep] ?? []
  const detailKey      = centerView !== 'workspace' ? (centerView as SectionKey) : null
  const activeSection  = detailKey ? BRAIN_SECTIONS.find(s => s.key === detailKey) : null

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy AI</h1>
          <p className="text-white/40 text-sm mt-0.5">AI guides our process from brand discovery to growth.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddLink(true)}
            className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-4 py-2 rounded-lg transition"
          >
            <Link2 size={13} /> Add Link
          </button>
          <button
            onClick={() => setShowAddMemory(true)}
            className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-4 py-2 rounded-lg transition"
          >
            <Plus size={13} /> Add Memory
          </button>
          <button
            onClick={runStrategy}
            disabled={running}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition"
          >
            {running
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</>
              : <><Sparkles size={13} /> Run Strategy AI</>}
          </button>
        </div>
      </div>

      {/* ── Funnel Stepper ── */}
      <div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((step, i) => {
            const isActive = step.id === activeStep
            const status   = brainStatus[step.sectionKey]
            const isDone   = status === 'Saved' || status === 'Ready'
            return (
              <div key={step.id} className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                    isActive
                      ? 'border-[#FF3B1A] bg-[#FF3B1A]/10 text-white'
                      : 'border-white/10 bg-[#0d0d0d] text-white/45 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isActive ? 'bg-[#FF3B1A] text-white'
                      : isDone  ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/35'
                  }`}>
                    {step.id}
                  </span>
                  {step.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={13} className="text-white/20 shrink-0" />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-white/30 text-xs mt-2 flex items-center gap-1.5">
          <span className="text-white/20 text-[11px]">ⓘ</span>
          Strategy AI powers the process: gather inputs → save memory → generate ideas → drive growth.
        </p>
      </div>

      {/* ── 2-Column: Workspace + Super Brain ── */}
      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

        {/* ── AI Workspace ── */}
        <div
          className="flex-1 min-w-0 bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden flex flex-col"
          style={{ minHeight: 480 }}
        >
          {/* Workspace header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="text-white font-semibold text-sm">
              {centerView === 'workspace' ? 'AI Workspace' : (activeSection?.title ?? 'Memory Detail')}
            </p>
            <p className="text-white/30 text-xs">
              {centerView === 'workspace' ? `Step ${activeStep} of 5` : `${currentStep.label} Memory`}
            </p>
          </div>

          {/* WORKSPACE: chat + questions + input */}
          {centerView === 'workspace' && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: 360 }}>
                {/* Existing messages */}
                {currentMsgs.map(msg => (
                  <div key={msg.id}>
                    {msg.role === 'ai' ? (
                      <div className="flex items-start gap-2.5 max-w-[92%]">
                        <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={11} className="text-[#FF3B1A]" />
                        </div>
                        <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-[#FF3B1A]/10 border border-[#FF3B1A]/18 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                          <p className="text-white/90 text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="flex items-center gap-1 text-green-400 text-[10px] pr-1">
                          <CheckCircle2 size={10} /> Saved to Super Brain
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Current step questions */}
                <div className="space-y-2 pt-1">
                  {currentStep.questions.map((q, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={11} className="text-[#FF3B1A]" />
                      </div>
                      <div className="bg-white/4 border border-white/6 rounded-2xl rounded-tl-sm px-4 py-2.5">
                        <p className="text-white/60 text-sm">{q}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/6 space-y-2">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type your answer here..."
                    rows={2}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <p className="text-white/25 text-[10px] pl-1">Share as much detail as you can. Better inputs = better strategy.</p>
              </div>
            </>
          )}

          {/* MEMORY DETAIL VIEW */}
          {centerView !== 'workspace' && detailKey && activeSection && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: 370 }}>
                <p className="text-white/35 text-xs leading-relaxed">
                  {activeSection.desc}. Fill in your details below — Strategy AI will use this across the whole funnel.
                </p>
                <div className="space-y-3">
                  {DETAIL_FIELDS[detailKey].map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">{field.label}</p>
                      <input
                        value={detailInputs[detailKey]?.[idx] ?? ''}
                        onChange={e => saveDetailField(detailKey, idx, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B1A]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-white/6">
                <button
                  onClick={() => setCenterView('workspace')}
                  className="flex items-center gap-1.5 text-white/35 hover:text-white text-xs transition"
                >
                  <ArrowRight size={11} className="rotate-180" /> Back to Funnel Step
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Super Brain Panel ── */}
        <div className="w-full lg:w-64 shrink-0 bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex items-center gap-2 mb-0.5">
              <Brain size={14} className="text-[#FF3B1A]" />
              <p className="text-white font-semibold text-sm">Super Brain</p>
            </div>
            <p className="text-white/30 text-[11px]">Living memory used across the whole funnel.</p>
          </div>

          <div className="divide-y divide-white/5">
            {BRAIN_SECTIONS.map(({ key, Icon, title, desc, stepId }) => {
              const status   = brainStatus[key]
              const isActive = centerView === key
              return (
                <button
                  key={key}
                  onClick={() => { setCenterView(isActive ? 'workspace' : key); setActiveStep(stepId) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    isActive ? 'bg-[#FF3B1A]/8' : 'hover:bg-white/2'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-[#FF3B1A]/20' : 'bg-white/5'}`}>
                    <Icon size={13} className={isActive ? 'text-[#FF3B1A]' : 'text-white/40'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/65'}`}>{title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-white/28 text-[10px] truncate">{desc}</p>
                  </div>
                  <ChevronRight size={12} className={`shrink-0 ${isActive ? 'text-[#FF3B1A]' : 'text-white/18'}`} />
                </button>
              )
            })}
          </div>

          {/* Info box */}
          <div className="m-3 bg-white/3 border border-white/6 rounded-xl p-3">
            <p className="text-white/35 text-[11px] leading-relaxed">
              Memory grows as we move through the funnel. All insights are connected and reused to generate stronger ideas and results.
            </p>
          </div>
        </div>
      </div>

      {/* ── Outcomes Section ── */}
      <div id="strategy-outcomes" className="space-y-3">
        <div>
          <p className="text-white font-semibold">What Strategy AI creates</p>
          <p className="text-white/35 text-sm mt-0.5">Your outputs from this process. Generated as we progress.</p>
        </div>

        {running && (
          <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="w-4 h-4 border-2 border-[#FF3B1A]/40 border-t-[#FF3B1A] rounded-full animate-spin" />
              <Sparkles size={14} className="text-[#FF3B1A] animate-pulse" />
            </div>
            <p className="text-white/55 text-sm">Strategy AI is analyzing your inputs…</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {OUTCOME_CARDS.map(({ Icon, title, desc, key }) => (
            <div key={key} className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 flex flex-col gap-2.5">
              <Icon size={14} className="text-[#FF3B1A]" />
              <div>
                <p className="text-white text-xs font-semibold">{title}</p>
                <p className="text-white/30 text-[11px] mt-0.5 leading-relaxed">{desc}</p>
              </div>
              {outcomes ? (
                <div className="space-y-1.5 mt-0.5">
                  {outcomes[key].slice(0, 3).map((item, i) => (
                    <p key={i} className="text-white/50 text-[10px] leading-relaxed border-l-2 border-[#FF3B1A]/25 pl-2">{item}</p>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 mt-0.5">
                  {[65, 80, 50].map((w, i) => (
                    <div key={i} className="h-1.5 bg-white/6 rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Add Memory Modal ── */}
      {showAddMemory && (
        <div
          className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddMemory(false)}
        >
          <div
            className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Add Memory</p>
              <button onClick={() => setShowAddMemory(false)} className="text-white/30 hover:text-white transition">
                <X size={16} />
              </button>
            </div>
            <p className="text-white/40 text-sm">Add a note or context directly to your Super Brain.</p>
            <textarea
              value={memoryInput}
              onChange={e => setMemoryInput(e.target.value)}
              rows={4}
              placeholder="Type memory content…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B1A] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setMemoryInput(''); setShowAddMemory(false) }}
                className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm py-2.5 rounded-xl transition"
              >
                Save Memory
              </button>
              <button
                onClick={() => setShowAddMemory(false)}
                className="flex-1 border border-white/10 text-white/45 hover:text-white text-sm py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Link Modal ── */}
      {showAddLink && (
        <div
          className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddLink(false)}
        >
          <div
            className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Add Link</p>
              <button onClick={() => setShowAddLink(false)} className="text-white/30 hover:text-white transition">
                <X size={16} />
              </button>
            </div>
            <p className="text-white/40 text-sm">Save a website, post, video, or reference for Strategy AI to use.</p>
            <input
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              placeholder="https://…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B1A]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setLinkInput(''); setShowAddLink(false) }}
                className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm py-2.5 rounded-xl transition"
              >
                Save Link
              </button>
              <button
                onClick={() => setShowAddLink(false)}
                className="flex-1 border border-white/10 text-white/45 hover:text-white text-sm py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
