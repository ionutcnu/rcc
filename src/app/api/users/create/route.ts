import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"
import { isUserAdmin } from "@/lib/auth/admin-check"

export async function GET(request: Request) {
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

        // Get the search query from the URL
        const { searchParams } = new URL(request.url)
        const query = searchParams.get("query")?.toLowerCase()

        if (!query) {
            // If no query provided, return all users
            const listUsersResult = await admin.auth.listUsers(1000)

            const users = listUsersResult.users.map((user) => {
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
        }

        // List all users and filter on the server side
        // Firebase Auth doesn't provide a direct search API, so we need to fetch all and filter
        const listUsersResult = await admin.auth.listUsers(1000)

        const filteredUsers = listUsersResult.users
            .filter((user) => {
                return (
                    (user.email && user.email.toLowerCase().includes(query)) ||
                    (user.displayName && user.displayName.toLowerCase().includes(query)) ||
                    user.uid.toLowerCase().includes(query)
                )
            })
            .map((user) => {
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
