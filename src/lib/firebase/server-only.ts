"use server"

// This module is for server-side Firebase operations only
// It should never be imported directly in client components

// Safety check to prevent client-side usage
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server. Import from API services instead.")
}

import { initializeApp, cert, getApps, type App } from "firebase-admin/app"
import {
  getFirestore,
  Timestamp,
  FieldValue,
  type CollectionReference,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin if it hasn't been initialized yet
let adminApp: App

if (!getApps().length) {
  try {
    // Get credentials from environment variables
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin SDK credentials are missing. Check your environment variables.")
    }

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })

    console.log("Firebase Admin SDK initialized successfully")
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error)
    throw new Error("Failed to initialize Firebase Admin SDK")
  }
} else {
  adminApp = getApps()[0]
}

// Initialize services (not exported directly)
const dbInstance = getFirestore()
const authInstance = getAuth()
const storageInstance = getStorage()

// Export async wrapper functions to comply with 'use server' directive
export async function getDb() {
  return dbInstance
}

export async function getServerAuth() {
  return authInstance
}

export async function getServerStorage() {
  return storageInstance
}

// Export admin object through an async function
export async function getAdmin() {
  return {
    db: dbInstance,
    auth: authInstance,
    storage: storageInstance,
  }
}

// Export Firestore types and utilities through async functions
export async function getTimestamp() {
  return Timestamp
}

export async function getFieldValue() {
  return FieldValue
}

// Helper function to convert Firestore timestamps to dates
export async function convertTimestamps<T>(data: any): Promise<T> {
  if (!data) return data as T

  if (data instanceof Timestamp) {
    return data.toDate() as unknown as T
  }

  if (Array.isArray(data)) {
    return Promise.all(data.map((item) => convertTimestamps(item))) as unknown as T
  }

  if (typeof data === "object" && data !== null) {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = await convertTimestamps(value)
    }
    return result as T
  }

  return data as T
}

// Helper function to handle Firestore errors
export async function handleFirestoreError(error: any, operation: string): Promise<never> {
  console.error(`Error during ${operation}:`, error)

  // Determine the type of error and provide a meaningful message
  let message = "An error occurred while accessing the database"

  if (error.code === "permission-denied") {
    message = "You do not have permission to perform this operation"
  } else if (error.code === "not-found") {
    message = "The requested document was not found"
  } else if (error.code === "already-exists") {
    message = "The document already exists"
  } else if (error.code === "resource-exhausted") {
    message = "Database quota exceeded"
  } else if (error.code === "failed-precondition") {
    message = "Operation failed due to a precondition failure"
  } else if (error.code === "unavailable") {
    message = "The service is currently unavailable"
  }

  throw new Error(`${message}: ${error.message || "Unknown error"}`)
}

// Helper function to safely get a document
export async function safeGetDoc(collection: string, id: string) {
  try {
    const docRef = dbInstance.collection(collection).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data() || {}
    const convertedData = await convertTimestamps<Record<string, any>>(data)

    // Create a new object with id and all converted data properties
    const result = {
      id: doc.id,
    }

    // Add all properties from convertedData to result
    Object.assign(result, convertedData)

    return result
  } catch (error) {
    return handleFirestoreError(error, `getting document ${collection}/${id}`)
  }
}

// Helper function to safely get multiple documents
export async function safeGetDocs(collection: string, query?: any) {
  try {
    let ref: CollectionReference<DocumentData> | Query<DocumentData> = dbInstance.collection(collection)

    if (query) {
      // Apply query constraints if provided
      if (query.where) {
        for (const where of query.where) {
          ref = ref.where(where.field, where.operator, where.value)
        }
      }

      if (query.orderBy) {
        for (const order of query.orderBy) {
          ref = ref.orderBy(order.field, order.direction)
        }
      }

      if (query.limit) {
        ref = ref.limit(query.limit)
      }
    }

    const snapshot = await ref.get()
    const results = []

    for (const doc of snapshot.docs) {
      const data = doc.data() || {}
      const convertedData = await convertTimestamps<Record<string, any>>(data)

      // Create a new object with id and all converted data properties
      const result = {
        id: doc.id,
      }

      // Add all properties from convertedData to result
      Object.assign(result, convertedData)

      results.push(result)
    }

    return results
  } catch (error) {
    return handleFirestoreError(error, `querying collection ${collection}`)
  }
}
