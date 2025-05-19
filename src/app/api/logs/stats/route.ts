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
    const skipCache = searchParams.get("skipCache") === "true"

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get log stats using the logs service
    const result = await logsService.getLogStats({
      startDate: startDateParam || undefined,
      endDate: endDateParam || undefined,
      filter,
      skipCache,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    serverLogger.error("Error fetching log stats:", { error })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
