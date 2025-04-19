import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function POST(request: Request) {
    try {
        // Verify the requester is an admin
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
        }

        const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie, true)
        const isAdmin = await isUserAdmin(decodedClaims.uid)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // Get user data from request
        const { uid, disabled } = await request.json()

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
        await admin.auth.updateUser(uid, { disabled })

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
