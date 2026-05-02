import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAuthCookieName, getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const adminUserView = request.cookies.get('ugcfire_admin_user_view')?.value === 'true'

  const demoMode = request.cookies.get('ugcfire_demo_mode')?.value
  const demoRole = request.cookies.get('ugcfire_demo_role')?.value

  if (demoMode === 'true') {
    if (path.startsWith('/admin') && demoRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookieOptions: {
        name: getSupabaseAuthCookieName(),
      },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log(`[proxy] Intercepting ${path} | cookies count:`, request.cookies.getAll().length)
  console.log(`[proxy] getUser result:`, user ? user.email : 'NO USER', '| error:', userError?.message || 'none')

  if ((path.startsWith('/dashboard') || path.startsWith('/admin')) && !user) {
    console.log(`[proxy] Redirecting to /login because NO USER`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const role = profile?.role === 'admin' ? 'admin' : 'client'

    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (path.startsWith('/admin') && adminUserView) {
      supabaseResponse.cookies.set('ugcfire_admin_user_view', '', {
        path: '/',
        maxAge: 0,
      })
    }

    if (path.startsWith('/dashboard') && role === 'admin' && !adminUserView) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
