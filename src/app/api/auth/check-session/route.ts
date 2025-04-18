import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAuth } from "firebase-admin/auth"

export async function GET() {
    try {
        // Get the session cookie - with await to resolve the Promise
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ authenticated: false })
        }

        try {
            // Verify the session cookie
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)

            // Get user details
            const userRecord = await getAuth().getUser(decodedClaims.uid)

            return NextResponse.json({
                authenticated: true,
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    isAdmin: decodedClaims.admin === true || userRecord.customClaims?.admin === true,
                },
            })
        } catch (error) {
            console.error("Error verifying session:", error)
            return NextResponse.json({ authenticated: false })
        }
    } catch (error) {
        console.error("Error checking session:", error)
        return NextResponse.json({ authenticated: false })
    }
}
