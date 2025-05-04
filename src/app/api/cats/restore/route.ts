import { type NextRequest, NextResponse } from "next/server"
import { restoreCat, getCatById } from "@/lib/firebase/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

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

    // Restore cat from trash
    await restoreCat(id)

    return NextResponse.json({
      success: true,
      message: "Cat restored successfully",
    })
  } catch (error: any) {
    console.error("Error in cats/restore API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
