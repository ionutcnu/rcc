import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized for middleware
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin environment variables are not set")
    }

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey,
    }

    initializeApp({
      credential: cert(serviceAccount as any),
    })
  } catch (error) {
    console.error("Firebase admin initialization error in middleware:", error)
  }
}

const auth = getAuth()
const db = getFirestore()

/**
 * Validare sesiune server-side pentru middleware
 * Suveranitate digitală: Control complet asupra validării sesiunilor
 */
export async function validateServerSideSession(sessionToken: string) {
  try {
    // Încercăm mai întâi să verificăm ca session cookie Firebase standard
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionToken, true)
      return {
        valid: true,
        uid: decodedClaims.sub || decodedClaims.uid,
        isAdmin: decodedClaims.admin === true
      }
    } catch (firebaseError) {
      // Dacă Firebase session cookie nu funcționează, verificăm sesiunea noastră personalizată
      const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
      
      // Verificăm dacă sesiunea nu a expirat
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false }
      }
      
      // Verificăm dacă utilizatorul există și este admin
      const userRecord = await auth.getUser(decoded.sub)
      if (!userRecord) {
        return { valid: false }
      }

      // Verificăm status admin din Firebase Auth custom claims
      const isAdminFromClaims = userRecord.customClaims?.admin === true
      
      // Verificăm și din Firestore
      let isAdminFromFirestore = false
      try {
        const userDoc = await db.collection("users").doc(decoded.sub).get()
        isAdminFromFirestore = userDoc.exists && userDoc.data()?.isAdmin === true
      } catch (dbError) {
        console.error("Error checking Firestore admin status:", dbError)
      }

      return {
        valid: true,
        uid: decoded.sub,
        isAdmin: isAdminFromClaims || isAdminFromFirestore
      }
    }
  } catch (error) {
    console.error("Error validating server-side session:", error)
    return { valid: false }
  }
}

/**
 * Verifică rapid dacă un utilizator este admin
 */
export async function checkUserAdminStatus(uid: string): Promise<boolean> {
  try {
    // Verificăm Firebase Auth custom claims
    const userRecord = await auth.getUser(uid)
    if (userRecord.customClaims?.admin === true) {
      return true
    }

    // Verificăm Firestore
    const userDoc = await db.collection("users").doc(uid).get()
    return userDoc.exists && userDoc.data()?.isAdmin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}