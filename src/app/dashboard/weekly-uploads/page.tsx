'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity, statusColor } from '@/lib/data'
import type { Company, ContentItem, Message } from '@/lib/types'
import { isDemoMode, DEMO_CONTENT_ITEMS, DEMO_COMPANY } from '@/lib/demoData'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function MediaPreview({ item }: { item: ContentItem }) {
  if (!item.file_url) {
    return (
      <div className="w-full h-40 bg-white/5 rounded-lg flex items-center justify-center">
        <span className="text-white/20 text-sm">No preview available</span>
      </div>
    )
  }

  if (item.media_type === 'video') {
    return (
      <video
        controls
        className="w-full h-40 rounded-lg object-cover bg-black"
        poster={item.thumbnail_url ?? undefined}
        src={item.file_url}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.file_url}
      alt={item.title}
      className="w-full h-40 rounded-lg object-cover"
    />
  )
}

function CommentThread({ item, userId }: { item: ContentItem; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('content_item_id', item.id)
        .order('created_at', { ascending: true })
      setMessages((data ?? []) as Message[])
    }
    loadMessages()
  }, [item.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)

    const supabase = createClient()
    const { data } = await supabase.from('messages').insert({
      company_id: item.company_id,
      content_item_id: item.id,
      sender_user_id: userId,
      sender_role: 'client',
      message: text.trim(),
    }).select().single()

    if (data) setMessages(prev => [...prev, data as Message])
    setText('')
    setSending(false)
  }

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <p className="text-white/30 text-xs mb-3 font-medium uppercase tracking-wider">Comments</p>
      {messages.length === 0 && (
        <p className="text-white/20 text-xs mb-3">No comments yet.</p>
      )}
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_role === 'client' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs text-xs px-3 py-2 rounded-lg ${msg.sender_role === 'client' ? 'bg-[#FF3B1A]/20 text-white' : 'bg-white/5 text-white/70'}`}>
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#FF3B1A] focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-[#FF3B1A] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default function WeeklyUploadsPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [revisionItem, setRevisionItem] = useState<string | null>(null)
  const [revisionNote, setRevisionNote] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        setCompany(DEMO_COMPANY as Company)
        setUserId('user-demo-client')
        setItems(DEMO_CONTENT_ITEMS.filter(i => ['ready_for_review', 'revision_requested'].includes(i.status)) as ContentItem[])
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const co = await getMyCompany()
      setCompany(co)
      if (co) await fetchItems(co.id)
      setLoading(false)
    }
    load()
  }, [])

  async function fetchItems(companyId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['ready_for_review', 'revision_requested'])
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
    setItems((data ?? []) as ContentItem[])
  }

  async function approveItem(item: ContentItem) {
    if (!company || processing) return
    setProcessing(item.id)

    if (isDemoMode()) {
      setItems(prev => prev.filter(i => i.id !== item.id))
      setProcessing(null)
      return
    }

    const supabase = createClient()
    await supabase.from('content_items').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('id', item.id)

    await logActivity({
      company_id: company.id,
      actor_user_id: userId,
      actor_role: 'client',
      event_type: 'client_approved_video',
      event_message: `Client approved: ${item.title}`,
      metadata: { content_item_id: item.id },
    })

    await fetchItems(company.id)
    setProcessing(null)
  }

  async function submitRevision(item: ContentItem) {
    if (!company || !revisionNote.trim() || processing) return
    setProcessing(item.id)

    if (isDemoMode()) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'revision_requested' } : i))
      setRevisionItem(null)
      setRevisionNote('')
      setProcessing(null)
      return
    }

    const supabase = createClient()
    await supabase.from('content_items').update({ status: 'revision_requested' }).eq('id', item.id)

    await supabase.from('content_revisions').insert({
      content_item_id: item.id,
      company_id: company.id,
      requested_by: userId,
      revision_note: revisionNote.trim(),
      status: 'open',
    })

    await supabase.from('messages').insert({
      company_id: company.id,
      content_item_id: item.id,
      sender_user_id: userId,
      sender_role: 'client',
      message: revisionNote.trim(),
    })

    await logActivity({
      company_id: company.id,
      actor_user_id: userId,
      actor_role: 'client',
      event_type: 'client_requested_revision',
      event_message: `Client requested revision: ${item.title}`,
      metadata: { content_item_id: item.id, note: revisionNote.trim() },
    })

    setRevisionItem(null)
    setRevisionNote('')
    await fetchItems(company.id)
    setProcessing(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Weekly Uploads</h1>
        <p className="text-white/40 mt-1 text-sm">Review and approve your content deliverables.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/30 text-lg mb-2">No content ready for review</p>
          <p className="text-white/20 text-sm">Your first deliverables will appear here once production begins.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {items.map(item => (
            <div key={item.id} className="bg-[#111] border border-white/10 rounded-xl p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.media_type === 'video' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                      {item.media_type === 'video' ? 'Video' : 'Photo'}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                  {item.week_label && <p className="text-white/30 text-xs mt-0.5">{item.week_label}</p>}
                  {item.content_type && <p className="text-white/40 text-xs">{item.content_type}</p>}
                </div>
              </div>

              {/* Media preview */}
              <MediaPreview item={item} />

              {/* Actions */}
              {item.status === 'ready_for_review' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => approveItem(item)}
                    disabled={processing === item.id}
                    className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold py-2 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                  >
                    {processing === item.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => { setRevisionItem(item.id); setRevisionNote('') }}
                    disabled={processing === item.id}
                    className="flex-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold py-2 rounded-lg hover:bg-orange-500/30 transition disabled:opacity-50"
                  >
                    Request Revision
                  </button>
                </div>
              )}

              {/* Revision input */}
              {revisionItem === item.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={revisionNote}
                    onChange={e => setRevisionNote(e.target.value)}
                    placeholder="Describe the revision needed..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-[#FF3B1A] focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitRevision(item)}
                      disabled={!revisionNote.trim() || processing === item.id}
                      className="bg-[#FF3B1A] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50"
                    >
                      {processing === item.id ? 'Sending...' : 'Send Revision'}
                    </button>
                    <button
                      onClick={() => setRevisionItem(null)}
                      className="text-white/40 text-xs px-3 py-2 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Download */}
              {item.file_url && (
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-white/50 text-xs hover:text-white transition"
                >
                  ↓ Download
                </a>
              )}

              {/* Comment thread */}
              <CommentThread item={item} userId={userId} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
