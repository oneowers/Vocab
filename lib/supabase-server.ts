import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

import { hasSupabaseEnv } from "@/lib/config"

function normalizeCookieOptions(options: CookieOptions) {
  return {
    domain: options.domain,
    httpOnly: options.httpOnly,
    maxAge: options.maxAge,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure
  }
}

export function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    return null
  }

  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, normalizeCookieOptions(options))
          } catch {
            // Server Components can read cookies but may not be able to mutate them.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, "", {
              ...normalizeCookieOptions(options),
              maxAge: 0
            })
          } catch {
            // Ignore cookie mutation failures in read-only contexts.
          }
        }
      }
    }
  )
}
