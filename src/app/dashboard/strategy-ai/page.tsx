'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Brain, Send, ChevronRight, ChevronDown, Folder, Target, Users,
  Flame, Link2, TrendingUp, Plus, X, Zap, ArrowRight, Lightbulb,
  FileText, CheckCircle2, Copy, Check, BookOpen, Play, BarChart2,
  Star, AlignLeft, Mic2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type StepId       = 1 | 2 | 3 | 4 | 5
type SectionKey   = 'brandMemory' | 'competitorNotes' | 'contentLibrary' | 'strategyIdeas' | 'growthSignals'
type MemoryStatus = 'New' | 'Learning' | 'Saved' | 'Ready'
type CenterView   = 'workspace' | SectionKey
type AccordionId  = 'summary' | 'hooks' | 'captions' | 'cta' | 'ideas' | 'briefs' | 'tasks' | 'growth'
interface ChatMsg  { id: string; role: 'ai' | 'user'; text: string }

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: { id: StepId; label: string; sectionKey: SectionKey; intro: string; questions: string[] }[] = [
  {
    id: 1, label: 'Brand', sectionKey: 'brandMemory',
    intro: "Hi! I'm your AI content strategist. I'll guide us through the Brand step.\nLet's start by learning about your business.",
    questions: ['What is your business called?', 'What do you sell?', 'Who is your ideal customer?', 'What makes your brand different?'],
  },
  {
    id: 2, label: 'Competitors', sectionKey: 'competitorNotes',
    intro: "Now let's understand your market. I'll use competitor insights to find gaps, angles, and opportunities your content can own.",
    questions: ['Who are your top competitors?', 'What do they do well?', 'Where is their content weak?', 'Add competitor links or examples.'],
  },
  {
    id: 3, label: 'Content', sectionKey: 'contentLibrary',
    intro: "Next, let's look at your existing content, proof, assets, and examples. This helps Strategy AI know what we can build from.",
    questions: ['What content has worked best?', 'Do you have testimonials, reviews, product photos, or videos?', 'What content do you want more of?', 'Add inspiration links or examples.'],
  },
  {
    id: 4, label: 'Strategy', sectionKey: 'strategyIdeas',
    intro: "Now I'll turn what we know into strategy: hooks, CTAs, angles, content ideas, and briefs.",
    questions: ['What offer or message do you want to push?', 'What objections do customers have?', 'What action do you want viewers to take?', 'What type of content should we create first?'],
  },
  {
    id: 5, label: 'Growth', sectionKey: 'growthSignals',
    intro: "Finally, let's turn the strategy into growth. I'll help decide how to post, test, and improve your content.",
    questions: ['Where do you currently post?', 'What is your main growth goal?', 'What results matter most?', 'What should we test next?'],
  },
]

// ─── Super Brain ──────────────────────────────────────────────────────────────

const BRAIN_SECTIONS: { key: SectionKey; Icon: React.ElementType; title: string; desc: string; stepId: StepId }[] = [
  { key: 'brandMemory',     Icon: Folder,     title: 'Brand Memory',     desc: 'Core identity, mission, positioning',  stepId: 1 },
  { key: 'competitorNotes', Icon: Users,      title: 'Competitor Notes', desc: 'Competitor landscape + gaps',          stepId: 2 },
  { key: 'contentLibrary',  Icon: Lightbulb,  title: 'Content Library',  desc: 'Hooks, ideas, angles, references',     stepId: 3 },
  { key: 'strategyIdeas',   Icon: Target,     title: 'Strategy Ideas',   desc: 'Angles, offers, positioning',          stepId: 4 },
  { key: 'growthSignals',   Icon: TrendingUp, title: 'Growth Signals',   desc: "What's working & opportunities",       stepId: 5 },
]

const DETAIL_FIELDS: Record<SectionKey, { label: string; placeholder: string }[]> = {
  brandMemory:      [{ label: 'Business Name', placeholder: 'e.g. Apex Fitness Co.' }, { label: 'Main Offer', placeholder: 'Describe your core product or service…' }, { label: 'Target Customer', placeholder: 'Who is your ideal customer?' }, { label: 'Differentiator', placeholder: 'What makes you unique?' }, { label: 'Brand Voice', placeholder: 'e.g. Bold, authentic, educational…' }],
  competitorNotes:  [{ label: 'Top Competitors', placeholder: 'Names, handles, or URLs…' }, { label: 'Their Strengths', placeholder: 'What angles or formats work for them?' }, { label: 'Their Weaknesses', placeholder: 'Gaps or objections they miss…' }, { label: 'Reference Links', placeholder: 'Links to their best content…' }],
  contentLibrary:   [{ label: 'Best Content So Far', placeholder: 'What has performed best?' }, { label: 'Assets Available', placeholder: 'Videos, photos, testimonials, reviews…' }, { label: 'Inspiration Links', placeholder: 'Reference content you love…' }, { label: 'Content Gaps', placeholder: 'What do you wish you had more of?' }],
  strategyIdeas:    [{ label: 'Current Offer Focus', placeholder: 'What message are you pushing now?' }, { label: 'Top Objections', placeholder: "What stops customers from buying?" }, { label: 'Desired CTA', placeholder: 'What action should viewers take?' }, { label: 'Content Priority', placeholder: 'What type of content first?' }],
  growthSignals:    [{ label: 'Active Platforms', placeholder: 'TikTok, Instagram, YouTube…' }, { label: 'Growth Goal', placeholder: 'Leads, sales, calls, awareness…' }, { label: 'Key Metrics', placeholder: 'What numbers matter most?' }, { label: 'Next Experiment', placeholder: 'What should we test next?' }],
}

// ─── Mock strategy output ─────────────────────────────────────────────────────

const MOCK_STRATEGY = {
  summary: {
    direction: 'Focus on trust-building content that explains the offer, shows proof, and gives viewers a clear next step.',
    weekFocus:  'Create short-form videos around customer pain points, common objections, and simple proof-based hooks.',
    opportunity:'Use founder-led UGC and testimonial-style content to build trust quickly.',
    why:        'Your audience needs to understand before they buy. Strategy-first content shortens the sales cycle and reduces ad spend.',
  },
  hooks: [
    { text: "Most brands post content without a strategy. Here's what to do instead.",     type: 'Problem'        },
    { text: 'Before you make another video, fix this first.',                               type: 'Direct'         },
    { text: 'This is why your content is not converting.',                                  type: 'Problem'        },
    { text: 'Stop guessing what to post.',                                                  type: 'Direct'         },
    { text: "Here's the content your audience actually needs to see.",                      type: 'Curiosity'      },
    { text: 'If your videos are getting views but no leads, watch this.',                   type: 'Problem'        },
    { text: 'The fastest way to make better content is to start with the hook.',            type: 'Insight'        },
    { text: 'Your CTA is probably too weak.',                                               type: 'Direct'         },
    { text: 'This is what we would post if we ran your brand.',                             type: 'Proof'          },
    { text: 'Every video needs a job.',                                                     type: 'Insight'        },
  ],
  captions: [
    { text: "Content without strategy is just noise. Here's what to focus on this week.",           platform: 'Instagram / TikTok', cta: 'Save this.' },
    { text: 'Your audience needs clarity before they buy. Start with proof, then give them a next step.', platform: 'LinkedIn / Instagram', cta: 'DM READY' },
    { text: "Better hooks. Clearer CTAs. Stronger content. That's the difference.",                 platform: 'TikTok / Reels',     cta: 'Comment PLAN' },
    { text: 'Stop posting randomly. Build content around a real strategy.',                          platform: 'Instagram / YouTube', cta: 'Book a call' },
    { text: 'Every video should have a reason behind it.',                                           platform: 'TikTok / Reels',     cta: 'Tap the link' },
  ],
  ctaStrategy: [
    { text: 'Book a call',     useCase: 'High-intent viewers ready to convert',       why: 'Direct response — best for warm audiences and paid ads.' },
    { text: 'DM READY',        useCase: 'Mid-funnel engagement, DM automations',      why: 'Low friction. Works well with ManyChat or IG DM flows.' },
    { text: 'Comment PLAN',    useCase: 'Organic reach + comment boost',              why: 'Triggers algorithm, captures leads via comment automation.' },
    { text: 'Tap the link',    useCase: 'Drive traffic to landing page or offer',     why: 'Simple and clear. Works across all platforms.' },
    { text: 'Download guide',  useCase: 'Lead magnet / email list building',          why: 'Strong for value-based content and top-of-funnel.' },
    { text: 'Claim offer',     useCase: 'Limited-time promotions or urgency content', why: 'Creates urgency and scarcity. Best paired with deadline.' },
  ],
  contentIdeas: [
    { title: 'Founder explains the offer',         angle: 'Direct, confident, personal — show the person behind the brand.', platform: 'TikTok / Reels' },
    { title: 'Customer proof video',               angle: 'Real results from a real customer. Let them tell the story.',     platform: 'Instagram / Ads' },
    { title: 'Behind-the-scenes process',          angle: 'Show how the work gets done. Builds trust through transparency.', platform: 'Reels / TikTok' },
    { title: 'Common mistake your audience makes', angle: 'Educational + authority. Positions you as the expert.',           platform: 'YouTube Shorts / TikTok' },
    { title: 'Before/after transformation',        angle: 'Show the result. Emotion-led. High share potential.',             platform: 'TikTok / Reels' },
    { title: 'FAQ video',                          angle: 'Overcome objections on camera. Builds confidence to buy.',        platform: 'YouTube / Instagram' },
    { title: 'Product/service demo',               angle: 'Show exactly how it works. Reduces friction for new buyers.',     platform: 'Reels / YouTube Shorts' },
    { title: 'Testimonial-style UGC',              angle: 'Third-party credibility. Works extremely well as paid ad.',       platform: 'Facebook / Instagram Ads' },
    { title: 'Myth vs truth',                      angle: 'Bust a misconception. Creates curiosity and shares.',             platform: 'TikTok / Reels' },
    { title: 'Why customers choose us',            angle: 'Differentiation on camera. Comparison without naming names.',     platform: 'Instagram / YouTube' },
  ],
  briefs: [
    {
      title:   'Problem/Solution UGC Video',
      hook:    'Most businesses post content without knowing what job the video is supposed to do.',
      angle:   'Position UGCFire as the content team that brings strategy before production.',
      script:  '"Most businesses are posting just to post. But every video should have a job — is it building trust, driving calls, or explaining your offer? At UGCFire, we use Strategy AI to create the hook, the CTA, the angle, and the purpose behind every piece of content."',
      shotList:['Creator talking to camera', 'Show content examples on screen', 'Strategy card overlay visual', 'End with strong CTA'],
      cta:     'Book a call',
      platform:'Instagram Reels, TikTok, YouTube Shorts',
      why:     'Explains the pain point and positions UGCFire as the smarter, strategy-first solution.',
    },
    {
      title:   'Founder Authority Video',
      hook:    "This is what we'd post if we ran your brand.",
      angle:   "Founder-led content showing UGCFire's process and confidence. Build trust through personality.",
      script:  `"I've worked with dozens of brands. And the ones that get results? They all have one thing in common — they start with a strategy, not a camera. Here's what we do differently..."`,
      shotList:['Founder talking to camera', 'B-roll of team/process', 'Screen recording of Strategy AI', 'CTA card at end'],
      cta:     'DM READY',
      platform:'Instagram Reels, LinkedIn, TikTok',
      why:     'Founder content builds personal trust. Showing the process makes the product real.',
    },
    {
      title:   'Customer Proof Testimonial',
      hook:    'Real results, real brands.',
      angle:   'A real customer explaining what changed after working with UGCFire.',
      script:  '"Before UGCFire, we were posting randomly. Now we have a strategy, a system, and content that actually converts. The difference is night and day."',
      shotList:['Customer talking to camera', 'Show their platform/results', 'Before/after metrics if available', 'End with UGCFire branding + CTA'],
      cta:     'Book a call',
      platform:'Facebook Ads, Instagram, YouTube Shorts',
      why:     'Third-party social proof is the most trusted form of content. Reduces buying friction dramatically.',
    },
  ],
  fireTasks: [
    { task: 'Create 5 hook variations for Reels',         priority: 'High',   status: 'Pending' },
    { task: 'Write 3 full video scripts',                  priority: 'High',   status: 'Pending' },
    { task: 'Build testimonial-style video concept',       priority: 'High',   status: 'Pending' },
    { task: 'Create product/service demo shot list',       priority: 'Medium', status: 'Pending' },
    { task: 'Prepare 5-post caption pack',                 priority: 'Medium', status: 'Pending' },
    { task: 'Create growth post set (3 formats, 2 hooks)', priority: 'Low',    status: 'Pending' },
  ],
  growth: {
    whereToPost:   ['Instagram Reels — highest organic reach for short-form', 'TikTok — top-of-funnel discovery', 'YouTube Shorts — long-term compounding views', 'Facebook Ads — conversion-focused paid distribution'],
    weeklyPlan:    ['Mon: Post hook-led Reel (problem angle)', 'Wed: Post proof/testimonial content', 'Fri: Post educational or behind-the-scenes', 'Ongoing: Run top Reel as paid ad with clear CTA'],
    whatToTest:    ['Test 2 different hook styles (curiosity vs direct)', 'Test organic post as paid ad to reduce ad creative cost', 'Test 2 CTAs — DM READY vs Book a Call — on same content'],
    whatToMeasure: ['Watch time / average view duration', 'Saves and shares (indicates value)', 'DM replies and link clicks', 'Calls booked per week'],
    doubleDown:    'Double down on the format and hook style with the highest saves-to-comments ratio. That signals content worth pushing with budget.',
    next7Days:     ['Day 1: Film 3 videos from the brief list above', 'Day 2: Edit and caption all 3', 'Day 3: Post Video 1 + monitor comments', 'Day 4: Run Video 1 as paid ad if performing', 'Day 5: Post Video 2', 'Day 6–7: Analyse, note which hook got most engagement'],
  },
}

const ALL_ACCORDION_IDS: AccordionId[] = ['summary', 'hooks', 'captions', 'cta', 'ideas', 'briefs', 'tasks', 'growth']
const STATUS_STYLES: Record<MemoryStatus, string> = {
  New:      'bg-white/8 text-white/40',
  Learning: 'bg-[#FF3B1A]/15 text-[#FF3B1A]',
  Saved:    'bg-green-500/15 text-green-400',
  Ready:    'bg-blue-500/15 text-blue-300',
}
const STORAGE_KEY = 'ugcfire_strategy_v2'

// ─── Small helpers ────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setDone(true); setTimeout(() => setDone(false), 1600) }}
      className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${done ? 'border-green-500/30 text-green-400' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
    >
      {done ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
  )
}

function PriorityBadge({ p }: { p: string }) {
  const s = p === 'High' ? 'bg-[#FF3B1A]/15 text-[#FF3B1A]' : p === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-white/8 text-white/35'
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s}`}>{p}</span>
}

interface AccordionProps {
  id: AccordionId; title: string; Icon: React.ElementType
  isOpen: boolean; onToggle: () => void; children: React.ReactNode
}
function AccordionSection({ title, Icon, isOpen, onToggle, children }: AccordionProps) {
  return (
    <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition"
      >
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
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Top area state ──
  const [activeStep,   setActiveStep]   = useState<StepId>(1)
  const [centerView,   setCenterView]   = useState<CenterView>('workspace')
  const [input,        setInput]        = useState('')
  const [detailInputs, setDetailInputs] = useState<Partial<Record<SectionKey, Record<number, string>>>>({})
  const [stepChats,    setStepChats]    = useState<Record<StepId, ChatMsg[]>>({
    1: [{ id: 'i1', role: 'ai', text: STEPS[0].intro }],
    2: [{ id: 'i2', role: 'ai', text: STEPS[1].intro }],
    3: [{ id: 'i3', role: 'ai', text: STEPS[2].intro }],
    4: [{ id: 'i4', role: 'ai', text: STEPS[3].intro }],
    5: [{ id: 'i5', role: 'ai', text: STEPS[4].intro }],
  })
  const [brainStatus, setBrainStatus] = useState<Record<SectionKey, MemoryStatus>>({
    brandMemory: 'New', competitorNotes: 'New', contentLibrary: 'New',
    strategyIdeas: 'New', growthSignals: 'New',
  })

  // ── Output area state ──
  const [strategy,     setStrategy]     = useState<typeof MOCK_STRATEGY | null>(null)
  const [running,      setRunning]      = useState(false)
  const [openSections, setOpenSections] = useState<Set<AccordionId>>(new Set())
  const [successMsg,   setSuccessMsg]   = useState(false)

  // ── Modals ──
  const [showAddMemory, setShowAddMemory] = useState(false)
  const [showAddLink,   setShowAddLink]   = useState(false)
  const [memoryInput,   setMemoryInput]   = useState('')
  const [linkInput,     setLinkInput]     = useState('')

  // ── Hydrate ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s.brainStatus)  setBrainStatus(s.brainStatus)
      if (s.stepChats)    setStepChats(s.stepChats)
      if (s.strategy)     { setStrategy(s.strategy); setOpenSections(new Set(ALL_ACCORDION_IDS)) }
      if (s.detailInputs) setDetailInputs(s.detailInputs)
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

  // ── Top-area actions ──
  function handleStepClick(id: StepId) {
    setActiveStep(id); setCenterView('workspace'); setInput('')
  }

  function sendMessage() {
    const text = input.trim(); if (!text) return
    const step = STEPS[activeStep - 1]
    const msgs: ChatMsg[] = [
      { id: `u${Date.now()}`, role: 'user', text },
      { id: `a${Date.now()}`, role: 'ai',   text: `Got it — I've saved that to your ${step.label} memory.` },
    ]
    const updated = { ...stepChats, [activeStep]: [...stepChats[activeStep], ...msgs] }
    setStepChats(updated)
    const prev = brainStatus[step.sectionKey]
    const next = prev === 'New' ? 'Learning' : 'Saved'
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

  // ── Run Strategy AI ──
  function runStrategy() {
    setRunning(true)
    setTimeout(() => {
      setStrategy(MOCK_STRATEGY)
      setRunning(false)
      setOpenSections(new Set(ALL_ACCORDION_IDS))
      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 4000)
      const allDone: Record<SectionKey, MemoryStatus> = {
        brandMemory: 'Saved', competitorNotes: 'Saved', contentLibrary: 'Saved',
        strategyIdeas: 'Ready', growthSignals: 'Ready',
      }
      setBrainStatus(allDone)
      persist({ strategy: MOCK_STRATEGY, brainStatus: allDone })
      document.getElementById('strategy-output')?.scrollIntoView({ behavior: 'smooth' })
    }, 1800)
  }

  function toggleSection(id: AccordionId) {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Derived ──
  const currentStep   = STEPS[activeStep - 1]
  const currentMsgs   = stepChats[activeStep] ?? []
  const detailKey     = centerView !== 'workspace' ? (centerView as SectionKey) : null
  const activeSection = detailKey ? BRAIN_SECTIONS.find(s => s.key === detailKey) : null

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
          <button onClick={() => setShowAddLink(true)}   className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-4 py-2 rounded-lg transition"><Link2 size={13} /> Add Link</button>
          <button onClick={() => setShowAddMemory(true)} className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-4 py-2 rounded-lg transition"><Plus size={13} /> Add Memory</button>
          <button onClick={runStrategy} disabled={running} className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-60 text-white font-semibold text-sm px-4 py-2 rounded-lg transition">
            {running ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</> : <><Sparkles size={13} /> Run Strategy AI</>}
          </button>
        </div>
      </div>

      {/* ── Success toast ── */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/25 text-green-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 size={15} /> Strategy generated from Super Brain.
        </div>
      )}

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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition ${isActive ? 'border-[#FF3B1A] bg-[#FF3B1A]/10 text-white' : 'border-white/10 bg-[#0d0d0d] text-white/45 hover:text-white hover:border-white/20'}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isActive ? 'bg-[#FF3B1A] text-white' : isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/35'}`}>{step.id}</span>
                  {step.label}
                </button>
                {i < STEPS.length - 1 && <ArrowRight size={13} className="text-white/20 shrink-0" />}
              </div>
            )
          })}
        </div>
        <p className="text-white/28 text-xs mt-2 flex items-center gap-1.5">
          <span className="text-white/20 text-[11px]">ⓘ</span>
          Strategy AI powers the process: gather inputs → save memory → generate ideas → drive growth.
        </p>
      </div>

      {/* ── 2-Column: AI Workspace + Super Brain ── */}
      <div className="flex gap-4 items-start flex-wrap lg:flex-nowrap">

        {/* ── AI Workspace ── */}
        <div className="flex-1 min-w-0 bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="text-white font-semibold text-sm">
              {centerView === 'workspace' ? 'AI Workspace' : (activeSection?.title ?? 'Memory Detail')}
            </p>
            <p className="text-white/30 text-xs">
              {centerView === 'workspace' ? `Step ${activeStep} of 5` : `${currentStep.label} Memory`}
            </p>
          </div>

          {/* WORKSPACE VIEW */}
          {centerView === 'workspace' && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: 360 }}>
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
                  <button onClick={sendMessage} disabled={!input.trim()} className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0">
                    <Send size={15} />
                  </button>
                </div>
                <p className="text-white/22 text-[10px] pl-1">Share as much detail as you can. Better inputs = better strategy.</p>
              </div>
            </>
          )}

          {/* MEMORY DETAIL VIEW */}
          {centerView !== 'workspace' && detailKey && activeSection && (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: 370 }}>
                <p className="text-white/35 text-xs leading-relaxed">{activeSection.desc}. Fill in your details — Strategy AI will use this across the whole funnel.</p>
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
                <button onClick={() => setCenterView('workspace')} className="flex items-center gap-1.5 text-white/35 hover:text-white text-xs transition">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isActive ? 'bg-[#FF3B1A]/8' : 'hover:bg-white/2'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-[#FF3B1A]/20' : 'bg-white/5'}`}>
                    <Icon size={13} className={isActive ? 'text-[#FF3B1A]' : 'text-white/40'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/65'}`}>{title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>{status}</span>
                    </div>
                    <p className="text-white/28 text-[10px] truncate">{desc}</p>
                  </div>
                  <ChevronRight size={12} className={`shrink-0 ${isActive ? 'text-[#FF3B1A]' : 'text-white/18'}`} />
                </button>
              )
            })}
          </div>
          <div className="m-3 bg-white/3 border border-white/6 rounded-xl p-3">
            <p className="text-white/35 text-[11px] leading-relaxed">Memory grows as we move through the funnel. All insights are connected and reused to generate stronger ideas and results.</p>
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
            <p className="text-white/35 text-sm mt-0.5">Hooks, captions, CTAs, content ideas, briefs, and growth direction created from your Super Brain.</p>
          </div>
          {strategy && (
            <div className="flex gap-2">
              <button onClick={() => setOpenSections(new Set(ALL_ACCORDION_IDS))} className="text-xs text-white/35 hover:text-white transition border border-white/8 px-3 py-1.5 rounded-lg">Expand all</button>
              <button onClick={() => setOpenSections(new Set())}                 className="text-xs text-white/35 hover:text-white transition border border-white/8 px-3 py-1.5 rounded-lg">Collapse all</button>
            </div>
          )}
        </div>

        {/* Running state */}
        {running && (
          <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-[#FF3B1A]/40 border-t-[#FF3B1A] rounded-full animate-spin" />
              <Sparkles size={16} className="text-[#FF3B1A] animate-pulse" />
            </div>
            <p className="text-white font-semibold text-sm">Strategy AI is analyzing your Super Brain…</p>
            <p className="text-white/30 text-xs">Building hooks, captions, briefs, and your growth plan.</p>
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
              <p className="text-white/35 text-sm mt-1.5 max-w-sm mx-auto">Answer the AI questions above, then click Run Strategy AI to generate hooks, captions, CTAs, briefs, and your growth plan.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
              {[['Hooks', Zap], ['Captions', AlignLeft], ['Briefs', FileText], ['Growth Plan', TrendingUp]].map(([label, Icon]) => (
                <div key={label as string} className="bg-white/3 border border-white/6 rounded-xl p-3 text-center">
                  <div className="w-6 h-6 rounded-lg bg-[#FF3B1A]/12 flex items-center justify-center mx-auto mb-2">
                    {/* @ts-ignore */}
                    <Icon size={12} className="text-[#FF3B1A]" />
                  </div>
                  <p className="text-white/40 text-[11px] font-semibold">{label as string}</p>
                  <div className="mt-2 space-y-1">
                    {[70, 50, 80].map((w, i) => <div key={i} className="h-1 bg-white/6 rounded-full" style={{ width: `${w}%`, margin: '0 auto' }} />)}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={runStrategy} className="inline-flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition">
              <Play size={13} /> Run Strategy AI
            </button>
          </div>
        )}

        {/* Accordion sections — shown after run */}
        {!running && strategy && (
          <div className="space-y-3">

            {/* 1. Strategy Summary */}
            <AccordionSection id="summary" title="Strategy Summary" Icon={Star} isOpen={openSections.has('summary')} onToggle={() => toggleSection('summary')}>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Main Direction',              text: strategy.summary.direction   },
                  { label: "This Week's Focus",           text: strategy.summary.weekFocus   },
                  { label: 'Best Opportunity',            text: strategy.summary.opportunity },
                  { label: 'Why This Strategy Matters',   text: strategy.summary.why         },
                ].map(({ label, text }) => (
                  <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-4">
                    <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide mb-1.5">{label}</p>
                    <p className="text-white/75 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 2. Hooks */}
            <AccordionSection id="hooks" title={`Hooks (${strategy.hooks.length})`} Icon={Zap} isOpen={openSections.has('hooks')} onToggle={() => toggleSection('hooks')}>
              <div className="space-y-2">
                {strategy.hooks.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-white/80 text-sm flex-1 leading-relaxed italic">&ldquo;{h.text}&rdquo;</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-semibold bg-white/6 text-white/35 px-2 py-0.5 rounded-full">{h.type}</span>
                      <CopyBtn text={h.text} />
                      <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition">
                        <BookOpen size={10} /> Brief
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 3. Captions */}
            <AccordionSection id="captions" title={`Captions (${strategy.captions.length})`} Icon={AlignLeft} isOpen={openSections.has('captions')} onToggle={() => toggleSection('captions')}>
              <div className="space-y-3">
                {strategy.captions.map((c, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-2">
                    <p className="text-white/80 text-sm leading-relaxed">{c.text}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] bg-[#FF3B1A]/10 text-[#FF3B1A] px-2 py-0.5 rounded-full font-medium">{c.platform}</span>
                      <span className="text-[10px] bg-white/6 text-white/40 px-2 py-0.5 rounded-full">CTA: {c.cta}</span>
                      <CopyBtn text={c.text} />
                      <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition ml-auto">
                        <Star size={10} /> Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 4. CTA Strategy */}
            <AccordionSection id="cta" title="CTA Strategy" Icon={Target} isOpen={openSections.has('cta')} onToggle={() => toggleSection('cta')}>
              <div className="grid sm:grid-cols-2 gap-3">
                {strategy.ctaStrategy.map((c, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold text-sm">{c.text}</p>
                      <CopyBtn text={c.text} />
                    </div>
                    <p className="text-white/40 text-[11px]"><span className="text-white/25">Use case:</span> {c.useCase}</p>
                    <p className="text-white/40 text-[11px]"><span className="text-white/25">Why it works:</span> {c.why}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 5. Content Ideas */}
            <AccordionSection id="ideas" title={`Content Ideas (${strategy.contentIdeas.length})`} Icon={Lightbulb} isOpen={openSections.has('ideas')} onToggle={() => toggleSection('ideas')}>
              <div className="space-y-2">
                {strategy.contentIdeas.map((idea, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium">{idea.title}</p>
                      <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{idea.angle}</p>
                      <span className="inline-block mt-1.5 text-[10px] bg-[#FF3B1A]/10 text-[#FF3B1A] px-2 py-0.5 rounded-full font-medium">{idea.platform}</span>
                    </div>
                    <button className="flex items-center gap-1 shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/40 hover:bg-[#FF3B1A] hover:text-white hover:border-[#FF3B1A] transition">
                      <FileText size={10} /> Brief
                    </button>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 6. UGC Video Briefs */}
            <AccordionSection id="briefs" title={`UGC Video Briefs (${strategy.briefs.length})`} Icon={FileText} isOpen={openSections.has('briefs')} onToggle={() => toggleSection('briefs')}>
              <div className="space-y-4">
                {strategy.briefs.map((b, i) => (
                  <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold text-sm">{b.title}</p>
                        <span className="text-[10px] bg-[#FF3B1A]/10 text-[#FF3B1A] px-2 py-0.5 rounded-full font-medium mt-1 inline-block">{b.platform}</span>
                      </div>
                      <button className="flex items-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition shrink-0">
                        <Flame size={10} /> Send to Fire Creator
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[{ label: 'Hook', text: b.hook }, { label: 'Angle', text: b.angle }, { label: 'Script', text: b.script }, { label: 'Why This Works', text: b.why }].map(({ label, text }) => (
                        <div key={label} className="space-y-1">
                          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                          <p className="text-white/65 text-xs leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">Shot List</p>
                      <div className="flex flex-wrap gap-2">
                        {b.shotList.map((s, si) => (
                          <span key={si} className="text-[10px] bg-white/5 border border-white/8 text-white/50 px-2.5 py-1 rounded-lg">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wide">CTA:</span>
                      <span className="text-[#FF3B1A] text-xs font-semibold">{b.cta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 7. Fire Creator Tasks */}
            <AccordionSection id="tasks" title={`Fire Creator Tasks (${strategy.fireTasks.length})`} Icon={Flame} isOpen={openSections.has('tasks')} onToggle={() => toggleSection('tasks')}>
              <div className="space-y-2">
                {strategy.fireTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-white/80 text-sm flex-1">{t.task}</p>
                    <PriorityBadge p={t.priority} />
                    <span className="text-[9px] font-semibold bg-white/6 text-white/30 px-2 py-0.5 rounded-full">{t.status}</span>
                    <button className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/40 hover:bg-[#FF3B1A] hover:text-white hover:border-[#FF3B1A] transition shrink-0">
                      <Flame size={10} /> Assign
                    </button>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* 8. Growth Plan */}
            <AccordionSection id="growth" title="Growth Plan" Icon={TrendingUp} isOpen={openSections.has('growth')} onToggle={() => toggleSection('growth')}>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">Where to Post</p>
                    {strategy.growth.whereToPost.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                        <BarChart2 size={11} className="text-[#FF3B1A] mt-0.5 shrink-0" />
                        <p className="text-white/65 text-xs">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">Weekly Posting Plan</p>
                    {strategy.growth.weeklyPlan.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                        <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" />
                        <p className="text-white/65 text-xs">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">What to Test</p>
                    {strategy.growth.whatToTest.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                        <Mic2 size={11} className="text-[#FF3B1A] mt-0.5 shrink-0" />
                        <p className="text-white/65 text-xs">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">What to Measure</p>
                    {strategy.growth.whatToMeasure.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/3 border border-white/6 rounded-lg px-3 py-2">
                        <BarChart2 size={11} className="text-white/30 mt-0.5 shrink-0" />
                        <p className="text-white/65 text-xs">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl p-4">
                  <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide mb-1.5">Double Down On</p>
                  <p className="text-white/75 text-sm leading-relaxed">{strategy.growth.doubleDown}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/35 text-[10px] font-semibold uppercase tracking-wide">Next 7-Day Action Plan</p>
                  {strategy.growth.next7Days.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/6 rounded-xl px-4 py-3">
                      <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-white/75 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionSection>

          </div>
        )}
      </div>

      {/* ── Add Memory Modal ── */}
      {showAddMemory && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4" onClick={() => setShowAddMemory(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Add Memory</p>
              <button onClick={() => setShowAddMemory(false)} className="text-white/30 hover:text-white transition"><X size={16} /></button>
            </div>
            <p className="text-white/40 text-sm">Add a note or context directly to your Super Brain.</p>
            <textarea value={memoryInput} onChange={e => setMemoryInput(e.target.value)} rows={4} placeholder="Type memory content…" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B1A] resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setMemoryInput(''); setShowAddMemory(false) }} className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm py-2.5 rounded-xl transition">Save Memory</button>
              <button onClick={() => setShowAddMemory(false)} className="flex-1 border border-white/10 text-white/45 hover:text-white text-sm py-2.5 rounded-xl transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Link Modal ── */}
      {showAddLink && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4" onClick={() => setShowAddLink(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold">Add Link</p>
              <button onClick={() => setShowAddLink(false)} className="text-white/30 hover:text-white transition"><X size={16} /></button>
            </div>
            <p className="text-white/40 text-sm">Save a website, post, video, or reference for Strategy AI to use.</p>
            <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://…" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B1A]" />
            <div className="flex gap-2">
              <button onClick={() => { setLinkInput(''); setShowAddLink(false) }} className="flex-1 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm py-2.5 rounded-xl transition">Save Link</button>
              <button onClick={() => setShowAddLink(false)} className="flex-1 border border-white/10 text-white/45 hover:text-white text-sm py-2.5 rounded-xl transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
