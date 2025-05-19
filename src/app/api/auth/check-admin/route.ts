import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function GET() {
    try {
        // Get the session cookie
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ isAdmin: false })
        }

        try {
            // Verify the session cookie
            const decodedClaims = await authService.verifySessionToken(sessionCookie)

            if (!decodedClaims || !decodedClaims.uid) {
                return NextResponse.json({ isAdmin: false })
            }

            // Check if user is admin
            const isAdmin = await authService.isUserAdmin(decodedClaims.uid)

            return NextResponse.json({ isAdmin })
        } catch (error) {
            console.error("Session verification error:", error)
            return NextResponse.json({ isAdmin: false })
        }
    } catch (error) {
        console.error("Permission check error:", error)
        return NextResponse.json({ isAdmin: false })
    }
}
