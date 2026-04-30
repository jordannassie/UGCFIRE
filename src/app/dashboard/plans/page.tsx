'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan, BillingRecord } from '@/lib/types'
import { isDemoMode, DEMO_PLANS, DEMO_COMPANY } from '@/lib/demoData'
import { PLAN_CONFIG, BOOKING_CALENDAR_URL, type PlanConfig } from '@/lib/planConfig'
import {
  CheckCircle, ArrowUp, ArrowDown, Loader2, Star, Zap, Building2,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDisplayPrice(cfg: PlanConfig, cycle: 'monthly' | 'yearly') {
  if (cfg.salesOnly) return { main: 'Custom', unit: '', note: null }
  if (cycle === 'yearly' && cfg.yearlyMonthlyPrice != null) {
    return { main: `$${cfg.yearlyMonthlyPrice.toLocaleString()}`, unit: '/mo', note: 'billed annually' }
  }
  return { main: `$${cfg.monthlyPrice!.toLocaleString()}`, unit: '/mo', note: null }
}

const ICON_MAP: Record<string, typeof Zap> = {
  growth: Zap,
  scale: Star,
  enterprise: Building2,
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<Partial<BillingRecord> | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        const allPlans = [...DEMO_PLANS] as Plan[]
        setPlans(allPlans)
        setCompany(DEMO_COMPANY as unknown as Company)
        setCurrentPlan(allPlans.find(p => p.id === DEMO_COMPANY.plan_id) ?? null)
        setBilling({ billing_status: 'active_mock', billing_interval: 'monthly', cancel_at_period_end: false })
        setLoading(false)
        return
      }

      const supabase = createClient()
      const co = await getMyCompany()
      setCompany(co)

      const { data: planData } = await supabase
        .from('plans').select('*').eq('is_active', true).order('sort_order')
      const allPlans = (planData ?? []) as Plan[]
      setPlans(allPlans)

      if (co?.plan_id) setCurrentPlan(allPlans.find(p => p.id === co.plan_id) ?? null)

      if (co?.id) {
        const { data: br } = await supabase
          .from('billing_records').select('*').eq('company_id', co.id).maybeSingle()
        if (br) {
          setBilling(br)
          setBillingCycle((br.billing_interval as 'monthly' | 'yearly') ?? 'monthly')
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function selectPlan(dbPlan: Plan, cfg: PlanConfig, interval: 'monthly' | 'yearly') {
    if (!company || cfg.salesOnly) return
    setSelecting(dbPlan.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSelecting(null); return }

      const isUpgrade = currentPlan && dbPlan.price_monthly > (currentPlan.price_monthly ?? 0)
      const isDowngrade = currentPlan && dbPlan.price_monthly < (currentPlan.price_monthly ?? 0)
      const eventType = !currentPlan ? 'plan_selected' : isUpgrade ? 'plan_upgraded' : isDowngrade ? 'plan_downgraded' : 'plan_selected'

      await supabase.from('companies').update({ plan_id: dbPlan.id }).eq('id', company.id)
      await supabase.from('billing_records').upsert({
        company_id: company.id,
        plan_id: dbPlan.id,
        billing_status: 'inactive',
        subscription_status: 'none',
        billing_interval: interval,
        cancel_at_period_end: false,
        mock_mode: true,
      }, { onConflict: 'company_id' })

      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: eventType,
        event_message: `Plan ${eventType.replace('_', ' ')}: ${dbPlan.name} (${interval})`,
        metadata: { plan_id: dbPlan.id, plan_name: dbPlan.name, billing_interval: interval },
      })

      setCurrentPlan(dbPlan)
      setBillingCycle(interval)
      showToast(`Switched to ${dbPlan.name} · ${interval === 'yearly' ? 'Yearly' : 'Monthly'}`)
    } catch {
      showToast('Something went wrong. Please try again.')
    } finally {
      setSelecting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-8 w-56 bg-white/5 rounded animate-pulse" />
        <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
        <div className="grid md:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => <div key={i} className="h-96 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const nextBillingDate = billing?.current_period_end
    ? new Date(billing.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl space-y-8">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1a1a1a] border border-green-500/30 text-green-400 text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle size={14} /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-white/40 mt-1 text-sm">
          Select the content plan that fits your brand. You can upgrade or downgrade at any time.
        </p>
      </div>

      {/* Subscription summary */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wider font-semibold mb-1">Current Plan</p>
          <p className="text-white font-bold text-sm">{currentPlan?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wider font-semibold mb-1">Billing</p>
          <p className="text-white font-bold text-sm capitalize">{billing?.billing_interval ?? '—'}</p>
        </div>
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wider font-semibold mb-1">Status</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            billing?.billing_status === 'active_mock'
              ? 'bg-green-500/15 text-green-400'
              : 'bg-white/8 text-white/40'
          }`}>
            {billing?.billing_status === 'active_mock' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-wider font-semibold mb-1">
            {billing?.cancel_at_period_end ? 'Cancels On' : 'Next Renewal'}
          </p>
          <p className="text-white font-bold text-sm">{nextBillingDate ?? '—'}</p>
        </div>
      </div>

      {/* Billing cycle toggle */}
      <div className="flex items-center gap-3">
        <span className="text-white/35 text-xs font-semibold uppercase tracking-wider">Billing:</span>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              billingCycle === 'monthly' ? 'bg-[#FF3B1A] text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              billingCycle === 'yearly' ? 'bg-green-500 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            Yearly
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              billingCycle === 'yearly' ? 'bg-white/25 text-white' : 'bg-green-500/20 text-green-400'
            }`}>-20%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {PLAN_CONFIG.map(cfg => {
          // Find matching DB plan by slug
          const dbPlan = plans.find(p => p.slug === cfg.key)

          const isCurrent = !!currentPlan && !!dbPlan && currentPlan.id === dbPlan.id
          const isCurrentBillingMatch = isCurrent && billing?.billing_interval === billingCycle
          const isScale = cfg.key === 'scale'
          const isEnterprise = cfg.key === 'enterprise'
          const currentMonthly = currentPlan?.price_monthly ?? 0
          const isUpgrade = !!currentPlan && !!dbPlan && !isEnterprise && (dbPlan.price_monthly ?? 0) > currentMonthly
          const isDowngrade = !!currentPlan && !!dbPlan && !isEnterprise && (dbPlan.price_monthly ?? 0) < currentMonthly
          const isBusy = !!dbPlan && selecting === dbPlan.id
          const Icon = ICON_MAP[cfg.key] ?? Zap
          const { main, unit, note } = getDisplayPrice(cfg, billingCycle)

          let buttonLabel = 'Select Plan'
          if (isEnterprise) buttonLabel = 'Talk to Sales'
          else if (isCurrentBillingMatch) buttonLabel = 'Current Plan'
          else if (isCurrent) buttonLabel = billingCycle === 'yearly' ? 'Switch to Yearly' : 'Switch to Monthly'
          else if (isUpgrade) buttonLabel = `Upgrade to ${cfg.name}`
          else if (isDowngrade) buttonLabel = `Downgrade to ${cfg.name}`
          else if (!currentPlan) buttonLabel = `Select ${cfg.name}`

          return (
            <div
              key={cfg.key}
              className={`relative flex flex-col rounded-xl p-5 transition ${
                isCurrent
                  ? 'bg-[#FF3B1A]/8 border border-[#FF3B1A]/30'
                  : isScale
                  ? 'bg-[#111] border border-white/18 hover:border-white/28'
                  : 'bg-[#111] border border-white/10 hover:border-white/18'
              }`}
            >
              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3.5 left-5">
                  <span className="bg-[#FF3B1A] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={9} /> Current Plan
                  </span>
                </div>
              )}
              {isScale && !isCurrent && (
                <div className="absolute -top-3.5 left-5">
                  <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/20">
                    <Star size={9} /> Most Popular
                  </span>
                </div>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-2.5 mb-3 mt-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isScale ? 'bg-[#FF3B1A]/20' : 'bg-white/5'}`}>
                  <Icon className="text-[#FF3B1A]" size={16} />
                </div>
                <h2 className="text-white font-bold text-base">{cfg.name}</h2>
              </div>

              {/* Price */}
              <div className="mb-0.5">
                {cfg.salesOnly ? (
                  <span className="text-3xl font-bold text-white">{main}</span>
                ) : (
                  <>
                    {/* Slashed original price — only shown on yearly */}
                    {billingCycle === 'yearly' && cfg.monthlyPrice != null && (
                      <div className="text-sm text-white/30 font-semibold line-through mb-0.5">
                        ${cfg.monthlyPrice.toLocaleString()}/mo
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{main}</span>
                      {unit && <span className="text-white/40 text-sm">{unit}</span>}
                    </div>
                    {note && <p className="text-green-400 text-xs font-semibold mt-1">{note}</p>}
                  </>
                )}
              </div>
              <p className="text-white/35 text-xs mb-4 mt-1">{cfg.deliverables ? `${cfg.deliverables} deliverables/month` : 'Custom volume'}</p>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {cfg.dashboardFeatures.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={12} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isEnterprise ? (
                <a
                  href={BOOKING_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center font-bold px-4 py-2.5 rounded-lg text-xs border border-white/15 text-white/60 hover:border-[#FF3B1A]/40 hover:text-white transition flex items-center justify-center gap-2"
                >
                  Talk to Sales
                </a>
              ) : (
                <button
                  onClick={() => !isCurrentBillingMatch && !isBusy && dbPlan && selectPlan(dbPlan, cfg, billingCycle)}
                  disabled={isCurrentBillingMatch || isBusy || selecting !== null}
                  className={`w-full font-bold px-4 py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 disabled:opacity-60 ${
                    isCurrentBillingMatch
                      ? 'border border-white/10 text-white/30 cursor-default'
                      : isScale
                      ? 'bg-[#FF3B1A] text-white hover:bg-[#e02e10]'
                      : 'border border-white/18 text-white hover:border-[#FF3B1A] hover:text-white'
                  }`}
                >
                  {isBusy ? <><Loader2 size={13} className="animate-spin" /> Updating...</>
                  : isCurrentBillingMatch ? <><CheckCircle size={13} /> Current Plan</>
                  : isUpgrade ? <><ArrowUp size={13} /> {buttonLabel}</>
                  : isDowngrade ? <><ArrowDown size={13} /> {buttonLabel}</>
                  : buttonLabel}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Enterprise callout */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">Need higher volume or a custom plan?</p>
          <p className="text-white/35 text-xs mt-0.5">Talk to our team about volume pricing, dedicated support, and custom workflows.</p>
        </div>
        <a
          href={BOOKING_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/8 border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:border-[#FF3B1A]/40 hover:bg-white/12 transition shrink-0"
        >
          Book a Call
        </a>
      </div>
    </div>
  )
}
