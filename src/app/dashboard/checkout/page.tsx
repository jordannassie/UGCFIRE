'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan } from '@/lib/types'

const PLAN_FEATURES: Record<string, string[]> = {
  growth: [
    '8 content deliverables per month',
    'Photos + videos',
    'AI-assisted production',
    'Dashboard review system',
    'Team chat support',
    'Weekly content drops',
  ],
  scale: [
    '20 content deliverables per month',
    'Photos, videos + carousels',
    'AI-assisted production',
    'Dashboard review system',
    'Priority team chat support',
    'Weekly content drops',
    'Advanced content strategy',
  ],
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function CheckoutPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [billingRecord, setBillingRecord] = useState<{ billing_status: string; current_period_start: string | null; current_period_end: string | null } | null>(null)

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
          .select('billing_status, current_period_start, current_period_end')
          .eq('company_id', co.id)
          .single()

        if (billing) setBillingRecord(billing)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function simulatePayment() {
    if (!company) return
    setPaying(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)

      await supabase.from('billing_records').upsert({
        company_id: company.id,
        plan_id: company.plan_id,
        billing_status: 'active_mock',
        subscription_status: 'active_mock',
        mock_mode: true,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      }, { onConflict: 'company_id' })

      await supabase.from('companies').update({
        billing_status: 'active_mock',
        subscription_status: 'active_mock',
        onboarding_status: 'needs_brand_brief',
      }).eq('id', company.id)

      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: 'mock_payment_completed',
        event_message: 'Mock payment completed — subscription activated',
        metadata: { plan_id: company.plan_id, mock_mode: true },
      })

      router.push('/dashboard/brand-brief')
    } catch {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  const isAlreadyActive = company?.billing_status === 'active_mock' || billingRecord?.billing_status === 'active_mock'

  if (isAlreadyActive && billingRecord) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Payment Active</h1>
          <p className="text-white/40 mt-1 text-sm">Your subscription is currently active.</p>
        </div>

        <div className="bg-[#111] border border-green-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-green-400 font-bold">Subscription Active</span>
            <span className="ml-auto bg-orange-500/20 text-orange-300 text-xs font-bold px-2 py-0.5 rounded-full">TEST MODE</span>
          </div>

          {plan && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-white font-bold">{plan.name}</p>
              <p className="text-white/40 text-sm">${plan.price_monthly.toLocaleString()}/month</p>
            </div>
          )}

          {billingRecord.current_period_start && billingRecord.current_period_end && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/40 text-xs">Period Start</p>
                <p className="text-white mt-0.5">{formatDate(billingRecord.current_period_start)}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs">Period End</p>
                <p className="text-white mt-0.5">{formatDate(billingRecord.current_period_end)}</p>
              </div>
            </div>
          )}
        </div>

        <Link
          href="/dashboard/billing"
          className="border border-white/10 text-white/60 px-6 py-3 rounded-lg hover:border-[#FF3B1A] hover:text-white transition inline-block"
        >
          View Billing Details
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Complete Checkout</h1>
        <p className="text-white/40 mt-1 text-sm">Activate your subscription to get started.</p>
      </div>

      {plan && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Plan Summary</p>
              <h2 className="text-white font-bold text-xl mt-1">{plan.name}</h2>
              <p className="text-[#FF3B1A] font-bold text-2xl mt-1">
                ${plan.price_monthly.toLocaleString()}<span className="text-white/40 text-sm font-normal">/month</span>
              </p>
            </div>
            <span className="bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
              TEST MODE
            </span>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">What's included</p>
            <ul className="space-y-2">
              {(PLAN_FEATURES[plan.slug] ?? []).map(feat => (
                <li key={feat} className="flex items-center gap-2 text-sm text-white/70">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={simulatePayment}
            disabled={paying}
            className="w-full bg-[#FF3B1A] text-white font-bold px-6 py-4 rounded-lg hover:bg-[#e02e10] transition text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {paying ? 'Processing...' : 'Simulate Successful Payment'}
          </button>

          <p className="text-white/30 text-xs text-center">
            No real charge. This is a demo/mock checkout. Stripe will be connected for live payments.
          </p>
        </div>
      )}

      {!plan && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/40 mb-4">No plan selected. Please choose a plan first.</p>
          <Link href="/dashboard/plan" className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition inline-block">
            Choose a Plan
          </Link>
        </div>
      )}
    </div>
  )
}
