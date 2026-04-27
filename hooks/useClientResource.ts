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
  onError?: (error: unknown) => void
}

interface UseClientResourceResult<T> {
  data: T | null
  loading: boolean
  refreshing: boolean
  revalidate: () => Promise<void>
}

const resourceCache = new Map<string, ClientResourceCacheEntry<unknown>>()
const CACHE_TTL_MS = 45_000

function getCachedValue<T>(key: string) {
  const cached = resourceCache.get(key) as ClientResourceCacheEntry<T> | undefined

  if (!cached) {
    return null
  }

  if (Date.now() - cached.updatedAt > CACHE_TTL_MS) {
    resourceCache.delete(key)
    return null
  }

  return cached.data
}

export function useClientResource<T>({
  key,
  loader,
  initialData = null,
  enabled = true,
  keepPreviousData = true,
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
        const nextData = await loaderRef.current()
        resourceCache.set(key, {
          data: nextData,
          updatedAt: Date.now()
        })
        setData(nextData)
      } catch (error) {
        onErrorRef.current?.(error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [enabled, initialData, keepPreviousData, key]
  )

  useEffect(() => {
    void load()
  }, [load])

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
