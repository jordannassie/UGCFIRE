'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity, statusColor } from '@/lib/data'
import type { BillingStatus } from '@/lib/types'
import { isDemoMode, DEMO_BILLING_RECORDS, DEMO_PLANS } from '@/lib/demoData'

const BILLING_STATUSES: BillingStatus[] = ['inactive', 'active_mock', 'past_due_mock', 'canceled_mock']

const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  inactive: 'Inactive',
  active_mock: 'Active',
  past_due_mock: 'Past Due',
  canceled_mock: 'Canceled',
}

interface BillingRow {
  id: string
  company_id: string
  company_name: string
  plan_id: string | null
  plan_name: string
  plan_price: number
  billing_status: BillingStatus
  subscription_status: string
  mock_mode: boolean
  current_period_start: string | null
  current_period_end: string | null
  saving: boolean
}

interface Plan { id: string; name: string; price_monthly: number }

export default function AdminBillingPage() {
  const [records, setRecords] = useState<BillingRow[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [adminUserId, setAdminUserId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (isDemoMode()) {
      setPlans(DEMO_PLANS.map(p => ({ id: p.id, name: p.name, price_monthly: p.price_monthly })))
      setRecords(DEMO_BILLING_RECORDS.map(b => ({
        id: b.id,
        company_id: b.company_id,
        company_name: b.company_name,
        plan_id: b.plan_id,
        plan_name: b.plan_name,
        plan_price: b.price_monthly,
        billing_status: b.billing_status as BillingStatus,
        subscription_status: b.subscription_status,
        mock_mode: b.mock_mode,
        current_period_start: b.current_period_start,
        current_period_end: b.current_period_end,
        saving: false,
      })))
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setAdminUserId(user.id)

    const [{ data: billing }, { data: plansData }] = await Promise.all([
      supabase.from('billing_records')
        .select('*, companies(name), plans(name, price_monthly)')
        .order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name, price_monthly').eq('is_active', true),
    ])

    setPlans((plansData ?? []) as Plan[])
    const rows = (billing ?? []).map((b: {
      id: string
      company_id: string
      plan_id: string | null
      billing_status: BillingStatus
      subscription_status: string
      mock_mode: boolean
      current_period_start: string | null
      current_period_end: string | null
      companies?: { name?: string } | null
      plans?: { name?: string; price_monthly?: number } | null
    }) => ({
      id: b.id,
      company_id: b.company_id,
      company_name: b.companies?.name ?? '—',
      plan_id: b.plan_id,
      plan_name: b.plans?.name ?? 'No Plan',
      plan_price: b.plans?.price_monthly ?? 0,
      billing_status: b.billing_status,
      subscription_status: b.subscription_status,
      mock_mode: b.mock_mode,
      current_period_start: b.current_period_start,
      current_period_end: b.current_period_end,
      saving: false,
    }))
    setRecords(rows)
    setLoading(false)
  }

  async function updateBillingStatus(id: string, companyId: string, status: BillingStatus) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, billing_status: status, saving: false } : r))
    if (isDemoMode()) return
    setRecords(prev => prev.map(r => r.id === id ? { ...r, saving: true } : r))
    const supabase = createClient()
    await supabase.from('billing_records').update({ billing_status: status }).eq('id', id)
    await supabase.from('companies').update({ billing_status: status }).eq('id', companyId)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, saving: false } : r))
    await logActivity({ company_id: companyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'billing_status_changed', event_message: `Billing status changed to ${status}` })
  }

  async function updatePlan(id: string, companyId: string, planId: string) {
    const plan = plans.find(p => p.id === planId)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, plan_id: planId, plan_name: plan?.name ?? '—', plan_price: plan?.price_monthly ?? 0, saving: false } : r))
    if (isDemoMode()) return
    setRecords(prev => prev.map(r => r.id === id ? { ...r, saving: true } : r))
    const supabase = createClient()
    await supabase.from('billing_records').update({ plan_id: planId }).eq('id', id)
    await supabase.from('companies').update({ plan_id: planId }).eq('id', companyId)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, saving: false } : r))
    await logActivity({ company_id: companyId, actor_user_id: adminUserId, actor_role: 'admin', event_type: 'plan_changed', event_message: `Plan changed to ${plan?.name}` })
  }

  const activeMrr = records.filter(r => r.billing_status === 'active_mock').reduce((sum, r) => sum + r.plan_price, 0)
  const activeCount = records.filter(r => r.billing_status === 'active_mock').length
  const pastDueCount = records.filter(r => r.billing_status === 'past_due_mock').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-white/40 text-sm mt-1">Manage client billing records and plan assignments</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111] border border-white/10 rounded-xl p-5 border-l-4 border-l-[#FF3B1A]">
            <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">Mock MRR</p>
            <p className="text-2xl font-bold text-[#FF3B1A]">${activeMrr.toLocaleString()}</p>
            <p className="text-white/30 text-xs mt-1">from active subscriptions</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-5">
            <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">Active</p>
            <p className="text-2xl font-bold text-green-300">{activeCount}</p>
            <p className="text-white/30 text-xs mt-1">active clients</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-5">
            <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-1">Past Due</p>
            <p className="text-2xl font-bold text-red-300">{pastDueCount}</p>
            <p className="text-white/30 text-xs mt-1">need attention</p>
          </div>
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading billing records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-white/30 text-sm">No billing records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-6 pt-5">Company</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Plan</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">MRR</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Billing Status</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Sub Status</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-left px-4 pt-5">Period End</th>
                  <th className="text-white/40 text-xs uppercase font-semibold pb-3 border-b border-white/5 text-center px-4 pt-5">Mode</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 border-b border-white/5 text-white font-medium px-6">{r.company_name}</td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <select
                        value={r.plan_id ?? ''}
                        disabled={r.saving}
                        onChange={e => e.target.value && updatePlan(r.id, r.company_id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#FF3B1A] focus:outline-none disabled:opacity-50"
                      >
                        <option value="">No Plan</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      {r.billing_status === 'active_mock' && r.plan_price > 0 ? (
                        <span className="text-[#FF3B1A] font-semibold text-sm">${r.plan_price.toLocaleString()}</span>
                      ) : (
                        <span className="text-white/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <select
                        value={r.billing_status}
                        disabled={r.saving}
                        onChange={e => updateBillingStatus(r.id, r.company_id, e.target.value as BillingStatus)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:border-[#FF3B1A] focus:outline-none disabled:opacity-50"
                      >
                        {BILLING_STATUSES.map(s => <option key={s} value={s}>{BILLING_STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="py-3 border-b border-white/5 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(r.subscription_status)}`}>{r.subscription_status}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-white/40 px-4 text-xs">
                      {r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 border-b border-white/5 px-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${r.mock_mode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/40'}`}>
                        {r.mock_mode ? 'Mock' : 'Live'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
