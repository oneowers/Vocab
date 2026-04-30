import { unstable_cache } from "next/cache"

export const USER_DATA_REVALIDATE_SECONDS = 60
export const ADMIN_DATA_REVALIDATE_SECONDS = 45

export const userCacheTag = {
  cards: (userId: string) => `cards:${userId}`,
  grammar: (userId: string) => `grammar:${userId}`,
  stats: (userId: string) => `stats:${userId}`,
  profile: (userId: string) => `profile:${userId}`,
  review: (userId: string) => `review:${userId}`
}

export const adminCacheTag = {
  analytics: "admin:analytics",
  catalog: "admin:catalog",
  grammarTopics: "admin:grammar-topics"
}

export const sharedCacheTag = {
  appSettings: "app-settings"
}

export function cacheUserResource<T>(
  keyParts: string[],
  tags: string[],
  loader: () => Promise<T>,
  revalidate = USER_DATA_REVALIDATE_SECONDS
) {
  return unstable_cache(loader, keyParts, {
    tags,
    revalidate
  })()
}

export function cacheAdminResource<T>(
  keyParts: string[],
  tags: string[],
  loader: () => Promise<T>,
  revalidate = ADMIN_DATA_REVALIDATE_SECONDS
) {
  return unstable_cache(loader, keyParts, {
    tags,
    revalidate
  })()
}
