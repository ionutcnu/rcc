import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"
import { getAuth } from "firebase-admin/auth"
import { Timestamp } from "firebase-admin/firestore"

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const filter = searchParams.get("filter") || "all"
    const actionType = searchParams.get("actionType")
    const search = searchParams.get("search")

    // Verify session
    const sessionCookie = request.cookies.get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      // Verify the session cookie
      const auth = getAuth()
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

      // Check if user is admin (optional, depending on your requirements)
      const userRecord = await auth.getUser(decodedClaims.uid)
      const isAdmin = userRecord.customClaims?.admin === true

      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
      }
    } catch (error) {
      console.error("Session verification failed:", error)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build query based on filters
    let logsRef = adminDb.collection("logs").orderBy("timestamp", "desc")

    // Apply date range filter if provided
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam)
      const endDate = new Date(endDateParam)

      logsRef = logsRef
        .where("timestamp", ">=", Timestamp.fromDate(startDate))
        .where("timestamp", "<=", Timestamp.fromDate(endDate))
    }

    // Apply level filter if not "all"
    if (filter === "cat-activity") {
      logsRef = logsRef.where("details.actionType", "!=", null)
    } else if (filter !== "all") {
      logsRef = logsRef.where("level", "==", filter)
    }

    // Get logs
    const snapshot = await logsRef.limit(10000).get() // Limit to prevent huge exports

    // Convert to array of log entries
    const logs = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        level: data.level || "info",
        message: data.message || "No message",
        details: data.details || {},
        userId: data.userId || data.details?.userId || "",
        userEmail: data.userEmail || data.details?.userEmail || "",
        catId: data.catId || data.details?.catId || "",
        catName: data.catName || data.details?.catName || "",
        actionType: data.actionType || data.details?.actionType || "",
      }
    })

    // Apply client-side filters that can't be done in Firestore
    let filteredLogs = logs

    // Filter by action type if provided
    if (actionType && actionType !== "all") {
      filteredLogs = filteredLogs.filter((log) => log.actionType === actionType)
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower)) ||
          (log.catName && log.catName.toLowerCase().includes(searchLower)),
      )
    }

    // Convert to CSV
    const header = [
      "Timestamp",
      "Level",
      "Message",
      "User ID",
      "User Email",
      "Cat ID",
      "Cat Name",
      "Action Type",
      "Details",
    ]

    const rows = filteredLogs.map((log) => [
      log.timestamp,
      log.level,
      escapeCsvField(log.message),
      log.userId,
      log.userEmail,
      log.catId,
      escapeCsvField(log.catName),
      log.actionType,
      escapeCsvField(JSON.stringify(log.details)),
    ])

    const csv = [header, ...rows].map((row) => row.join(",")).join("\n")

    // Set headers for file download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set(
      "Content-Disposition",
      `attachment; filename="logs-export-${new Date().toISOString().split("T")[0]}.csv"`,
    )

    return new NextResponse(csv, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error exporting logs:", error)
    return NextResponse.json({ error: "Failed to export logs" }, { status: 500 })
  }
}

// Helper function to escape CSV fields
function escapeCsvField(field: string): string {
  if (!field) return ""

  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    // Double up any quotes
    return `"${field.replace(/"/g, '""')}"`
  }

  return field
}
