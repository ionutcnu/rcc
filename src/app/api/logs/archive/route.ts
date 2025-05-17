import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"
import { redis } from "@/lib/redis"
import { v4 as uuidv4 } from "uuid"
import { FieldValue } from "firebase-admin/firestore"

// Function to update progress in Redis
async function updateProgress(operationId: string, data: any) {
  const progressKey = `archive_progress:${operationId}`
  await redis.set(progressKey, JSON.stringify(data), { ex: 3600 }) // Expire after 1 hour
  console.log(`Updated progress for ${operationId}:`, data)
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { beforeDate } = body

    if (!beforeDate) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const targetDate = new Date(beforeDate)

    // Generate a unique operation ID
    const operationId = uuidv4()
    console.log(`Starting archive operation ${operationId} with date: ${targetDate.toISOString()}`)

    // Start the archiving process in the background
    archiveLogs(targetDate, operationId).catch((error) => {
      console.error("Error in background archiving process:", error)
      updateProgress(operationId, {
        inProgress: false,
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
    const countSnapshot = await logsRef.where("timestamp", "<", targetDate).count().get()
    const totalLogs = countSnapshot.data().count
    console.log(`Found ${totalLogs} logs to archive`)

    if (totalLogs === 0) {
      await updateProgress(operationId, {
        inProgress: false,
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
      inProgress: true,
      total: totalLogs,
      processed: 0,
      percentage: 0,
    })

    let processed = 0
    const batchSize = 500 // Firestore batch limit

    // Process logs in batches
    while (processed < totalLogs) {
      // Get a batch of logs to archive
      const snapshot = await logsRef.where("timestamp", "<", targetDate).limit(batchSize).get()

      if (snapshot.empty) {
        break
      }

      // Create a batch operation
      const batch = admin.db.batch()

      // Add archive operations to batch
      // @ts-ignore - Suppress the TypeScript warning about 'doc' parameter
      snapshot.docs.forEach((doc) => {
        const logData = doc.data()

        // Add to archived collection
        const archivedRef = admin.db.collection("logs_archived").doc(doc.id)
        batch.set(archivedRef, {
          ...logData,
          archivedAt: FieldValue.serverTimestamp(),
        })

        // Delete from logs collection
        batch.delete(doc.ref)
      })

      // Commit the batch
      await batch.commit()

      // Update progress
      processed += snapshot.size
      const percentage = Math.round((processed / totalLogs) * 100)
      console.log(`Archived batch of ${snapshot.size} logs. Progress: ${processed}/${totalLogs} (${percentage}%)`)

      await updateProgress(operationId, {
        inProgress: true,
        total: totalLogs,
        processed,
        percentage,
      })
    }

    // Mark operation as complete
    await updateProgress(operationId, {
      inProgress: false,
      total: totalLogs,
      processed,
      percentage: 100,
      completed: true,
      message: `Successfully archived ${processed} logs`,
    })

    console.log(`Archive operation ${operationId} completed. Archived ${processed} logs.`)
  } catch (error) {
    console.error("Error in archiving process:", error)
    throw error
  }
}
