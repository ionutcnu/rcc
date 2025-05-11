/**
 * Creates a proxied URL for Firebase Storage images to avoid CORS issues
 * @param url The original image URL
 * @returns A proxied URL if it's a Firebase Storage URL, otherwise the original URL
 */
export function getProxiedImageUrl(url: string): string {
    if (!url) return `/api/image-proxy?placeholder=true&width=200&height=300`

    // Check if it's a Firebase Storage URL
    if (url.includes("firebasestorage.googleapis.com")) {
        return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }

    // Return the original URL for non-Firebase images
    return url
}

/**
 * Creates a proxied URL for any image
 * @param url The original image URL
 * @returns A proxied URL
 */
export function forceProxyImage(url: string): string {
    if (!url) return `/api/image-proxy?placeholder=true&width=200&height=300`
    return `/api/image-proxy?url=${encodeURIComponent(url)}`
}
