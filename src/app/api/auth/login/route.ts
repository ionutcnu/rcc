import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
        }

        try {
            // Authenticate user with email and password
            const { user, token } = await authService.signInWithEmailAndPassword(email, password)

            if (!user || !token) {
                return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
            }

            // Create a session cookie
            const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
            const sessionCookie = await authService.createSessionCookie(token, expiresIn)

            if (!sessionCookie) {
                return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
            }

            // Check if user is admin
            const isAdmin = await authService.isUserAdmin(user.uid)

            // Create response with the cookie and include redirect information
            const response = NextResponse.json({
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || "",
                    isAdmin: isAdmin,
                },
                redirectUrl: isAdmin ? "/admin" : "/",
            })

            // Set cookie on the response object with explicit path
            const cookieStore = await cookies()
            cookieStore.set({
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
            console.error("Login error:", error.message)

            // Check for specific Firebase auth errors
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
            }

            return NextResponse.json({ success: false, error: error.message || "Authentication failed" }, { status: 401 })
        }
    } catch (error: any) {
        console.error("Login process error:", error.message)
        return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 })
    }
}
