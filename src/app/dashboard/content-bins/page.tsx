'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, statusColor } from '@/lib/data'
import type { Company, ContentItem } from '@/lib/types'
import { isDemoMode, DEMO_CONTENT_ITEMS, DEMO_COMPANY } from '@/lib/demoData'
import { Download, Play, Image as ImageIcon, Star, LayoutGrid, Video, FileImage } from 'lucide-react'

type Filter = 'all' | 'photo' | 'video' | 'carousel' | 'graphic'

const FILTERS: { key: Filter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <LayoutGrid size={14} /> },
  { key: 'photo', label: 'Photos', icon: <FileImage size={14} /> },
  { key: 'video', label: 'Videos', icon: <Video size={14} /> },
  { key: 'carousel', label: 'Carousels', icon: <ImageIcon size={14} /> },
  { key: 'graphic', label: 'Graphics', icon: <Star size={14} /> },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mediaTypeBadge(type: string) {
  const map: Record<string, string> = {
    video: 'bg-blue-500/80 text-white',
    photo: 'bg-purple-500/80 text-white',
    carousel: 'bg-indigo-500/80 text-white',
    graphic: 'bg-pink-500/80 text-white',
    other: 'bg-gray-500/80 text-white',
  }
  return map[type] ?? 'bg-gray-500/80 text-white'
}

function ContentCard({ item }: { item: ContentItem }) {
  const isVideo = item.media_type === 'video'

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-white/20 transition">
      {/* Preview */}
      <div className="relative bg-black/60 aspect-video">
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
            {isVideo
              ? <Play className="text-white/20" size={36} />
              : <ImageIcon className="text-white/20" size={36} />
            }
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mediaTypeBadge(item.media_type)}`}>
            {item.media_type}
          </span>
        </div>

        {item.can_showcase && (
          <div className="absolute top-2 right-2">
            <span className="bg-[#FF3B1A]/90 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} />
              Showcase
            </span>
          </div>
        )}

        {isVideo && item.file_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
              <Play className="text-white ml-0.5" size={20} />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-white font-semibold text-sm leading-snug">{item.title}</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-white/30">
          {item.week_label && <span>{item.week_label}</span>}
          {item.content_type && <span>· {item.content_type}</span>}
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
              className="text-white/50 text-xs hover:text-white transition border border-white/10 px-3 py-1.5 rounded-lg hover:border-[#FF3B1A] flex items-center gap-1.5"
            >
              <Download size={12} />
              Download
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
      if (isDemoMode()) {
        setCompany(DEMO_COMPANY as Company)
        setItems(DEMO_CONTENT_ITEMS.filter(i => ['approved', 'delivered'].includes(i.status)) as ContentItem[])
        setLoading(false)
        return
      }

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
    if (filter === 'photo') return item.media_type === 'photo'
    if (filter === 'video') return item.media_type === 'video'
    if (filter === 'carousel') return item.media_type === 'carousel'
    if (filter === 'graphic') return item.media_type === 'graphic'
    return true
  })

  // Count per filter
  const counts: Record<Filter, number> = {
    all: items.length,
    photo: items.filter(i => i.media_type === 'photo').length,
    video: items.filter(i => i.media_type === 'video').length,
    carousel: items.filter(i => i.media_type === 'carousel').length,
    graphic: items.filter(i => i.media_type === 'graphic').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Bins</h1>
          <p className="text-white/40 mt-1 text-sm">Your approved and delivered content. Download anytime.</p>
        </div>
        {items.length > 0 && (
          <span className="bg-[#FF3B1A]/10 text-[#FF3B1A] text-sm font-bold px-4 py-1.5 rounded-full border border-[#FF3B1A]/20">
            {items.length} asset{items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => {
          const count = counts[f.key]
          if (f.key !== 'all' && count === 0) return null
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                filter === f.key
                  ? 'bg-[#FF3B1A] text-white'
                  : 'border border-white/10 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              {f.icon}
              {f.label}
              {count > 0 && (
                <span className={`text-xs opacity-60 ${filter === f.key ? '' : ''}`}>({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-xl p-12 text-center">
          <LayoutGrid className="text-white/10 mx-auto mb-4" size={40} />
          <p className="text-white/40 font-medium text-lg mb-2">
            {items.length === 0 ? 'No approved content yet' : 'No content in this category'}
          </p>
          <p className="text-white/20 text-sm max-w-sm mx-auto">
            {items.length === 0
              ? 'No approved content yet. Check Weekly Uploads to review and approve your deliverables.'
              : 'No content matches the selected filter. Try a different category.'}
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
