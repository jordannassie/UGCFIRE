import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAuthCookieName, getSupabasePublishableKey, getSupabaseUrl } from './env'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookieOptions: {
          name: getSupabaseAuthCookieName(),
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
        auth: {
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
        isSingleton: true,
      }
    )
  }

  return browserClient
}
