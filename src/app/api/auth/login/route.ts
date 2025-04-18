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

        if (!idToken) {
            return NextResponse.json({ success: false, error: "No ID token provided" }, { status: 400 })
        }

        // Verify the ID token
        const decodedToken = await getAuth().verifyIdToken(idToken)
        const uid = decodedToken.uid

        // Create a session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        // Get user details to check admin status
        const userRecord = await getAuth().getUser(uid)
        const customClaims = userRecord.customClaims || {}
        const isAdmin = customClaims?.admin === true

        // Create response with the cookie and include redirect information
        const response = NextResponse.json({
            success: true,
            isAdmin: isAdmin,
            redirectUrl: isAdmin ? "/admin" : "/",
        })

        // Set cookie on the response object with explicit path
        // In Next.js 15, use the set method with an options object
        response.cookies.set({
            name: "session",
            value: sessionCookie,
            maxAge: expiresIn / 1000, // Convert to seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        })

        console.log(`User ${uid} login successful, admin: ${isAdmin}, cookie set with path: /`)

        return response
    } catch (error: any) {
        console.error("Login error:", error.message)
        return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }
}
