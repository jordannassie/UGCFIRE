'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Message } from '@/lib/types'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const diff = today.getDate() - d.getDate()
  if (diff === 0 && today.getMonth() === d.getMonth()) return 'Today'
  if (diff === 1 && today.getMonth() === d.getMonth()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TeamChatPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const co = await getMyCompany()
      setCompany(co)

      if (co) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('company_id', co.id)
          .is('content_item_id', null)
          .order('created_at', { ascending: true })
        setMessages((data ?? []) as Message[])
      }

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !company || sending) return
    setSending(true)

    try {
      const supabase = createClient()
      const { data } = await supabase.from('messages').insert({
        company_id: company.id,
        content_item_id: null,
        sender_user_id: userId,
        sender_role: 'client',
        message: text.trim(),
      }).select().single()

      if (data) setMessages(prev => [...prev, data as Message])

      await logActivity({
        company_id: company.id,
        actor_user_id: userId,
        actor_role: 'client',
        event_type: 'client_sent_message',
        event_message: 'Client sent a message in team chat',
      })

      setText('')
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 h-full">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl flex flex-col gap-6 h-full">
      <div className="flex items-start gap-6 flex-wrap">
        {/* Company info card */}
        {company && (
          <div className="bg-[#111] border border-white/10 rounded-xl p-5 w-full md:w-64 flex-shrink-0">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Messaging</p>
            <p className="text-white font-bold">{company.name}</p>
            <p className="text-white/30 text-xs mt-1">↔ UGCFire Team</p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/40 text-xs">Team is available</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-white">Team Chat</h1>
          <p className="text-white/40 mt-1 text-sm">Message the UGCFire team directly.</p>
        </div>
      </div>

      {/* Chat thread */}
      <div className="bg-[#111] border border-white/10 rounded-xl flex flex-col" style={{ minHeight: '480px', maxHeight: '600px' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-white/20 text-sm">No messages yet. Say hello to the team!</p>
            </div>
          )}
          {messages.map((msg, idx) => {
            const isClient = msg.sender_role === 'client'
            const prevMsg = messages[idx - 1]
            const showDay = !prevMsg || formatDay(prevMsg.created_at) !== formatDay(msg.created_at)

            return (
              <div key={msg.id}>
                {showDay && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-white/20 text-xs">{formatDay(msg.created_at)}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
                <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm lg:max-w-md ${isClient ? '' : ''}`}>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isClient
                        ? 'bg-[#FF3B1A] text-white'
                        : 'bg-white/10 text-white/80'
                    }`}>
                      {msg.message}
                    </div>
                    <p className={`text-white/25 text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}>
                      {isClient ? 'You' : 'UGCFire'} · {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-white/10 p-4 flex gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
            placeholder="Message the UGCFire team…"
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-[#FF3B1A] text-white font-bold px-5 py-3 rounded-lg hover:bg-[#e02e10] transition self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
