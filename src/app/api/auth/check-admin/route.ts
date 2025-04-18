import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function GET() {
    try {
        // Get the cookies store - with await
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ isAdmin: false })
        }

        try {
            // Verify the session cookie
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)

            // Check if user is admin
            const admin = await isUserAdmin(decodedClaims.uid)

            return NextResponse.json({ isAdmin: admin })
        } catch (error) {
            return NextResponse.json({ isAdmin: false })
        }
    } catch (error) {
        return NextResponse.json({ isAdmin: false })
    }
}
