import { type NextRequest, NextResponse } from "next/server"
import { incrementCatViews, getCatById } from "@/lib/firebase/catService"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json()
    const { id } = data

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    // Check if cat exists
    const existingCat = await getCatById(id)
    if (!existingCat) {
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    try {
      // Increment view count
      await incrementCatViews(id)

      return NextResponse.json({
        success: true,
        message: "View count incremented",
      })
    } catch (error: any) {
      console.error(`Error incrementing views for cat ${id}:`, error)

      // Check if it's a permission error
      if (error.code === "permission-denied" || (error.message && error.message.includes("PERMISSION_DENIED"))) {
        return NextResponse.json(
          {
            success: false,
            message: "Could not increment view count due to permission restrictions",
            error: "permission-denied",
          },
          { status: 403 },
        )
      }

      // For other errors
      return NextResponse.json({ error: error.message || "Failed to increment view count" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error in cats/increment-views API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
