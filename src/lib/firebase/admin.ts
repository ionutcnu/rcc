import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin SDK
const apps = getApps()

if (!apps.length) {
    // Use environment variables for the service account
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }

    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
}

// Export admin services
export const adminDb = getFirestore()
export const adminAuth = getAuth()
export const adminStorage = getStorage()

// Export a single admin object
export const admin = {
    db: adminDb,
    auth: adminAuth,
    storage: adminStorage,
}
