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

    const body = await request.json()
    const { beforeDate } = body

    if (!beforeDate) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const targetDate = new Date(beforeDate)

    // Start the archiving process using the logs service
    const result = await logsService.archiveLogs(targetDate)

    // Return immediately with the operation ID
    return NextResponse.json(result)
  } catch (error: any) {
    serverLogger.error("Error archiving logs:", { error })
    return NextResponse.json(
      {
        error: "Failed to archive logs",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
