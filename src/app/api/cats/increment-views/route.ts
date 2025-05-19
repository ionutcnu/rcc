import { type NextRequest, NextResponse } from "next/server"
import { incrementCatViews } from "@/lib/server/catService"
import { logError } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { catId } = body

    if (!catId) {
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    // Use the server-side incrementCatViews function
    await incrementCatViews(catId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error incrementing views:", error)

    // Log the error
    logError("Error incrementing views", {
      error: error.message,
      catId: (await request.json()).catId,
    })

    // Check for specific error types
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    if (error.code === "permission-denied" || error.message?.includes("PERMISSION_DENIED")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 })
  }
}
