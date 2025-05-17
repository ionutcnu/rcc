import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { redis } from "@/lib/redis"

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

    // Get progress from Redis
    const progressKey = `archive_progress:${operationId}`
    const progress = await redis.get(progressKey)

    if (!progress) {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 })
    }

    // Parse progress data
    const progressData = typeof progress === "string" ? JSON.parse(progress) : progress

    return NextResponse.json({
      inProgress: !progressData.completed && !progressData.error,
      ...progressData,
    })
  } catch (error: any) {
    console.error("Error getting archive progress:", error)
    return NextResponse.json(
      {
        error: "Failed to get archive progress",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
