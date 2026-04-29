'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan, BillingRecord } from '@/lib/types'
import { isDemoMode, DEMO_PLANS, DEMO_COMPANY } from '@/lib/demoData'
import {
  CheckCircle, ArrowUp, ArrowDown, Mail, Zap, Star, Building2, Sun, Moon, Loader2,
} from 'lucide-react'

// ─── Static plan metadata ───────────────────────────────────────────────────

const PLAN_META: Record<string, {
  deliverables: string
  yearlyEquiv: string
  features: string[]
  icon: typeof Zap
}> = {
  growth: {
    deliverables: '8 content deliverables/month',
    yearlyEquiv: '$2,000/mo billed annually',
    features: [
      '8 content deliverables/month',
      'Photos + videos',
      'AI-assisted production',
      'Dashboard review system',
      'Team chat support',
      'Revisions included',
      'Cancel anytime',
    ],
    icon: Zap,
  },
  scale: {
    deliverables: '20 content deliverables/month',
    yearlyEquiv: '$4,000/mo billed annually',
    features: [
      '20 content deliverables/month',
      'Photos + videos + carousels',
      'AI-assisted production',
      'Dashboard review system',
      'Priority team chat support',
      'Weekly content drops',
      'Priority delivery',
      'Revisions included',
      'Cancel anytime',
    ],
    icon: Star,
  },
  enterprise: {
    deliverables: 'Custom deliverables/month',
    yearlyEquiv: 'Custom pricing — contact sales',
    features: [
      'Custom deliverables/month',
      'Dedicated creative strategist',
      'Priority support',
      'Custom workflows',
      'Team collaboration',
      'Strategy support',
      'Priority delivery',
    ],
    icon: Building2,
  },
}

// ─── Demo stubs ──────────────────────────────────────────────────────────────

const DEMO_BILLING: Partial<BillingRecord> = {
  billing_status: 'active_mock',
  subscription_status: 'active_mock',
  billing_interval: 'monthly',
  current_period_end: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
  cancel_at_period_end: false,
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billing, setBilling] = useState<Partial<BillingRecord> | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        const allPlans = [...DEMO_PLANS] as Plan[]
        // Inject enterprise for demo if not present
        if (!allPlans.find(p => p.slug === 'enterprise')) {
          allPlans.push({
            id: 'enterprise-demo',
            name: 'Enterprise',
            slug: 'enterprise',
            price_monthly: 0,
            yearly_price: null,
            videos_per_month: 0,
            description: 'Custom content volume for brands that need more.',
            sales_only: true,
            sort_order: 3,
            is_active: true,
            created_at: new Date().toISOString(),
          })
        }
        setPlans(allPlans.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
        setCompany(DEMO_COMPANY as unknown as Company)
        const found = allPlans.find(p => p.id === DEMO_COMPANY.plan_id) ?? null
        setCurrentPlan(found)
        setBilling(DEMO_BILLING)
        setBillingCycle((DEMO_BILLING.billing_interval as 'monthly' | 'yearly') ?? 'monthly')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const co = await getMyCompany()
      setCompany(co)

      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      const allPlans = (planData ?? []) as Plan[]
      setPlans(allPlans)

      if (co?.plan_id) {
        setCurrentPlan(allPlans.find(p => p.id === co.plan_id) ?? null)
      }

      // Load billing record
      if (co?.id) {
        const { data: br } = await supabase
          .from('billing_records')
          .select('*')
          .eq('company_id', co.id)
          .maybeSingle()
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
    setTimeout(() => setToast(null), 3000)
  }

  async function selectPlan(plan: Plan, interval: 'monthly' | 'yearly') {
    if (!company || plan.sales_only) return
    setSelecting(plan.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSelecting(null); return }

      const wasNeedsPlan = company.onboarding_status === 'needs_plan'
      const isUpgrade = currentPlan && plan.price_monthly > (currentPlan.price_monthly ?? 0)
      const isDowngrade = currentPlan && plan.price_monthly < (currentPlan.price_monthly ?? 0)

      await supabase.from('companies').update({
        plan_id: plan.id,
        ...(wasNeedsPlan ? { onboarding_status: 'needs_agreement' } : {}),
      }).eq('id', company.id)

      await supabase.from('billing_records').upsert({
        company_id: company.id,
        plan_id: plan.id,
        billing_status: 'inactive',
        subscription_status: 'none',
        billing_interval: interval,
        cancel_at_period_end: false,
        mock_mode: true,
      }, { onConflict: 'company_id' })

      const eventType = !currentPlan
        ? 'plan_selected'
        : isUpgrade ? 'plan_upgraded'
        : isDowngrade ? 'plan_downgraded'
        : 'plan_selected'

      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: eventType,
        event_message: `Plan ${eventType.replace('_', ' ')}: ${plan.name} (${interval})`,
        metadata: { plan_id: plan.id, plan_name: plan.name, billing_interval: interval },
      })

      setCurrentPlan(plan)
      setBillingCycle(interval)
      showToast(`Switched to ${plan.name} (${interval === 'yearly' ? 'Yearly' : 'Monthly'})`)
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

  const growthPlan = plans.find(p => p.slug === 'growth')
  const scalePlan = plans.find(p => p.slug === 'scale')
  const enterprisePlan = plans.find(p => p.slug === 'enterprise')

  const formatPrice = (plan: Plan) => {
    if (plan.sales_only) return 'Talk to Sales'
    if (billingCycle === 'yearly' && plan.yearly_price) {
      return `$${plan.yearly_price.toLocaleString()}/yr`
    }
    return `$${plan.price_monthly.toLocaleString()}/mo`
  }

  const nextBillingDate = billing?.current_period_end
    ? new Date(billing.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1a1a1a] border border-green-500/30 text-green-400 text-sm font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in">
          <CheckCircle size={14} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-white/40 mt-1 text-sm">
          Select the monthly content plan that fits your brand. You can upgrade or downgrade at any time.
        </p>
      </div>

      {/* Subscription summary */}
      {(currentPlan || billing) && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-white/35 text-[11px] uppercase tracking-wider font-semibold mb-1">Current Plan</p>
            <p className="text-white font-bold text-sm">{currentPlan?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-white/35 text-[11px] uppercase tracking-wider font-semibold mb-1">Billing Cycle</p>
            <p className="text-white font-bold text-sm capitalize">{billing?.billing_interval ?? '—'}</p>
          </div>
          <div>
            <p className="text-white/35 text-[11px] uppercase tracking-wider font-semibold mb-1">Status</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              billing?.billing_status === 'active_mock'
                ? 'bg-green-500/15 text-green-400'
                : 'bg-white/8 text-white/40'
            }`}>
              {billing?.billing_status === 'active_mock' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-white/35 text-[11px] uppercase tracking-wider font-semibold mb-1">
              {billing?.cancel_at_period_end ? 'Cancels On' : 'Next Renewal'}
            </p>
            <p className="text-white font-bold text-sm">{nextBillingDate ?? '—'}</p>
          </div>
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex items-center gap-4">
        <span className="text-white/40 text-sm font-medium">Billing:</span>
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-[#FF3B1A] text-white'
                : 'text-white/45 hover:text-white/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              billingCycle === 'yearly'
                ? 'bg-[#FF3B1A] text-white'
                : 'text-white/45 hover:text-white/70'
            }`}
          >
            Yearly
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              billingCycle === 'yearly'
                ? 'bg-white/25 text-white'
                : 'bg-[#FF3B1A]/20 text-[#FF3B1A]'
            }`}>
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards grid */}
      <div className="grid md:grid-cols-3 gap-5 pt-2">
        {[growthPlan, scalePlan, enterprisePlan].map(plan => {
          if (!plan) return null
          const slug = plan.slug as 'growth' | 'scale' | 'enterprise'
          const meta = PLAN_META[slug]
          const isCurrent = currentPlan?.id === plan.id && billing?.billing_interval === billingCycle
          const isCurrentPlan = currentPlan?.id === plan.id
          const isScale = slug === 'scale'
          const isEnterprise = slug === 'enterprise'
          const isUpgrade = currentPlan && !isEnterprise && plan.price_monthly > (currentPlan.price_monthly ?? 0)
          const isDowngrade = currentPlan && !isEnterprise && plan.price_monthly < (currentPlan.price_monthly ?? 0)
          const isBusy = selecting === plan.id
          const Icon = meta?.icon ?? Zap

          let buttonLabel = 'Select Plan'
          if (isEnterprise) {
            buttonLabel = 'Talk to Sales'
          } else if (isCurrent) {
            buttonLabel = 'Current Plan'
          } else if (isCurrentPlan && billing?.billing_interval !== billingCycle) {
            buttonLabel = billingCycle === 'yearly' ? 'Switch to Yearly' : 'Switch to Monthly'
          } else if (isUpgrade) {
            buttonLabel = `Upgrade to ${plan.name}`
          } else if (isDowngrade) {
            buttonLabel = `Downgrade to ${plan.name}`
          } else if (!currentPlan) {
            buttonLabel = `Select ${plan.name}`
          }

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl p-6 transition ${
                isCurrent
                  ? 'bg-[#FF3B1A]/8 border border-[#FF3B1A]/35 shadow-[0_0_28px_rgba(255,59,26,0.07)]'
                  : isScale
                  ? 'bg-[#111] border border-white/18 hover:border-white/30'
                  : 'bg-[#111] border border-white/10 hover:border-white/18'
              }`}
            >
              {/* Current plan badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3.5 left-5">
                  <span className="bg-[#FF3B1A] text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={9} /> Current Plan
                  </span>
                </div>
              )}
              {/* Most Popular badge */}
              {isScale && !isCurrentPlan && (
                <div className="absolute -top-3.5 left-5">
                  <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/20">
                    <Star size={9} /> Most Popular
                  </span>
                </div>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isScale ? 'bg-[#FF3B1A]/20' : 'bg-white/5'
                }`}>
                  <Icon className="text-[#FF3B1A]" size={18} />
                </div>
                <h2 className="text-white font-bold text-lg">{plan.name}</h2>
              </div>

              {/* Price */}
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">
                  {plan.sales_only ? 'Custom' : billingCycle === 'yearly' && plan.yearly_price
                    ? `$${plan.yearly_price.toLocaleString()}`
                    : `$${plan.price_monthly.toLocaleString()}`
                  }
                </span>
                {!plan.sales_only && (
                  <span className="text-white/40 text-sm ml-1">
                    {billingCycle === 'yearly' ? '/yr' : '/mo'}
                  </span>
                )}
              </div>
              {billingCycle === 'yearly' && !plan.sales_only && meta?.yearlyEquiv && (
                <p className="text-green-400 text-xs font-semibold mb-2">{meta.yearlyEquiv}</p>
              )}
              <p className="text-white/35 text-xs mb-5">{meta?.deliverables}</p>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {meta?.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm text-white/65">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={13} />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              {isEnterprise ? (
                <a
                  href="mailto:hello@ugcfire.com"
                  className="w-full text-center font-bold px-5 py-2.5 rounded-lg text-sm border border-white/15 text-white/70 hover:border-[#FF3B1A]/40 hover:text-white transition flex items-center justify-center gap-2"
                >
                  <Mail size={14} /> Talk to Sales
                </a>
              ) : (
                <button
                  onClick={() => !isCurrent && !isBusy && selectPlan(plan, billingCycle)}
                  disabled={isCurrent || isBusy || selecting !== null}
                  className={`w-full font-bold px-5 py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-60 ${
                    isCurrent
                      ? 'border border-white/10 text-white/30 cursor-default'
                      : isScale
                      ? 'bg-[#FF3B1A] text-white hover:bg-[#e02e10]'
                      : 'border border-white/20 text-white hover:border-[#FF3B1A] hover:text-white'
                  }`}
                >
                  {isBusy ? (
                    <><Loader2 size={14} className="animate-spin" /> Updating...</>
                  ) : isCurrent ? (
                    <><CheckCircle size={14} /> {buttonLabel}</>
                  ) : isUpgrade ? (
                    <><ArrowUp size={14} /> {buttonLabel}</>
                  ) : isDowngrade ? (
                    <><ArrowDown size={14} /> {buttonLabel}</>
                  ) : (
                    <>{buttonLabel}</>
                  )}
                </button>
              )}
            </div>
          )
        })}

        {!growthPlan && !scalePlan && !enterprisePlan && (
          <div className="col-span-3 bg-[#111] border border-white/10 rounded-xl p-8 text-center">
            <Zap className="text-white/20 mx-auto mb-3" size={32} />
            <p className="text-white/40 text-sm">No plans available. Please contact support.</p>
          </div>
        )}
      </div>

      {/* Enterprise contact callout */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">Need a custom plan?</p>
          <p className="text-white/40 text-xs mt-0.5">Talk to our team about volume pricing, custom workflows, and dedicated support.</p>
        </div>
        <a
          href="mailto:hello@ugcfire.com"
          className="flex items-center gap-2 bg-white/8 border border-white/15 text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:border-[#FF3B1A]/40 hover:bg-white/12 transition shrink-0"
        >
          <Mail size={14} /> Contact Sales
        </a>
      </div>
    </div>
  )
}
