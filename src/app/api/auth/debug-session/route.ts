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
        // Get all cookies - with await to resolve the Promise
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        const sessionCookie = cookieStore.get("session")?.value

        // Basic cookie info - only include name and value which are guaranteed to exist
        const cookieInfo = {
            allCookies: allCookies.map((c) => ({
                name: c.name,
                value: c.name === "session" ? "***" : c.value.substring(0, 5) + "...",
                // Remove all properties that don't exist on RequestCookie in Next.js 15
            })),
            hasSessionCookie: !!sessionCookie,
            sessionCookieLength: sessionCookie ? sessionCookie.length : 0,
        }

        // If we have a session cookie, try to verify it
        let sessionInfo = null
        if (sessionCookie) {
            try {
                const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
                const uid = decodedClaims.uid
                const userRecord = await getAuth().getUser(uid)

                sessionInfo = {
                    valid: true,
                    uid: uid,
                    email: userRecord.email,
                    isAdmin: userRecord.customClaims?.admin === true,
                    expiresAt: new Date(decodedClaims.exp * 1000).toISOString(),
                    claims: decodedClaims,
                }
            } catch (error: any) {
                sessionInfo = {
                    valid: false,
                    error: error.message,
                    errorCode: error.code,
                }
            }
        }

        return NextResponse.json({
            cookies: cookieInfo,
            session: sessionInfo,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                stack: error.stack,
            },
            { status: 500 },
        )
    }
}
