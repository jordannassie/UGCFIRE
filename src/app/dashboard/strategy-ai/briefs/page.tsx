'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, ChevronRight, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react'

const BRIEFS_KEY = 'ugcfire_content_briefs'

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

export default function BriefsListPage() {
  const router = useRouter()
  const [briefs, setBriefs] = useState<ContentBrief[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BRIEFS_KEY)
      if (stored) setBriefs(JSON.parse(stored))
    } catch {}
  }, [])

  function sendToFireCreator(id: string) {
    const updated = briefs.map(b => b.id === id ? { ...b, status: 'Sent to Fire Creator' as const } : b)
    setBriefs(updated)
    localStorage.setItem(BRIEFS_KEY, JSON.stringify(updated))
  }

  const statusCounts = {
    draft: briefs.filter(b => b.status === 'Draft').length,
    sent:  briefs.filter(b => b.status === 'Sent to Fire Creator').length,
    done:  briefs.filter(b => b.status === 'Done').length,
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} className="text-[#FF3B1A]" />
            <h1 className="text-2xl font-bold text-white">Content Briefs</h1>
          </div>
          <p className="text-white/40 text-sm">Each brief is ready to send to Fire Creator for production.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/strategy-ai')}
          className="flex items-center gap-1.5 border border-white/10 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-lg transition hover:border-white/25"
        >
          <Sparkles size={13} /> Strategy AI
        </button>
      </div>

      {/* Stats */}
      {briefs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Drafts', value: statusCounts.draft, color: 'text-white/60' },
            { label: 'Sent to Fire Creator', value: statusCounts.sent, color: 'text-[#FF3B1A]' },
            { label: 'Done', value: statusCounts.done, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#111] border border-white/8 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-white/35 text-[11px] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Brief list */}
      {briefs.length === 0 ? (
        <div className="bg-[#111] border border-white/8 rounded-xl p-10 text-center space-y-4">
          <BookOpen size={28} className="mx-auto text-white/20" />
          <div>
            <p className="text-white font-semibold">No briefs yet</p>
            <p className="text-white/35 text-sm mt-1">Run Strategy AI and click "Create Brief" on any content idea.</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/strategy-ai')}
            className="inline-flex items-center gap-2 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            <Sparkles size={13} /> Run Strategy AI
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {briefs.map(brief => {
            const meta = STATUS_META[brief.status] ?? STATUS_META['Draft']
            return (
              <div key={brief.id} className="bg-[#111] border border-white/8 rounded-xl p-5 hover:border-white/15 transition">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-white font-semibold text-sm">{brief.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-white/35 text-xs">
                      {brief.format && <span>{brief.format}</span>}
                      {brief.platform && <><span>·</span><span>{brief.platform}</span></>}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {new Date(brief.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {brief.hook && (
                      <p className="text-white/45 text-xs mt-2 italic line-clamp-1">{brief.hook}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {brief.status === 'Draft' && (
                      <button
                        onClick={() => sendToFireCreator(brief.id)}
                        className="flex items-center gap-1.5 bg-[#FF3B1A] hover:bg-[#e02e10] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <Send size={11} /> Send to Fire Creator
                      </button>
                    )}
                    {brief.status === 'Sent to Fire Creator' && (
                      <span className="flex items-center gap-1 text-[#FF3B1A] text-xs font-semibold">
                        <CheckCircle2 size={13} /> Sent
                      </span>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/strategy-ai/briefs/${brief.id}`)}
                      className="text-white/30 hover:text-white transition"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
