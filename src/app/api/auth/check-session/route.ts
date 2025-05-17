import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"

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
            const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie, true)

            // Get user details
            const userRecord = await admin.auth.getUser(decodedClaims.uid)

            return NextResponse.json({
                authenticated: true,
                user: {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName || null,
                    photoURL: userRecord.photoURL || null,
                    isAdmin: decodedClaims.admin === true || userRecord.customClaims?.admin === true,
                },
            })
        } catch (error) {
            console.error("Error verifying session:", error)

            // Clear the invalid session cookie - with await
            const cookieStore = await cookies()
            cookieStore.set({
                name: "session",
                value: "",
                expires: new Date(0),
                path: "/",
            })

            return NextResponse.json({ authenticated: false })
        }
    } catch (error) {
        console.error("Error checking session:", error)
        return NextResponse.json({ authenticated: false })
    }
}
