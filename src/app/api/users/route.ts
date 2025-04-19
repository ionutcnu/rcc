import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function GET() {
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

        // List all users (with pagination if needed)
        // For simplicity, we're listing all users here, but in a real app you'd want to implement pagination
        const listUsersResult = await admin.auth.listUsers(1000)

        const users = listUsersResult.users.map((user) => {
            // Check if user has admin claim
            const isUserAdmin = user.customClaims?.admin === true

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAdmin: isUserAdmin,
                createdAt: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime,
                disabled: user.disabled,
            }
        })

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
