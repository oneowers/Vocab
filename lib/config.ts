export function isLocalDevelopment() {
  return process.env.NODE_ENV === "development"
}

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function hasDatabaseEnv() {
  return Boolean(process.env.DATABASE_URL)
}

export function getTooltipMessage() {
  return "Technical maintenance — saving is temporarily unavailable"
}
