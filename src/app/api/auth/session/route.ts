import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json()

        if (!idToken) {
            return NextResponse.json({ success: false, error: "No ID token provided" }, { status: 400 })
        }

        // Verify the ID token
        const decodedToken = await admin.auth.verifyIdToken(idToken)
        const uid = decodedToken.uid

        // Check if user is admin
        const isAdmin = await isUserAdmin(uid)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // Create a session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = await admin.auth.createSessionCookie(idToken, { expiresIn })

        // Create response
        const response = NextResponse.json({ success: true, isAdmin })

        // Get the cookie store - UPDATED FOR NEXT.JS 15
        const cookieStore = await cookies()

        // Set cookie with explicit path
        cookieStore.set("session", sessionCookie, {
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
            console.error("Session creation error occurred")
        }
        return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }
}
