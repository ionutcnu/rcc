/**
 * Creates a proxied URL for Firebase Storage images to avoid CORS issues
 * @param url The original image URL
 * @param options Optional optimization parameters
 * @returns A proxied URL if it's a Firebase Storage URL, otherwise the original URL
 */
export function getProxiedImageUrl(url: string, options?: { width?: number; height?: number; quality?: number }): string {
    if (!url) return `/api/image-proxy?placeholder=true&width=200&height=300`

    // Check if it's a Firebase Storage URL
    let isFirebaseStorageUrl = false
    try {
        const parsedUrl = new URL(url)
        isFirebaseStorageUrl = parsedUrl.hostname === "firebasestorage.googleapis.com"
    } catch {
        // Invalid URL, return original URL
        return url
    }
    
    if (isFirebaseStorageUrl) {
        if (options) {
            const params = new URLSearchParams({
                url: url,
                ...(options.width && { w: options.width.toString() }),
                ...(options.height && { h: options.height.toString() }),
                ...(options.quality && { q: options.quality.toString() })
            })
            return `/api/image-optimize?${params.toString()}`
        }
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

/**
 * Creates an optimized image URL with specified dimensions and quality
 * @param url The original image URL
 * @param width Target width
 * @param height Target height
 * @param quality Image quality (1-100)
 * @returns An optimized image URL
 */
export function getOptimizedImageUrl(url: string, width?: number, height?: number, quality?: number): string {
    if (!url) return `/api/image-proxy?placeholder=true&width=${width || 200}&height=${height || 300}`
    
    const params = new URLSearchParams({
        url: url,
        ...(width && { w: width.toString() }),
        ...(height && { h: height.toString() }),
        ...(quality && { q: quality.toString() })
    })
    
    return `/api/image-optimize?${params.toString()}`
}

/**
 * Gets responsive image sizes for different breakpoints
 * @param url The original image URL
 * @param quality Image quality (1-100)
 * @returns Object with different image sizes
 */
export function getResponsiveImageUrls(url: string, quality = 75) {
    return {
        mobile: getOptimizedImageUrl(url, 400, 300, quality),
        tablet: getOptimizedImageUrl(url, 800, 600, quality),
        desktop: getOptimizedImageUrl(url, 1200, 900, quality),
        hero: getOptimizedImageUrl(url, 1920, 1080, quality)
    }
}
