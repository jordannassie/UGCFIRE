'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getMyCompany, logActivity, getOnboardingNext } from '@/lib/data'
import type { Company, ActivityLog } from '@/lib/types'
import { isDemoMode, DEMO_COMPANY, DEMO_CONTENT_ITEMS, DEMO_ACTIVITY_LOGS } from '@/lib/demoData'

const ONBOARDING_STEPS = [
  { key: 'needs_plan', label: 'Choose Plan', href: '/dashboard/plan', description: 'Select a monthly content plan' },
  { key: 'needs_agreement', label: 'Sign Agreement', href: '/dashboard/agreement', description: 'Review and sign the service agreement' },
  { key: 'needs_checkout', label: 'Complete Checkout', href: '/dashboard/checkout', description: 'Activate your subscription' },
  { key: 'needs_brand_brief', label: 'Complete Brand Brief', href: '/dashboard/brand-brief', description: 'Tell us about your brand' },
  { key: 'completed', label: 'Receive Weekly Content', href: '/dashboard/weekly-uploads', description: 'Review and approve your content deliverables' },
]

const STATUS_ORDER = ['needs_plan', 'needs_agreement', 'needs_checkout', 'needs_brand_brief', 'completed']

function isStepComplete(stepKey: string, onboardingStatus: string): boolean {
  const stepIdx = STATUS_ORDER.indexOf(stepKey)
  const currentIdx = STATUS_ORDER.indexOf(onboardingStatus)
  if (onboardingStatus === 'completed') return true
  return stepIdx < currentIdx
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DashboardHome() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentStats, setContentStats] = useState({ total: 0, approved: 0, in_review: 0, revisions: 0 })
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    async function load() {
      if (isDemoMode()) {
        setCompany(DEMO_COMPANY as Company)
        const items = DEMO_CONTENT_ITEMS
        setContentStats({
          total: items.length,
          approved: items.filter(i => i.status === 'approved' || i.status === 'delivered').length,
          in_review: items.filter(i => i.status === 'ready_for_review').length,
          revisions: items.filter(i => i.status === 'revision_requested').length,
        })
        setActivityLogs(DEMO_ACTIVITY_LOGS.filter(l => l.company_id === 'company-demo-brand') as ActivityLog[])
        setLoading(false)
        return
      }

      const co = await getMyCompany()
      setCompany(co)

      if (co) {
        const supabase = createClient()

        const { data: items } = await supabase
          .from('content_items')
          .select('status')
          .eq('company_id', co.id)
          .is('deleted_at', null)

        if (items) {
          setContentStats({
            total: items.length,
            approved: items.filter(i => i.status === 'approved' || i.status === 'delivered').length,
            in_review: items.filter(i => i.status === 'ready_for_review').length,
            revisions: items.filter(i => i.status === 'revision_requested').length,
          })
        }

        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('company_id', co.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (logs) setActivityLogs(logs as ActivityLog[])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const onboardingComplete = company?.onboarding_status === 'completed'
  const nextRoute = company ? getOnboardingNext(company.onboarding_status) : '/dashboard/plan'

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back{company?.name ? `, ${company.name}` : ''}
        </h1>
        <p className="text-white/40 mt-1 text-sm">Here's what's happening with your account.</p>
      </div>

      {/* Next step banner */}
      {!onboardingComplete && company && (
        <div className="bg-[#FF3B1A]/10 border border-[#FF3B1A]/30 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#FF3B1A] text-xs font-bold uppercase tracking-wider mb-1">Action Required</p>
            <p className="text-white font-semibold">Complete your onboarding to get started</p>
            <p className="text-white/50 text-sm mt-0.5">
              Next step: {ONBOARDING_STEPS.find(s => s.key === company.onboarding_status)?.label ?? 'Continue setup'}
            </p>
          </div>
          <Link
            href={nextRoute}
            className="bg-[#FF3B1A] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#e02e10] transition whitespace-nowrap"
          >
            Continue Setup →
          </Link>
        </div>
      )}

      {/* Onboarding checklist */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-4">Setup Checklist</h2>
        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step, idx) => {
            const complete = company ? isStepComplete(step.key, company.onboarding_status) : false
            const isCurrent = company?.onboarding_status === step.key
            return (
              <div
                key={step.key}
                className={`flex items-center gap-4 p-4 rounded-lg border transition ${
                  complete
                    ? 'border-green-500/20 bg-green-500/5'
                    : isCurrent
                    ? 'border-[#FF3B1A]/30 bg-[#FF3B1A]/5'
                    : 'border-white/5 bg-white/2'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  complete ? 'bg-green-500/20 text-green-400' : isCurrent ? 'bg-[#FF3B1A]/20 text-[#FF3B1A]' : 'bg-white/5 text-white/30'
                }`}>
                  {complete ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${complete ? 'text-green-400' : isCurrent ? 'text-white' : 'text-white/40'}`}>
                    {step.label}
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">{step.description}</p>
                </div>
                {isCurrent && (
                  <Link href={step.href} className="text-[#FF3B1A] text-xs font-bold hover:underline whitespace-nowrap">
                    Do This →
                  </Link>
                )}
                {complete && <span className="text-green-400 text-xs">Done</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats — only when onboarding complete */}
      {onboardingComplete && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Content', value: contentStats.total, color: 'text-white' },
            { label: 'Approved', value: contentStats.approved, color: 'text-green-400' },
            { label: 'In Review', value: contentStats.in_review, color: 'text-blue-400' },
            { label: 'Revisions', value: contentStats.revisions, color: 'text-orange-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111] border border-white/10 rounded-xl p-5">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-white/40 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-4">Recent Activity</h2>
        {activityLogs.length === 0 ? (
          <p className="text-white/30 text-sm">No activity yet — complete your setup to get started.</p>
        ) : (
          <div className="space-y-3">
            {activityLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B1A] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm">{log.event_message}</p>
                  <p className="text-white/30 text-xs mt-0.5">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
