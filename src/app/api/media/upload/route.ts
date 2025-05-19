import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { uploadMedia } from "@/lib/server/mediaService"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySessionCookie()
    if (!session.authenticated || !session.uid) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const admin = await isUserAdmin(session.uid)
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Parse the form data
    const formData = await request.formData()

    // Get the file from the form data
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get additional options
    const folder = (formData.get("folder") as string) || "general"
    const generateUniqueName = formData.get("generateUniqueName") !== "false" // Default to true

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload the file
    const mediaItem = await uploadMedia(buffer, file.name, file.type, session.uid, {
      folder,
      generateUniqueName,
    })

    return NextResponse.json({
      success: true,
      media: mediaItem,
    })
  } catch (error) {
    console.error("Error in upload media API:", error)
    return NextResponse.json(
      { error: "Failed to upload media", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
