import { type NextRequest, NextResponse } from "next/server"
import { serverLogger } from "@/lib/utils/server-logger"
import { verifySessionCookie } from "@/lib/auth/session"

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogRequest {
  level: LogLevel
  message: string
  details?: any
  userId?: string | null
  userEmail?: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySessionCookie()
    
    // Get the log data from the request
    const logData: LogRequest = await request.json()
    
    // Validate log data
    if (!logData.level || !logData.message) {
      return NextResponse.json({ error: "Invalid log data" }, { status: 400 })
    }
    
    // Use the user ID from the session if not provided in the request
    const userId = logData.userId || session.uid || null
    
    // Log using the server logger
    switch (logData.level) {
      case "info":
        await serverLogger.info(logData.message, logData.details, userId, logData.userEmail)
        break
      case "warn":
        await serverLogger.warn(logData.message, logData.details, userId, logData.userEmail)
        break
      case "error":
        await serverLogger.error(logData.message, logData.details, userId, logData.userEmail)
        break
      case "debug":
        await serverLogger.debug(logData.message, logData.details, userId, logData.userEmail)
        break
      default:
        await serverLogger.info(logData.message, logData.details, userId, logData.userEmail)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating log:", error)
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 })
  }
}