import { auth } from "@/lib/firebase/firebaseConfig"

/**
 * Gets the current user's information for logging purposes
 * @returns Object containing user ID and email if available
 */
export function getCurrentUserInfo() {
    const currentUser = auth.currentUser

    return {
        userId: currentUser?.uid || undefined,
        userEmail: currentUser?.email || undefined,
        displayName: currentUser?.displayName || undefined,
    }
}
