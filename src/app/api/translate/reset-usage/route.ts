import { NextResponse } from "next/server"
import { resetUsageTracking } from "@/lib/i18n/usageTracker"
import { adminAuth } from "@/lib/firebase/admin"

export async function POST(request: Request) {
    try {
        // Get the session token from the request
        const authHeader = request.headers.get("authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split("Bearer ")[1]

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(token)

        // Check if the user is an admin
        if (!decodedToken.admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Reset the usage tracking
        await resetUsageTracking()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error resetting usage tracking:", error)
        return NextResponse.json({ error: "Failed to reset usage tracking" }, { status: 500 })
    }
}
