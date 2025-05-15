// Enhanced request deduplicator to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()
const DEBUG = process.env.DEBUG === "true"

export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  options?: {
    retryOnError?: boolean
    fallbackFn?: () => Promise<T>
    logErrors?: boolean
  },
): Promise<T> {
  const { retryOnError = false, fallbackFn, logErrors = true } = options || {}

  // If there's already a pending request with this key, return it
  if (pendingRequests.has(key)) {
    if (DEBUG) console.log(`[Deduplicator] Using pending request for ${key}`)
    return pendingRequests.get(key) as Promise<T>
  }

  // Otherwise, create a new request and store it
  if (DEBUG) console.log(`[Deduplicator] Creating new request for ${key}`)

  const promise = requestFn()
    .catch(async (error) => {
      if (logErrors) {
        console.error(`[Deduplicator] Error in request ${key}:`, error)
      }

      // If we should retry on error and have a fallback function, use it
      if (retryOnError && fallbackFn) {
        if (DEBUG) console.log(`[Deduplicator] Retrying request ${key} with fallback`)
        return fallbackFn()
      }

      // Otherwise, rethrow the error
      throw error
    })
    .finally(() => {
      // Remove the request from the map when it completes (success or failure)
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, promise)
  return promise
}

// Add a function to clear all pending requests (useful for testing)
export function clearPendingRequests() {
  pendingRequests.clear()
}

// Add a function to get the number of pending requests (useful for debugging)
export function getPendingRequestCount() {
  return pendingRequests.size
}
