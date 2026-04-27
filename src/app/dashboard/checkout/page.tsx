'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan } from '@/lib/types'
import { CreditCard, CheckCircle, Zap, Lock, ArrowRight, Package } from 'lucide-react'

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
          <h1 className="text-3xl font-bold text-white">Subscription Active</h1>
          <p className="text-white/40 mt-1 text-sm">Your subscription is running and content is in production.</p>
        </div>

        <div className="bg-[#111] border border-green-500/20 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={20} />
              <span className="text-green-400 font-bold text-lg">Active Subscription</span>
            </div>
            <span className="bg-orange-500/20 text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
              TEST MODE
            </span>
          </div>

          {plan && (
            <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF3B1A]/20 flex items-center justify-center">
                  <Package className="text-[#FF3B1A]" size={18} />
                </div>
                <div>
                  <p className="text-white font-bold">{plan.name}</p>
                  <p className="text-white/40 text-sm">{PLAN_FEATURES[plan.slug]?.[0]}</p>
                </div>
              </div>
              <p className="text-[#FF3B1A] font-bold text-lg">${plan.price_monthly.toLocaleString()}<span className="text-white/30 text-xs">/mo</span></p>
            </div>
          )}

          {billingRecord.current_period_start && billingRecord.current_period_end && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Billing Start</p>
                <p className="text-white">{formatDate(billingRecord.current_period_start)}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Next Renewal</p>
                <p className="text-white">{formatDate(billingRecord.current_period_end)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-white/30 text-xs">
            <CreditCard size={12} />
            <span>Mock card ending in 4242</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard/brand-brief"
            className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition inline-flex items-center gap-2"
          >
            Go to Brand Brief
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard/billing"
            className="border border-white/10 text-white/60 px-6 py-3 rounded-lg hover:border-[#FF3B1A] hover:text-white transition inline-block"
          >
            View Billing
          </Link>
        </div>
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
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">What&apos;s included</p>
            <ul className="space-y-2">
              {(PLAN_FEATURES[plan.slug] ?? []).map(feat => (
                <li key={feat} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock card UI */}
          <div className="border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="text-white/40" size={16} />
              <p className="text-white/50 text-xs uppercase tracking-wider">Payment Method</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded px-2 py-1 text-white/50 text-xs font-mono">**** **** **** 4242</div>
              </div>
              <span className="text-white/30 text-xs">Exp 12/28</span>
            </div>
            <p className="text-white/20 text-xs mt-2">Stripe test card — no real charge</p>
          </div>

          <button
            onClick={simulatePayment}
            disabled={paying}
            className="w-full bg-[#FF3B1A] text-white font-bold px-6 py-4 rounded-lg hover:bg-[#e02e10] transition text-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Zap size={18} />
            {paying ? 'Processing...' : 'Simulate Successful Payment'}
          </button>

          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <Lock size={12} />
            <span>No real charge. Demo/mock checkout. Stripe connects for live payments.</span>
          </div>
        </div>
      )}

      {!plan && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
          <Package className="text-[#FF3B1A] mx-auto mb-4" size={32} />
          <p className="text-white/40 mb-4">No plan selected. Please choose a plan first.</p>
          <Link href="/dashboard/plan" className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition inline-block">
            Choose a Plan
          </Link>
        </div>
      )}
    </div>
  )
}
