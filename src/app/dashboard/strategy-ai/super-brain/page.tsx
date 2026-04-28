'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain, Sparkles, Plus, Link2, BookOpen, Play,
  Folder, Target, Users, Flame, BarChart2, Zap, Star, TrendingUp,
  ChevronRight, Check, Clock, ArrowRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryCard {
  id: string
  icon: React.ElementType
  title: string
  chip: { label: string; color: string }
  content: React.ReactNode
}

// ─── Memory card content ──────────────────────────────────────────────────────

const MEMORY_CARDS: MemoryCard[] = [
  {
    id: 'brandMemory',
    icon: Folder,
    title: 'Brand Memory',
    chip: { label: 'Saved to Super Brain', color: 'bg-green-500/15 text-green-300' },
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wide font-semibold mb-1">Core Positioning</p>
          <p className="text-white/75 leading-relaxed">Fitness coaching for busy moms that helps them lose weight without diets.</p>
        </div>
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wide font-semibold mb-1">Main Offer</p>
          <p className="text-white/75 leading-relaxed">12-week transformation program with coaching, workouts, and nutrition support.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'audienceVoice',
    icon: Users,
    title: 'Audience & Voice',
    chip: { label: 'Saved to Super Brain', color: 'bg-green-500/15 text-green-300' },
    content: (
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wide font-semibold mb-1">Target Customer</p>
          <p className="text-white/75 leading-relaxed">Women 28–45, busy moms, tired of diets, want real results without giving up family life.</p>
        </div>
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wide font-semibold mb-1">Brand Voice</p>
          <p className="text-white/75 leading-relaxed">Empowering, real, no-BS, supportive big sister energy.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'hookLibrary',
    icon: Zap,
    title: 'Hook Library',
    chip: { label: 'Ready for briefs', color: 'bg-blue-500/15 text-blue-300' },
    content: (
      <div className="space-y-2">
        {[
          "I didn't have time for the gym, but I still lost 27 lbs.",
          'This is the exact plan that helped me lose 2 jean sizes.',
          'No diets. No guilt. Just real results.',
        ].map((h, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#FF3B1A]/15 text-[#FF3B1A] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
            <p className="text-white/75 text-sm italic leading-relaxed">{h}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'ctaStrategy',
    icon: Target,
    title: 'CTA Strategy',
    chip: { label: 'Used in strategy', color: 'bg-[#FF3B1A]/15 text-[#FF3B1A]' },
    content: (
      <div className="space-y-2">
        {[
          'DM "READY" to start your transformation',
          'Tap the link to get your free strategy call',
          'Comment "PLAN" and I\'ll send you the details',
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check size={11} className="text-[#FF3B1A] shrink-0" />
            <p className="text-white/75 text-sm">{c}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'competitorIntel',
    icon: BarChart2,
    title: 'Competitor Intel',
    chip: { label: 'Saved to Super Brain', color: 'bg-green-500/15 text-green-300' },
    content: (
      <div className="space-y-2">
        {[
          'Competitors overuse extreme transformation messaging',
          'Weak on real mom-life messaging and authenticity',
          'Strong on free plans and challenges — gap to exploit',
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
            <p className="text-white/70 text-sm leading-relaxed">{n}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'winningAngles',
    icon: Flame,
    title: 'Winning Angles',
    chip: { label: 'Ready for briefs', color: 'bg-blue-500/15 text-blue-300' },
    content: (
      <div className="flex flex-wrap gap-1.5">
        {[
          'Real mom life + real results',
          'Simple steps, sustainable change',
          'No diets. Just balance.',
          'Accountability + community',
          'Feel confident in your own skin',
        ].map(a => (
          <span key={a} className="bg-white/8 border border-white/10 text-white/65 text-xs px-2.5 py-1 rounded-lg">{a}</span>
        ))}
      </div>
    ),
  },
  {
    id: 'linksRefs',
    icon: Link2,
    title: 'Links & References',
    chip: { label: 'Saved to Super Brain', color: 'bg-green-500/15 text-green-300' },
    content: (
      <div className="space-y-2">
        {[
          { label: 'Instagram reel inspiration', url: '#' },
          { label: 'YouTube workout routine', url: '#' },
          { label: 'Landing page inspiration', url: '#' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <Link2 size={11} className="text-white/30 shrink-0" />
            <p className="text-white/65 text-sm hover:text-white transition cursor-pointer">{l.label}</p>
          </div>
        ))}
        <button className="flex items-center gap-1.5 text-[#FF3B1A] text-xs font-semibold mt-1 hover:underline">
          <Plus size={11} /> Add Link
        </button>
      </div>
    ),
  },
  {
    id: 'conversionSignals',
    icon: TrendingUp,
    title: 'UGC Conversion Signals',
    chip: { label: 'High Impact', color: 'bg-purple-500/15 text-purple-300' },
    content: (
      <div className="space-y-2">
        {[
          'Show real results early in video (first 3s)',
          'Address time constraints + mom guilt directly',
          'Use before/after + social proof together',
          'Strong CTA within first 10 seconds of hook',
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <Star size={10} className="text-purple-400 shrink-0 mt-1" />
            <p className="text-white/70 text-sm leading-relaxed">{s}</p>
          </div>
        ))}
      </div>
    ),
  },
]

const TIMELINE = [
  { label: 'Competitor notes added', chip: 'Updated', time: '2h ago',   chipColor: 'bg-blue-500/15 text-blue-300' },
  { label: 'New CTA angle saved: "Comment PLAN"', chip: 'New', time: '3h ago', chipColor: 'bg-[#FF3B1A]/15 text-[#FF3B1A]' },
  { label: 'Audience pain points updated', chip: 'Updated', time: '5h ago', chipColor: 'bg-blue-500/15 text-blue-300' },
  { label: 'Hook added: "No diets. No guilt. Just results."', chip: 'Saved to Super Brain', time: '1d ago', chipColor: 'bg-green-500/15 text-green-300' },
  { label: 'Brand Memory established', chip: 'Saved to Super Brain', time: '1d ago', chipColor: 'bg-green-500/15 text-green-300' },
]

const USAGE = [
  { label: 'Hooks', value: 24, color: 'bg-[#FF3B1A]' },
  { label: 'Angles', value: 18, color: 'bg-orange-400' },
  { label: 'CTAs', value: 12, color: 'bg-blue-400' },
  { label: 'Links', value: 10, color: 'bg-purple-400' },
  { label: 'Other', value: 23, color: 'bg-white/20' },
]

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SuperBrainPage() {
  const router = useRouter()
  const [showAddMemory, setShowAddMemory] = useState(false)

  const total = USAGE.reduce((s, u) => s + u.value, 0)

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} className="text-[#FF3B1A]" />
            <h1 className="text-2xl font-bold text-white">Super Brain</h1>
          </div>
          <p className="text-white/40 text-sm">Your living strategy memory for better UGC conversions.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAddMemory(true)} className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white text-sm px-3 py-2 rounded-lg transition hover:border-white/25">
            <Plus size={13} /> Add Memory
          </button>
          <button className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white text-sm px-3 py-2 rounded-lg transition hover:border-white/25">
            <Link2 size={13} /> Add Link
          </button>
          <button onClick={() => router.push('/dashboard/strategy-ai/briefs')} className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white text-sm px-3 py-2 rounded-lg transition hover:border-white/25">
            <BookOpen size={13} /> Generate Brief
          </button>
          <button onClick={() => router.push('/dashboard/strategy-ai')} className="flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <Sparkles size={13} /> Run Strategy AI
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Memory Status', value: 'Strong', sub: '& Growing', accent: true },
          { label: 'Last Updated', value: 'Today', sub: '2h ago' },
          { label: 'Memories Saved', value: '87', sub: 'Total entries' },
          { label: 'Briefs Ready', value: '5', sub: 'Content briefs' },
          { label: 'Strategies Run', value: '12', sub: 'AI runs' },
        ].map(s => (
          <div key={s.label} className={`bg-[#111] border rounded-xl p-3 text-center ${s.accent ? 'border-[#FF3B1A]/30' : 'border-white/8'}`}>
            <p className={`text-lg font-bold leading-none ${s.accent ? 'text-[#FF3B1A]' : 'text-white'}`}>{s.value}</p>
            {s.sub && <p className="text-white/30 text-[9px] mt-0.5">{s.sub}</p>}
            <p className="text-white/40 text-[10px] mt-1 font-semibold">{s.label}</p>
          </div>
        ))}
        <div className="bg-[#111] border border-white/8 rounded-xl p-3 text-center flex flex-col items-center justify-center">
          <button onClick={() => {}} className="text-[#FF3B1A] text-xs font-semibold hover:underline flex items-center gap-1">
            View History <ChevronRight size={11} />
          </button>
        </div>
      </div>

      {/* Memory cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MEMORY_CARDS.map(card => {
          const Icon = card.icon
          return (
            <div key={card.id} className="bg-[#111] border border-white/8 rounded-xl p-5 space-y-3 hover:border-white/15 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF3B1A]/12 flex items-center justify-center">
                    <Icon size={15} className="text-[#FF3B1A]" />
                  </div>
                  <p className="text-white font-semibold text-sm">{card.title}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${card.chip.color}`}>{card.chip.label}</span>
              </div>
              <div>{card.content}</div>
            </div>
          )
        })}
      </div>

      {/* Bottom 2-col: timeline + usage */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent updates timeline */}
        <div className="lg:col-span-3 bg-[#111] border border-white/8 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Recent Super Brain Updates</p>
          </div>
          <div className="space-y-3">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0 mt-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#FF3B1A]" />
                  {i < TIMELINE.length - 1 && <div className="w-px h-6 bg-white/8" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white/75 text-sm">{item.label}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.chipColor}`}>{item.chip}</span>
                  </div>
                  <p className="text-white/25 text-[10px] mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage card */}
        <div className="lg:col-span-2 bg-[#111] border border-white/8 rounded-xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-[#FF3B1A]" />
            <p className="text-white font-semibold text-sm">Super Brain Usage</p>
          </div>

          <div className="text-center py-2">
            <p className="text-4xl font-bold text-white">{total}</p>
            <p className="text-white/35 text-xs mt-1">Total Memories</p>
          </div>

          {/* Bar breakdown */}
          <div className="space-y-2.5">
            {USAGE.map(u => (
              <div key={u.label} className="flex items-center gap-3">
                <p className="text-white/50 text-xs w-12 shrink-0">{u.label}</p>
                <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${u.color}`} style={{ width: `${(u.value / total) * 100}%` }} />
                </div>
                <p className="text-white/35 text-xs w-6 text-right shrink-0">{u.value}</p>
              </div>
            ))}
          </div>

          {/* Callout */}
          <div className="mt-auto bg-[#FF3B1A]/8 border border-[#FF3B1A]/18 rounded-xl p-3 space-y-2">
            <p className="text-white/60 text-xs leading-relaxed">
              Keep your Super Brain fresh and win more. The more you add, the smarter your strategies and briefs become.
            </p>
            <button
              onClick={() => setShowAddMemory(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-semibold py-2 rounded-lg transition"
            >
              <Plus size={11} /> Add Memory
            </button>
          </div>
        </div>
      </div>

      {/* Add Memory modal */}
      {showAddMemory && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowAddMemory(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-white/12 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center gap-2">
                <Brain size={15} className="text-[#FF3B1A]" />
                <p className="text-white font-semibold">Add to Super Brain</p>
              </div>
              <div className="space-y-3">
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF3B1A]">
                  <option value="">Select memory type…</option>
                  <option>Brand Memory</option>
                  <option>Hook Ideas</option>
                  <option>CTA Angles</option>
                  <option>Competitor Notes</option>
                  <option>Audience Insights</option>
                  <option>Content Wins</option>
                  <option>Offer Positioning</option>
                  <option>Links & References</option>
                  <option>UGC Conversion Signals</option>
                </select>
                <textarea
                  placeholder="What do you want to save to Super Brain? Be specific."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#FF3B1A] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMemory(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold py-2.5 rounded-lg transition"
                >
                  <Check size={13} /> Save to Super Brain
                </button>
                <button onClick={() => setShowAddMemory(false)} className="border border-white/10 text-white/40 px-4 py-2.5 rounded-lg text-sm hover:border-white/25 hover:text-white transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
