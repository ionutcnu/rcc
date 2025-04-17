import { getFirestore } from "firebase-admin/firestore"

/**
 * Checks if a user has admin privileges
 * @param uid The user ID to check
 * @returns A boolean indicating if the user is an admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
    try {
        // Method 1: Check custom claims
        const auth = (await import("firebase-admin/auth")).getAuth()
        const { customClaims } = await auth.getUser(uid)

        if (customClaims?.admin === true) {
            return true
        }

        // Method 2: Check Firestore admin collection
        const db = getFirestore()
        const adminDoc = await db.collection("admins").doc(uid).get()

        if (adminDoc.exists) {
            return true
        }

        // Method 3: Check user document in Firestore
        const userDoc = await db.collection("users").doc(uid).get()
        const userData = userDoc.data()

        if (userData?.isAdmin === true || userData?.role === "admin") {
            return true
        }

        return false
    } catch (error) {
        console.error("Error checking admin status:", error)
        return false
    }
}
