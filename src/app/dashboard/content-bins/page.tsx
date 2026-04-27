'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, statusColor } from '@/lib/data'
import type { Company, ContentItem } from '@/lib/types'

type Filter = 'all' | 'photo' | 'video' | 'approved' | 'delivered'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Videos' },
  { key: 'approved', label: 'Approved' },
  { key: 'delivered', label: 'Delivered' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ContentCard({ item }: { item: ContentItem }) {
  const isVideo = item.media_type === 'video'

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
      {/* Preview */}
      <div className="relative bg-black aspect-video">
        {item.file_url ? (
          isVideo ? (
            <video
              className="w-full h-full object-cover"
              poster={item.thumbnail_url ?? undefined}
              src={item.file_url}
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.file_url} alt={item.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-sm">{isVideo ? '▶' : '🖼'}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isVideo ? 'bg-blue-500/80 text-white' : 'bg-purple-500/80 text-white'}`}>
            {isVideo ? 'Video' : 'Photo'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-white font-semibold text-sm leading-snug">{item.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {item.week_label && <span className="text-white/30 text-xs">{item.week_label}</span>}
          {item.content_type && <span className="text-white/30 text-xs">· {item.content_type}</span>}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(item.status)}`}>
            {item.status}
          </span>
          {item.file_url && (
            <a
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 text-xs hover:text-white transition border border-white/10 px-3 py-1 rounded-lg hover:border-[#FF3B1A]"
            >
              ↓ Download
            </a>
          )}
        </div>
        <p className="text-white/20 text-xs">{formatDate(item.uploaded_at)}</p>
      </div>
    </div>
  )
}

export default function ContentBinsPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const co = await getMyCompany()
      setCompany(co)

      if (co) {
        const { data } = await supabase
          .from('content_items')
          .select('*')
          .eq('company_id', co.id)
          .in('status', ['approved', 'delivered'])
          .is('deleted_at', null)
          .order('uploaded_at', { ascending: false })
        setItems((data ?? []) as ContentItem[])
      }

      setLoading(false)
    }
    load()
  }, [])

  const filtered = items.filter(item => {
    if (filter === 'all') return true
    if (filter === 'photo') return item.media_type === 'photo' || item.media_type === 'carousel' || item.media_type === 'graphic'
    if (filter === 'video') return item.media_type === 'video'
    if (filter === 'approved') return item.status === 'approved'
    if (filter === 'delivered') return item.status === 'delivered'
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Content Bins</h1>
        <p className="text-white/40 mt-1 text-sm">Your approved and delivered content. Download anytime.</p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? 'bg-[#FF3B1A] text-white'
                : 'border border-white/10 text-white/50 hover:border-white/30 hover:text-white'
            }`}
          >
            {f.label}
            {f.key === 'all' && items.length > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({items.length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/30 text-lg mb-2">No content yet</p>
          <p className="text-white/20 text-sm">
            {items.length === 0
              ? 'Your first deliverables will appear here once production begins.'
              : 'No content matches the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
