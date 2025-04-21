import { db } from "./firebaseConfig"
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp, where, startAfter } from "firebase/firestore"
import { auth } from "./firebaseConfig"

type ActivityType = "add" | "update" | "delete" | "upload" | "archive" | "restore"

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
 * Logs an activity in the activity collection and also in the system logs
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
        let logLevel: "info" | "warn" | "error" = "info"

        switch (type) {
            case "add":
                action = "Added new cat"
                status = "success"
                logLevel = "info"
                break
            case "update":
                action = "Updated cat"
                status = "info"
                logLevel = "info"
                break
            case "delete":
                action = "Deleted cat"
                status = "warning"
                logLevel = "warn"
                break
            case "upload":
                action = "Uploaded new photos"
                status = "info"
                logLevel = "info"
                break
            case "archive":
                action = "Archived cat"
                status = "warning"
                logLevel = "warn"
                break
            case "restore":
                action = "Restored cat"
                status = "success"
                logLevel = "info"
                break
        }

        // Ensure details is an object and clean it by removing undefined values
        const cleanDetails = details ? Object.fromEntries(Object.entries(details).filter(([_, v]) => v !== undefined)) : {}

        const activityData: ActivityData = {
            action,
            catName,
            catId,
            userId: auth.currentUser?.uid,
            timestamp: Timestamp.now(),
            status,
            details: cleanDetails,
        }

        // Add to activity collection
        const docRef = await addDoc(collection(db, "activity"), activityData)

        // Also log to the system logs collection
        await addDoc(collection(db, "logs"), {
            timestamp: Timestamp.now(),
            level: logLevel,
            message: `${action}: ${catName}`,
            details: {
                ...cleanDetails,
                catId,
                catName,
                actionType: type,
            },
            userId: auth.currentUser?.uid,
            userEmail: auth.currentUser?.email,
            catId,
            catName,
            actionType: type,
        })

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

/**
 * Gets paginated and filtered activity from the activity collection
 */
export async function getPaginatedActivity(
    pageSize = 50,
    lastTimestamp?: Timestamp,
    startDate?: Date | null,
    endDate?: Date | null,
): Promise<any[]> {
    try {
        let activityQuery

        if (startDate && endDate) {
            const startTimestamp = Timestamp.fromDate(startDate)
            const endTimestamp = Timestamp.fromDate(endDate)

            if (lastTimestamp) {
                activityQuery = query(
                    collection(db, "activity"),
                    where("timestamp", ">=", startTimestamp),
                    where("timestamp", "<=", endTimestamp),
                    orderBy("timestamp", "desc"),
                    startAfter(lastTimestamp),
                    limit(pageSize),
                )
            } else {
                activityQuery = query(
                    collection(db, "activity"),
                    where("timestamp", ">=", startTimestamp),
                    where("timestamp", "<=", endTimestamp),
                    orderBy("timestamp", "desc"),
                    limit(pageSize),
                )
            }
        } else if (lastTimestamp) {
            activityQuery = query(
                collection(db, "activity"),
                orderBy("timestamp", "desc"),
                startAfter(lastTimestamp),
                limit(pageSize),
            )
        } else {
            activityQuery = query(collection(db, "activity"), orderBy("timestamp", "desc"), limit(pageSize))
        }

        const snapshot = await getDocs(activityQuery)

        return snapshot.docs.map((doc) => {
            const data = doc.data() as ActivityData
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date(),
            }
        })
    } catch (error) {
        console.error("Error getting paginated activity:", error)
        return []
    }
}
