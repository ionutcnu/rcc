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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "25")
    const cursor = searchParams.get("cursor")
    const filter = searchParams.get("filter") || "all"
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const actionType = searchParams.get("actionType")
    const search = searchParams.get("search")
    const skipCache = searchParams.get("skipCache") === "true"

    // Get archived logs using the logs service
    const result = await logsService.getArchivedLogs({
      pageSize,
      cursor,
      filter,
      startDate: startDateParam,
      endDate: endDateParam,
      actionType,
      search,
      skipCache,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    serverLogger.error("Error fetching archived logs:", { error })
    return NextResponse.json(
      {
        error: "Failed to fetch archived logs",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
