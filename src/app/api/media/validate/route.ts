import { type NextRequest, NextResponse } from "next/server"
import { validateAllMedia } from "@/lib/utils/media-validator"
import { verifySessionCookie } from "@/lib/auth/session"
import { checkIsAdmin } from "@/lib/auth/admin-check"
import { serverLogger } from "@/lib/utils/server-logger"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await verifySessionCookie(request)
    if (!session.authenticated || !session.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin status
    const isAdmin = await checkIsAdmin(session.uid)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Log the API access
    await serverLogger.info(`API: Validating media`, { userId: session.uid })

    // Validate all media
    const results = await validateAllMedia()

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error validating media:", error)
    await serverLogger.error(`Error validating media`, { error })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
