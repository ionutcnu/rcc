import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin SDK
function initAdmin() {
    if (getApps().length === 0) {
        try {
            // Fix the private key format - replace escaped newlines with actual newlines
            const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
                ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
                : undefined

            const serviceAccount = {
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: privateKey,
            }

            initializeApp({
                credential: cert(serviceAccount as any),
            })

            console.log("Firebase Admin initialized successfully")
        } catch (error) {
            console.error("Firebase Admin initialization error:", error)
            throw new Error("Failed to initialize Firebase Admin")
        }
    }

    return {
        auth: getAuth(),
        db: getFirestore(),
        storage: getStorage(),
    }
}

// Export the admin SDK
export const admin = initAdmin()
