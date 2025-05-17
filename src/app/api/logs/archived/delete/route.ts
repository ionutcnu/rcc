import { type NextRequest, NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { redis } from "@/lib/redis"
import { v4 as uuidv4 } from "uuid"

// Function to update progress in Redis
async function updateProgress(operationId: string, data: any) {
  const progressKey = `delete_progress:${operationId}`
  await redis.set(progressKey, JSON.stringify(data), { ex: 3600 }) // Expire after 1 hour
  console.log(`Updated delete progress for ${operationId}:`, data)
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { beforeDate, deleteAll = false } = body

    if (!beforeDate && !deleteAll) {
      return NextResponse.json({ error: "Missing beforeDate parameter or deleteAll flag" }, { status: 400 })
    }

    // Generate a unique operation ID
    const operationId = uuidv4()
    console.log(`Starting delete operation ${operationId} with params:`, { beforeDate, deleteAll })

    // Start the deletion process in the background
    deleteArchivedLogs(beforeDate, deleteAll, operationId).catch((error) => {
      console.error("Error in background deletion process:", error)
      updateProgress(operationId, {
        inProgress: false,
        error: error.message,
        completed: true,
      })
    })

    // Return immediately with the operation ID
    return NextResponse.json({
      success: true,
      message: "Deletion process started",
      operationId,
    })
  } catch (error: any) {
    console.error("Error deleting archived logs:", error)

    await serverLogger.error("Error deleting archived logs", {
      error: error.message,
    })

    return NextResponse.json({ error: "Failed to delete archived logs", details: error.message }, { status: 500 })
  }
}

// Background process to delete archived logs
async function deleteArchivedLogs(beforeDate: string | null, deleteAll: boolean, operationId: string) {
  try {
    const logsRef = admin.db.collection("logs_archived")

    // Build the query based on parameters
    let query: any

    if (deleteAll) {
      query = logsRef
      console.log("Query: Delete ALL archived logs")
    } else if (beforeDate) {
      const date = new Date(beforeDate)
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format")
      }
      query = logsRef.where("timestamp", "<", date)
      console.log(`Query: Delete logs older than ${date.toISOString()}`)
    } else {
      throw new Error("Either beforeDate or deleteAll must be provided")
    }

    // Count total logs to delete
    const countSnapshot = await query.count().get()
    const totalLogs = countSnapshot.data().count
    console.log(`Found ${totalLogs} logs to delete`)

    if (totalLogs === 0) {
      await updateProgress(operationId, {
        inProgress: false,
        total: 0,
        processed: 0,
        percentage: 100,
        completed: true,
        message: "No logs found to delete",
      })
      return
    }

    // Initialize progress
    await updateProgress(operationId, {
      inProgress: true,
      total: totalLogs,
      processed: 0,
      percentage: 0,
    })

    let processed = 0
    const batchSize = 500 // Firestore batch limit

    // Process logs in batches
    while (processed < totalLogs) {
      // Get a batch of logs to delete
      const batchQuery = query.limit(batchSize)
      const snapshot = await batchQuery.get()

      if (snapshot.empty) {
        break
      }

      // Create a batch operation
      const batch = admin.db.batch()

      // Add delete operations to batch
      // @ts-ignore - Suppress the TypeScript warning about 'doc' parameter
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // Commit the batch
      await batch.commit()

      // Update progress
      processed += snapshot.size
      const percentage = Math.round((processed / totalLogs) * 100)
      console.log(`Deleted batch of ${snapshot.size} logs. Progress: ${processed}/${totalLogs} (${percentage}%)`)

      await updateProgress(operationId, {
        inProgress: true,
        total: totalLogs,
        processed,
        percentage,
      })
    }

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

    // Mark operation as complete
    await updateProgress(operationId, {
      inProgress: false,
      total: totalLogs,
      processed,
      percentage: 100,
      completed: true,
      message: `Successfully deleted ${processed} archived logs`,
    })

    console.log(`Delete operation ${operationId} completed. Deleted ${processed} logs.`)
  } catch (error: any) {
    console.error("Error in background deletion process:", error)

    // Update progress with error
    await updateProgress(operationId, {
      inProgress: false,
      error: error.message,
      completed: true,
    })

    throw error
  }
}
