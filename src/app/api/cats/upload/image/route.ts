import { type NextRequest, NextResponse } from "next/server"
import { uploadCatImage, getCatById } from "@/lib/firebase/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Handle file upload
    const formData = await request.formData()
    const file = formData.get("file") as File
    const catId = formData.get("catId") as string
    const type = (formData.get("type") as string) || "image"

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!catId) {
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    // Check if cat exists
    const existingCat = await getCatById(catId)
    if (!existingCat) {
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    // Upload image
    const imageUrl = await uploadCatImage(file, catId, type)

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl,
    })
  } catch (error: any) {
    console.error("Error in cats/upload/image API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
