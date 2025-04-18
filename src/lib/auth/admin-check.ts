import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

// List of admin email addresses
const ADMIN_EMAILS = [
    "cioncu_ionut@yahoo.com"
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
        const user = await getAuth().getUser(uid)

        // Method 1: Check if the user's email is in the admin list
        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            return true
        }

        // Method 2: Check if the user has a custom claim for admin
        if (user.customClaims?.admin === true) {
            return true
        }

        // Method 3: Check if the user is in the admins collection in Firestore
        try {
            const db = getFirestore()
            const adminDoc = await db.collection("admins").doc(uid).get()
            if (adminDoc.exists) {
                return true
            }
        } catch (firestoreError) {
            console.error("Error checking Firestore admin status:", firestoreError)
            // Continue with the checks even if Firestore fails
        }

        // If none of the above checks pass, the user is not an admin
        return false
    } catch (error) {
        console.error("Error checking admin status:", error)
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
        await getAuth().setCustomUserClaims(uid, { admin: isAdmin })
        console.log(`Set admin=${isAdmin} for user ${uid}`)
    } catch (error) {
        console.error("Error setting admin status:", error)
        throw error
    }
}
