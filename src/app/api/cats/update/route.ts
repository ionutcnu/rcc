import { type NextRequest, NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { adminCheck } from "@/lib/auth/admin-check"
import { getCatById } from "@/lib/firebase/catService"

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

    // Prepare cat data with updated timestamp
    const catWithTimestamp = {
      ...catData,
      updatedAt: new Date(),
    }

    // Remove id from the data to be updated
    const { id, ...updateData } = catWithTimestamp

    // Update cat directly using admin SDK
    await admin.db.collection("cats").doc(id).update(updateData)

    return NextResponse.json({
      success: true,
      message: "Cat updated successfully",
      catId: id,
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
