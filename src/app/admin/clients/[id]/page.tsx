'use client'
import { use, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusColor, logActivity } from '@/lib/data'
import { Check, X, Send, ExternalLink } from 'lucide-react'
import type {
  Company, Profile, Plan, BrandBrief, ContentItem, ClientUpload,
  Message, BillingRecord, Agreement, ActivityLog, ContentStatus, BillingStatus
} from '@/lib/types'
import {
  isDemoMode, DEMO_COMPANIES, DEMO_ALL_CONTENT, DEMO_CLIENT_UPLOADS,
  DEMO_MESSAGES, DEMO_BILLING_RECORDS, DEMO_AGREEMENTS, DEMO_BRAND_BRIEF,
  DEMO_ACTIVITY_LOGS, DEMO_PLANS,
} from '@/lib/demoData'

const TABS = ['Overview', 'Brand Brief', 'Content', 'Client Uploads', 'Messages', 'Billing', 'Agreement', 'Activity Log'] as const
type Tab = typeof TABS[number]

const CONTENT_STATUSES: ContentStatus[] = ['in_production', 'ready_for_review', 'revision_requested', 'approved', 'delivered', 'archived']
const BILLING_STATUSES: BillingStatus[] = ['inactive', 'active_mock', 'past_due_mock', 'canceled_mock']

const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  inactive: 'Inactive',
  active_mock: 'Active',
  past_due_mock: 'Past Due',
  canceled_mock: 'Canceled',
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [tab, setTab] = useState<Tab>('Overview')

  const [company, setCompany] = useState<Company | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [brief, setBrief] = useState<BrandBrief | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [clientUploads, setClientUploads] = useState<ClientUpload[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [billing, setBilling] = useState<BillingRecord | null>(null)
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [adminUserId, setAdminUserId] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAll()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  async function loadAll() {
    if (isDemoMode()) {
      const companyId = id
      const demoComp = DEMO_COMPANIES.find(c => c.id === companyId) ?? DEMO_COMPANIES[0]
      setCompany({
        ...demoComp,
        website: null,
        created_at: '2026-04-01T00:00:00Z',
        is_demo: true,
      } as unknown as Company)
      setProfile({
        id: demoComp.owner_user_id,
        email: demoComp.owner_email,
        full_name: demoComp.name + ' Owner',
        role: 'client',
        created_at: '2026-04-01T00:00:00Z',
      } as unknown as Profile)
      const demoPlan = DEMO_PLANS.find(p => p.id === demoComp.plan_id)
      setPlan(demoPlan ? { ...demoPlan } as unknown as Plan : null)
      setBrief(demoComp.id === 'company-demo-brand' ? DEMO_BRAND_BRIEF as unknown as BrandBrief : null)
      setContent(DEMO_ALL_CONTENT.filter(c => c.company_id === companyId) as unknown as ContentItem[])
      setClientUploads(DEMO_CLIENT_UPLOADS.filter(u => u.company_id === companyId) as unknown as ClientUpload[])
      setMessages(DEMO_MESSAGES.filter(m => m.company_id === companyId) as unknown as Message[])
      const demoBilling = DEMO_BILLING_RECORDS.find(b => b.company_id === companyId)
      setBilling(demoBilling ? { ...demoBilling } as unknown as BillingRecord : null)
      const demoAgreement = DEMO_AGREEMENTS.find(a => a.company_id === companyId)
      setAgreement(demoAgreement ? { ...demoAgreement, accepted_checkbox: true } as unknown as Agreement : null)
      setActivityLogs(DEMO_ACTIVITY_LOGS.filter(l => l.company_id === companyId) as unknown as ActivityLog[])
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setAdminUserId(user.id)

    const [
      { data: comp },
      { data: contentData },
      { data: uploadsData },
      { data: messagesData },
      { data: billingData },
      { data: agreementData },
      { data: activityData },
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id).maybeSingle(),
      supabase.from('content_items').select('*').eq('company_id', id).is('deleted_at', null).order('uploaded_at', { ascending: false }),
      supabase.from('client_uploads').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('company_id', id).is('content_item_id', null).order('created_at', { ascending: true }),
      supabase.from('billing_records').select('*').eq('company_id', id).order('created_at', { ascending: false }).limit(1),
      supabase.from('agreements').select('*').eq('company_id', id).order('created_at', { ascending: false }).limit(1),
      supabase.from('activity_logs').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    ])

    setCompany(comp as Company | null)
    setContent((contentData ?? []) as ContentItem[])
    setClientUploads((uploadsData ?? []) as ClientUpload[])
    setMessages((messagesData ?? []) as Message[])
    setBilling((billingData?.[0] as BillingRecord | null) || null)
    setAgreement((agreementData?.[0] as Agreement | null) || null)
    setActivityLogs((activityData ?? []) as ActivityLog[])

    if (comp) {
      const [{ data: prof }, { data: planData }, { data: briefData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', comp.owner_user_id).maybeSingle(),
        comp.plan_id ? supabase.from('plans').select('*').eq('id', comp.plan_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('brand_briefs')
          .select('*')
          .eq('company_id', id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])
      setProfile(prof as Profile | null)
      setPlan(planData as Plan | null)
      setBrief((briefData?.[0] as BrandBrief | null) || null)
    }

    setLoading(false)
  }

  async function updateContentStatus(itemId: string, status: ContentStatus) {
    setContent(prev => prev.map(c => c.id === itemId ? { ...c, status } : c))
    if (isDemoMode()) return
    const supabase = createClient()
    await supabase.from('content_items').update({ status }).eq('id', itemId)
    await logActivity({ company_id: id, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'content_status_changed', event_message: `Content status updated to ${status}` })
  }

  async function archiveContent(itemId: string) {
    setContent(prev => prev.filter(c => c.id !== itemId))
    if (isDemoMode()) return
    const supabase = createClient()
    await supabase.from('content_items').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', itemId)
  }

  async function updateUploadStatus(uploadId: string, status: string) {
    const update: { status: string; reviewed_at?: string; archived_at?: string } = { status }
    if (status === 'reviewed') update.reviewed_at = new Date().toISOString()
    if (status === 'archived') update.archived_at = new Date().toISOString()
    setClientUploads(prev => prev.map(u => u.id === uploadId ? { ...u, ...update } : u))
    if (isDemoMode()) return
    const supabase = createClient()
    await supabase.from('client_uploads').update(update).eq('id', uploadId)
  }

  async function sendReply() {
    if (!replyText.trim()) return
    setSendingReply(true)

    if (isDemoMode()) {
      const demoMsg = {
        id: `demo-msg-${Date.now()}`,
        company_id: id,
        content_item_id: null,
        sender_user_id: 'user-admin',
        sender_role: 'admin',
        message: replyText.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, demoMsg as unknown as Message])
      setReplyText('')
      setSendingReply(false)
      return
    }

    const supabase = createClient()
    const { data } = await supabase.from('messages').insert({
      company_id: id,
      content_item_id: null,
      sender_user_id: adminUserId,
      sender_role: 'admin',
      message: replyText.trim(),
    }).select().single()
    if (data) setMessages(prev => [...prev, data as Message])
    setReplyText('')
    setSendingReply(false)
    await logActivity({ company_id: id, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'admin_sent_message', event_message: 'Admin sent a message' })
  }

  async function updateBillingStatus(status: BillingStatus) {
    if (!billing) return
    setBilling(prev => prev ? { ...prev, billing_status: status } : prev)
    setCompany(prev => prev ? { ...prev, billing_status: status } : prev)
    if (isDemoMode()) return
    const supabase = createClient()
    await supabase.from('billing_records').update({ billing_status: status }).eq('id', billing.id)
    await supabase.from('companies').update({ billing_status: status }).eq('id', id)
    await logActivity({ company_id: id, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'billing_status_changed', event_message: `Billing status changed to ${status}` })
  }

  async function toggleShowcase(current: boolean) {
    setCompany(prev => prev ? { ...prev, showcase_permission: !current } : prev)
    if (isDemoMode()) return
    const supabase = createClient()
    await supabase.from('companies').update({ showcase_permission: !current }).eq('id', id)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-white/40">Loading client data...</p></div>
  }

  if (!company) {
    return <div className="text-white/40 py-20 text-center">Client not found.</div>
  }

  const contentStats = {
    total: content.length,
    inProduction: content.filter(c => c.status === 'in_production').length,
    readyForReview: content.filter(c => c.status === 'ready_for_review').length,
    delivered: content.filter(c => c.status === 'delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColor(company.billing_status)}`}>{company.billing_status}</span>
          </div>
          <p className="text-white/40 text-sm mt-1">{profile?.email ?? 'No email on record'}</p>
        </div>
        <a href="/admin/clients" className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
          Back to Clients
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-0">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${tab === t ? 'border-[#FF3B1A] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
          >
            {t}
            {t === 'Content' && content.length > 0 && (
              <span className="ml-1.5 text-xs text-white/30">({content.length})</span>
            )}
            {t === 'Messages' && messages.filter(m => m.sender_role === 'client' && !m.read_at).length > 0 && (
              <span className="ml-1.5 bg-[#FF3B1A] text-white text-xs px-1.5 py-0.5 rounded-full">
                {messages.filter(m => m.sender_role === 'client' && !m.read_at).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="space-y-4">
          {/* Mini stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#111] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">Total Content</p>
              <p className="text-2xl font-bold text-white">{contentStats.total}</p>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl p-4 border-l-4 border-l-[#FF3B1A]">
              <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">In Production</p>
              <p className="text-2xl font-bold text-yellow-300">{contentStats.inProduction}</p>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">Ready for Review</p>
              <p className="text-2xl font-bold text-blue-300">{contentStats.readyForReview}</p>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">Delivered</p>
              <p className="text-2xl font-bold text-green-300">{contentStats.delivered}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="text-white font-semibold">Company Info</h3>
              <InfoRow label="Name" value={company.name} />
              <InfoRow label="Website" value={company.website ?? '—'} />
              <InfoRow label="Plan" value={plan?.name ?? 'No Plan'} />
              <InfoRow label="Plan Price" value={plan?.price_monthly ? `$${plan.price_monthly.toLocaleString()}/mo` : '—'} />
              <InfoRow label="Onboarding" value={company.onboarding_status.replace(/_/g, ' ')} />
              <InfoRow label="Billing Status" value={company.billing_status.replace(/_/g, ' ')} />
              <InfoRow label="Created" value={new Date(company.created_at).toLocaleDateString()} />
              <div className="flex items-center justify-between pt-1">
                <span className="text-white/40 text-sm">Showcase Permission</span>
                <button
                  onClick={() => toggleShowcase(company.showcase_permission)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${company.showcase_permission ? 'bg-[#FF3B1A]' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${company.showcase_permission ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="text-white font-semibold">Owner Info</h3>
              <InfoRow label="Email" value={profile?.email ?? '—'} />
              <InfoRow label="Full Name" value={profile?.full_name ?? '—'} />
              <InfoRow label="Role" value={profile?.role ?? '—'} />
              <InfoRow label="Joined" value={profile ? new Date(profile.created_at).toLocaleDateString() : '—'} />
              <div className="pt-2 space-y-2">
                <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">Quick Stats</p>
                <div className="flex gap-3 flex-wrap text-xs">
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg text-white/60">{clientUploads.length} uploads</span>
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg text-white/60">{messages.length} messages</span>
                  <span className="bg-white/5 px-3 py-1.5 rounded-lg text-white/60">{activityLogs.length} events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Brief */}
      {tab === 'Brand Brief' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          {!brief ? (
            <div className="py-8 text-center">
              <p className="text-white/40 text-sm">Brand brief not completed yet.</p>
              <p className="text-white/20 text-xs mt-1">The client hasn&apos;t filled out their brand brief.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-white font-semibold mb-4">Brand Brief</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['Company Name', brief.company_name],
                  ['Website', brief.website ?? '—'],
                  ['Offer', brief.offer ?? '—'],
                  ['Target Customer', brief.target_customer ?? '—'],
                  ['Brand Voice', brief.brand_voice ?? '—'],
                  ['Video Styles', brief.video_styles ?? '—'],
                  ['Examples', brief.examples ?? '—'],
                  ['Notes', brief.notes ?? '—'],
                  ['Assets URL', brief.assets_url ?? '—'],
                  ['Completed', brief.completed_at ? new Date(brief.completed_at).toLocaleDateString() : 'Not completed'],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1 bg-white/[0.02] rounded-lg p-3">
                    <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">{label}</p>
                    <p className="text-white/80 text-sm break-words">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {tab === 'Content' && (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          {content.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">No content uploaded for this client yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Title</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Type</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Week</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Status</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Uploaded</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 border-b border-white/5 text-white font-medium px-6 max-w-xs truncate">{item.title}</td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{item.media_type}</span>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{item.week_label ?? '—'}</td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <select
                          value={item.status}
                          onChange={e => updateContentStatus(item.id, e.target.value as ContentStatus)}
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#FF3B1A] focus:outline-none"
                        >
                          {CONTENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs whitespace-nowrap">{new Date(item.uploaded_at).toLocaleDateString()}</td>
                      <td className="py-3 border-b border-white/5 px-6 flex gap-3 items-center">
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noreferrer"
                            className="text-[#FF3B1A] hover:text-[#e02e10] transition flex items-center gap-1 text-xs">
                            <ExternalLink size={12} />
                            View
                          </a>
                        )}
                        <button onClick={() => archiveContent(item.id)} className="text-xs text-red-400 hover:text-red-300 transition">Archive</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Client Uploads */}
      {tab === 'Client Uploads' && (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          {clientUploads.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">No client uploads for this client</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Title</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Category</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">File</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Status</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Date</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientUploads.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 border-b border-white/5 text-white px-6">{u.title}</td>
                      <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{u.upload_category}</td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <a href={u.file_url} target="_blank" rel="noreferrer" className="text-[#FF3B1A] hover:underline text-xs flex items-center gap-1">
                          <ExternalLink size={10} />
                          View
                        </a>
                      </td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor(u.status)}`}>{u.status}</span>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3 border-b border-white/5 px-6 flex gap-2">
                        <button onClick={() => updateUploadStatus(u.id, 'reviewed')} className="text-xs border border-white/10 px-2 py-1 rounded text-white/60 hover:text-white hover:border-[#FF3B1A] transition">Reviewed</button>
                        <button onClick={() => updateUploadStatus(u.id, 'used')} className="text-xs border border-white/10 px-2 py-1 rounded text-white/60 hover:text-white hover:border-[#FF3B1A] transition">Used</button>
                        <button onClick={() => updateUploadStatus(u.id, 'archived')} className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1">Archive</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {tab === 'Messages' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="py-8 text-center text-white/30 text-sm">No messages yet — start the conversation below</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-3 rounded-xl text-sm ${msg.sender_role === 'admin' ? 'bg-[#FF3B1A]/20 text-white' : 'bg-white/5 text-white/80'}`}>
                  <p className={`text-xs mb-1 font-medium ${msg.sender_role === 'admin' ? 'text-[#FF3B1A]' : 'text-white/40'}`}>
                    {msg.sender_role === 'admin' ? 'Admin' : company.name}
                    {' · '}
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="leading-relaxed">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-3 pt-2 border-t border-white/10">
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
              disabled={sendingReply || !replyText.trim()}
              className="bg-[#FF3B1A] text-white font-bold px-5 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={14} />
              {sendingReply ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'Billing' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          {!billing ? (
            <div className="py-8 text-center text-white/40 text-sm">No billing record found for this client.</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow label="Plan" value={plan?.name ?? 'No Plan'} />
                <InfoRow label="Plan Price" value={plan?.price_monthly ? `$${plan.price_monthly.toLocaleString()}/mo` : '—'} />
                <InfoRow label="Billing Status" value={billing.billing_status.replace(/_/g, ' ')} />
                <InfoRow label="Subscription Status" value={billing.subscription_status} />
                <InfoRow label="Mock Mode" value={billing.mock_mode ? 'Yes' : 'No'} />
                <InfoRow label="Period Start" value={billing.current_period_start ? new Date(billing.current_period_start).toLocaleDateString() : '—'} />
                <InfoRow label="Period End" value={billing.current_period_end ? new Date(billing.current_period_end).toLocaleDateString() : '—'} />
              </div>
              <div className="pt-2 border-t border-white/10">
                <label className="text-white/40 text-sm block mb-3">Change Billing Status</label>
                <div className="flex gap-2 flex-wrap">
                  {BILLING_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateBillingStatus(s)}
                      className={`text-xs px-3 py-2 rounded-lg border transition ${billing.billing_status === s ? 'border-[#FF3B1A] text-white bg-[#FF3B1A]/10' : 'border-white/10 text-white/60 hover:border-[#FF3B1A] hover:text-white'}`}
                    >
                      {BILLING_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Agreement */}
      {tab === 'Agreement' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          {!agreement ? (
            <div className="py-8 text-center text-white/40 text-sm">No signed agreement found for this client.</div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow label="Signed Name" value={agreement.signed_name} />
                <InfoRow label="Signed Email" value={agreement.signed_email} />
                <InfoRow label="Signed At" value={new Date(agreement.signed_at).toLocaleString()} />
                <InfoRow label="Agreement Version" value={agreement.agreement_version} />
              </div>
              <div className="flex gap-4 flex-wrap pt-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/40">Accepted Terms:</span>
                  {agreement.accepted_checkbox ? (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><Check size={12} /> Yes</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs"><X size={12} /> No</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/40">Showcase Rights:</span>
                  {agreement.showcase_rights_checkbox ? (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium"><Check size={10} /> Showcase Granted</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 text-xs"><X size={12} /> Not granted</span>
                  )}
                </div>
              </div>
              {agreement.contract_body && (
                <div className="mt-2">
                  <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-2">{agreement.contract_title || 'Contract Text'}</p>
                  <div className="bg-[#080808] rounded-lg p-4 text-white/60 text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap border border-white/5">
                    {agreement.contract_body}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Log */}
      {tab === 'Activity Log' && (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          {activityLogs.length === 0 ? (
            <div className="p-12 text-center text-white/30 text-sm">No activity recorded for this client yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Date</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Actor</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Event</th>
                    <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 border-b border-white/5 text-white/40 px-6 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${log.actor_role === 'admin' ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-blue-500/20 text-blue-300'}`}>
                          {log.actor_role ?? 'system'}
                        </span>
                      </td>
                      <td className="py-3 border-b border-white/5 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor(log.event_type)}`}>{log.event_type}</span>
                      </td>
                      <td className="py-3 border-b border-white/5 text-white/70 px-6">{log.event_message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/40 text-sm shrink-0">{label}</span>
      <span className="text-white/80 text-sm text-right break-words">{value}</span>
    </div>
  )
}
