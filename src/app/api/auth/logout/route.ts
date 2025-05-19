import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function POST(): Promise<NextResponse<{ success: boolean }>> {
    try {
        // Get the session cookie
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (sessionCookie) {
            try {
                // Verify the session cookie
                const decodedClaims = await authService.verifySessionToken(sessionCookie)

                if (decodedClaims && decodedClaims.uid) {
                    // Revoke all refresh tokens for the user
                    await authService.revokeUserTokens(decodedClaims.uid)
                }
            } catch (error) {
                console.error("Error during token revocation:", error)
                // Continue with logout even if token revocation fails
            }
        }

        // Create response
        const response = NextResponse.json({ success: true })

        // Clear the session cookie
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
