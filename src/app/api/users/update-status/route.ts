import { NextResponse, type NextRequest } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { authService } from "@/lib/server/authService"

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is an admin
    const isAdmin = await adminCheck(request)

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
    }

    // Get user data from request
    const body = await request.json().catch(() => ({}))
    const { uid, disabled } = body

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    // Update the user's disabled status
    const success = await authService.updateUser(uid, { disabled })

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update user status",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `User ${disabled ? "disabled" : "enabled"} successfully`,
    })
  } catch (error: any) {
    console.error("Error updating user status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update user status",
      },
      { status: 500 },
    )
  }
}
