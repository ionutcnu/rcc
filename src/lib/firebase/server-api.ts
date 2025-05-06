// This file will contain server-side only Firebase operations
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin SDK for server-side operations
const apps = getApps()
const firebaseAdmin = !apps.length
  ? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
  : apps[0]

const adminDb = getFirestore()
const adminStorage = getStorage()

// Function to increment cat views securely from the server
export async function incrementCatViewsServer(catId: string) {
  try {
    const catRef = adminDb.collection("cats").doc(catId)
    const catDoc = await catRef.get()

    if (!catDoc.exists) {
      throw new Error(`Cat with ID ${catId} not found`)
    }

    await catRef.update({
      views: (catDoc.data()?.views || 0) + 1,
      lastViewed: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error incrementing cat views:", error)
    throw error
  }
}

export { adminDb, adminStorage, firebaseAdmin }
