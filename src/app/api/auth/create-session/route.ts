import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }

        initializeApp({
            credential: cert(serviceAccount as any),
        })
    } catch (error) {
        console.error("Firebase admin initialization error:", error)
    }
}

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json()

        if (!idToken) {
            return NextResponse.json({ success: false, error: "No ID token provided" }, { status: 400 })
        }

        // Verify the ID token
        const decodedToken = await getAuth().verifyIdToken(idToken)
        const uid = decodedToken.uid

        // Create a session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        // Create response
        const response = NextResponse.json({ success: true })

        // Get the cookie store - UPDATED FOR NEXT.JS 15
        const cookieStore = await cookies()

        // Set cookie with explicit path
        cookieStore.set({
            name: "session",
            value: sessionCookie,
            maxAge: expiresIn / 1000, // Convert to seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        })

        console.log(`Session created for user ${uid}, cookie set with path: /`)

        return response
    } catch (error: any) {
        console.error("Session creation error:", error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
}
