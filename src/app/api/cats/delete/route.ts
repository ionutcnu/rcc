import { type NextRequest, NextResponse } from "next/server"
import { getCatById } from "@/lib/firebase/catService"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"

export async function DELETE(request: NextRequest) {
  try {
    console.log("Processing delete cat request")

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      console.log("Unauthorized access attempt to delete cat")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin privileges required to delete cats",
        },
        { status: 403 },
      )
    }

    // Get ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const permanent = searchParams.get("permanent") === "true"

    // Validate required fields
    if (!id) {
      console.log("Missing cat ID in delete request")
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    console.log(`Deleting cat with ID: ${id}, permanent: ${permanent}`)

    // Check if cat exists
    const existingCat = await getCatById(id)
    if (!existingCat) {
      console.log(`Cat with ID ${id} not found`)
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    // Delete cat from database using admin SDK directly
    if (permanent) {
      // Permanently delete the document
      await admin.db.collection("cats").doc(id).delete()
      console.log(`Cat with ID ${id} permanently deleted`)
    } else {
      // Soft delete - mark as deleted
      await admin.db.collection("cats").doc(id).update({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      console.log(`Cat with ID ${id} moved to trash`)
    }

    return NextResponse.json({
      success: true,
      message: permanent ? "Cat permanently deleted" : "Cat moved to trash",
    })
  } catch (error: any) {
    console.error("Error in cats/delete API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
