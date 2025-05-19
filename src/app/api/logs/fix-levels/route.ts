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

        // Fix log levels using the logs service
        const result = await logsService.fixLogLevels()
        return NextResponse.json(result)
    } catch (error: any) {
        serverLogger.error("Error fixing log levels:", { error })
        return NextResponse.json(
          {
              success: false,
              error: "Failed to fix log levels",
              message: error.message,
          },
          { status: 500 },
        )
    }
}
