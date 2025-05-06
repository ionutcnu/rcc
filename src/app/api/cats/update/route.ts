import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"

export async function PUT(request: NextRequest) {
  try {
    console.log("Processing update cat request")

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      console.log("Unauthorized access attempt to update cat")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin privileges required to update cats",
        },
        { status: 403 },
      )
    }

    // Parse request body
    const data = await request.json()
    const { id, ...catData } = data

    // Validate required fields
    if (!id) {
      console.log("Missing cat ID in update request")
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    console.log(`Updating cat with ID: ${id}`)

    // Check if cat exists
    const catRef = admin.db.collection("cats").doc(id)
    const catDoc = await catRef.get()

    if (!catDoc.exists) {
      console.log(`Cat with ID ${id} not found`)
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    // Prepare cat data with timestamp
    const catWithTimestamp = {
      ...catData,
      updatedAt: new Date(),
    }

    // Update cat directly using admin SDK
    await catRef.update(catWithTimestamp)

    console.log(`Cat with ID ${id} updated successfully`)

    return NextResponse.json({
      success: true,
      message: "Cat updated successfully",
      id,
    })
  } catch (error: any) {
    console.error("Error in cats/update API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.code || "unknown_error",
      },
      { status: 500 },
    )
  }
}
