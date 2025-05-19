import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { restoreMediaFromTrash } from "@/lib/server/mediaService"

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

    // Get request body
    const body = await request.json()
    const { mediaId } = body

    // Validate required fields
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    // Restore the media from trash
    const result = await restoreMediaFromTrash(mediaId, session.uid)

    if (!result.success) {
      return NextResponse.json({ error: result.message, details: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in restore from trash API:", error)
    return NextResponse.json(
      {
        error: "Failed to restore media from trash",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
