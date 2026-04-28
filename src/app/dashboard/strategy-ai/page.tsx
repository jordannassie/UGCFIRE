'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Brain, TrendingUp, Target, Lightbulb, Zap, ChevronRight,
  Play, Clock, CheckCircle2, Copy, Check, ArrowRight, Calendar,
  BarChart2, Eye, Flame, AlertCircle, BookOpen, Send,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentIdea {
  id: string
  title: string
  format: string
  platform: string
  hook: string
  goal: string
  angle: string
}

interface UGCScript {
  id: string
  title: string
  hook: string
  body: string
  cta: string
  duration: string
}

interface StrategyRun {
  id: string
  createdAt: string
  summary: string
  contentIdeas: ContentIdea[]
  hooks: string[]
  scripts: UGCScript[]
  captions: string[]
  competitorNotes: string[]
  contentGaps: string[]
  nextActions: string[]
}

interface BrandBrain {
  businessName: string
  category: string
  offer: string
  targetCustomer: string
  brandVoice: string
  goal: string
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const BRAIN_KEY  = 'ugcfire_brand_brain'
const RUNS_KEY   = 'ugcfire_strategy_runs'
const BRIEFS_KEY = 'ugcfire_content_briefs'

// ─── Mock AI generator ────────────────────────────────────────────────────────

function generateMockStrategy(brain: BrandBrain): StrategyRun {
  const name   = brain.businessName || 'your brand'
  const cat    = brain.category     || 'your industry'
  const offer  = brain.offer        || 'your offer'
  const target = brain.targetCustomer || 'your audience'

  return {
    id: `run-${Date.now()}`,
    createdAt: new Date().toISOString(),
    summary: `This week, ${name} should focus on social proof and transformation content. Your audience (${target}) responds best to authentic before/after stories and specific outcome promises. Lead with problem-awareness hooks, then pivot to your offer (${offer}). Batch 3 short-form videos and 2 static ads this week to maintain consistent reach in ${cat}.`,

    contentIdeas: [
      {
        id: `ci-1-${Date.now()}`,
        title: 'Before & After Transformation Story',
        format: 'UGC Video',
        platform: 'TikTok / Reels',
        hook: `"I was struggling with [problem] until I found ${name}…"`,
        goal: 'Social proof + conversion',
        angle: 'Personal story, real results, authentic delivery',
      },
      {
        id: `ci-2-${Date.now()}`,
        title: `"3 Things I Wish I Knew Before Trying ${cat}"`,
        format: 'Talking Head Video',
        platform: 'TikTok / YouTube Shorts',
        hook: '"Stop wasting money on this before you watch this video…"',
        goal: 'Awareness + authority',
        angle: 'Educational, counter-intuitive, builds trust',
      },
      {
        id: `ci-3-${Date.now()}`,
        title: 'Day in the Life With the Product',
        format: 'Lifestyle UGC',
        platform: 'Instagram Reels',
        hook: '"Here\'s how I actually use this every single day…"',
        goal: 'Relatability + desire',
        angle: 'Show product naturally in daily routine',
      },
      {
        id: `ci-4-${Date.now()}`,
        title: `${target} POV: The Problem We Solve`,
        format: 'POV Skit',
        platform: 'TikTok',
        hook: '"POV: You\'re tired of [pain point] and finally found something that works…"',
        goal: 'Relatability + clicks',
        angle: 'Funny or emotional POV that mirrors the audience situation',
      },
      {
        id: `ci-5-${Date.now()}`,
        title: 'Objection Crusher Ad',
        format: 'Direct Response UGC',
        platform: 'Facebook / Instagram Ads',
        hook: '"I know what you\'re thinking — is this actually worth it?"',
        goal: 'Conversion — lower CPL',
        angle: 'Address top 3 objections head on. End with strong CTA.',
      },
    ],

    hooks: [
      `"Stop scrolling — this is for ${target} who are sick of [pain point]."`,
      `"I tried every ${cat} solution out there. Here's the only one that actually worked."`,
      `"Nobody talks about this, but ${name} changed everything for me."`,
      `"You're losing money every day you don't know about this."`,
      `"This is the ${offer} everyone in ${cat} is quietly switching to."`,
      `"I was skeptical. Now I can't imagine going back."`,
      `"${target} — this one's for you. Watch to the end."`,
      `"3 seconds: that's how long this takes. Here's what happened after 30 days."`,
      `"We asked 100 customers what they regret. Their answer was shocking."`,
      `"If you're not doing this, you're leaving results on the table."`,
    ],

    scripts: [
      {
        id: `sc-1-${Date.now()}`,
        title: 'The Transformation Hook Script',
        hook: `"I was exactly where you are 6 months ago — frustrated with ${cat} and not seeing results."`,
        body: `"I tried everything. Nothing worked. Then I found ${name} and their ${offer}. In the first week alone, I started seeing a difference. By week 4, everything had changed. The thing that's different? [Unique mechanism]. It works because [reason]. And it doesn't require [common objection]."`,
        cta: `"If you're ready to stop guessing and start getting real results, check out ${name}. Link is in the bio."`,
        duration: '30–45 seconds',
      },
      {
        id: `sc-2-${Date.now()}`,
        title: 'The Problem-Agitate-Solve Script',
        hook: '"Are you still dealing with [pain point]? Because you don\'t have to."',
        body: `"Most ${target} spend months trying to figure this out alone. They waste time, money, and energy on things that don't move the needle. Here's the truth: it's not your fault. The old way doesn't work anymore. ${name}'s ${offer} is built specifically for ${target} who want [desired outcome] without [objection]."`,
        cta: '"Click below, grab your free [lead magnet or trial], and see the difference in 7 days."',
        duration: '45–60 seconds',
      },
      {
        id: `sc-3-${Date.now()}`,
        title: 'The Social Proof Stack Script',
        hook: '"Real people. Real results. Let me show you what\'s actually happening."',
        body: `"In the last 30 days, our customers have [specific result]. One of them was [customer persona]. They came to ${name} with [problem]. After using ${offer}, they [specific outcome]. And they're not alone — hundreds of ${target} are getting the same results right now."`,
        cta: '"Ready to be next? The link to get started is below."',
        duration: '30–45 seconds',
      },
    ],

    captions: [
      `The ${cat} results don't lie 👀 Here's what happened when we put our ${offer} to the test with real ${target}. Drop a ❤️ if you want to see more. 👇 Link in bio.`,
      `Stop waiting for the "right time." The ${target} who started last month are already seeing results. Your move. #${cat.replace(/\s/g, '')} #results`,
      `We asked our community: what changed everything for you? The answer was always ${offer}. DM us "READY" and we'll show you how.`,
      `Hot take: most ${cat} solutions are built for the wrong person. ${name} is built for ${target} who actually want [outcome]. Save this if that's you.`,
      `This week's strategy: stop creating random content. Start with your audience's biggest problem, then show how you solve it. Every. Single. Time. 🔥`,
    ],

    competitorNotes: [
      `Competitors in ${cat} are leaning heavily on testimonial content — your brand should differentiate with behind-the-scenes and process transparency.`,
      `Most competitor ads in this space run 3–5x on desktop. Consider increasing mobile-first creative for better CPM efficiency.`,
      `Competitors are not addressing the objection around [price/time/trust]. This is an open gap your content can own.`,
    ],

    contentGaps: [
      `No "How it works" explainer content — ${target} need to understand the process before they buy.`,
      `Missing local/community social proof — add city or niche-specific testimonials.`,
      `No content targeting the research/consideration stage — most current content jumps straight to CTA.`,
      `Email nurture repurposing — existing content isn't being adapted for email or DM campaigns.`,
    ],

    nextActions: [
      `Set up 3 UGC shoots this week — script the Transformation Hook, PAS, and Social Proof scripts.`,
      `Create a 7-day content calendar mixing hooks, educational posts, and direct-response ads.`,
      `Audit competitor comment sections for recurring pain points to address in next week's hooks.`,
      `Submit top 2 content briefs to Fire Creator for production.`,
      `A/B test 2 hooks from this week's list in paid ads — minimum 48-hour window per variant.`,
    ],
  }
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy} className="text-white/30 hover:text-white transition p-1 rounded">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  )
}

function Tag({ label, color = 'default' }: { label: string; color?: 'red' | 'orange' | 'blue' | 'green' | 'default' }) {
  const colors = {
    red:     'bg-red-500/15 text-red-300',
    orange:  'bg-[#FF3B1A]/15 text-[#FF3B1A]',
    blue:    'bg-blue-500/15 text-blue-300',
    green:   'bg-green-500/15 text-green-300',
    default: 'bg-white/8 text-white/50',
  }
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors[color]}`}>{label}</span>
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StrategyAIPage() {
  const router = useRouter()
  const [brain, setBrain]     = useState<BrandBrain | null>(null)
  const [runs, setRuns]       = useState<StrategyRun[]>([])
  const [latest, setLatest]   = useState<StrategyRun | null>(null)
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'ideas' | 'hooks' | 'scripts' | 'captions' | 'gaps' | 'actions'>('ideas')
  const [briefs, setBriefs]   = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const b = localStorage.getItem(BRAIN_KEY)
      if (b) setBrain(JSON.parse(b))
      const r = localStorage.getItem(RUNS_KEY)
      if (r) {
        const parsed: StrategyRun[] = JSON.parse(r)
        setRuns(parsed)
        if (parsed.length) setLatest(parsed[parsed.length - 1])
      }
      const br = localStorage.getItem(BRIEFS_KEY)
      if (br) {
        const parsed: { id: string }[] = JSON.parse(br)
        const map: Record<string, boolean> = {}
        parsed.forEach(b => { map[b.id] = true })
        setBriefs(map)
      }
    } catch {}
  }, [])

  function runStrategy() {
    if (!brain) { router.push('/dashboard/strategy-ai/brand-brain'); return }
    setRunning(true)
    setTimeout(() => {
      const result = generateMockStrategy(brain)
      const updated = [...runs, result]
      setRuns(updated)
      setLatest(result)
      localStorage.setItem(RUNS_KEY, JSON.stringify(updated))
      setRunning(false)
      setActiveTab('ideas')
    }, 2200)
  }

  function createBrief(idea: ContentIdea) {
    const brief = {
      id: `brief-${Date.now()}`,
      contentIdeaId: idea.id,
      title: idea.title,
      format: idea.format,
      platform: idea.platform,
      hook: idea.hook,
      goal: idea.goal,
      angle: idea.angle,
      script: '',
      shotList: '',
      caption: '',
      visualDirection: '',
      status: 'Draft',
      createdAt: new Date().toISOString(),
    }
    const existing = JSON.parse(localStorage.getItem(BRIEFS_KEY) ?? '[]')
    localStorage.setItem(BRIEFS_KEY, JSON.stringify([...existing, brief]))
    setBriefs(p => ({ ...p, [idea.id]: true }))
    router.push(`/dashboard/strategy-ai/briefs/${brief.id}`)
  }

  const OVERVIEW_CARDS = [
    {
      icon: TrendingUp,
      label: 'This Week\'s Direction',
      value: latest ? 'Strategy Ready' : 'Not Run Yet',
      sub: latest ? `${new Date(latest.createdAt).toLocaleDateString()}` : 'Run your first strategy',
      color: 'text-[#FF3B1A]',
      bg: 'bg-[#FF3B1A]/8 border-[#FF3B1A]/20',
    },
    {
      icon: Lightbulb,
      label: 'Content Ideas',
      value: latest ? `${latest.contentIdeas.length} ideas` : '—',
      sub: 'Ready to brief',
      color: 'text-orange-400',
      bg: 'bg-orange-500/8 border-orange-500/15',
    },
    {
      icon: Target,
      label: 'Top Hooks',
      value: latest ? `${latest.hooks.length} hooks` : '—',
      sub: 'Swipe-stopping openers',
      color: 'text-blue-400',
      bg: 'bg-blue-500/8 border-blue-500/15',
    },
    {
      icon: Eye,
      label: 'Content Gaps',
      value: latest ? `${latest.contentGaps.length} gaps` : '—',
      sub: 'Opportunities to capture',
      color: 'text-purple-400',
      bg: 'bg-purple-500/8 border-purple-500/15',
    },
    {
      icon: BarChart2,
      label: 'Competitor Insights',
      value: latest ? `${latest.competitorNotes.length} notes` : '—',
      sub: 'Market intelligence',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/8 border-yellow-500/15',
    },
    {
      icon: Flame,
      label: 'Fire Creator Tasks',
      value: latest ? `${latest.nextActions.length} actions` : '—',
      sub: 'Send briefs to production',
      color: 'text-green-400',
      bg: 'bg-green-500/8 border-green-500/15',
    },
  ]

  const OUTPUT_TABS = [
    { id: 'ideas'   as const, label: `Content Ideas (${latest?.contentIdeas.length ?? 0})` },
    { id: 'hooks'   as const, label: `Hooks (${latest?.hooks.length ?? 0})` },
    { id: 'scripts' as const, label: `UGC Scripts (${latest?.scripts.length ?? 0})` },
    { id: 'captions'as const, label: `Captions (${latest?.captions.length ?? 0})` },
    { id: 'gaps'    as const, label: 'Gaps & Insights' },
    { id: 'actions' as const, label: 'Next Actions' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-[#FF3B1A]" />
            <h1 className="text-2xl font-bold text-white">Strategy AI</h1>
          </div>
          <p className="text-white/40 text-sm">Your AI content strategist — know exactly what to create next.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push('/dashboard/strategy-ai/brand-brain')}
            className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-4 py-2.5 rounded-lg transition"
          >
            <Brain size={14} /> Brand Brain
          </button>
          <button
            onClick={() => router.push('/dashboard/strategy-ai/briefs')}
            className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-4 py-2.5 rounded-lg transition"
          >
            <BookOpen size={14} /> Briefs
          </button>
          <button
            onClick={runStrategy}
            disabled={running}
            className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {running
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analyzing…</>
              : <><Play size={14} /> Run Strategy AI</>
            }
          </button>
        </div>
      </div>

      {/* Brand Brain missing callout */}
      {!brain && (
        <div className="flex items-start gap-3 bg-[#FF3B1A]/8 border border-[#FF3B1A]/20 rounded-xl px-4 py-4">
          <AlertCircle size={16} className="text-[#FF3B1A] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Set up Brand Brain first</p>
            <p className="text-white/50 text-xs mt-0.5">Tell the AI about your business so it can generate personalized strategies.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/strategy-ai/brand-brain')}
            className="flex items-center gap-1 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:bg-[#e02e10] shrink-0"
          >
            Set Up <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Brand context pill */}
      {brain && (
        <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
          <Brain size={14} className="text-[#FF3B1A] shrink-0" />
          <p className="text-white/60 text-sm">
            Strategy for <span className="text-white font-semibold">{brain.businessName}</span>
            <span className="text-white/30"> · </span>
            <span className="text-white/50">{brain.category}</span>
            <span className="text-white/30"> · </span>
            <span className="text-white/50">{brain.goal}</span>
          </p>
          <button
            onClick={() => router.push('/dashboard/strategy-ai/brand-brain')}
            className="ml-auto text-white/30 hover:text-white text-xs transition"
          >
            Edit
          </button>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {OVERVIEW_CARDS.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`bg-[#111] border rounded-xl p-4 ${card.bg}`}>
              <Icon size={16} className={`mb-3 ${card.color}`} />
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{card.label}</p>
              <p className="text-white font-bold text-lg leading-none">{card.value}</p>
              <p className="text-white/30 text-[11px] mt-1">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Running state */}
      {running && (
        <div className="bg-[#111] border border-white/8 rounded-xl p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-[#FF3B1A]/40 border-t-[#FF3B1A] rounded-full animate-spin" />
            <Sparkles size={16} className="text-[#FF3B1A] animate-pulse" />
          </div>
          <p className="text-white font-semibold">Strategy AI is analyzing your brand…</p>
          <p className="text-white/35 text-sm">Scanning content gaps, hooks, competitor moves, and opportunities.</p>
        </div>
      )}

      {/* No run yet empty state */}
      {!running && !latest && (
        <div className="bg-[#111] border border-white/8 rounded-xl p-10 text-center space-y-4">
          <Sparkles size={32} className="mx-auto text-[#FF3B1A] opacity-60" />
          <div>
            <p className="text-white font-semibold text-lg">What should we create next?</p>
            <p className="text-white/35 text-sm mt-1.5">Run Strategy AI to get your weekly content direction, hooks, scripts, and action plan.</p>
          </div>
          <button
            onClick={runStrategy}
            className="inline-flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-6 py-3 rounded-lg transition"
          >
            <Play size={14} /> Run Strategy AI
          </button>
        </div>
      )}

      {/* ── Strategy output ── */}
      {!running && latest && (
        <div className="space-y-5">

          {/* Summary */}
          <div className="bg-[#111] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#FF3B1A]" />
              <p className="text-white font-semibold text-sm">This Week's Strategy</p>
              <Tag label={new Date(latest.createdAt).toLocaleDateString()} />
              <span className="ml-auto">
                <button
                  onClick={runStrategy}
                  className="flex items-center gap-1 text-white/30 hover:text-white text-xs transition"
                >
                  <Play size={11} /> Re-run
                </button>
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">{latest.summary}</p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-[#111] border border-white/8 rounded-xl p-1 overflow-x-auto">
            {OUTPUT_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  activeTab === t.id ? 'bg-[#FF3B1A] text-white' : 'text-white/45 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Content Ideas ── */}
          {activeTab === 'ideas' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Recommended Content Ideas</p>
              {latest.contentIdeas.map((idea, i) => (
                <div key={idea.id} className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{idea.title}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Tag label={idea.format} color="orange" />
                        <Tag label={idea.platform} color="blue" />
                        <Tag label={idea.goal} color="default" />
                      </div>
                    </div>
                  </div>
                  <div className="pl-9 space-y-2">
                    <div>
                      <p className="text-white/35 text-[10px] uppercase tracking-wide mb-0.5">Hook</p>
                      <p className="text-white/75 text-xs italic">{idea.hook}</p>
                    </div>
                    <div>
                      <p className="text-white/35 text-[10px] uppercase tracking-wide mb-0.5">Angle</p>
                      <p className="text-white/60 text-xs">{idea.angle}</p>
                    </div>
                  </div>
                  <div className="pl-9 flex items-center gap-2">
                    {briefs[idea.id] ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                        <CheckCircle2 size={13} /> Brief Created
                      </span>
                    ) : (
                      <button
                        onClick={() => createBrief(idea)}
                        className="flex items-center gap-1.5 bg-white/8 hover:bg-[#FF3B1A] text-white/70 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <BookOpen size={12} /> Create Brief
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Hooks ── */}
          {activeTab === 'hooks' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Swipe-Stopping Hooks</p>
              <div className="bg-[#111] border border-white/8 rounded-xl divide-y divide-white/5">
                {latest.hooks.map((hook, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="text-white/20 text-xs font-bold w-4 shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-white/80 text-sm flex-1 italic">{hook}</p>
                    <CopyBtn text={hook} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── UGC Scripts ── */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">UGC Video Scripts</p>
              {latest.scripts.map((s, i) => (
                <div key={s.id} className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-white font-semibold text-sm">{s.title}</p>
                    <Tag label={s.duration} color="default" />
                  </div>
                  {[{ label: 'Hook', text: s.hook }, { label: 'Body', text: s.body }, { label: 'CTA', text: s.cta }].map(part => (
                    <div key={part.label} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white/35 text-[10px] uppercase tracking-wide font-semibold">{part.label}</p>
                        <CopyBtn text={part.text} />
                      </div>
                      <p className="text-white/75 text-sm leading-relaxed italic border-l-2 border-[#FF3B1A]/30 pl-3">{part.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── Captions ── */}
          {activeTab === 'captions' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Caption Ideas</p>
              <div className="bg-[#111] border border-white/8 rounded-xl divide-y divide-white/5">
                {latest.captions.map((cap, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-4">
                    <span className="text-white/20 text-xs font-bold w-4 shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-white/75 text-sm flex-1 leading-relaxed">{cap}</p>
                    <CopyBtn text={cap} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Gaps & Competitor Insights ── */}
          {activeTab === 'gaps' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Content Gaps — Opportunities to Own</p>
                <div className="bg-[#111] border border-white/8 rounded-xl divide-y divide-white/5">
                  {latest.contentGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <AlertCircle size={13} className="text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-white/75 text-sm">{gap}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Competitor Insights</p>
                <div className="bg-[#111] border border-white/8 rounded-xl divide-y divide-white/5">
                  {latest.competitorNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <Eye size={13} className="text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-white/75 text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Next Actions ── */}
          {activeTab === 'actions' && (
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Fire Creator Next Actions</p>
              <div className="bg-[#111] border border-white/8 rounded-xl divide-y divide-white/5">
                {latest.nextActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="w-5 h-5 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-white/80 text-sm flex-1">{action}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => router.push('/dashboard/strategy-ai/briefs')}
                  className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  <Send size={13} /> Send Briefs to Fire Creator
                </button>
                <button
                  onClick={() => router.push('/dashboard/strategy-ai/briefs')}
                  className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-lg transition"
                >
                  <BookOpen size={13} /> View All Briefs
                </button>
              </div>
            </div>
          )}

          {/* Runs history */}
          {runs.length > 1 && (
            <div className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock size={13} className="text-white/30" />
              <p className="text-white/35 text-xs">{runs.length} strategy runs total.</p>
              <button className="ml-auto text-white/30 hover:text-white text-xs transition flex items-center gap-1">
                View history <ChevronRight size={11} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
