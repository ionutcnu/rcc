import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { serverLogger } from "@/lib/utils/server-logger"
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
                    
                    // Log successful logout
                    await serverLogger.info("User logged out successfully", {
                        userId: decodedClaims.uid,
                        email: decodedClaims.email
                    }, decodedClaims.uid, decodedClaims.email)
                }
            } catch (error) {
                console.error("Error during token revocation:", error)
                // Log token revocation error
                await serverLogger.error("Error during token revocation on logout", {
                    errorMessage: error instanceof Error ? error.message : String(error)
                })
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
        await serverLogger.error("Logout process error", {
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 })
    }
}
