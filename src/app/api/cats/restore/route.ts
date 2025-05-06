import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"

export async function POST(request: NextRequest) {
  try {
    console.log("Processing restore cat request")

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      console.log("Unauthorized access attempt to restore cat")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin privileges required to restore cats",
        },
        { status: 403 },
      )
    }

    // Parse request body
    const data = await request.json()
    const { id } = data

    // Validate required fields
    if (!id) {
      console.log("Missing cat ID in restore request")
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    console.log(`Attempting to restore cat with ID: ${id}`)

    // Check if cat exists
    const catRef = admin.db.collection("cats").doc(id)
    const catDoc = await catRef.get()

    if (!catDoc.exists) {
      console.log(`Cat with ID ${id} not found`)
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    // Restore cat from trash by updating isDeleted field
    await catRef.update({
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedAt: new Date(),
    })

    console.log(`Successfully restored cat with ID: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Cat restored successfully",
      catId: id,
    })
  } catch (error: any) {
    console.error("Error in cats/restore API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        code: error.code || "unknown_error",
      },
      { status: 500 },
    )
  }
}
