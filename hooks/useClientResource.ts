"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type ClientResourcePriority = "high" | "low"

interface ClientResourceCacheEntry<T> {
  data: T
  updatedAt: number
}

interface ClientResourceLoadOptions {
  force?: boolean
  staleTimeMs?: number
}

interface UseClientResourceOptions<T> {
  key: string
  loader: () => Promise<T>
  initialData?: T | null
  enabled?: boolean
  keepPreviousData?: boolean
  revalidateOnMount?: boolean
  staleTimeMs?: number
  hydrateFromCacheOnly?: boolean
  priority?: ClientResourcePriority
  onError?: (error: unknown) => void
}

interface UseClientResourceResult<T> {
  data: T | null
  loading: boolean
  refreshing: boolean
  revalidate: () => Promise<void>
}

const resourceCache = new Map<string, ClientResourceCacheEntry<unknown>>()
const inflightRequests = new Map<string, Promise<unknown>>()
const CACHE_TTL_MS = 45_000

export function setClientResourceData<T>(key: string, data: T) {
  resourceCache.set(key, {
    data,
    updatedAt: Date.now()
  })
}

export function updateClientResourceData<T>(key: string, updater: (current: T | null) => T | null) {
  const nextData = updater(getCachedValue<T>(key))

  if (nextData === null) {
    resourceCache.delete(key)
    return
  }

  setClientResourceData(key, nextData)
}

function getCachedEntry<T>(key: string, staleTimeMs = CACHE_TTL_MS) {
  const cached = resourceCache.get(key) as ClientResourceCacheEntry<T> | undefined

  if (!cached) {
    return null
  }

  if (Date.now() - cached.updatedAt > staleTimeMs) {
    resourceCache.delete(key)
    return null
  }

  return cached
}

function getCachedValue<T>(key: string, staleTimeMs = CACHE_TTL_MS) {
  return getCachedEntry<T>(key, staleTimeMs)?.data ?? null
}

function getAnyCachedValue<T>(key: string) {
  const cached = resourceCache.get(key) as ClientResourceCacheEntry<T> | undefined
  return cached?.data ?? null
}

async function fetchAndCacheClientResource<T>(
  key: string,
  loader: () => Promise<T>,
  options: ClientResourceLoadOptions = {}
) {
  const { force = false, staleTimeMs = CACHE_TTL_MS } = options

  if (!force) {
    const cached = getCachedEntry<T>(key, staleTimeMs)
    if (cached) {
      return cached.data
    }
  }

  let pendingRequest = inflightRequests.get(key) as Promise<T> | undefined

  if (!pendingRequest) {
    pendingRequest = loader()
    inflightRequests.set(key, pendingRequest)
  }

  try {
    const nextData = await pendingRequest
    resourceCache.set(key, {
      data: nextData,
      updatedAt: Date.now()
    })
    return nextData
  } finally {
    inflightRequests.delete(key)
  }
}

export async function prefetchClientResource<T>(
  key: string,
  loader: () => Promise<T>,
  options: ClientResourceLoadOptions = {}
) {
  return fetchAndCacheClientResource(key, loader, options)
}

export function useClientResource<T>({
  key,
  loader,
  initialData = null,
  enabled = true,
  keepPreviousData = true,
  revalidateOnMount = true,
  staleTimeMs = CACHE_TTL_MS,
  hydrateFromCacheOnly = false,
  priority = "high",
  onError
}: UseClientResourceOptions<T>): UseClientResourceResult<T> {
  const cachedData = useMemo(() => getCachedValue<T>(key, staleTimeMs), [key, staleTimeMs])
  const startingData = initialData ?? cachedData ?? null
  const [data, setData] = useState<T | null>(startingData)
  const [loading, setLoading] = useState(enabled && startingData === null)
  const [refreshing, setRefreshing] = useState(false)
  const dataRef = useRef<T | null>(startingData)
  const loaderRef = useRef(loader)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (initialData === null) {
      return
    }

    resourceCache.set(key, {
      data: initialData,
      updatedAt: Date.now()
    })
    setData(initialData)
    setLoading(false)
  }, [initialData, key])

  const load = useCallback(
    async (force = false) => {
      if (!enabled) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (hydrateFromCacheOnly && !force) {
        const cached = getAnyCachedValue<T>(key)
        setData(cached)
        setLoading(false)
        setRefreshing(false)
        return
      }

      const visibleData = force
        ? dataRef.current
        : initialData ?? getAnyCachedValue<T>(key) ?? dataRef.current

      if (visibleData === null || !keepPreviousData) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        const nextData = await fetchAndCacheClientResource(key, loaderRef.current, {
          force,
          staleTimeMs
        })
        setData(nextData)
      } catch (error) {
        onErrorRef.current?.(error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [enabled, hydrateFromCacheOnly, initialData, keepPreviousData, key, staleTimeMs]
  )

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const hasFreshCache = getCachedEntry<T>(key, staleTimeMs) !== null

    if (!revalidateOnMount && (initialData !== null || hasFreshCache)) {
      setLoading(false)
      return
    }

    if (priority === "low" && (initialData !== null || hasFreshCache)) {
      const scheduleBackgroundRefresh = () => {
        void load()
      }

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(scheduleBackgroundRefresh, {
          timeout: 1_500
        })
        return () => window.cancelIdleCallback(idleId)
      }

      const timeoutId = globalThis.setTimeout(scheduleBackgroundRefresh, 250)
      return () => globalThis.clearTimeout(timeoutId)
    }

    void load()
  }, [enabled, initialData, key, load, priority, revalidateOnMount, staleTimeMs])

  const revalidate = useCallback(async () => {
    await load(true)
  }, [load])

  return {
    data,
    loading,
    refreshing,
    revalidate
  }
}
