'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/data'
import { Send } from 'lucide-react'
import type { Message } from '@/lib/types'
import { isDemoMode, DEMO_MESSAGES, DEMO_COMPANIES } from '@/lib/demoData'

interface CompanyThread {
  id: string
  name: string
  unread_count: number
  last_message: string | null
  last_message_at: string | null
}

export default function AdminMessagesPage() {
  const [companies, setCompanies] = useState<CompanyThread[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [adminUserId, setAdminUserId] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadCompanies() {
    if (isDemoMode()) {
      setCompanies(DEMO_COMPANIES.map(c => ({
        id: c.id,
        name: c.name,
        unread_count: DEMO_MESSAGES.filter(m => m.company_id === c.id && !m.read_at && m.sender_role === 'client').length,
        last_message: DEMO_MESSAGES.filter(m => m.company_id === c.id).slice(-1)[0]?.message ?? null,
        last_message_at: DEMO_MESSAGES.filter(m => m.company_id === c.id).slice(-1)[0]?.created_at ?? null,
      })).filter(c => DEMO_MESSAGES.some(m => m.company_id === c.id)))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setAdminUserId(user.id)

    const { data: msgs } = await supabase
      .from('messages')
      .select('company_id, sender_role, message, created_at, read_at')
      .is('content_item_id', null)
      .order('created_at', { ascending: false })

    if (!msgs) { setLoading(false); return }

    const companyMap = new Map<string, { unread: number; last: string; lastAt: string }>()
    for (const m of msgs) {
      if (!companyMap.has(m.company_id)) {
        companyMap.set(m.company_id, { unread: 0, last: m.message, lastAt: m.created_at })
      }
      if (m.sender_role === 'client' && !m.read_at) {
        companyMap.get(m.company_id)!.unread++
      }
    }

    const companyIds = Array.from(companyMap.keys())
    if (companyIds.length === 0) { setLoading(false); return }

    const { data: comps } = await supabase.from('companies').select('id, name').in('id', companyIds)
    const threads: CompanyThread[] = (comps ?? []).map((c: { id: string; name: string }) => {
      const info = companyMap.get(c.id)!
      return { id: c.id, name: c.name, unread_count: info.unread, last_message: info.last, last_message_at: info.lastAt }
    }).sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''))

    setCompanies(threads)
    setLoading(false)
  }

  async function selectCompany(companyId: string) {
    setSelectedCompanyId(companyId)
    setThreadLoading(true)

    if (isDemoMode()) {
      setMessages(DEMO_MESSAGES.filter(m => m.company_id === companyId) as unknown as Message[])
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, unread_count: 0 } : c))
      setThreadLoading(false)
      return
    }

    const supabase = createClient()

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('company_id', companyId)
      .is('content_item_id', null)
      .order('created_at', { ascending: true })

    setMessages((data ?? []) as Message[])
    setThreadLoading(false)

    // Mark client messages as read
    const now = new Date().toISOString()
    await supabase
      .from('messages')
      .update({ read_at: now })
      .eq('company_id', companyId)
      .eq('sender_role', 'client')
      .is('read_at', null)

    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, unread_count: 0 } : c))
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedCompanyId) return
    setSending(true)

    if (isDemoMode()) {
      const demoMsg = {
        id: `demo-msg-${Date.now()}`,
        company_id: selectedCompanyId,
        content_item_id: null,
        sender_user_id: 'user-admin',
        sender_role: 'admin',
        message: replyText.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, demoMsg as unknown as Message])
      setReplyText('')
      setSending(false)
      return
    }

    const supabase = createClient()
    const { data } = await supabase.from('messages').insert({
      company_id: selectedCompanyId,
      content_item_id: null,
      sender_user_id: adminUserId,
      sender_role: 'admin',
      message: replyText.trim(),
    }).select().single()

    if (data) setMessages(prev => [...prev, data as Message])
    setReplyText('')
    setSending(false)
    await logActivity({ company_id: selectedCompanyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'admin_sent_message', event_message: 'Admin sent a message' })
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)
  const totalUnread = companies.reduce((sum, c) => sum + c.unread_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-white/40 text-sm mt-1">
          Admin inbox — all client threads
          {totalUnread > 0 && (
            <span className="ml-2 bg-[#FF3B1A] text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnread} unread</span>
          )}
        </p>
      </div>

      <div className="flex gap-0 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left panel - company list */}
        <div className="w-72 shrink-0 bg-[#111] border border-white/10 rounded-l-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-white/40 text-sm">Loading...</div>
            ) : companies.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">No messages yet</div>
            ) : (
              companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCompany(c.id)}
                  className={`w-full text-left p-4 border-b border-white/5 transition ${selectedCompanyId === c.id ? 'bg-[#FF3B1A]/10 border-l-2 border-l-[#FF3B1A]' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium truncate">{c.name}</span>
                    {c.unread_count > 0 && (
                      <span className="bg-[#FF3B1A] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  {c.last_message && (
                    <p className="text-white/40 text-xs truncate">{c.last_message}</p>
                  )}
                  {c.last_message_at && (
                    <p className="text-white/20 text-xs mt-1">{new Date(c.last_message_at).toLocaleDateString()}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel - thread */}
        <div className="flex-1 bg-[#0d0d0d] border border-l-0 border-white/10 rounded-r-xl flex flex-col overflow-hidden">
          {!selectedCompanyId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-white/30 text-sm">Select a conversation</p>
                <p className="text-white/20 text-xs mt-1">to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div>
                  <p className="text-white font-semibold">{selectedCompany?.name}</p>
                  <p className="text-white/40 text-xs">{messages.length} messages in thread</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadLoading ? (
                  <div className="text-center text-white/40 text-sm py-8">Loading thread...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-white/30 text-sm py-8">No messages in this thread yet</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm px-4 py-3 rounded-xl text-sm ${msg.sender_role === 'admin' ? 'bg-[#FF3B1A]/20 text-white' : 'bg-white/8 text-white/80'}`}>
                        <p className={`text-xs mb-1.5 font-medium ${msg.sender_role === 'admin' ? 'text-[#FF3B1A]' : 'text-white/40'}`}>
                          {msg.sender_role === 'admin' ? 'You (Admin)' : selectedCompany?.name ?? 'Client'}
                          {' · '}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10 flex gap-3">
                <input
                  type="text"
                  placeholder="Type a reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                  className="bg-[#FF3B1A] text-white font-bold px-5 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={14} />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
