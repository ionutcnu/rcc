import { type NextRequest, NextResponse } from "next/server"
import { getCatById, deleteCat } from "@/lib/server/catService"
import { adminCheck } from "@/lib/auth/admin-check"

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

    // Use the server-side deleteCat function
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
