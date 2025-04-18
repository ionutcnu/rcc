import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    try {
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
            ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
            : undefined

        const serviceAccount = {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
        }

        initializeApp({
            credential: cert(serviceAccount as any),
        })
    } catch (error) {
        console.error("Firebase admin initialization error in middleware:", error)
    }
}

export async function middleware(request: NextRequest) {
    // Only run this middleware for admin routes
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
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)

            // Check if user has admin claim
            const isAdmin = decodedClaims.admin === true

            if (!isAdmin) {
                // If not admin, redirect to unauthorized page
                return NextResponse.redirect(new URL("/unauthorized", request.url))
            }

            // If verification succeeds and user is admin, allow access
            return NextResponse.next()
        } catch (error) {
            console.error("Session verification failed:", error)
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

// Make sure to catch ALL admin routes
export const config = {
    matcher: ["/admin", "/admin/:path*"],
}
