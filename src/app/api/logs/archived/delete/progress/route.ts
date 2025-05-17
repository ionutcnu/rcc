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

    console.log(`Checking progress for delete operation: ${operationId}`)

    // Get progress data from Redis
    const progressKey = `delete_progress:${operationId}`
    const progressData = await redis.get(progressKey)

    console.log(`Progress data for ${operationId}:`, progressData)

    if (!progressData) {
      return NextResponse.json(
        {
          inProgress: false,
          error: "No progress data found for this operation",
        },
        { status: 404 },
      )
    }

    // Parse progress data
    try {
      // Check if progressData is a string before parsing
      const progress = typeof progressData === "string" ? JSON.parse(progressData) : progressData
      return NextResponse.json(progress)
    } catch (error) {
      console.error(`Error parsing progress data: ${error}`, progressData)
      return NextResponse.json(
        {
          inProgress: false,
          error: "Invalid progress data",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error(`Error checking delete progress: ${error}`)
    return NextResponse.json(
      {
        error: "Failed to check delete progress",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
