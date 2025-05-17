import { NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
        }

        try {
            // Create user with email and password
            const userRecord = await admin.auth.getUserByEmail(email)

            // Sign in with Firebase Admin SDK
            const userCredential = await admin.auth.createCustomToken(userRecord.uid)

            // Get the user's ID token
            const idToken = userCredential

            // Create a session cookie
            const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
            const sessionCookie = await admin.auth.createSessionCookie(idToken, { expiresIn })

            // Get user details to check admin status
            const customClaims = userRecord.customClaims || {}
            const isAdmin = customClaims?.admin === true

            // Create response with the cookie and include redirect information
            const response = NextResponse.json({
                success: true,
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    isAdmin: isAdmin,
                },
                redirectUrl: isAdmin ? "/admin" : "/",
            })

            // Set cookie on the response object with explicit path
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
            console.error("Login error:", error.message)

            // Check for specific Firebase auth errors
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
            }

            return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
        }
    } catch (error: any) {
        console.error("Login process error:", error.message)
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
    }
}
