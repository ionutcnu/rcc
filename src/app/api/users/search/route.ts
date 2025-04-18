import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAuth } from "firebase-admin/auth"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function GET(request: Request) {
    try {
        // First, verify the requester is an admin
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

        // Get the email from the query string
        const { searchParams } = new URL(request.url)
        const email = searchParams.get("email")

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
        }

        // Search for the user by email
        try {
            const userRecord = await getAuth().getUserByEmail(email)

            // Check if the user has admin claim
            const isUserAdminStatus = userRecord.customClaims?.admin === true

            return NextResponse.json({
                success: true,
                users: [
                    {
                        uid: userRecord.uid,
                        email: userRecord.email,
                        displayName: userRecord.displayName,
                        isAdmin: isUserAdminStatus,
                    },
                ],
            })
        } catch (error: any) {
            if (error.code === "auth/user-not-found") {
                return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
            }
            throw error
        }
    } catch (error) {
        console.error("Error searching users:", error)
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
    }
}
