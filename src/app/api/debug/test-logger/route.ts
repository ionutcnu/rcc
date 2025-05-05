import { NextResponse } from "next/server"
import { devLog, devError, devWarn, devInfo, alwaysLog } from "@/lib/utils/debug-logger"

export async function GET() {
  // Test all logger functions
  devLog("This is a test log message")
  devError("This is a test error message")
  devWarn("This is a test warning message")
  devInfo("This is a test info message")
  alwaysLog("This message should always appear regardless of environment")

  // Log the current NODE_ENV
  console.log("Current NODE_ENV:", process.env.NODE_ENV)

  return NextResponse.json({
    message: "Logger test executed",
    environment: process.env.NODE_ENV || "not set",
    isDevelopment: process.env.NODE_ENV !== "production",
  })
}
