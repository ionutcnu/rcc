import { type NextRequest, NextResponse } from "next/server"
import { addCat } from "@/lib/firebase/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parse request body
    const catData = await request.json()

    // Validate required fields
    if (!catData.name) {
      return NextResponse.json({ error: "Cat name is required" }, { status: 400 })
    }

    // Add cat to database
    const catId = await addCat(catData)

    return NextResponse.json({
      success: true,
      message: "Cat added successfully",
      catId,
    })
  } catch (error: any) {
    console.error("Error in cats/add API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
