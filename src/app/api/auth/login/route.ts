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

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json()

        // Set session expiration to 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000

        // Create the session cookie
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        // Await the cookies function
        const cookieStore = await cookies()

        // Set the cookie
        cookieStore.set({
            name: "session",
            value: sessionCookie,
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error creating session:", error)
        return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
    }
}
