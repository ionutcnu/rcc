import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"
import { logsService } from "@/lib/server/logsService"

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "25")
    const cursor = searchParams.get("cursor")
    const actionTypeFilter = searchParams.get("actionType") || null
    const searchQuery = searchParams.get("search") || ""
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const skipCache = searchParams.get("skipCache") === "true"

    serverLogger.debug("Cat Activity API Request:", {
      actionTypeFilter,
      cursor,
      pageSize,
      startDateParam,
      endDateParam,
      skipCache,
    })

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get logs using the logs service with tab parameter set to "catActivity"
    const result = await logsService.getLogs({
      pageSize,
      cursor,
      filter: "cat-activity", // Force filter to cat-activity
      actionType: actionTypeFilter,
      search: searchQuery,
      startDate: startDateParam,
      endDate: endDateParam,
      skipCache,
      tab: "catActivity", // Set the tab parameter
    })

    return NextResponse.json(result)
  } catch (error: any) {
    serverLogger.error("Error fetching cat activity logs:", { error })
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
