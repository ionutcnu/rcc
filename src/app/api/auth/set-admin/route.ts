import { NextResponse, type NextRequest } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { authService } from "@/lib/server/authService"

export async function POST(request: NextRequest) {
    try {
        // First verify the requester is an admin
        const isAdmin = await adminCheck(request)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // Get the target user email and admin status from the request
        const body = await request.json().catch(() => ({}))
        const { email, uid, admin } = body

        if (!email && !uid) {
            return NextResponse.json({ success: false, error: "Email or UID is required" }, { status: 400 })
        }

        // Get the user by email or uid
        let targetUser
        try {
            if (email) {
                targetUser = await authService.getUserByEmail(email)
            } else if (uid) {
                targetUser = await authService.getUserById(uid)
            }

            if (!targetUser || !targetUser.uid) {
                return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
            }

            // Set the admin status
            const success = await authService.setUserAsAdmin(targetUser.uid, !!admin)

            return NextResponse.json({ success })
        } catch (error: any) {
            console.error("Error getting user:", error)
            return NextResponse.json(
              {
                  success: false,
                  error: error.message || "User not found",
                  details: { email, uid },
              },
              { status: 404 },
            )
        }
    } catch (error: any) {
        console.error("Error setting admin status:", error)
        return NextResponse.json(
          {
              success: false,
              error: error.message || "Server error",
          },
          { status: 500 },
        )
    }
}
