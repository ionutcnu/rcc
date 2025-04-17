import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }

    initializeApp({
        credential: cert(serviceAccount as any),
    })
}

export async function middleware(request: NextRequest) {
    // Only run this middleware for admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        // Get the session cookie directly from request.cookies
        const sessionCookie = request.cookies.get("session")?.value

        // If no session cookie exists, redirect to login
        if (!sessionCookie) {
            console.log("No session cookie found, redirecting to login")
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl)
        }

        try {
            // Verify the session cookie with Firebase Admin
            // The second parameter (true) checks if the session was revoked
            await getAuth().verifySessionCookie(sessionCookie, true)

            // If verification succeeds, allow access
            return NextResponse.next()
        } catch (error) {
            console.error("Invalid session cookie:", error)
            // If verification fails (invalid or expired token), redirect to login
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // For non-admin routes, continue normally
    return NextResponse.next()
}

// Make sure to catch ALL admin routes
export const config = {
    matcher: ["/admin", "/admin/:path*"],
}
