"use server"

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

// Create session cookie
export async function createSessionCookie(idToken: string) {
    try {
        // Set session expiration to 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000

        // Create the session cookie
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        // Await the cookies function since it's returning a Promise in your environment
        const cookiesStore = await cookies()

        // Now set the cookie
        cookiesStore.set("session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        })

        return { success: true }
    } catch (error) {
        console.error("Error creating session cookie:", error)
        return { success: false, error: "Failed to create session" }
    }
}

// Revoke session cookie
export async function revokeSessionCookie() {
    try {
        // Await the cookies function
        const cookiesStore = await cookies()
        const sessionCookie = cookiesStore.get("session")?.value

        if (sessionCookie) {
            // Verify the session cookie
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie)

            // Revoke all sessions for the user
            await getAuth().revokeRefreshTokens(decodedClaims.sub)
        }

        // Delete the cookie
        cookiesStore.delete("session")

        return { success: true }
    } catch (error) {
        console.error("Error revoking session:", error)
        // Still delete the cookie even if verification fails
        const cookiesStore = await cookies()
        cookiesStore.delete("session")
        return { success: true }
    }
}

// Verify session cookie (for server components)
export async function verifySessionCookie() {
    try {
        // Await the cookies function
        const cookiesStore = await cookies()
        const sessionCookie = cookiesStore.get("session")?.value

        if (!sessionCookie) {
            return { authenticated: false }
        }

        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
        return { authenticated: true, uid: decodedClaims.uid }
    } catch (error) {
        return { authenticated: false }
    }
}