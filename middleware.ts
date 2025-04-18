import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }

        initializeApp({
            credential: cert(serviceAccount as any),
        })
    } catch (error) {
        console.error("Firebase admin initialization error:", error)
    }
}

// Function to check if a user is an admin
async function isUserAdmin(uid: string): Promise<boolean> {
    try {
        // Method 1: Check custom claims
        const auth = getAuth()
        const { customClaims } = await auth.getUser(uid)

        if (customClaims?.admin === true) {
            return true
        }

        return false
    } catch (error) {
        console.error("Error checking admin status:", error)
        return false
    }
}

export async function middleware(request: NextRequest) {
    // Only run this middleware for admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
        console.log("Admin route accessed:", request.nextUrl.pathname)

        // Check if we're in a redirect loop by looking for a special query parameter
        const redirectCount = Number.parseInt(request.nextUrl.searchParams.get("redirectCount") || "0")
        if (redirectCount > 2) {
            console.error("Detected redirect loop! Allowing access to prevent infinite loop.")
            return NextResponse.next()
        }

        // Get the session cookie directly from request.cookies
        const sessionCookie = request.cookies.get("session")?.value

        // Add more detailed logging
        console.log("Session cookie exists:", !!sessionCookie)
        console.log("Session cookie length:", sessionCookie?.length || 0)

        // If no session cookie exists, redirect to login
        if (!sessionCookie) {
            console.log("No session cookie found, redirecting to login")
            // Use absolute URL construction to ensure proper redirects in production
            const baseUrl = new URL(request.url).origin
            const loginUrl = new URL("/login", baseUrl)
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
            loginUrl.searchParams.set("message", "Please sign in to access the admin area")
            console.log("Redirecting to login URL:", loginUrl.toString())
            return NextResponse.redirect(loginUrl)
        }

        try {
            // Verify the session cookie with Firebase Admin
            console.log("Verifying session cookie...")
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
            const uid = decodedClaims.uid

            console.log(`Session cookie verified for user ${uid}`)

            // Check if the user has admin privileges
            const isAdmin = await isUserAdmin(uid)
            console.log(`User ${uid} is admin: ${isAdmin}`)

            if (!isAdmin) {
                console.log(`User ${uid} is not an admin, redirecting to unauthorized page`)
                return NextResponse.redirect(new URL("/unauthorized", request.url))
            }

            console.log(`User ${uid} is admin, allowing access to ${request.nextUrl.pathname}`)
            // If verification succeeds and user is admin, allow access
            return NextResponse.next()
        } catch (error) {
            console.error("Invalid session cookie:", error)
            // If verification fails (invalid or expired token), redirect to login
            const baseUrl = new URL(request.url).origin
            const loginUrl = new URL("/login", baseUrl)
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
            loginUrl.searchParams.set("message", "Your session has expired. Please sign in again.")

            // Add redirect count to detect loops
            loginUrl.searchParams.set("redirectCount", (redirectCount + 1).toString())

            console.log("Session invalid, redirecting to:", loginUrl.toString())
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
