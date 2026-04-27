'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'
import { Upload, GitPullRequestArrow, MessageSquare, Film } from 'lucide-react'
import type { ActivityLog } from '@/lib/types'

interface StatCard {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  highlight?: boolean
}

function StatCardUI({ label, value, sub, accent, highlight }: StatCard) {
  return (
    <div className={`bg-[#111] border border-white/10 rounded-xl p-6 ${highlight ? 'border-l-4 border-l-[#FF3B1A]' : ''}`}>
      <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-[#FF3B1A]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  )
}

interface ProductionItem {
  id: string
  title: string
  company_name: string
  media_type: string
  uploaded_at: string
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeSubscriptions: 0,
    readyForReview: 0,
    openRevisions: 0,
    deliveredThisMonth: 0,
    mockMrr: 0,
    unreadMessages: 0,
    clientUploadsWaiting: 0,
  })
  const [recentActivity, setRecentActivity] = useState<(ActivityLog & { company_name?: string })[]>([])
  const [productionQueue, setProductionQueue] = useState<ProductionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [
        { count: totalClients },
        { count: activeSubscriptions },
        { count: readyForReview },
        { count: openRevisions },
        { count: deliveredThisMonth },
        { count: unreadMessages },
        { count: clientUploadsWaiting },
        { data: billingData },
        { data: activityData },
        { data: productionData },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('billing_records').select('*', { count: 'exact', head: true }).eq('billing_status', 'active_mock'),
        supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('status', 'ready_for_review').is('deleted_at', null),
        supabase.from('content_revisions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('status', 'delivered').gte('delivered_at', monthStart.toISOString()),
        supabase.from('messages').select('*', { count: 'exact', head: true }).is('read_at', null).eq('sender_role', 'client'),
        supabase.from('client_uploads').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('billing_records').select('plan_id, plans(price_monthly)').eq('billing_status', 'active_mock'),
        supabase.from('activity_logs').select('*, companies(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('content_items')
          .select('id, title, media_type, uploaded_at, company_id, companies(name)')
          .eq('status', 'in_production')
          .is('deleted_at', null)
          .order('uploaded_at', { ascending: false })
          .limit(8),
      ])

      let mockMrr = 0
      if (billingData) {
        for (const rec of billingData as { plan_id: string | null; plans: { price_monthly: number } | null }[]) {
          if (rec.plans?.price_monthly) mockMrr += rec.plans.price_monthly
        }
      }

      const activity = (activityData ?? []).map((a: { companies?: { name?: string } | null } & ActivityLog) => ({
        ...a,
        company_name: (a.companies as { name?: string } | null)?.name ?? '—',
      }))

      const queue = (productionData ?? []).map((p: { companies?: { name?: string } | null } & ProductionItem) => ({
        ...p,
        company_name: (p.companies as { name?: string } | null)?.name ?? '—',
      }))

      setStats({
        totalClients: totalClients ?? 0,
        activeSubscriptions: activeSubscriptions ?? 0,
        readyForReview: readyForReview ?? 0,
        openRevisions: openRevisions ?? 0,
        deliveredThisMonth: deliveredThisMonth ?? 0,
        mockMrr,
        unreadMessages: unreadMessages ?? 0,
        clientUploadsWaiting: clientUploadsWaiting ?? 0,
      })
      setRecentActivity(activity as (ActivityLog & { company_name?: string })[])
      setProductionQueue(queue as ProductionItem[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/40 text-sm">Loading overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
          <p className="text-white/40 text-sm mt-1">UGCFire command center — real-time platform snapshot</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/uploads"
            className="flex items-center gap-2 bg-[#FF3B1A] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#e02e10] transition text-sm">
            <Upload size={14} />
            Upload Content
          </Link>
          <Link href="/admin/revisions"
            className="flex items-center gap-2 border border-white/10 text-white/70 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
            <GitPullRequestArrow size={14} />
            View Revisions
            {stats.openRevisions > 0 && (
              <span className="bg-[#FF3B1A] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{stats.openRevisions}</span>
            )}
          </Link>
          <Link href="/admin/messages"
            className="flex items-center gap-2 border border-white/10 text-white/70 px-4 py-2 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm">
            <MessageSquare size={14} />
            View Messages
            {stats.unreadMessages > 0 && (
              <span className="bg-[#FF3B1A] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{stats.unreadMessages}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardUI label="Total Clients" value={stats.totalClients} />
        <StatCardUI label="Active Subscriptions" value={stats.activeSubscriptions} accent highlight />
        <StatCardUI label="Ready for Review" value={stats.readyForReview} sub="content items" highlight />
        <StatCardUI label="Open Revisions" value={stats.openRevisions} />
        <StatCardUI label="Delivered This Month" value={stats.deliveredThisMonth} sub="content items" />
        <StatCardUI label="Mock MRR" value={`$${stats.mockMrr.toLocaleString()}`} accent sub="active plans" highlight />
        <StatCardUI label="Unread Messages" value={stats.unreadMessages} sub="from clients" />
        <StatCardUI label="Uploads Waiting" value={stats.clientUploadsWaiting} sub="client submissions" />
      </div>

      {/* Production Queue */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Film size={16} className="text-[#FF3B1A]" />
          <h2 className="text-white font-semibold">In Production</h2>
          <span className="text-white/30 text-xs">{productionQueue.length} items across all clients</span>
        </div>
        {productionQueue.length === 0 ? (
          <p className="text-white/30 text-sm py-4 text-center">No content currently in production</p>
        ) : (
          <div className="space-y-2">
            {productionQueue.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full shrink-0">in_production</span>
                  <span className="text-white text-sm font-medium truncate">{item.title}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-white/40 text-xs">{item.company_name}</span>
                  <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{item.media_type}</span>
                  <span className="text-white/30 text-xs whitespace-nowrap">{new Date(item.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left pr-4">Event</th>
                <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left pr-4">Message</th>
                <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left pr-4">Company</th>
                <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left pr-4">Actor</th>
                <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-white/30 text-sm">No activity yet</td></tr>
              )}
              {recentActivity.map(log => (
                <tr key={log.id}>
                  <td className="py-3 border-b border-white/5 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(log.event_type)}`}>{log.event_type}</span>
                  </td>
                  <td className="py-3 border-b border-white/5 text-white/70 pr-4 max-w-xs truncate">{log.event_message}</td>
                  <td className="py-3 border-b border-white/5 text-white/70 pr-4">{log.company_name}</td>
                  <td className="py-3 border-b border-white/5 text-white/40 pr-4 text-xs">{log.actor_role ?? '—'}</td>
                  <td className="py-3 border-b border-white/5 text-white/40 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
