import { useState, useCallback, useEffect, useRef } from 'react'
import { deduplicateRequest, clearPendingRequests } from '@/lib/api/requestDeduplicator'

interface UseApiRequestOptions<T> {
  immediate?: boolean
  cacheKey?: string
  retryOnError?: boolean
  logErrors?: boolean
  fallbackFn?: () => Promise<T>
  dependencies?: any[]
}

interface UseApiRequestResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (customKey?: string) => Promise<T | null>
  refetch: () => Promise<T | null>
  reset: () => void
}

export function useApiRequest<T>(
  requestFn: () => Promise<T>,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestResult<T> {
  const {
    immediate = false,
    cacheKey,
    retryOnError = false,
    logErrors = true,
    fallbackFn,
    dependencies = []
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)

  const execute = useCallback(async (customKey?: string): Promise<T | null> => {
    const currentRequestId = ++requestIdRef.current
    const keyToUse = customKey || cacheKey || `request_${Date.now()}_${Math.random()}`

    setLoading(true)
    setError(null)

    try {
      const result = await deduplicateRequest(
        keyToUse,
        requestFn,
        {
          retryOnError,
          fallbackFn,
          logErrors
        }
      )

      // Only update state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setData(result)
        setLoading(false)
        return result
      }
      return null
    } catch (err) {
      // Only update state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        setError(error)
        setLoading(false)
        
        if (logErrors) {
          console.error(`API request failed for key "${keyToUse}":`, error)
        }
      }
      return null
    }
  }, [requestFn, cacheKey, retryOnError, fallbackFn, logErrors])

  const refetch = useCallback(() => {
    return execute()
  }, [execute])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    requestIdRef.current++
  }, [])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      requestIdRef.current++
    }
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    reset
  }
}

// Hook for multiple related API requests
export function useApiRequests<T extends Record<string, any>>(
  requests: { [K in keyof T]: () => Promise<T[K]> },
  options: Omit<UseApiRequestOptions<any>, 'cacheKey'> & {
    cacheKeys?: { [K in keyof T]?: string }
  } = {}
): {
  data: Partial<T>
  loading: boolean
  errors: Partial<Record<keyof T, Error>>
  execute: (keys?: (keyof T)[]) => Promise<void>
  refetch: () => Promise<void>
  reset: () => void
} {
  const { cacheKeys = {}, ...restOptions } = options
  const [data, setData] = useState<Partial<T>>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof T, Error>>>({})

  const execute = useCallback(async (keys?: (keyof T)[]) => {
    const keysToExecute = keys || (Object.keys(requests) as (keyof T)[])
    setLoading(true)

    const results = await Promise.allSettled(
      keysToExecute.map(async (key) => {
        const cacheKey = (cacheKeys as any)[key] || `${String(key)}_${Date.now()}`
        const result = await deduplicateRequest(
          cacheKey,
          (requests as any)[key],
          {
            retryOnError: restOptions.retryOnError,
            fallbackFn: restOptions.fallbackFn,
            logErrors: restOptions.logErrors
          }
        )
        return { key, result }
      })
    )

    const newData: Partial<T> = { ...data }
    const newErrors: Partial<Record<keyof T, Error>> = { ...errors }

    results.forEach((result, index) => {
      const key = keysToExecute[index]
      if (result.status === 'fulfilled') {
        newData[key] = result.value.result
        delete newErrors[key]
      } else {
        newErrors[key] = result.reason instanceof Error ? result.reason : new Error('Unknown error')
      }
    })

    setData(newData)
    setErrors(newErrors)
    setLoading(false)
  }, [requests, cacheKeys, data, errors, restOptions])

  const refetch = useCallback(() => execute(), [execute])

  const reset = useCallback(() => {
    setData({})
    setErrors({})
    setLoading(false)
  }, [])

  useEffect(() => {
    if (restOptions.immediate) {
      execute()
    }
  }, [restOptions.immediate, execute, ...(restOptions.dependencies || [])])

  return {
    data,
    loading,
    errors,
    execute,
    refetch,
    reset
  }
}

// Utility hook for cache management
export function useRequestCache() {
  const clearCache = useCallback(() => {
    clearPendingRequests()
  }, [])

  return {
    clearCache
  }
}

export default useApiRequest