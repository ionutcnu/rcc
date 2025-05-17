import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function GET() {
    try {
        // Get the session cookie - with await to resolve the Promise
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ isAdmin: false })
        }

        try {
            // Verify the session cookie
            const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie, true)

            // Check if user is admin
            const adminStatus = await isUserAdmin(decodedClaims.uid)

            return NextResponse.json({ isAdmin: adminStatus })
        } catch (error) {
            console.error("Session verification error")
            return NextResponse.json({ isAdmin: false })
        }
    } catch (error) {
        console.error("Permission check error")
        return NextResponse.json({ isAdmin: false })
    }
}
