import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { destinationForRole, syncAuthenticatedUser } from '@/lib/auth/server'
import { getSupabaseAuthCookieName, getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  if (value.startsWith('/admin')) return null
  return value
}

function serializeCookie(
  name: string,
  value: string,
  opts?: Record<string, unknown>
): string {
  const parts = [`${name}=${value}`]
  if (opts?.path) parts.push(`Path=${opts.path}`)
  if (opts?.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`)
  if (opts?.domain) parts.push(`Domain=${opts.domain}`)
  if (opts?.sameSite) parts.push(`SameSite=${opts.sameSite}`)
  if (opts?.secure) parts.push('Secure')
  // Explicitly never set HttpOnly — the browser JS client needs access
  return parts.join('; ')
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawCookieHeaders: string[] = []
  const redirectTo = new URL(requestUrl)
  redirectTo.pathname = '/signup'
  redirectTo.search = ''

  console.log('[auth/callback] Starting. code:', code ? code.slice(0, 8) + '...' : 'none')

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookieOptions: {
        name: getSupabaseAuthCookieName(),
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(nextCookies) {
          nextCookies.forEach(cookie => {
            // Build raw Set-Cookie header to avoid Next.js cookie mangling
            const header = serializeCookie(cookie.name, cookie.value, cookie.options as Record<string, unknown>)
            rawCookieHeaders.push(header)
            // Also update the request cookies so subsequent reads work
            request.cookies.set(cookie.name, cookie.value)
          })
        },
      },
    }
  )

  function redirectWithAuthCookies(destination: URL) {
    console.log('[auth/callback] Redirecting to:', destination.toString())
    console.log('[auth/callback] Raw Set-Cookie headers:', rawCookieHeaders.length)
    const response = NextResponse.redirect(destination)
    // Set cookies using raw headers to avoid Next.js adding httpOnly
    rawCookieHeaders.forEach(header => {
      console.log('[auth/callback] Set-Cookie:', header.slice(0, 80) + '...')
      response.headers.append('Set-Cookie', header)
    })
    return response
  }

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.log('[auth/callback] Code exchange error:', error.message)
        const message = error.message.includes('PKCE code verifier not found')
          ? 'Login timed out. Please continue with Google again from this browser tab.'
          : error.message
        redirectTo.searchParams.set('error', message)
        return redirectWithAuthCookies(redirectTo)
      }
      console.log('[auth/callback] Code exchange succeeded')
    } catch (error) {
      console.log('[auth/callback] Code exchange threw:', error instanceof Error ? error.message : error)
      const message = error instanceof Error && error.message.includes('PKCE code verifier not found')
        ? 'Login timed out. Please continue with Google again from this browser tab.'
        : (error instanceof Error ? error.message : 'Could not complete login.')
      redirectTo.searchParams.set('error', message)
      return redirectWithAuthCookies(redirectTo)
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  console.log('[auth/callback] getUser result:', user ? `${user.email} (${user.id.slice(0, 8)}...)` : 'NO USER')

  if (!user) {
    redirectTo.searchParams.set('error', 'Session could not be established after login.')
    return redirectWithAuthCookies(redirectTo)
  }

  try {
    const role = await syncAuthenticatedUser(user)
    console.log('[auth/callback] syncAuthenticatedUser returned role:', role)
    const next = safeNextPath(requestUrl.searchParams.get('next'))
    const destination = new URL(requestUrl)
    destination.pathname = next ?? destinationForRole(role)
    destination.search = ''

    console.log('[auth/callback] Final destination:', destination.pathname)
    return redirectWithAuthCookies(destination)
  } catch (error) {
    console.log('[auth/callback] syncAuthenticatedUser threw:', error instanceof Error ? error.message : error)
    redirectTo.searchParams.set(
      'error',
      error instanceof Error ? error.message : 'Could not sync your account.'
    )
    return redirectWithAuthCookies(redirectTo)
  }
}
