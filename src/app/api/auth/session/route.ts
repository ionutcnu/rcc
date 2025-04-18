import { NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json()

        if (!idToken) {
            return NextResponse.json({ success: false, error: "No ID token provided" }, { status: 400 })
        }

        // Verify the ID token
        const decodedToken = await getAuth().verifyIdToken(idToken)
        const uid = decodedToken.uid

        // Check if user is admin
        const isAdmin = await isUserAdmin(uid)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // Create a session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        // Create response
        const response = NextResponse.json({ success: true, isAdmin })

        // Set cookie with explicit path
        response.cookies.set({
            name: "session",
            value: sessionCookie,
            maxAge: expiresIn / 1000, // Convert to seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        })

        return response
    } catch (error: any) {
        console.error("Session creation error:", error.message)
        return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }
}
