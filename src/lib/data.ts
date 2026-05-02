import { createClient } from './supabase/client'
import type { Company, ContentItem, Plan } from './types'

export async function getMyProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data
}

export async function getMyCompany() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  return (data?.[0] as Company | null) || null
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = createClient()
  const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('price_monthly')
  return (data ?? []) as Plan[]
}

export async function logActivity(params: {
  company_id?: string
  actor_user_id?: string
  actor_role?: string
  event_type: string
  event_message: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createClient()
  await supabase.from('activity_logs').insert(params)
}

export async function getCompanyContentItems(company_id: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('content_items')
    .select('*')
    .eq('company_id', company_id)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })
  return (data ?? []) as ContentItem[]
}

export function getOnboardingNext(status: string): string {
  const map: Record<string, string> = {
    needs_plan: '/dashboard/plan',
    needs_agreement: '/dashboard/agreement',
    needs_checkout: '/dashboard/checkout',
    needs_brand_brief: '/dashboard/brand-brief',
    completed: '/dashboard',
  }
  return map[status] ?? '/dashboard'
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    in_production: 'bg-yellow-500/20 text-yellow-300',
    ready_for_review: 'bg-blue-500/20 text-blue-300',
    revision_requested: 'bg-orange-500/20 text-orange-300',
    approved: 'bg-green-500/20 text-green-300',
    delivered: 'bg-emerald-500/20 text-emerald-300',
    archived: 'bg-gray-500/20 text-gray-400',
    open: 'bg-red-500/20 text-red-300',
    in_progress: 'bg-yellow-500/20 text-yellow-300',
    completed: 'bg-green-500/20 text-green-300',
    active_mock: 'bg-green-500/20 text-green-300',
    inactive: 'bg-gray-500/20 text-gray-400',
    past_due_mock: 'bg-red-500/20 text-red-300',
    canceled_mock: 'bg-gray-500/20 text-gray-400',
    submitted: 'bg-blue-500/20 text-blue-300',
    reviewed: 'bg-purple-500/20 text-purple-300',
    used: 'bg-green-500/20 text-green-300',
  }
  return map[status] ?? 'bg-gray-500/20 text-gray-400'
}
