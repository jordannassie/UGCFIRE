import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Demo mode cookie bypass ────────────────────────────────────────────────
  // Cookies are set by enterDemoMode() in src/lib/demoData.ts
  const demoMode = request.cookies.get('ugcfire_demo_mode')?.value
  const demoRole = request.cookies.get('ugcfire_demo_role')?.value

  if (demoMode === 'true') {
    if (path.startsWith('/admin')) {
      // Only admin-role demo can access /admin
      if (demoRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    // Allow all protected routes for valid demo sessions
    return NextResponse.next()
  }

  // ── Real Supabase auth ─────────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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

  const { data: { user } } = await supabase.auth.getUser()

  if ((path.startsWith('/dashboard') || path.startsWith('/admin')) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
