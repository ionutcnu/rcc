import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

// Keep the existing GET handler for listing/searching users
export async function GET(request: Request) {
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

// Add the POST handler for user creation
export async function POST(request: Request) {
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

        // Parse request body
        let body
        try {
            body = await request.json()
            console.log("Request body:", JSON.stringify(body))
        } catch (e) {
            console.error("Error parsing request body:", e)
            return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
        }

        const { email, password, isAdmin: shouldBeAdmin = false, displayName } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
        }

        // Create user with properly handled undefined values
        const userData = {
            email,
            password,
            displayName: displayName || null, // Use null instead of undefined
            emailVerified: false,
            isAdmin: shouldBeAdmin || false,
        }

        console.log("Creating user with data:", JSON.stringify(userData))
        const userRecord = await authService.createUser(userData)

        if (!userRecord) {
            return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 })
        }

        // Set admin claims if requested
        if (shouldBeAdmin) {
            await authService.setUserAsAdmin(userRecord.uid, true)
        }

        return NextResponse.json({
            success: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName || null,
                isAdmin: shouldBeAdmin || false,
                disabled: userRecord.disabled || false,
            },
        })
    } catch (error: any) {
        console.error("Error creating user:", error)
        return NextResponse.json(
          {
              success: false,
              error: error.message || "Failed to create user",
          },
          { status: 500 },
        )
    }
}
