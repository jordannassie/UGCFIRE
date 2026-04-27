'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, statusColor } from '@/lib/data'
import type { Company, Plan, BillingRecord } from '@/lib/types'

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BillingPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
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
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Billing</h1>
        <p className="text-white/40 mt-1 text-sm">Manage your subscription and billing details.</p>
      </div>

      {/* Plan card */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Current Plan</p>
            <h2 className="text-white font-bold text-2xl">{plan?.name ?? 'No plan selected'}</h2>
            {plan && (
              <p className="text-[#FF3B1A] font-bold text-xl mt-1">
                ${plan.price_monthly.toLocaleString()}
                <span className="text-white/40 text-sm font-normal">/month</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {billingRecord && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor(billingRecord.billing_status)}`}>
                {billingRecord.billing_status.replace(/_/g, ' ')}
              </span>
            )}
            <span className="bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
              TEST MODE
            </span>
          </div>
        </div>

        {billingRecord?.current_period_start && (
          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
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

        <div className="mt-5 pt-5 border-t border-white/10 flex gap-3 flex-wrap">
          <Link
            href="/dashboard/plan"
            className="border border-white/10 text-white/60 px-5 py-2.5 rounded-lg hover:border-[#FF3B1A] hover:text-white transition text-sm"
          >
            Upgrade or change plan
          </Link>
        </div>
      </div>

      {/* Manage billing */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-white font-bold">Manage Billing</h2>
          <span className="bg-white/5 text-white/40 text-xs px-2 py-0.5 rounded-full">Coming Soon</span>
        </div>
        <p className="text-white/30 text-sm">
          Stripe billing portal will be available here once connected. You'll be able to update payment methods, download invoices, and manage your subscription directly.
        </p>
      </div>

      {/* Invoice history */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold mb-3">Invoice History</h2>
        <div className="border border-white/5 rounded-lg p-6 bg-white/2 text-center">
          <p className="text-white/30 text-sm">Invoices will appear here when Stripe is connected.</p>
          <p className="text-white/20 text-xs mt-1">Currently running in demo/mock mode.</p>
        </div>
      </div>
    </div>
  )
}
