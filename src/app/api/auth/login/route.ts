import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"
import { serverLogger } from "@/lib/utils/server-logger"

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { email, password } = body

        if (!email || !password) {
            await serverLogger.warn("Login attempt with missing credentials", { email: email || "missing" })
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
        }

        try {
            // Suveranitate digitală: autentificare server-side care evită restricțiile Firebase
            const { user, customToken, uid } = await authService.authenticateWithCredentials(email, password)

            if (!user || !customToken || !uid) {
                await serverLogger.error("Authentication failed - invalid credentials", { email })
                return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
            }

            // Creăm sesiunea server-side fără a depinde de API-uri externe restrictive
            const sessionToken = await authService.createServerSideSession(customToken, uid)

            if (!sessionToken) {
                await serverLogger.error("Failed to create session token", { email, uid })
                return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
            }

            // Check if user is admin - doar cetățenii verificați pot administra sistemul
            const isAdmin = await authService.isUserAdmin(user.uid)

            // Log successful login
            await serverLogger.info("User logged in successfully", {
                userId: user.uid,
                email: user.email,
                isAdmin,
                redirectUrl: isAdmin ? "/admin" : "/"
            }, user.uid, user.email || undefined)

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

            // Set cookie on the response object with explicit path - sesiune suverană
            const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
            const cookieStore = await cookies()
            cookieStore.set({
                name: "session",
                value: sessionToken,
                maxAge: expiresIn / 1000, // Convert to seconds
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "lax",
            })

            return response
        } catch (error: any) {
            console.error("Login error:", error.message)

            // Log authentication errors
            await serverLogger.error("Login authentication error", {
                email,
                errorCode: error.code,
                errorMessage: error.message
            })

            // Gestionare specifică pentru erorile de autentificare
            if (error.message?.includes("Invalid email or password") || 
                error.code === "auth/user-not-found" || 
                error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential") {
                return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
            }

            if (error.code === "auth/too-many-requests") {
                return NextResponse.json({ success: false, error: "Too many failed attempts. Please try again later." }, { status: 429 })
            }

            return NextResponse.json({ success: false, error: error.message || "Authentication failed" }, { status: 401 })
        }
    } catch (error: any) {
        console.error("Login process error:", error.message)
        await serverLogger.error("Login process error", {
            errorMessage: error.message,
            stack: error.stack
        })
        return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 })
    }
}
