import { NextResponse } from "next/server"
import { getRecentActivity } from "@/lib/firebase/activityService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    const activity = await getRecentActivity(limit)

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 })
  }
}
