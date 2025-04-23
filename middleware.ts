import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { admin } from "@/lib/firebase/admin"

export async function middleware(request: NextRequest) {
    // Check if the request is for a PDF file in the Documents directory
    if (request.nextUrl.pathname.startsWith("/Documents/") && request.nextUrl.pathname.endsWith(".pdf")) {
        // Clone the response
        const response = NextResponse.next()

        // Add headers to allow the PDF to be embedded in an iframe
        response.headers.set("X-Frame-Options", "SAMEORIGIN")
        response.headers.set("Content-Security-Policy", "default-src 'self'; frame-ancestors 'self'")
        response.headers.set("Content-Disposition", "inline")

        return response
    }

    // Only run admin middleware for admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        // Get the session cookie
        const sessionCookie = request.cookies.get("session")?.value

        // If no session cookie exists, redirect to login
        if (!sessionCookie) {
            const url = new URL("/login", request.url)
            url.searchParams.set("redirect", request.nextUrl.pathname)
            return NextResponse.redirect(url)
        }

        try {
            // Verify the session cookie
            const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie, true)

            // Check if user has admin claim
            const isAdmin = decodedClaims.admin === true

            if (!isAdmin) {
                // If not admin, redirect to unauthorized page
                return NextResponse.redirect(new URL("/unauthorized", request.url))
            }

            // If verification succeeds and user is admin, allow access
            return NextResponse.next()
        } catch (error) {
            if (process.env.NODE_ENV !== "production") {
                console.error("Access verification failed")
            }
            // If verification fails, redirect to login
            const url = new URL("/login", request.url)
            url.searchParams.set("redirect", request.nextUrl.pathname)
            url.searchParams.set("message", "Your session has expired. Please sign in again.")
            return NextResponse.redirect(url)
        }
    }

    // For non-admin routes, continue normally
    return NextResponse.next()
}

// Make sure to catch both admin routes and PDF files
export const config = {
    matcher: ["/admin", "/admin/:path*", "/Documents/:path*"],
}
