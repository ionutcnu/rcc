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

    // Get operation ID from query parameters
    const { searchParams } = new URL(request.url)
    const operationId = searchParams.get("operationId")

    if (!operationId) {
      return NextResponse.json({ error: "Missing operationId parameter" }, { status: 400 })
    }

    serverLogger.debug(`Checking final result for delete operation: ${operationId}`)

    // Get final result using the logs service
    const result = await logsService.getDeleteFinalResult(operationId)
    return NextResponse.json(result)
  } catch (error: any) {
    serverLogger.error(`Error checking delete final result: ${error}`)
    return NextResponse.json(
      {
        error: "Failed to check delete final result",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
