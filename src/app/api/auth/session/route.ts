import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { idToken } = body

        if (!idToken) {
            return NextResponse.json({ success: false, error: "No ID token provided" }, { status: 400 })
        }

        // Verify the ID token
        const decodedToken = await authService.verifyIdToken(idToken)

        if (!decodedToken || !decodedToken.uid) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
        }

        const uid = decodedToken.uid

        // Check if user is admin
        const isAdmin = await authService.isUserAdmin(uid)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // Create a session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = await authService.createSessionCookie(idToken, expiresIn)

        if (!sessionCookie) {
            return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
        }

        // Create response
        const response = NextResponse.json({ success: true, isAdmin })

        // Get the cookie store
        const cookieStore = await cookies()

        // Set cookie with explicit path
        cookieStore.set({
            name: "session",
            value: sessionCookie,
            maxAge: expiresIn / 1000, // Convert to seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        })

        if (process.env.NODE_ENV !== "production") {
            console.log(`User session created successfully`)
        }

        return response
    } catch (error: any) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Session creation error occurred:", error)
        }
        return NextResponse.json({ success: false, error: error.message || "Authentication failed" }, { status: 401 })
    }
}
