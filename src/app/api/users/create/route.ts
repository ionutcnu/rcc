import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { admin } from "@/lib/firebase/admin"
import { isUserAdmin } from "@/lib/auth/admin-check"

// Keep the existing GET handler for listing/searching users
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

// Add the POST handler for user creation
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

        // Parse request body
        const { email, password, isAdmin: shouldBeAdmin = false, displayName } = await request.json()

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
        }

        // Create user in Firebase Auth
        const userRecord = await admin.auth.createUser({
            email,
            password,
            displayName: displayName || undefined,
            emailVerified: false,
        })

        // Set admin claims if requested
        if (shouldBeAdmin) {
            await admin.auth.setCustomUserClaims(userRecord.uid, { admin: true })
        }

        return NextResponse.json({
            success: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                isAdmin: shouldBeAdmin,
                disabled: userRecord.disabled,
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
