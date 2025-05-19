import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function GET() {
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
