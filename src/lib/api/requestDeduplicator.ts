// Simple request deduplicator to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

export function deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // If there's already a pending request with this key, return it
  if (pendingRequests.has(key)) {
    console.log(`Using pending request for ${key}`)
    return pendingRequests.get(key) as Promise<T>
  }

  // Otherwise, create a new request and store it
  console.log(`Creating new request for ${key}`)
  const promise = requestFn().finally(() => {
    // Remove the request from the map when it completes (success or failure)
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}
