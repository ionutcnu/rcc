import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"
import { validateServerSideSession } from "@/lib/middleware/sessionValidator"

export async function GET() {
    try {
        // Get the session cookie
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ isAdmin: false })
        }

        try {
            // Suveranitate digitală: Verificăm sesiunea server-side personalizată
            const sessionValidation = await validateServerSideSession(sessionCookie)

            if (!sessionValidation.valid) {
                return NextResponse.json({ isAdmin: false })
            }

            return NextResponse.json({ isAdmin: sessionValidation.isAdmin })
        } catch (error) {
            console.error("Session verification error:", error)
            return NextResponse.json({ isAdmin: false })
        }
    } catch (error) {
        console.error("Permission check error:", error)
        return NextResponse.json({ isAdmin: false })
    }
}
