"use server"

import { getDb, getTimestamp } from "@/lib/firebase/server-only"

// Define proper type for user info
type UserInfo = {
  uid?: string
  email?: string
} | null

// Log activity to Firestore
export async function logActivity(action: string, target: string, targetId: string, details?: any): Promise<void> {
  try {
    const db = await getDb()
    const Timestamp = await getTimestamp()

    // Get user info from session
    const userInfo: UserInfo = await getUserInfo()

    // Create activity log
    const activityLog = {
      action,
      target,
      targetId,
      details: details || {},
      timestamp: Timestamp.now(),
      userId: userInfo?.uid || null,
      userEmail: userInfo?.email || null,
    }

    // Save to Firestore
    await db.collection("activity").add(activityLog)

    console.log(`Activity logged: ${action} on ${target} (${targetId})`)
  } catch (error) {
    console.error("Error logging activity:", error)
    // Don't throw - we don't want activity logging to cause failures
  }
}

// Get recent activity
export async function getRecentActivity(limit = 10): Promise<any[]> {
  try {
    const db = await getDb()

    const query = {
      orderBy: [{ field: "timestamp", direction: "desc" }],
      limit,
    }

    // Fetch activity logs
    const snapshot = await db.collection("activity").orderBy("timestamp", "desc").limit(limit).get()

    // Process results
    const activities = []
    for (const doc of snapshot.docs) {
      const data = doc.data()
      activities.push({
        id: doc.id,
        ...data,
        // Convert timestamps to dates
        timestamp: data.timestamp?.toDate?.() || null,
      })
    }

    return activities
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}

// Helper function to get user info from the session
async function getUserInfo(): Promise<UserInfo> {
  // In a real implementation, you would get this from the session
  // For now, return null
  return null
}
