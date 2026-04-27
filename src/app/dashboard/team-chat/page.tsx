'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Message } from '@/lib/types'
import { isDemoMode, DEMO_MESSAGES, DEMO_COMPANY } from '@/lib/demoData'
import { Send, Info, Users } from 'lucide-react'

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
      if (isDemoMode()) {
        setCompany(DEMO_COMPANY as Company)
        setUserId('user-demo-client')
        setMessages(DEMO_MESSAGES as Message[])
        setLoading(false)
        return
      }

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

    if (isDemoMode()) {
      const newMsg: Message = {
        id: `msg-demo-${Date.now()}`,
        company_id: company.id,
        content_item_id: null,
        sender_user_id: 'user-demo-client',
        sender_role: 'client',
        message: text.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
      } as Message
      setMessages(prev => [...prev, newMsg])
      setText('')
      setSending(false)
      return
    }

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
      <div className="space-y-6 h-full max-w-3xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">UGCFire Team Chat</h1>
          <p className="text-white/40 mt-1 text-sm">Direct line to your production team.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#111] border border-white/10 rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-white/50 text-sm">Team available</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start gap-3">
        <Info className="text-[#FF3B1A] mt-0.5 flex-shrink-0" size={16} />
        <p className="text-white/50 text-sm">All messages are reviewed by your UGCFire production team. Response time is typically within 1 business day.</p>
      </div>

      {/* Chat window */}
      <div className="bg-[#111] border border-white/10 rounded-xl flex flex-col" style={{ minHeight: '480px', maxHeight: '620px' }}>
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF3B1A]/20 flex items-center justify-center">
            <Users className="text-[#FF3B1A]" size={16} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">UGCFire Production Team</p>
            <p className="text-white/30 text-xs">{company?.name ?? ''}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Users className="text-white/10" size={36} />
              <p className="text-white/20 text-sm text-center">No messages yet. Introduce yourself to the team.</p>
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
                  <div className="max-w-sm lg:max-w-md">
                    <p className={`text-white/30 text-xs mb-1 ${isClient ? 'text-right' : 'text-left'}`}>
                      {isClient ? 'You (Client)' : 'UGCFire Team'}
                    </p>
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isClient
                        ? 'bg-gradient-to-br from-[#FF3B1A] to-[#e02e10] text-white'
                        : 'bg-white/10 text-white/80 border border-white/5'
                    }`}>
                      {msg.message}
                    </div>
                    <p className={`text-white/20 text-xs mt-1 ${isClient ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-white/10 p-4 flex gap-3 items-end">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
            placeholder="Message the UGCFire team..."
            rows={2}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-[#FF3B1A] text-white font-bold px-4 py-3 rounded-lg hover:bg-[#e02e10] transition self-end disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
            {sending ? 'Sending' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
