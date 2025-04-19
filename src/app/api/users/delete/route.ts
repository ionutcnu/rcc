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

        // Get user ID from request
        const { uid } = await request.json()

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
        await admin.auth.deleteUser(uid)

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
