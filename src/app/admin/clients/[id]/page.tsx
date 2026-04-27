'use client'
import { use, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusColor, logActivity } from '@/lib/data'
import type {
  Company, Profile, Plan, BrandBrief, ContentItem, ClientUpload,
  Message, BillingRecord, Agreement, ActivityLog, ContentStatus, BillingStatus
} from '@/lib/types'

const TABS = ['Overview', 'Brand Brief', 'Content', 'Client Uploads', 'Messages', 'Billing', 'Agreement', 'Activity Log'] as const
type Tab = typeof TABS[number]

const CONTENT_STATUSES: ContentStatus[] = ['in_production', 'ready_for_review', 'revision_requested', 'approved', 'delivered', 'archived']
const BILLING_STATUSES: BillingStatus[] = ['inactive', 'active_mock', 'past_due_mock', 'canceled_mock']

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

  useEffect(() => {
    loadAll()
  }, [id])

  async function loadAll() {
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
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('content_items').select('*').eq('company_id', id).is('deleted_at', null).order('uploaded_at', { ascending: false }),
      supabase.from('client_uploads').select('*').eq('company_id', id).order('created_at', { ascending: false }),
      supabase.from('messages').select('*').eq('company_id', id).is('content_item_id', null).order('created_at', { ascending: true }),
      supabase.from('billing_records').select('*').eq('company_id', id).single(),
      supabase.from('agreements').select('*').eq('company_id', id).single(),
      supabase.from('activity_logs').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    ])

    setCompany(comp)
    setContent((contentData ?? []) as ContentItem[])
    setClientUploads((uploadsData ?? []) as ClientUpload[])
    setMessages((messagesData ?? []) as Message[])
    setBilling(billingData)
    setAgreement(agreementData)
    setActivityLogs((activityData ?? []) as ActivityLog[])

    if (comp) {
      const [{ data: prof }, { data: planData }, { data: briefData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', comp.owner_user_id).single(),
        comp.plan_id ? supabase.from('plans').select('*').eq('id', comp.plan_id).single() : Promise.resolve({ data: null }),
        supabase.from('brand_briefs').select('*').eq('company_id', id).single(),
      ])
      setProfile(prof)
      setPlan(planData)
      setBrief(briefData)
    }

    setLoading(false)
  }

  async function updateContentStatus(itemId: string, status: ContentStatus) {
    const supabase = createClient()
    await supabase.from('content_items').update({ status }).eq('id', itemId)
    setContent(prev => prev.map(c => c.id === itemId ? { ...c, status } : c))
    await logActivity({ company_id: id, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'content_status_changed', event_message: `Content status updated to ${status}` })
  }

  async function archiveContent(itemId: string) {
    const supabase = createClient()
    await supabase.from('content_items').update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', itemId)
    setContent(prev => prev.filter(c => c.id !== itemId))
  }

  async function updateUploadStatus(uploadId: string, status: string) {
    const supabase = createClient()
    const update: { status: string; reviewed_at?: string; archived_at?: string } = { status }
    if (status === 'reviewed') update.reviewed_at = new Date().toISOString()
    if (status === 'archived') update.archived_at = new Date().toISOString()
    await supabase.from('client_uploads').update(update).eq('id', uploadId)
    setClientUploads(prev => prev.map(u => u.id === uploadId ? { ...u, ...update } : u))
  }

  async function sendReply() {
    if (!replyText.trim()) return
    setSendingReply(true)
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
    const supabase = createClient()
    await supabase.from('billing_records').update({ billing_status: status }).eq('id', billing.id)
    setBilling(prev => prev ? { ...prev, billing_status: status } : prev)
    await supabase.from('companies').update({ billing_status: status }).eq('id', id)
    setCompany(prev => prev ? { ...prev, billing_status: status } : prev)
    await logActivity({ company_id: id, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'billing_status_changed', event_message: `Billing status changed to ${status}` })
  }

  async function toggleShowcase(current: boolean) {
    const supabase = createClient()
    await supabase.from('companies').update({ showcase_permission: !current }).eq('id', id)
    setCompany(prev => prev ? { ...prev, showcase_permission: !current } : prev)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-white/40">Loading client data...</p></div>
  }

  if (!company) {
    return <div className="text-white/40 py-20 text-center">Client not found.</div>
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
          <p className="text-white/40 text-sm mt-1">{profile?.email}</p>
        </div>
        <a href="/admin/clients" className="border border-white/10 text-white/60 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
          ← Back to Clients
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
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-semibold">Company Info</h3>
            <InfoRow label="Name" value={company.name} />
            <InfoRow label="Website" value={company.website ?? '—'} />
            <InfoRow label="Plan" value={plan?.name ?? 'No Plan'} />
            <InfoRow label="Onboarding" value={company.onboarding_status} />
            <InfoRow label="Created" value={new Date(company.created_at).toLocaleDateString()} />
            <div className="flex items-center justify-between">
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
          </div>
        </div>
      )}

      {/* Brand Brief */}
      {tab === 'Brand Brief' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          {!brief ? (
            <p className="text-white/40 text-sm">Brand brief not completed yet.</p>
          ) : (
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
                ['Completed', brief.completed_at ? new Date(brief.completed_at).toLocaleDateString() : 'No'],
              ].map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <p className="text-white/40 text-xs uppercase font-semibold tracking-wider">{label}</p>
                  <p className="text-white/80 text-sm break-words">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {tab === 'Content' && (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
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
                {content.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-white/30">No content yet</td></tr>
                )}
                {content.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 border-b border-white/5 text-white font-medium px-6 max-w-xs truncate">{item.title}</td>
                    <td className="py-3 border-b border-white/5 text-white/60 px-4">{item.media_type}</td>
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
                    <td className="py-3 border-b border-white/5 px-6">
                      <button onClick={() => archiveContent(item.id)} className="text-xs text-red-400 hover:text-red-300 transition">Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client Uploads */}
      {tab === 'Client Uploads' && (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
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
                {clientUploads.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-white/30">No client uploads</td></tr>
                )}
                {clientUploads.map(u => (
                  <tr key={u.id}>
                    <td className="py-3 border-b border-white/5 text-white px-6">{u.title}</td>
                    <td className="py-3 border-b border-white/5 text-white/60 px-4">{u.upload_category}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <a href={u.file_url} target="_blank" rel="noreferrer" className="text-[#FF3B1A] hover:underline text-xs">View File</a>
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
        </div>
      )}

      {/* Messages */}
      {tab === 'Messages' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.length === 0 && <p className="text-white/30 text-sm text-center py-8">No messages yet</p>}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-3 rounded-xl text-sm ${msg.sender_role === 'admin' ? 'bg-[#FF3B1A]/20 text-white' : 'bg-white/5 text-white/80'}`}>
                  <p className={`text-xs mb-1 font-medium ${msg.sender_role === 'admin' ? 'text-[#FF3B1A]' : 'text-white/40'}`}>
                    {msg.sender_role === 'admin' ? 'Admin' : 'Client'} · {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <input
              type="text"
              placeholder="Type a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#FF3B1A] focus:outline-none"
            />
            <button
              onClick={sendReply}
              disabled={sendingReply || !replyText.trim()}
              className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'Billing' && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          {!billing ? (
            <p className="text-white/40 text-sm">No billing record found.</p>
          ) : (
            <>
              <InfoRow label="Billing Status" value={billing.billing_status} />
              <InfoRow label="Subscription Status" value={billing.subscription_status} />
              <InfoRow label="Mock Mode" value={billing.mock_mode ? 'Yes' : 'No'} />
              <InfoRow label="Period Start" value={billing.current_period_start ? new Date(billing.current_period_start).toLocaleDateString() : '—'} />
              <InfoRow label="Period End" value={billing.current_period_end ? new Date(billing.current_period_end).toLocaleDateString() : '—'} />
              <div className="pt-2">
                <label className="text-white/40 text-sm block mb-2">Change Billing Status</label>
                <div className="flex gap-2 flex-wrap">
                  {BILLING_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateBillingStatus(s)}
                      className={`text-xs px-3 py-2 rounded-lg border transition ${billing.billing_status === s ? 'border-[#FF3B1A] text-white bg-[#FF3B1A]/10' : 'border-white/10 text-white/60 hover:border-[#FF3B1A] hover:text-white'}`}
                    >
                      {s}
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
            <p className="text-white/40 text-sm">No signed agreement found.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <InfoRow label="Signed Name" value={agreement.signed_name} />
                <InfoRow label="Signed Email" value={agreement.signed_email} />
                <InfoRow label="Signed At" value={new Date(agreement.signed_at).toLocaleString()} />
                <InfoRow label="Agreement Version" value={agreement.agreement_version} />
                <InfoRow label="Accepted Terms" value={agreement.accepted_checkbox ? '✅ Yes' : '❌ No'} />
                <InfoRow label="Showcase Rights" value={agreement.showcase_rights_checkbox ? '✅ Yes' : '❌ No'} />
              </div>
              {agreement.contract_body && (
                <div className="mt-4">
                  <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-2">Contract Text</p>
                  <div className="bg-white/5 rounded-lg p-4 text-white/60 text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
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
                {activityLogs.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-white/30">No activity yet</td></tr>
                )}
                {activityLogs.map(log => (
                  <tr key={log.id}>
                    <td className="py-3 border-b border-white/5 text-white/40 px-6 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 border-b border-white/5 text-white/60 px-4 text-xs">{log.actor_role ?? '—'}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(log.event_type)}`}>{log.event_type}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/70 px-6">{log.event_message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
