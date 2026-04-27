'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity } from '@/lib/data'
import type { Company, Plan } from '@/lib/types'

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
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)

  useEffect(() => {
    async function load() {
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

      // Update company
      await supabase.from('companies').update({
        plan_id: plan.id,
        ...(wasNeedsPlan ? { onboarding_status: 'needs_agreement' } : {}),
      }).eq('id', company.id)

      // Upsert billing_records
      await supabase.from('billing_records').upsert({
        company_id: company.id,
        plan_id: plan.id,
        billing_status: 'inactive',
        subscription_status: 'none',
        mock_mode: true,
      }, { onConflict: 'company_id' })

      // Log activity
      const eventType = !currentPlan ? 'plan_selected' : isUpgrade ? 'plan_upgraded' : isDowngrade ? 'plan_downgraded' : 'plan_selected'
      await logActivity({
        company_id: company.id,
        actor_user_id: user.id,
        actor_role: 'client',
        event_type: eventType,
        event_message: `Plan ${eventType.replace('_', ' ')}: ${plan.name}`,
        metadata: { plan_id: plan.id, plan_name: plan.name },
      })

      router.push('/dashboard/agreement')
    } catch {
      setSelecting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
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
    const isGrowth = slug === 'growth'

    let buttonLabel = 'Select Plan'
    if (isCurrent) buttonLabel = 'Current Plan'
    else if (currentPlan) {
      buttonLabel = isGrowth ? 'Downgrade to Growth' : 'Upgrade to Scale'
    }

    return (
      <div className={`bg-[#111] border rounded-xl p-6 flex flex-col relative ${
        isCurrent ? 'border-[#FF3B1A]' : !isGrowth ? 'border-white/20' : 'border-white/10'
      }`}>
        {isCurrent && (
          <div className="absolute -top-3 left-6">
            <span className="bg-[#FF3B1A] text-white text-xs font-bold px-3 py-1 rounded-full">Current Plan</span>
          </div>
        )}
        {!isGrowth && !isCurrent && (
          <div className="absolute -top-3 left-6">
            <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-white font-bold text-xl">{plan.name}</h2>
          {plan.description && <p className="text-white/50 text-sm mt-1">{plan.description}</p>}
        </div>

        <div className="mb-6">
          <span className="text-4xl font-bold text-white">${plan.price_monthly.toLocaleString()}</span>
          <span className="text-white/40 text-sm">/month</span>
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {details.features.map(feat => (
            <li key={feat} className="flex items-center gap-2 text-sm text-white/70">
              <span className="text-green-400">✓</span>
              {feat}
            </li>
          ))}
        </ul>

        <button
          onClick={() => !isCurrent && selectPlan(plan)}
          disabled={isCurrent || selecting !== null}
          className={`w-full font-bold px-6 py-3 rounded-lg transition ${
            isCurrent
              ? 'border border-white/10 text-white/30 cursor-default'
              : !isGrowth
              ? 'bg-[#FF3B1A] text-white hover:bg-[#e02e10]'
              : 'border border-white/20 text-white hover:border-[#FF3B1A] hover:text-white'
          } disabled:opacity-60`}
        >
          {selecting === plan.id ? 'Selecting...' : buttonLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-white/40 mt-1 text-sm">Select the monthly content plan that fits your brand.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-4">
        {renderPlan(growthPlan, 'growth')}
        {renderPlan(scalePlan, 'scale')}
      </div>

      {!growthPlan && !scalePlan && (
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/40">No plans available. Please contact support.</p>
        </div>
      )}
    </div>
  )
}
