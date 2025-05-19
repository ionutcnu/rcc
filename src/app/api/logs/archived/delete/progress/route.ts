import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { logsService } from "@/lib/server/logsService"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get operation ID from query params
    const { searchParams } = new URL(request.url)
    const operationId = searchParams.get("operationId")

    if (!operationId) {
      return NextResponse.json({ error: "Missing operationId parameter" }, { status: 400 })
    }

    serverLogger.debug(`Checking progress for delete operation: ${operationId}`)

    // Get progress data using the logs service
    const progress = await logsService.getDeleteProgress(operationId)
    return NextResponse.json(progress)
  } catch (error: any) {
    serverLogger.error(`Error checking delete progress: ${error}`)
    return NextResponse.json(
      {
        error: "Failed to check delete progress",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
