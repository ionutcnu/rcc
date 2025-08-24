/**
 * Security utility functions for production environments
 */

/**
 * Safely logs errors in development but not in production
 * @param message Error message
 * @param error Error object
 */
export function safeErrorLog(message: string, error?: any): void {
    if (process.env.NODE_ENV !== "production") {
        console.error(message, error)
    }
}

/**
 * Creates a generic error message for users
 * @param errorCode Internal error code
 * @returns User-friendly error message
 */
export function getUserFriendlyError(errorCode: string): string {
    // Map internal error codes to user-friendly messages
    const errorMap: Record<string, string> = {
        "auth/user-disabled": "This account has been disabled. Please contact support.",
        "auth/invalid-email": "Invalid email or password. Please try again.",
        "auth/user-not-found": "Invalid email or password. Please try again.",
        "auth/wrong-password": "Invalid email or password. Please try again.",
        "auth/too-many-requests": "Too many unsuccessful login attempts. Please try again later.",
        "auth/network-request-failed": "Network error. Please check your connection and try again.",
        "auth/invalid-credential": "Authentication failed. Please try again.",
        "auth/session-expired": "Your session has expired. Please sign in again.",
        "permission/insufficient": "You don't have permission to access this resource.",
        "server/unavailable": "The server is currently unavailable. Please try again later.",
    }

    return errorMap[errorCode] || "An unexpected error occurred. Please try again later."
}

/**
 * Strips sensitive information from error objects
 * @param error Original error
 * @returns Sanitized error
 */
export function sanitizeError(error: any): { message: string; code?: string } {
    if (!error) return { message: "Unknown error" }

    // Extract only safe properties
    return {
        message: getUserFriendlyError(error.code || "unknown"),
        code: error.code ? error.code.replace(/^auth\//, "error/") : "error/unknown",
    }
}

/**
 * Validates and sanitizes URLs for use in HTML attributes
 * Prevents XSS attacks through malicious URL schemes including javascript:, vbscript:, etc.
 * Addresses CodeQL "Incomplete URL scheme check" vulnerability
 * @param url The URL to validate
 * @param allowedProtocols Array of allowed protocols (default: ['http:', 'https:', 'blob:', 'data:'])
 * @returns Sanitized URL or safe fallback
 */
export function sanitizeUrl(url: string | null | undefined, allowedProtocols: string[] = ['http:', 'https:', 'blob:', 'data:']): string {
    if (!url || typeof url !== 'string') {
        return '/placeholder.svg'
    }

    // Remove any leading/trailing whitespace
    const trimmedUrl = url.trim()
    
    if (!trimmedUrl) {
        return '/placeholder.svg'
    }

    try {
        // Handle relative URLs (safe by default)
        if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
            // Additional validation for path injection
            if (trimmedUrl.includes('..') && !trimmedUrl.startsWith('../')) {
                return '/placeholder.svg'
            }
            return trimmedUrl
        }

        // Parse absolute URLs
        const parsedUrl = new URL(trimmedUrl)
        
        // Check if protocol is allowed
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            safeErrorLog(`Blocked unsafe URL protocol: ${parsedUrl.protocol}`)
            return '/placeholder.svg'
        }

        // Additional validation for blob URLs to ensure they're from same origin
        if (parsedUrl.protocol === 'blob:') {
            if (typeof window !== 'undefined' && parsedUrl.origin !== window.location.origin) {
                safeErrorLog(`Blocked cross-origin blob URL: ${trimmedUrl}`)
                return '/placeholder.svg'
            }
        }

        // Block dangerous URL schemes that can execute code or cause security issues
        const dangerousSchemes = [
            'javascript:',  // JavaScript execution
            'vbscript:',    // VBScript execution (Internet Explorer)
            'livescript:',  // LiveScript execution
            'mocha:',       // Mocha URLs
            'about:',       // Browser internal pages
            'file:',        // Local file system access
            'chrome:',      // Chrome internal pages
            'chrome-extension:', // Chrome extension URLs
            'moz-extension:', // Firefox extension URLs
            'safari-extension:', // Safari extension URLs
            'ms-appx:',     // Windows app package URLs
            'ms-appx-web:', // Windows app web context URLs
            'view-source:', // View source URLs
            'jar:',         // Java Archive URLs
            'mailto:',      // Email links (not suitable for src attributes)
            'tel:',         // Telephone links (not suitable for src attributes)
            'sms:',         // SMS links (not suitable for src attributes)
        ]
        
        if (dangerousSchemes.includes(parsedUrl.protocol.toLowerCase())) {
            safeErrorLog(`Blocked dangerous URL scheme: ${parsedUrl.protocol} in URL: ${trimmedUrl}`)
            return '/placeholder.svg'
        }

        // Special handling for data: URLs - only allow if they're in the allowed protocols
        // and if they appear to be safe media types
        if (parsedUrl.protocol === 'data:' && allowedProtocols.includes('data:')) {
            // Basic validation for data URLs to ensure they're media types
            const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i
            if (!dataUrlPattern.test(trimmedUrl)) {
                safeErrorLog(`Blocked suspicious data: URL: ${trimmedUrl.substring(0, 50)}...`)
                return '/placeholder.svg'
            }
        }

        // Return the validated URL (React handles HTML encoding automatically)
        return trimmedUrl
        
    } catch (error) {
        safeErrorLog(`Invalid URL format: ${trimmedUrl}`, error)
        return '/placeholder.svg'
    }
}

/**
 * Encodes a string for safe use in HTML attributes
 * Prevents HTML injection through attribute values
 * Note: React automatically handles HTML encoding for JSX attributes,
 * but this function is useful for server-side rendering or raw HTML generation
 * @param value The string to encode
 * @returns HTML-safe encoded string
 */
export function encodeHtmlAttribute(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

/**
 * Sanitizes URLs specifically for media elements (img, video, audio)
 * More restrictive than general URL sanitization
 * @param url The media URL to validate
 * @returns Sanitized URL or safe fallback
 */
export function sanitizeMediaUrl(url: string | null | undefined): string {
    return sanitizeUrl(url, ['http:', 'https:', 'blob:'])
}

/**
 * Validates that a file is a safe media type
 * Provides additional security by checking file types at the source
 * @param file The file to validate
 * @returns true if file is a safe media type, false otherwise
 */
export function validateMediaFile(file: File): boolean {
    // Check file type
    const allowedImageTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml'
    ]
    
    const allowedVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
        'video/quicktime'
    ]
    
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
        safeErrorLog(`Blocked file with invalid MIME type: ${file.type}`)
        return false
    }
    
    // Check file extension as additional validation
    const fileName = file.name.toLowerCase()
    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
        '.mp4', '.webm', '.ogg', '.avi', '.mov'
    ]
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
        safeErrorLog(`Blocked file with invalid extension: ${fileName}`)
        return false
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
        safeErrorLog(`Blocked file exceeding size limit: ${file.size} bytes`)
        return false
    }
    
    return true
}
