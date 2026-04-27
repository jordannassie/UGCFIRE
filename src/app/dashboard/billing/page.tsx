'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, statusColor } from '@/lib/data'
import type { Company, Plan, BillingRecord } from '@/lib/types'
import { CreditCard, Package, Calendar, RefreshCw, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function mockRenewalDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BillingPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState<string | null>(null)

  async function loadData() {
    const supabase = createClient()
    const co = await getMyCompany()
    setCompany(co)

    if (co) {
      if (co.plan_id) {
        const { data: planData } = await supabase.from('plans').select('*').eq('id', co.plan_id).single()
        if (planData) setPlan(planData as Plan)
      }

      const { data: billing } = await supabase
        .from('billing_records')
        .select('*')
        .eq('company_id', co.id)
        .single()
      if (billing) setBillingRecord(billing as BillingRecord)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function simulateStatus(status: 'active_mock' | 'past_due_mock') {
    if (!company) return
    setSimulating(status)
    try {
      const supabase = createClient()
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)

      await supabase.from('billing_records').upsert({
        company_id: company.id,
        plan_id: company.plan_id,
        billing_status: status,
        subscription_status: status === 'active_mock' ? 'active_mock' : 'active_mock',
        mock_mode: true,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'company_id' })

      await supabase.from('companies').update({ billing_status: status }).eq('id', company.id)

      await loadData()
    } catch {
      // ignore
    } finally {
      setSimulating(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  const billingStatus = billingRecord?.billing_status ?? 'inactive'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-white/40 mt-1 text-sm">Manage your subscription and billing details.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-[#FF3B1A]" size={14} />
            <p className="text-white/40 text-xs uppercase tracking-wider">Current Plan</p>
          </div>
          <p className="text-white font-bold">{plan?.name ?? '—'}</p>
          {plan && <p className="text-[#FF3B1A] font-bold text-sm mt-0.5">${plan.price_monthly.toLocaleString()}/mo</p>}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="text-[#FF3B1A]" size={14} />
            <p className="text-white/40 text-xs uppercase tracking-wider">Status</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(billingStatus)}`}>
            {billingStatus.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-[#FF3B1A]" size={14} />
            <p className="text-white/40 text-xs uppercase tracking-wider">Next Renewal</p>
          </div>
          <p className="text-white font-bold text-sm">
            {billingRecord?.current_period_end ? formatDate(billingRecord.current_period_end) : mockRenewalDate()}
          </p>
        </div>

        {plan && (
          <div className="bg-[#111] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-[#FF3B1A]" size={14} />
              <p className="text-white/40 text-xs uppercase tracking-wider">Deliverables</p>
            </div>
            <p className="text-white font-bold">{plan.videos_per_month}/mo</p>
            <p className="text-white/30 text-xs mt-0.5">content assets</p>
          </div>
        )}

        <div className="bg-[#111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="text-[#FF3B1A]" size={14} />
            <p className="text-white/40 text-xs uppercase tracking-wider">Payment Method</p>
          </div>
          <p className="text-white font-bold text-sm font-mono">**** 4242</p>
          <p className="text-white/30 text-xs mt-0.5">Mock test card</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-[#FF3B1A]" size={14} />
            <p className="text-white/40 text-xs uppercase tracking-wider">Period Start</p>
          </div>
          <p className="text-white font-bold text-sm">
            {billingRecord?.current_period_start ? formatDate(billingRecord.current_period_start) : '—'}
          </p>
        </div>
      </div>

      {/* Plan details */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Subscription</p>
            <h2 className="text-white font-bold text-2xl">{plan?.name ?? 'No plan selected'}</h2>
            {plan && (
              <p className="text-[#FF3B1A] font-bold text-xl mt-1">
                ${plan.price_monthly.toLocaleString()}
                <span className="text-white/40 text-sm font-normal">/month</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor(billingStatus)}`}>
              {billingStatus.replace(/_/g, ' ')}
            </span>
            <span className="bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
              TEST MODE
            </span>
          </div>
        </div>

        {billingRecord?.current_period_start && (
          <div className="mb-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Period Start</p>
              <p className="text-white">{formatDate(billingRecord.current_period_start)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Period End</p>
              <p className="text-white">{formatDate(billingRecord.current_period_end)}</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 flex gap-3 flex-wrap">
          <Link
            href="/dashboard/plan"
            className="border border-white/10 text-white/60 px-5 py-2.5 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm flex items-center gap-2"
          >
            <Package size={14} />
            Manage Plan
          </Link>
        </div>
      </div>

      {/* Simulate buttons */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="text-[#FF3B1A]" size={16} />
          <h2 className="text-white font-bold">Simulate Billing Events</h2>
          <span className="bg-orange-500/20 text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-500/30 ml-auto">TEST MODE</span>
        </div>
        <p className="text-white/30 text-sm mb-5">These buttons simulate billing state changes for demo purposes.</p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => simulateStatus('active_mock')}
            disabled={simulating !== null}
            className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 font-bold px-5 py-2.5 rounded-lg hover:bg-green-500/30 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={14} />
            {simulating === 'active_mock' ? 'Simulating...' : 'Simulate Active Payment'}
          </button>
          <button
            onClick={() => simulateStatus('past_due_mock')}
            disabled={simulating !== null}
            className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 font-bold px-5 py-2.5 rounded-lg hover:bg-red-500/30 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle size={14} />
            {simulating === 'past_due_mock' ? 'Simulating...' : 'Simulate Failed Payment'}
          </button>
        </div>
      </div>

      {/* Manage billing */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="text-[#FF3B1A]" size={16} />
          <h2 className="text-white font-bold">Billing Portal</h2>
          <span className="bg-white/5 text-white/40 text-xs px-2 py-0.5 rounded-full border border-white/10">Coming Soon</span>
        </div>
        <p className="text-white/30 text-sm mb-4">
          Stripe billing portal will be available here once connected. You&apos;ll be able to update payment methods, download invoices, and manage your subscription directly.
        </p>
        <div className="flex items-center gap-2 text-white/20 text-xs">
          <XCircle size={12} />
          <span>Stripe not yet connected — running in demo mode</span>
        </div>
      </div>

      {/* Invoice history */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="text-[#FF3B1A]" size={16} />
          <h2 className="text-white font-bold">Invoice History</h2>
        </div>
        <div className="border border-white/5 rounded-lg p-6 bg-white/2 text-center">
          <p className="text-white/30 text-sm">Invoices will appear here when Stripe is connected.</p>
          <p className="text-white/20 text-xs mt-1">Currently running in demo/mock mode.</p>
        </div>
      </div>
    </div>
  )
}
