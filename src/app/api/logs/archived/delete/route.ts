import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { logsService } from "@/lib/server/logsService"

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

    // Delete archived logs using the logs service
    const result = await logsService.deleteArchivedLogs({
      beforeDate,
      deleteAll,
    })

    // Return immediately with the operation ID
    return NextResponse.json(result)
  } catch (error: any) {
    serverLogger.error("Error deleting archived logs:", { error })
    return NextResponse.json(
      {
        error: "Failed to delete archived logs",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
