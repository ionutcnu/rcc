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

        // Get the session cookie directly from request.cookies
        const sessionCookie = request.cookies.get("session")?.value

        // If no session cookie exists, redirect to login
        if (!sessionCookie) {
            console.log("No session cookie found, redirecting to login")
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
            loginUrl.searchParams.set("message", "Please sign in to access the admin area")
            return NextResponse.redirect(loginUrl)
        }

        try {
            // Verify the session cookie with Firebase Admin
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
            const loginUrl = new URL("/login", request.url)
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
            loginUrl.searchParams.set("message", "Your session has expired. Please sign in again.")
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
