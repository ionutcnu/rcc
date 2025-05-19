import { type NextRequest, NextResponse } from "next/server"
import { getDeletedCats } from "@/lib/server/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Use the server-side getDeletedCats function
    const deletedCats = await getDeletedCats()

    return NextResponse.json(deletedCats)
  } catch (error: any) {
    console.error("Error in cats/trash API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
