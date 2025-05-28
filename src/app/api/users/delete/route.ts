import { NextResponse, type NextRequest } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { authService } from "@/lib/server/authService"
import { validateServerSideSession } from "@/lib/middleware/sessionValidator"

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const isAdmin = await adminCheck(request)

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
    const sessionCookie = request.cookies.get("session")?.value
    if (sessionCookie) {
      const sessionValidation = await validateServerSideSession(sessionCookie)
      if (sessionValidation.valid && uid === sessionValidation.uid) {
        return NextResponse.json(
          {
            success: false,
            error: "You cannot delete your own account",
          },
          { status: 400 },
        )
      }
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
