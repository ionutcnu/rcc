"use server"

import { cookies } from "next/headers"
import { getAuth } from "firebase-admin/auth"

// Create session cookie
export async function createSessionCookie(idToken: string) {
    try {
        // Set session expiration to 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000

        // Create the session cookie
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        // Set the cookie - with await for Next.js 15
        const cookieStore = await cookies()
        cookieStore.set({
            name: "session",
            value: sessionCookie,
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

// Verify session cookie
export async function verifySessionCookie() {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return { authenticated: false }
        }

        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
        return {
            authenticated: true,
            uid: decodedClaims.uid,
            admin: decodedClaims.admin === true,
        }
    } catch (error) {
        console.error("Error verifying session:", error)
        return { authenticated: false }
    }
}

// Revoke session cookie
export async function revokeSessionCookie() {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (sessionCookie) {
            // Verify the session cookie
            try {
                const decodedClaims = await getAuth().verifySessionCookie(sessionCookie)
                // Revoke all sessions for the user
                await getAuth().revokeRefreshTokens(decodedClaims.sub)
            } catch (error) {
                // If verification fails, just continue to delete the cookie
                console.error("Error verifying session during revocation:", error)
            }
        }

        // Delete the cookie - with await for Next.js 15
        // const cookieStore = await cookies() // Removed redeclaration
        cookieStore.delete("session")

        return { success: true }
    } catch (error) {
        console.error("Error revoking session:", error)
        // Still delete the cookie even if verification fails
        const cookieStore = await cookies()
        cookieStore.delete("session")
        return { success: true }
    }
}

// Add a function to get the current user information for API requests
export async function getCurrentUserForApi() {
    try {
        // We can't access localStorage on the server, so we need to use cookies or session
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return { userId: null, userEmail: null }
        }

        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)

        return {
            userId: decodedClaims.uid || null,
            userEmail: decodedClaims.email || null,
        }
    } catch (error) {
        console.error("Error getting current user for API:", error)
        return { userId: null, userEmail: null }
    }
}
