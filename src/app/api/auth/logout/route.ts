import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }

    initializeApp({
        credential: cert(serviceAccount as any),
    })
}

export async function POST() {
    try {
        // Get the cookies store with await
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (sessionCookie) {
            try {
                // Verify the session cookie
                const decodedClaims = await getAuth().verifySessionCookie(sessionCookie)

                // Revoke all refresh tokens for the user
                await getAuth().revokeRefreshTokens(decodedClaims.sub)
            } catch (error) {
                // If verification fails, just continue with cookie deletion
            }
        }

        // Delete the cookie - using set with expired date
        cookieStore.set({
            name: "session",
            value: "",
            expires: new Date(0),
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
