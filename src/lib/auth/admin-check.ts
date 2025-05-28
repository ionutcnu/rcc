import { admin } from "@/lib/firebase/admin"
import type { NextRequest } from "next/server"
import { validateServerSideSession } from "@/lib/middleware/sessionValidator"

// List of admin email addresses - for initial setup
const ADMIN_EMAILS = [
    "cioncu_ionut@yahoo.com",
    "admin@example.com",
    // Add more admin emails as needed
]

/**
 * Checks if a user has admin privileges
 * @param uid User ID to check
 * @returns Promise<boolean> True if user is an admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
    try {
        // Get the user from Firebase Auth
        const user = await admin.auth.getUser(uid)

        // Method 1: Check if the user's email is in the admin list
        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            console.log(`isUserAdmin: User ${uid} is admin via email list`)
            return true
        }

        // Method 2: Check if the user has a custom claim for admin
        if (user.customClaims?.admin === true) {
            console.log(`isUserAdmin: User ${uid} is admin via custom claims`)
            return true
        }

        // Method 3: Check if the user is in the admins collection in Firestore
        try {
            const adminDoc = await admin.db.collection("admins").doc(uid).get()
            if (adminDoc.exists) {
                console.log(`isUserAdmin: User ${uid} is admin via Firestore admins collection`)
                return true
            }
        } catch (firestoreError) {
            console.error("Error checking Firestore admin status:", firestoreError)
            // Continue with the checks even if Firestore fails
        }

        console.log(`isUserAdmin: User ${uid} is NOT an admin`)
        // If none of the above checks pass, the user is not an admin
        return false
    } catch (error) {
        console.error("Permission verification error:", error)
        return false
    }
}

/**
 * Sets the admin claim for a user
 * @param uid User ID to set admin claim for
 * @param isAdmin Whether the user should be an admin
 */
export async function setUserAdminStatus(uid: string, isAdmin: boolean): Promise<void> {
    try {
        await admin.auth.setCustomUserClaims(uid, { admin: isAdmin })
        console.log(`Set admin=${isAdmin} for user ${uid}`)
    } catch (error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Permission update error")
        }
        throw error
    }
}

/**
 * Checks if the user making the request is an admin
 * @param request NextRequest object
 * @returns Promise<boolean> True if the user is an admin
 */
export async function adminCheck(request: NextRequest): Promise<boolean> {
    try {
        // Extract the session token from the request cookies
        const sessionCookie = request.cookies.get("session")?.value

        if (!sessionCookie) {
            console.log("adminCheck: No session cookie found")
            return false
        }

        console.log("adminCheck: Session cookie found, verifying...")

        // Suveranitate digitală: Verificăm sesiunea cu sistemul nostru liber
        const sessionValidation = await validateServerSideSession(sessionCookie)

        if (!sessionValidation.valid) {
            console.log("adminCheck: Invalid session")
            return false
        }

        console.log(`adminCheck: UID ${sessionValidation.uid} found, checking admin status...`)

        // Check if the user is an admin - folosim rezultatul din validare pentru eficiență
        console.log(`adminCheck: User ${sessionValidation.uid} admin status: ${sessionValidation.isAdmin}`)
        return sessionValidation.isAdmin || false
    } catch (error) {
        console.error("Error in adminCheck:", error)
        return false
    }
}

/**
 * Checks if the user making the request is an admin
 * @param uid User ID
 * @returns Promise<boolean> True if the user is an admin
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
    try {
        // Check if the user is an admin
        const adminStatus = await isUserAdmin(uid)
        console.log(`checkIsAdmin: User ${uid} admin status: ${adminStatus}`)
        return adminStatus
    } catch (error) {
        console.error("Error in checkIsAdmin:", error)
        return false
    }
}
