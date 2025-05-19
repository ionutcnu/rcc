import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { getCatById, updateCat } from "@/lib/server/catService"

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin privileges required to update cats",
        },
        { status: 403 },
      )
    }

    // Parse request body
    const catData = await request.json()

    // Validate required fields
    if (!catData.id) {
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    // Check if cat exists
    const existingCat = await getCatById(catData.id)
    if (!existingCat) {
      return NextResponse.json(
        { error: "Cat not found", message: `No cat found with ID: ${catData.id}` },
        { status: 404 },
      )
    }

    // Use the server-side updateCat function
    await updateCat(catData.id, catData)

    return NextResponse.json({
      success: true,
      message: "Cat updated successfully",
      catId: catData.id,
    })
  } catch (error: any) {
    console.error("Error in cats/update API:", error)

    return NextResponse.json(
      {
        error: "Failed to update cat",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
