import { NextResponse, type NextRequest } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { authService } from "@/lib/server/authService"

export async function GET(request: NextRequest) {
    try {
        // Verify the requester is an admin
        const isAdmin = await adminCheck(request)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // List all users
        const users = await authService.listUsers()

        return NextResponse.json({
            success: true,
            users,
        })
    } catch (error: any) {
        console.error("Error listing users:", error)
        return NextResponse.json(
          {
              success: false,
              error: error.message || "Failed to list users",
          },
          { status: 500 },
        )
    }
}
