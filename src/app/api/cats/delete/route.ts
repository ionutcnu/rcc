import { type NextRequest, NextResponse } from "next/server"
import { deleteCat, getCatById } from "@/lib/firebase/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const permanent = searchParams.get("permanent") === "true"

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    // Check if cat exists
    const existingCat = await getCatById(id)
    if (!existingCat) {
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    // Delete cat from database
    await deleteCat(id, permanent)

    return NextResponse.json({
      success: true,
      message: permanent ? "Cat permanently deleted" : "Cat moved to trash",
    })
  } catch (error: any) {
    console.error("Error in cats/delete API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
