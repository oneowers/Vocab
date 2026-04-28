"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface ClientResourceCacheEntry<T> {
  data: T
  updatedAt: number
}

interface UseClientResourceOptions<T> {
  key: string
  loader: () => Promise<T>
  initialData?: T | null
  enabled?: boolean
  keepPreviousData?: boolean
  revalidateOnMount?: boolean
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

function getCachedEntry<T>(key: string) {
  const cached = resourceCache.get(key) as ClientResourceCacheEntry<T> | undefined

  if (!cached) {
    return null
  }

  if (Date.now() - cached.updatedAt > CACHE_TTL_MS) {
    resourceCache.delete(key)
    return null
  }

  return cached
}

function getCachedValue<T>(key: string) {
  return getCachedEntry<T>(key)?.data ?? null
}

export function useClientResource<T>({
  key,
  loader,
  initialData = null,
  enabled = true,
  keepPreviousData = true,
  revalidateOnMount = true,
  onError
}: UseClientResourceOptions<T>): UseClientResourceResult<T> {
  const cachedData = useMemo(() => getCachedValue<T>(key), [key])
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

      const visibleData = force ? dataRef.current : initialData ?? getCachedValue<T>(key) ?? dataRef.current

      if (visibleData === null || !keepPreviousData) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        let pendingRequest = inflightRequests.get(key) as Promise<T> | undefined

        if (!pendingRequest) {
          pendingRequest = loaderRef.current()
          inflightRequests.set(key, pendingRequest)
        }

        const nextData = await pendingRequest
        resourceCache.set(key, {
          data: nextData,
          updatedAt: Date.now()
        })
        setData(nextData)
      } catch (error) {
        onErrorRef.current?.(error)
      } finally {
        inflightRequests.delete(key)
        setLoading(false)
        setRefreshing(false)
      }
    },
    [enabled, initialData, keepPreviousData, key]
  )

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    const hasFreshCache = getCachedEntry<T>(key) !== null

    if (!revalidateOnMount && (initialData !== null || hasFreshCache)) {
      setLoading(false)
      return
    }

    void load()
  }, [enabled, initialData, key, load, revalidateOnMount])

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
