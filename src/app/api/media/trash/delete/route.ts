import { type NextRequest, NextResponse } from "next/server"
import { verifySessionCookie } from "@/lib/auth/session"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { deleteMediaPermanently } from "@/lib/server/mediaService"

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

    // Delete the media permanently
    const result = await deleteMediaPermanently(mediaId, session.uid)

    if (!result.success) {
      // If media is locked, return a specific error
      if (result.locked) {
        return NextResponse.json(
          { error: result.message, locked: true, lockedReason: result.lockedReason },
          { status: 403 },
        )
      }

      return NextResponse.json({ error: result.message, details: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in delete media API:", error)
    return NextResponse.json(
      { error: "Failed to delete media", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
