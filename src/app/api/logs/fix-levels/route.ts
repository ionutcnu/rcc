import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase/admin"
import { getAuth } from "firebase-admin/auth"

export async function GET(request: NextRequest) {
    try {
        // Verify session
        const sessionCookie = request.cookies.get("session")?.value
        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        try {
            // Verify the session cookie
            const auth = getAuth()
            const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

            // Check if user is admin
            const userRecord = await auth.getUser(decodedClaims.uid)
            const isAdmin = userRecord.customClaims?.admin === true

            if (!isAdmin) {
                return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
            }
        } catch (error) {
            console.error("Session verification failed:", error)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get logs without a level
        const snapshot = await adminDb.collection("logs").where("level", "==", null).limit(500).get()

        if (snapshot.empty) {
            return NextResponse.json({ success: true, updated: 0, message: "No logs need fixing" })
        }

        // Batch updates for better performance
        const batch = adminDb.batch()
        let updatedCount = 0

        snapshot.docs.forEach((doc) => {
            const data = doc.data()

            // Determine the appropriate level
            let level = "info" // Default level

            // Check message content for error indicators
            const message = (data.message || "").toLowerCase()
            if (message.includes("error") || message.includes("fail") || message.includes("exception")) {
                level = "error"
            } else if (message.includes("warn") || message.includes("caution") || message.includes("attention")) {
                level = "warn"
            }

            // Check if this is a cat activity log
            if (data.details?.actionType || data.actionType) {
                // Don't change level for cat activity logs
                // Just ensure they have a level set
                if (!data.level) {
                    batch.update(doc.ref, { level: "info" })
                    updatedCount++
                }
            } else {
                // Update the level
                batch.update(doc.ref, { level })
                updatedCount++
            }
        })

        // Commit the batch
        await batch.commit()

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            message: `Fixed ${updatedCount} log entries`,
        })
    } catch (error) {
        console.error("Error fixing log levels:", error)
        return NextResponse.json(
          {
              success: false,
              error: "Failed to fix log levels",
              message: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
    }
}
