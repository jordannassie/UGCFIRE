'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan } from '@/lib/types'
import { isDemoMode, DEMO_PLANS, DEMO_COMPANY } from '@/lib/demoData'
import { Zap, CheckCircle, ArrowRight, Star } from 'lucide-react'

const PLAN_DETAILS: Record<string, { deliverables: number; features: string[] }> = {
  growth: {
    deliverables: 8,
    features: [
      '8 content deliverables/month',
      'Photos + videos',
      'AI-assisted production',
      'Dashboard review system',
      'Team chat support',
    ],
  },
  scale: {
    deliverables: 20,
    features: [
      '20 content deliverables/month',
      'Photos + videos + carousels',
      'AI-assisted production',
      'Dashboard review system',
      'Priority team chat support',
      'Weekly content drops',
    ],
  },
}

export default function PlanPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [selectedSuccess, setSelectedSuccess] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        const allPlans = DEMO_PLANS as Plan[]
        setPlans(allPlans)
        setCompany(DEMO_COMPANY as Company)
        const found = allPlans.find(p => p.id === DEMO_COMPANY.plan_id) ?? null
        setCurrentPlan(found)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const co = await getMyCompany()
      setCompany(co)

      const { data: planData } = await supabase.from('plans').select('*').eq('is_active', true).order('price_monthly')
      const allPlans = (planData ?? []) as Plan[]
      setPlans(allPlans)

      if (co?.plan_id) {
        const found = allPlans.find(p => p.id === co.plan_id) ?? null
        setCurrentPlan(found)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function selectPlan(plan: Plan) {
    if (!company) return
    setSelecting(plan.id)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const wasNeedsPlan = company.onboarding_status === 'needs_plan'
      const isUpgrade = currentPlan && plan.price_monthly > currentPlan.price_monthly
      const isDowngrade = currentPlan && plan.price_monthly < currentPlan.price_monthly

      await supabase.from('companies').update({
        plan_id: plan.id,
        ...(wasNeedsPlan ? { onboarding_status: 'needs_agreement' } : {}),
      }).eq('id', company.id)

      await supabase.from('billing_records').upsert({
        company_id: company.id,
        plan_id: plan.id,
        billing_status: 'inactive',
        subscription_status: 'none',
        mock_mode: true,
      }, { onConflict: 'company_id' })

      const eventType = !currentPlan ? 'plan_selected' : isUpgrade ? 'plan_upgraded' : isDowngrade ? 'plan_downgraded' : 'plan_selected'
      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: eventType,
        event_message: `Plan ${eventType.replace('_', ' ')}: ${plan.name}`,
        metadata: { plan_id: plan.id, plan_name: plan.name },
      })

      setSelectedSuccess(plan.id)
      setCurrentPlan(plan)

      setTimeout(() => {
        router.push('/dashboard/agreement')
      }, 1200)
    } catch {
      setSelecting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  const growthPlan = plans.find(p => p.slug === 'growth')
  const scalePlan = plans.find(p => p.slug === 'scale')

  const renderPlan = (plan: Plan | undefined, slug: string) => {
    if (!plan) return null
    const details = PLAN_DETAILS[slug]
    const isCurrent = currentPlan?.id === plan.id
    const isScale = slug === 'scale'
    const isSuccess = selectedSuccess === plan.id

    let buttonLabel = 'Select Plan'
    if (isCurrent) buttonLabel = 'Current Plan'
    else if (currentPlan) {
      buttonLabel = isScale ? 'Upgrade to Scale' : 'Downgrade to Growth'
    }

    return (
      <div className={`bg-[#111] border rounded-xl p-6 flex flex-col relative transition ${
        isCurrent
          ? 'border-[#FF3B1A] shadow-[0_0_30px_rgba(255,59,26,0.08)]'
          : isScale
          ? 'border-white/20 hover:border-white/30'
          : 'border-white/10 hover:border-white/20'
      }`}>
        {/* Badge */}
        {isCurrent && (
          <div className="absolute -top-3.5 left-6">
            <span className="bg-[#FF3B1A] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={10} />
              Current Plan
            </span>
          </div>
        )}
        {isScale && !isCurrent && (
          <div className="absolute -top-3.5 left-6">
            <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/20">
              <Star size={10} />
              Most Popular
            </span>
          </div>
        )}

        {/* Icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isScale ? 'bg-[#FF3B1A]/20' : 'bg-white/5'
          }`}>
            <Zap className="text-[#FF3B1A]" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{plan.name}</h2>
            {plan.description && <p className="text-white/40 text-xs mt-0.5">{plan.description}</p>}
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-bold text-white">${plan.price_monthly.toLocaleString()}</span>
          <span className="text-white/40 text-sm ml-1">/month</span>
          <p className="text-white/30 text-xs mt-1">{details.deliverables} content deliverables/month</p>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {details.features.map(feat => (
            <li key={feat} className="flex items-center gap-2.5 text-sm text-white/70">
              <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
              {feat}
            </li>
          ))}
        </ul>

        {/* Success message */}
        {isSuccess && (
          <div className="mb-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <CheckCircle className="text-green-400" size={14} />
            <span className="text-green-400 text-sm font-medium">Plan selected! Redirecting...</span>
          </div>
        )}

        <button
          onClick={() => !isCurrent && !isSuccess && selectPlan(plan)}
          disabled={isCurrent || selecting !== null}
          className={`w-full font-bold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
            isCurrent
              ? 'border border-white/10 text-white/30 cursor-default'
              : isScale
              ? 'bg-[#FF3B1A] text-white hover:bg-[#e02e10]'
              : 'border border-white/20 text-white hover:border-[#FF3B1A] hover:text-white'
          } disabled:opacity-60`}
        >
          {selecting === plan.id ? (
            <>Selecting...</>
          ) : isCurrent ? (
            <><CheckCircle size={16} /> {buttonLabel}</>
          ) : (
            <>{buttonLabel} <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-white/40 mt-1 text-sm">Select the monthly content plan that fits your brand. You can upgrade or downgrade at any time.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-4">
        {renderPlan(growthPlan, 'growth')}
        {renderPlan(scalePlan, 'scale')}
      </div>

      {!growthPlan && !scalePlan && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
          <Zap className="text-white/20 mx-auto mb-3" size={36} />
          <p className="text-white/40">No plans available. Please contact support.</p>
        </div>
      )}
    </div>
  )
}
