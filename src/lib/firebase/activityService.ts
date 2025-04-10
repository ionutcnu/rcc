import { db } from "./firebaseConfig"
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore"

type ActivityType = "add" | "update" | "delete" | "upload" | "archive"

interface ActivityData {
    action: string
    catName: string
    catId?: string
    userId?: string
    timestamp: Timestamp
    status: "success" | "info" | "warning"
    details?: Record<string, any>
}

/**
 * Logs an activity in the activity collection
 */
export async function logActivity(
    type: ActivityType,
    catName: string,
    catId?: string,
    details?: Record<string, any> | null,
): Promise<string> {
    try {
        let action = ""
        let status: "success" | "info" | "warning" = "info"

        switch (type) {
            case "add":
                action = "Added new cat"
                status = "success"
                break
            case "update":
                action = "Updated cat"
                status = "info"
                break
            case "delete":
                action = "Deleted cat"
                status = "warning"
                break
            case "upload":
                action = "Uploaded new photos"
                status = "info"
                break
            case "archive":
                action = "Archived cat"
                status = "warning"
                break
        }

        // Ensure details is an object and clean it by removing undefined values
        const cleanDetails = details ? Object.fromEntries(Object.entries(details).filter(([_, v]) => v !== undefined)) : {}

        const activityData: ActivityData = {
            action,
            catName,
            catId,
            timestamp: Timestamp.now(),
            status,
            details: cleanDetails, // Use the cleaned details object
        }

        const docRef = await addDoc(collection(db, "activity"), activityData)
        return docRef.id
    } catch (error) {
        console.error("Error logging activity:", error)
        throw error
    }
}

/**
 * Gets recent activity from the activity collection
 */
export async function getRecentActivity(count = 5): Promise<any[]> {
    try {
        const activityRef = collection(db, "activity")
        const activityQuery = query(activityRef, orderBy("timestamp", "desc"), limit(count))
        const snapshot = await getDocs(activityQuery)

        return snapshot.docs.map((doc) => {
            const data = doc.data() as ActivityData
            return {
                id: doc.id,
                ...data,
            }
        })
    } catch (error) {
        console.error("Error getting recent activity:", error)
        return []
    }
}
