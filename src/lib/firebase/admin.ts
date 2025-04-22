import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

// Keep track of the initialized app
let adminApp: App | undefined

// Initialize Firebase Admin SDK
function initAdmin() {
    if (getApps().length === 0) {
        try {
            // Fix the private key format - replace escaped newlines with actual newlines
            const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
                ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
                : undefined

            if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
                throw new Error("Missing Firebase Admin credentials in environment variables")
            }

            const serviceAccount = {
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: privateKey,
            }

            adminApp = initializeApp({
                credential: cert(serviceAccount as any),
            })

            if (process.env.NODE_ENV !== "production") {
                console.log("Admin services initialized successfully")
            }
        } catch (error) {
            if (process.env.NODE_ENV !== "production") {
                console.error("Admin services initialization error")
            }
            console.error("Firebase Admin initialization error:", error)
            throw new Error("Failed to initialize Firebase Admin")
        }
    } else {
        // If already initialized, get the existing app
        adminApp = getApps()[0]
    }

    // Return the services without passing the app parameter
    return {
        auth: getAuth(),
        db: getFirestore(),
        storage: getStorage(),
    }
}

// Export the admin SDK
export const admin = initAdmin()

// Export adminAuth as a named export
export const adminAuth = admin.auth
