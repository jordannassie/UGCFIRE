'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { statusColor } from '@/lib/data'
import type { ActivityLog } from '@/lib/types'

interface StatCard {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

function StatCardUI({ label, value, sub, accent }: StatCard) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
      <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-[#FF3B1A]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  )
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
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-white/40 text-sm mt-1">UGCFire command center — real-time platform snapshot</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardUI label="Total Clients" value={stats.totalClients} />
        <StatCardUI label="Active Subscriptions" value={stats.activeSubscriptions} accent />
        <StatCardUI label="Ready for Review" value={stats.readyForReview} sub="content items" />
        <StatCardUI label="Open Revisions" value={stats.openRevisions} />
        <StatCardUI label="Delivered This Month" value={stats.deliveredThisMonth} sub="content items" />
        <StatCardUI label="Mock MRR" value={`$${stats.mockMrr.toLocaleString()}`} accent sub="active plans" />
        <StatCardUI label="Unread Messages" value={stats.unreadMessages} sub="from clients" />
        <StatCardUI label="Uploads Waiting" value={stats.clientUploadsWaiting} sub="client submissions" />
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
