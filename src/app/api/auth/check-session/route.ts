import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function GET() {
    try {
        // Get the session cookie
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ authenticated: false })
        }

        try {
            // Verify the session cookie
            const decodedClaims = await authService.verifySessionToken(sessionCookie)

            if (!decodedClaims || !decodedClaims.uid) {
                return NextResponse.json({ authenticated: false })
            }

            // Get user details
            const user = await authService.getUserById(decodedClaims.uid)
            const isAdmin = await authService.isUserAdmin(decodedClaims.uid)

            return NextResponse.json({
                authenticated: true,
                user: {
                    uid: decodedClaims.uid,
                    email: user?.email || decodedClaims.email || "",
                    displayName: user?.displayName || "",
                    isAdmin,
                },
            })
        } catch (error) {
            console.error("Session verification error:", error)
            return NextResponse.json({ authenticated: false })
        }
    } catch (error) {
        console.error("Session check error:", error)
        return NextResponse.json({ authenticated: false })
    }
}
