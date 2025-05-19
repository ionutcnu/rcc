import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"

export async function GET() {
    try {
        // Get all cookies
        const cookieStore = await cookies()
        const allCookies = cookieStore.getAll()
        const sessionCookie = cookieStore.get("session")?.value

        // Basic cookie info
        const cookieInfo = {
            allCookies: allCookies.map((c) => ({
                name: c.name,
                value: c.name === "session" ? "***" : c.value.substring(0, 5) + "...",
            })),
            hasSessionCookie: !!sessionCookie,
            sessionCookieLength: sessionCookie ? sessionCookie.length : 0,
        }

        // If we have a session cookie, try to verify it
        let sessionInfo = null
        if (sessionCookie) {
            try {
                const decodedClaims = await authService.verifySessionToken(sessionCookie)

                if (decodedClaims && decodedClaims.uid) {
                    const uid = decodedClaims.uid
                    const userRecord = await authService.getUserById(uid)
                    const isAdmin = await authService.isUserAdmin(uid)

                    sessionInfo = {
                        valid: true,
                        uid: uid,
                        email: userRecord?.email || "",
                        isAdmin: isAdmin,
                        expiresAt: new Date(decodedClaims.exp * 1000).toISOString(),
                        claims: decodedClaims,
                    }
                } else {
                    sessionInfo = {
                        valid: false,
                        error: "Invalid session token",
                    }
                }
            } catch (error: any) {
                sessionInfo = {
                    valid: false,
                    error: error.message || "Unknown error",
                    errorCode: error.code,
                }
            }
        }

        return NextResponse.json({
            cookies: cookieInfo,
            session: sessionInfo,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        return NextResponse.json(
          {
              error: error.message || "Unknown error",
              stack: error.stack,
          },
          { status: 500 },
        )
    }
}
