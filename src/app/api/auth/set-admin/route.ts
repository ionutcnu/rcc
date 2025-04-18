import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAuth } from "firebase-admin/auth"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function POST(request: Request) {
    try {
        // First verify the requester is an admin
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get("session")?.value

        if (!sessionCookie) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
        }

        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true)
        const isAdmin = await isUserAdmin(decodedClaims.uid)

        if (!isAdmin) {
            return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 })
        }

        // Get the target user email and admin status from the request
        const { email, uid, admin } = await request.json()

        if (!email && !uid) {
            return NextResponse.json({ success: false, error: "Email or UID is required" }, { status: 400 })
        }

        // Get the user by email or uid
        let user
        if (email) {
            user = await getAuth().getUserByEmail(email)
        } else {
            user = await getAuth().getUser(uid)
        }

        // Set the admin status
        await getAuth().setCustomUserClaims(user.uid, { admin: !!admin })

        return NextResponse.json({ success: true })
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
