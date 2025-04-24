import { NextResponse } from "next/server"
import { clearTranslationCache } from "@/lib/i18n/cache-service"
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

        // Clear the translation cache
        await clearTranslationCache()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error clearing translation cache:", error)
        return NextResponse.json({ error: "Failed to clear translation cache" }, { status: 500 })
    }
}
