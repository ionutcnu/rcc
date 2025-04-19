import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"

export async function POST() {
    try {
        // Get the session cookie - with await to resolve the Promise
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (sessionCookie) {
            try {
                // Verify the session cookie
                const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie)

                // Revoke all refresh tokens for the user
                await admin.auth.revokeRefreshTokens(decodedClaims.sub)
            } catch (error) {
                // If verification fails, just continue to delete the cookie
                if (process.env.NODE_ENV !== "production") {
                    console.error("Session verification error during logout")
                }
            }
        }

        // Create response
        const response = NextResponse.json({ success: true })

        // Clear the session cookie using the cookie store
        cookieStore.set({
            name: "session",
            value: "",
            expires: new Date(0),
            path: "/",
        })

        return response
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Logout process error")
        }
        return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 })
    }
}
