import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

type UserRole = 'admin' | 'client'

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? ''
}

function getEnvAdminEmails() {
  const raw = process.env.UGCFIRE_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map(email => normalizeEmail(email))
      .filter(Boolean)
  )
}

function getFullName(user: User) {
  const meta = user.user_metadata ?? {}
  return (
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    user.email?.split('@')[0] ||
    'UGCFire User'
  )
}

export async function isAdminAllowedEmail(email?: string | null) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  if (getEnvAdminEmails().has(normalized)) return true

  const admin = createAdminClient()
  if (!admin) return false

  const { data } = await admin
    .from('admin_allowed_emails')
    .select('email')
    .eq('email', normalized)
    .maybeSingle()

  return Boolean(data)
}

export async function syncAuthenticatedUser(user: User): Promise<UserRole> {
  const email = normalizeEmail(user.email)
  const fullName = getFullName(user)
  const supabase = await createServerSupabaseClient()

  if (supabase) {
    const { data, error } = await supabase.rpc('sync_current_auth_profile', {
      profile_full_name: fullName,
    })

    if (!error && (data === 'admin' || data === 'client')) {
      return data
    }

    if (error) {
      console.warn('[syncAuthenticatedUser] RPC sync_current_auth_profile failed, falling back:', error.message)
      // Fall through to admin client fallback below
    }
  }

  const role: UserRole = await isAdminAllowedEmail(email) ? 'admin' : 'client'
  const admin = createAdminClient()

  if (!admin) return role

  try {
    const { error: profileError } = await admin.from('profiles').upsert({
      id: user.id,
      email,
      full_name: fullName,
      role,
      updated_at: new Date().toISOString(),
    }).select('id, email, role').single()

    if (profileError) {
      console.warn('[syncAuthenticatedUser] Profile upsert failed:', profileError.message)
      return role
    }

    if (role === 'client') {
      const { data: company } = await admin
        .from('companies')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle()

      if (!company) {
        const { data: inserted, error: companyError } = await admin
          .from('companies')
          .insert({
            name: `${fullName}'s Brand`,
            owner_user_id: user.id,
            onboarding_status: 'needs_plan',
          })
          .select('id')
          .single()

        if (companyError) {
          console.warn('[syncAuthenticatedUser] Company creation failed:', companyError.message)
        } else {
          await admin.from('activity_logs').insert({
            company_id: inserted?.id ?? null,
            actor_user_id: user.id,
            actor_role: 'client',
            event_type: 'user_signed_up',
            event_message: `${fullName} signed up.`,
          })
        }
      }
    }
  } catch (err) {
    console.warn('[syncAuthenticatedUser] Admin fallback failed:', err instanceof Error ? err.message : err)
  }

  return role
}

export function destinationForRole(role: UserRole) {
  return role === 'admin' ? '/admin' : '/dashboard'
}
