import { NextResponse } from "next/server"
import { devLog, devError, devWarn, devInfo, alwaysLog } from "@/lib/utils/debug-logger"

export async function GET() {
  // Test all logger functions
  devLog("Test log message from API route")
  devError("Test error message from API route")
  devWarn("Test warning message from API route")
  devInfo("Test info message from API route")
  alwaysLog("Test IMPORTANT message from API route")

  return NextResponse.json({
    success: true,
    message: "Logger test executed. Check server console for output.",
    environment: process.env.NODE_ENV,
    debug: process.env.DEBUG === "true",
  })
}
