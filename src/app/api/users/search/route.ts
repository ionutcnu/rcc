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

        // Get the search query from the URL
        const { searchParams } = new URL(request.url)
        const query = searchParams.get("query")?.toLowerCase()

        // Get all users
        const users = await authService.listUsers()

        if (!query) {
            // If no query provided, return all users
            return NextResponse.json({
                success: true,
                users,
            })
        }

        // Filter users based on query
        const filteredUsers = users.filter((user) => {
            return (
              (user.email && user.email.toLowerCase().includes(query)) ||
              (user.displayName && user.displayName.toLowerCase().includes(query)) ||
              user.uid.toLowerCase().includes(query)
            )
        })

        return NextResponse.json({
            success: true,
            users: filteredUsers,
        })
    } catch (error: any) {
        console.error("Error searching users:", error)
        return NextResponse.json(
          {
              success: false,
              error: error.message || "Failed to search users",
          },
          { status: 500 },
        )
    }
}
