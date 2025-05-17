import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"

export async function POST(): Promise<NextResponse<{ success: boolean }>> {
    try {
        // Get the session cookie - with await to resolve the Promise
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (sessionCookie) {
            try {
                // Verify the session cookie directly with Firebase Admin
                const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie)

                // Revoke all refresh tokens for the user
                await admin.auth.revokeRefreshTokens(decodedClaims.sub)
            } catch (error) {
                console.error("Error during token revocation:", error)
                // Continue with logout even if token revocation fails
            }
        }

        // Create response
        const response = NextResponse.json({ success: true })

        // Clear the session cookie - need to await cookies() here
        const cookieStore2 = await cookies()
        cookieStore2.set({
            name: "session",
            value: "",
            expires: new Date(0),
            path: "/",
        })

        return response
    } catch (error) {
        console.error("Logout process error:", error)
        return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 })
    }
}
