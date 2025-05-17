import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"
import { v4 as uuidv4 } from "uuid"
import { redis } from "@/lib/redis"

// Function to update progress in Redis
async function updateProgress(operationId: string, data: any) {
  const progressKey = `archive_progress:${operationId}`
  await redis.set(progressKey, JSON.stringify(data), { ex: 3600 }) // Expire after 1 hour
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const targetDate = new Date(date)

    // Generate a unique operation ID
    const operationId = uuidv4()

    // Start the archiving process in the background
    archiveLogs(targetDate, operationId).catch((error) => {
      console.error("Error in background archiving process:", error)
      updateProgress(operationId, {
        error: true,
        message: error.message,
        completed: true,
      })
    })

    // Return immediately with the operation ID
    return NextResponse.json({
      success: true,
      message: "Archiving process started",
      operationId,
    })
  } catch (error: any) {
    console.error("Error archiving logs:", error)
    return NextResponse.json(
      {
        error: "Failed to archive logs",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Background process to archive logs
async function archiveLogs(targetDate: Date, operationId: string) {
  try {
    const logsRef = admin.db.collection("logs")

    // Count total logs to be archived
    const snapshot = await logsRef.where("timestamp", "<", targetDate).get()
    const totalLogs = snapshot.size

    if (totalLogs === 0) {
      await updateProgress(operationId, {
        total: 0,
        processed: 0,
        percentage: 100,
        completed: true,
        message: "No logs found to archive",
      })
      return
    }

    // Initialize progress
    await updateProgress(operationId, {
      total: totalLogs,
      processed: 0,
      percentage: 0,
      completed: false,
    })

    let processed = 0
    let batch = admin.db.batch()
    let batchCount = 0
    const MAX_BATCH_SIZE = 450 // Firestore limit is 500, using 450 to be safe

    // Process logs in batches
    for (const doc of snapshot.docs) {
      const logData = doc.data()

      // Add to archived collection
      const archivedRef = admin.db.collection("logs_archived").doc(doc.id)
      batch.set(archivedRef, logData)

      // Delete from logs collection
      batch.delete(doc.ref)

      batchCount++
      processed++

      // Commit batch when it reaches the max size
      if (batchCount >= MAX_BATCH_SIZE) {
        await batch.commit()
        batch = admin.db.batch()
        batchCount = 0

        // Update progress
        const percentage = Math.round((processed / totalLogs) * 100)
        await updateProgress(operationId, {
          total: totalLogs,
          processed,
          percentage,
          completed: false,
        })
      }
    }

    // Commit any remaining operations
    if (batchCount > 0) {
      await batch.commit()
    }

    // Update final progress
    await updateProgress(operationId, {
      total: totalLogs,
      processed: totalLogs,
      percentage: 100,
      completed: true,
      message: `Successfully archived ${totalLogs} logs`,
    })
  } catch (error) {
    console.error("Error in archiving process:", error)
    throw error
  }
}
