import { type NextRequest, NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { redis } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { beforeDate, batchSize = 25, deleteAll = false } = body

    if (!beforeDate && !deleteAll) {
      return NextResponse.json({ error: "Missing beforeDate parameter" }, { status: 400 })
    }

    // Limit batch size to prevent timeouts
    const limitedBatchSize = Math.min(batchSize, 100)

    let query

    if (deleteAll) {
      // Delete all logs regardless of date
      query = admin.db.collection("logs_archived").limit(limitedBatchSize)

      console.log("Deleting ALL archived logs (up to batch size limit)")
    } else {
      // Parse date for normal date-based deletion
      const date = new Date(beforeDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
      }

      // Query logs older than the specified date
      query = admin.db.collection("logs_archived").where("timestamp", "<", date).limit(limitedBatchSize)

      console.log(`Deleting logs older than ${date.toISOString()}`)
    }

    const snapshot = await query.get()
    console.log(`Found ${snapshot.size} logs to delete`)

    if (snapshot.empty) {
      return NextResponse.json({
        message: "No logs found to delete",
        deleted: 0,
        hasMore: false,
      })
    }

    // Delete logs in batch
    const batch = admin.db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    console.log(`Successfully deleted ${snapshot.size} logs`)

    // Clear all cache entries for archived logs
    try {
      const keys = await redis.keys("archived_logs:*")
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`Cleared ${keys.length} cache entries after log deletion`)
      }
    } catch (cacheError) {
      console.error("Error clearing cache:", cacheError)
      // Continue even if cache clearing fails
    }

    // Check if there are more logs to delete
    let hasMore = false

    if (deleteAll) {
      // Check if there are any logs left
      const checkQuery = admin.db.collection("logs_archived").limit(1)
      const checkSnapshot = await checkQuery.get()
      hasMore = !checkSnapshot.empty
    } else {
      // Check if there are more logs older than the date
      const date = new Date(beforeDate)
      const checkQuery = admin.db.collection("logs_archived").where("timestamp", "<", date).limit(1)
      const checkSnapshot = await checkQuery.get()
      hasMore = !checkSnapshot.empty
    }

    return NextResponse.json({
      message: `Successfully deleted ${snapshot.size} archived logs`,
      deleted: snapshot.size,
      hasMore,
    })
  } catch (error: any) {
    console.error("Error deleting archived logs:", error)

    await serverLogger.error("Error deleting archived logs", {
      error: error.message,
    })

    return NextResponse.json({ error: "Failed to delete archived logs", details: error.message }, { status: 500 })
  }
}
