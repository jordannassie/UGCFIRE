import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { destinationForRole, syncAuthenticatedUser } from '@/lib/auth/server'

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const supabase = await createClient()

  if (!supabase) {
    url.pathname = '/signup'
    url.searchParams.set('error', 'Supabase is not configured.')
    return NextResponse.redirect(url)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    url.pathname = '/signup'
    url.search = ''
    return NextResponse.redirect(url)
  }

  try {
    const role = await syncAuthenticatedUser(user)
    url.pathname = safeNextPath(url.searchParams.get('next')) ?? destinationForRole(role)
    if (url.pathname.startsWith('/admin')) {
      url.search = ''
      url.searchParams.set('auth_synced', '1')
      return NextResponse.redirect(url)
    }
  } catch (error) {
    url.pathname = '/signup'
    url.search = ''
    url.searchParams.set('error', error instanceof Error ? error.message : 'Could not sync your account.')
    return NextResponse.redirect(url)
  }

  url.search = ''
  return NextResponse.redirect(url)
}
