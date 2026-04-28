'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Brain, Send, Check, Pencil, ArrowRight, ChevronRight,
  Folder, Target, Users, Flame, Link2, BarChart2, Zap, Star,
  Play, BookOpen, CheckCircle2, Circle, TrendingUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = 'ai' | 'user'
interface Message { id: string; role: MessageRole; text: string; questionStep?: number }
type MemoryStatus = 'New' | 'Learning' | 'Saved'

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    step: 0,
    text: 'What is your business called?',
    placeholder: 'e.g. Apex Fitness Co.',
    followUp: 'Got it. Now let me learn more about what you offer.',
  },
  {
    step: 1,
    text: 'What do you sell? Be specific about your offer.',
    placeholder: 'e.g. 12-week online transformation program with coaching, workouts, and nutrition support…',
    followUp: 'Great. Now let me understand who we\'re talking to.',
  },
  {
    step: 2,
    text: 'Who is your ideal customer? Describe them in detail.',
    placeholder: 'e.g. Busy moms aged 28–45 who want to lose weight without crash diets or giving up family time…',
    followUp: 'Perfect. Let\'s talk about what makes you stand out.',
  },
  {
    step: 3,
    text: 'What makes your business different from the competition?',
    placeholder: 'e.g. We don\'t do diets. We build sustainable habits with real accountability and community support…',
    followUp: 'Noted. I\'ll factor that into every hook and brief I build for you. Who are we up against?',
  },
  {
    step: 4,
    text: 'Who are your top competitors? Add names, websites, or social handles.',
    placeholder: 'e.g. Kayla Itsines @kayla_itsines, 80 Day Obsession, www.fitnessbrand.com…',
    followUp: 'Competitor intelligence saved. One last question.',
  },
  {
    step: 5,
    text: 'What content, ads, posts, or hooks have worked best for you so far?',
    placeholder: 'e.g. Before/after videos, real testimonials, "stop dieting" hooks, authentic mom-life content…',
    followUp: null,
  },
]

const BRAIN_SECTIONS = [
  { key: 'brandMemory',       Icon: Folder,   title: 'Brand Memory',           desc: 'Core identity, mission, positioning',   triggerStep: 0 },
  { key: 'hookIdeas',         Icon: Zap,      title: 'Hook Ideas',             desc: 'Attention-grabbing openers',            triggerStep: 3 },
  { key: 'ctaAngles',         Icon: Target,   title: 'CTA Angles',             desc: 'Calls-to-action that convert',          triggerStep: 3 },
  { key: 'competitorNotes',   Icon: Users,    title: 'Competitor Notes',       desc: 'Competitor landscape + gaps',           triggerStep: 4 },
  { key: 'audienceInsights',  Icon: Star,     title: 'Audience Insights',      desc: 'Pain points, desires, objections',      triggerStep: 2 },
  { key: 'contentWins',       Icon: Flame,    title: 'Content Wins',           desc: "What's worked and why",                 triggerStep: 5 },
  { key: 'offerPositioning',  Icon: BarChart2,title: 'Offer Positioning',      desc: 'Your offer, pricing, guarantees',       triggerStep: 1 },
  { key: 'links',             Icon: Link2,    title: 'Links & References',     desc: 'Inspiration, examples, references',     triggerStep: -1 },
  { key: 'convSignals',       Icon: TrendingUp,title:'UGC Conversion Signals', desc: 'What drives clicks and purchases',      triggerStep: -1 },
]

const BRAIN_KEY  = 'ugcfire_super_brain'
const RUNS_KEY   = 'ugcfire_strategy_runs'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusMeta(status: MemoryStatus) {
  if (status === 'Saved')    return { color: 'bg-green-500/15 text-green-300',  dot: 'bg-green-400' }
  if (status === 'Learning') return { color: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-400' }
  return                            { color: 'bg-white/8 text-white/35',          dot: 'bg-white/25' }
}

function getStatus(triggerStep: number, answeredCount: number): MemoryStatus {
  if (triggerStep === -1)              return 'New'
  if (answeredCount > triggerStep + 1) return 'Saved'
  if (answeredCount === triggerStep + 1) return 'Learning'
  return 'New'
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BrandBrainPage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'ai',
      text: "Hi! I'm your AI content strategist. I'll ask you 6 quick questions to understand your business, your audience, and what makes you different — so I can build content that actually converts.",
    },
    {
      id: 'q0',
      role: 'ai',
      text: QUESTIONS[0].text,
      questionStep: 0,
    },
  ])

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers]         = useState<Record<number, string>>({})
  const [editingStep, setEditingStep] = useState<number | null>(null)
  const [editInput, setEditInput]     = useState('')
  const [input, setInput]             = useState('')
  const [aiTyping, setAiTyping]       = useState(false)
  const [completed, setCompleted]     = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load existing brain from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BRAIN_KEY)
      if (!stored) return
      const data = JSON.parse(stored)
      if (!data.answers) return
      const saved: Record<number, string> = data.answers
      setAnswers(saved)
      // Rebuild messages
      const rebuilt: Message[] = [
        { id: 'greeting', role: 'ai', text: "Hi! I'm your AI content strategist. I'll ask you 6 quick questions to understand your business, your audience, and what makes you different — so I can build content that actually converts." },
        { id: 'q0', role: 'ai', text: QUESTIONS[0].text, questionStep: 0 },
      ]
      const count = Object.keys(saved).length
      for (let i = 0; i < count; i++) {
        rebuilt.push({ id: `user-${i}`, role: 'user', text: saved[i], questionStep: i })
        if (i < QUESTIONS.length - 1) {
          const fu = QUESTIONS[i].followUp
          if (fu) rebuilt.push({ id: `ack-${i}`, role: 'ai', text: fu })
          if (i < count - 1 || i === count - 1) {
            rebuilt.push({ id: `q${i+1}`, role: 'ai', text: QUESTIONS[i+1].text, questionStep: i+1 })
          }
        }
      }
      if (count >= QUESTIONS.length) {
        rebuilt.push({ id: 'complete', role: 'ai', text: "Brand Brain complete! I now have everything I need to generate your first content strategy. Your Super Brain is active and ready." })
        setCompleted(true)
        setCurrentStep(QUESTIONS.length)
      } else {
        setCurrentStep(count)
      }
      setMessages(rebuilt)
    } catch {}
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiTyping])

  function saveToStorage(newAnswers: Record<number, string>) {
    localStorage.setItem(BRAIN_KEY, JSON.stringify({ answers: newAnswers, updatedAt: new Date().toISOString() }))
  }

  function submitAnswer() {
    const trimmed = input.trim()
    if (!trimmed || aiTyping) return

    const step = currentStep
    setMessages(p => [...p, { id: `user-${step}-${Date.now()}`, role: 'user', text: trimmed, questionStep: step }])
    const newAnswers = { ...answers, [step]: trimmed }
    setAnswers(newAnswers)
    saveToStorage(newAnswers)
    setInput('')
    setAiTyping(true)

    setTimeout(() => {
      setAiTyping(false)
      if (step === QUESTIONS.length - 1) {
        setCompleted(true)
        setCurrentStep(QUESTIONS.length)
        setMessages(p => [...p, {
          id: 'complete',
          role: 'ai',
          text: "Brand Brain complete! I now have everything I need to generate your first content strategy. Your Super Brain is active and ready.",
        }])
      } else {
        const nextStep = step + 1
        const followUp = QUESTIONS[step].followUp
        if (followUp) {
          setMessages(p => [...p, { id: `ack-${step}`, role: 'ai', text: followUp }])
          setTimeout(() => {
            setCurrentStep(nextStep)
            setMessages(p => [...p, { id: `q${nextStep}-${Date.now()}`, role: 'ai', text: QUESTIONS[nextStep].text, questionStep: nextStep }])
          }, 650)
        } else {
          setCurrentStep(nextStep)
          setMessages(p => [...p, { id: `q${nextStep}-${Date.now()}`, role: 'ai', text: QUESTIONS[nextStep].text, questionStep: nextStep }])
        }
      }
    }, 900)
  }

  function startEdit(step: number) {
    setEditingStep(step)
    setEditInput(answers[step] ?? '')
  }

  function saveEdit() {
    if (editingStep === null) return
    const newAnswers = { ...answers, [editingStep]: editInput.trim() }
    setAnswers(newAnswers)
    saveToStorage(newAnswers)
    setEditingStep(null)
    setEditInput('')
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / QUESTIONS.length) * 100

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={18} className="text-[#FF3B1A]" />
            <h1 className="text-2xl font-bold text-white">Brand Brain</h1>
          </div>
          <p className="text-white/40 text-sm">Your AI content strategist is building your Brand Brain.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/dashboard/strategy-ai/super-brain')} className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-lg transition hover:border-white/25">
            <Brain size={13} /> Super Brain
          </button>
          <button onClick={() => router.push('/dashboard/strategy-ai')} className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
            <Sparkles size={13} /> Run Strategy AI
          </button>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="flex gap-5 items-start flex-wrap lg:flex-nowrap">

        {/* ── AI Chat Panel ── */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#111] border border-white/8 rounded-2xl overflow-hidden" style={{ minHeight: 580 }}>

          {/* Chat header — progress */}
          <div className="px-5 pt-5 pb-4 border-b border-white/6">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FF3B1A]/15 flex items-center justify-center">
                  <Sparkles size={13} className="text-[#FF3B1A]" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-none">Strategy AI</p>
                  <p className="text-white/35 text-[10px] mt-0.5">AI Strategist</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-xs font-semibold">
                  {completed ? 'Complete ✓' : `Step ${Math.min(answeredCount + 1, 6)} of 6`}
                </p>
                <p className="text-white/25 text-[10px] mt-0.5">Answer a few questions to build your Brand Brain.</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF3B1A] rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              {QUESTIONS.map((_, i) => (
                <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition ${
                  i < answeredCount ? 'bg-[#FF3B1A] text-white' : i === answeredCount && !completed ? 'border-2 border-[#FF3B1A] text-[#FF3B1A]' : 'bg-white/8 text-white/25'
                }`}>{i + 1}</div>
              ))}
            </div>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 440 }}>
            {messages.map(msg => (
              <div key={msg.id}>
                {msg.role === 'ai' ? (
                  <div className="flex items-start gap-3 max-w-[88%]">
                    <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={11} className="text-[#FF3B1A]" />
                    </div>
                    <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-white/85 text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-[#FF3B1A]/12 border border-[#FF3B1A]/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                      {editingStep === msg.questionStep ? (
                        <div className="space-y-2">
                          <textarea
                            value={editInput}
                            onChange={e => setEditInput(e.target.value)}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="flex items-center gap-1 bg-[#FF3B1A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                              <Check size={11} /> Save
                            </button>
                            <button onClick={() => setEditingStep(null)} className="text-white/35 text-xs hover:text-white transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white/90 text-sm leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                    {msg.questionStep !== undefined && editingStep !== msg.questionStep && (
                      <div className="flex items-center gap-2 pr-1">
                        <span className="flex items-center gap-1 text-green-400 text-[10px]">
                          <CheckCircle2 size={10} /> Saved to Super Brain
                        </span>
                        <button onClick={() => startEdit(msg.questionStep!)} className="flex items-center gap-1 text-white/25 hover:text-white/60 text-[10px] transition">
                          <Pencil size={9} /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* AI typing indicator */}
            {aiTyping && (
              <div className="flex items-start gap-3 max-w-[88%]">
                <div className="w-6 h-6 rounded-full bg-[#FF3B1A]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={11} className="text-[#FF3B1A]" />
                </div>
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF3B1A]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Completion CTA */}
            {completed && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => router.push('/dashboard/strategy-ai')}
                  className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white font-semibold text-sm px-6 py-3 rounded-xl transition"
                >
                  <Play size={14} /> Run Strategy AI
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          {!completed && (
            <div className="p-4 border-t border-white/6 space-y-2">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer() } }}
                  placeholder={currentStep < QUESTIONS.length ? QUESTIONS[currentStep].placeholder : ''}
                  rows={2}
                  disabled={aiTyping || currentStep >= QUESTIONS.length}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none disabled:opacity-40"
                />
                <button
                  onClick={submitAnswer}
                  disabled={!input.trim() || aiTyping}
                  className="bg-[#FF3B1A] hover:bg-[#e02e10] disabled:opacity-35 text-white p-3 rounded-xl transition shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-white/25 text-[10px] pl-1">The more detail you share, the smarter your strategy. Press Enter to send.</p>
            </div>
          )}
        </div>

        {/* ── Super Brain Panel ── */}
        <div className="w-full lg:w-80 shrink-0 bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-white/6">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-[#FF3B1A]" />
                <p className="text-white font-semibold text-sm">Super Brain</p>
              </div>
              <span className="flex items-center gap-1.5 bg-green-500/15 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
              </span>
            </div>
            <p className="text-white/35 text-[10px] leading-relaxed">I'm capturing what you share and building your brand intelligence in real time.</p>
          </div>

          <div className="divide-y divide-white/5">
            {BRAIN_SECTIONS.map(({ key, Icon, title, desc, triggerStep }) => {
              const status = getStatus(triggerStep, answeredCount)
              const meta = statusMeta(status)
              return (
                <div key={key} className="flex items-start gap-3 px-4 py-3 hover:bg-white/2 transition cursor-pointer" onClick={() => router.push('/dashboard/strategy-ai/super-brain')}>
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={13} className="text-[#FF3B1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-white/80 text-xs font-semibold">{title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${meta.color}`}>
                        <span className={`w-1 h-1 rounded-full ${meta.dot} ${status === 'Learning' ? 'animate-pulse' : ''}`} />
                        {status}
                      </span>
                    </div>
                    <p className="text-white/30 text-[10px] mt-0.5 truncate">{desc}</p>
                  </div>
                  <ChevronRight size={12} className="text-white/20 shrink-0 mt-1" />
                </div>
              )
            })}
          </div>

          {/* Bottom callout */}
          <div className="m-3 bg-white/3 border border-white/8 rounded-xl p-3 space-y-2.5">
            <p className="text-white/45 text-[11px] leading-relaxed">
              You can add links, references, and examples anytime inside Super Brain to help Strategy AI create higher-converting UGC content.
            </p>
            <button
              onClick={() => router.push('/dashboard/strategy-ai/super-brain')}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              Open Super Brain <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
