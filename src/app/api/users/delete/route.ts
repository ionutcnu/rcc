import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function POST(request: Request) {
  try {
    // Verify the requester is an admin
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const decodedClaims = await authService.verifySessionToken(sessionCookie)

    if (!decodedClaims || !decodedClaims.uid) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const isAdmin = await authService.isUserAdmin(decodedClaims.uid)

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
    }

    // Get user ID from request
    const body = await request.json().catch(() => ({}))
    const { uid } = body

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    // Prevent deleting yourself
    if (uid === decodedClaims.uid) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot delete your own account",
        },
        { status: 400 },
      )
    }

    // Delete the user
    const success = await authService.deleteUser(uid)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete user",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete user",
      },
      { status: 500 },
    )
  }
}
