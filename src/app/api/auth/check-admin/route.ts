import { NextResponse } from "next/server"
import { cookies } from "next/headers"
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

export async function GET() {
    try {
        // Get the session cookie - FIXED: Added await before cookies()
        const sessionCookie = (await cookies()).get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ isAdmin: false, error: "No session" }, { status: 401 })
        }

        // Verify the session cookie
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
        const uid = decodedClaims.uid

        // Get user details
        const userRecord = await getAuth().getUser(uid)
        const customClaims = userRecord.customClaims || {}
        const isAdmin = customClaims?.admin === true

        return NextResponse.json({ isAdmin })
    } catch (error: any) {
        console.error("Error checking admin status:", error)
        return NextResponse.json({ isAdmin: false, error: error.message }, { status: 401 })
    }
}
