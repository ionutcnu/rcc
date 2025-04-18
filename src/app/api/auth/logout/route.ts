import { NextResponse } from "next/server"

export async function POST() {
    try {
        // Create response
        const response = NextResponse.json({ success: true })

        // Clear the session cookie
        response.cookies.set({
            name: "session",
            value: "",
            expires: new Date(0),
            path: "/",
        })

        return response
    } catch (error) {
        console.error("Logout error:", error)
        return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 })
    }
}
