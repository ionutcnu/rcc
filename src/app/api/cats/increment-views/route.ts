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

    // Increment view count
    await incrementCatViews(id)

    return NextResponse.json({
      success: true,
      message: "View count incremented",
    })
  } catch (error: any) {
    console.error("Error in cats/increment-views API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
