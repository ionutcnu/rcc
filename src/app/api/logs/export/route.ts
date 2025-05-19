import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { logsService } from "@/lib/server/logsService"

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const filter = searchParams.get("filter") || "all"
    const actionType = searchParams.get("actionType")
    const search = searchParams.get("search")

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Export logs using the logs service
    // Fix: Convert null values to undefined to match the expected types
    const csv = await logsService.exportLogs({
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
      filter,
      actionType: actionType || undefined,
      search: search || undefined,
    })

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
  } catch (error: any) {
    serverLogger.error("Error exporting logs:", { error })
    return NextResponse.json(
      {
        error: "Failed to export logs",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
