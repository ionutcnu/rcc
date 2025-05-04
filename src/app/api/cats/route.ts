import { type NextRequest, NextResponse } from "next/server"
import { getAllCats, getCatById } from "@/lib/firebase/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function GET(request: NextRequest) {
  try {
    // Check for ID parameter
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    // If ID is provided, get specific cat
    if (id) {
      const cat = await getCatById(id)
      if (!cat) {
        return NextResponse.json({ error: "Cat not found" }, { status: 404 })
      }
      return NextResponse.json(cat)
    }

    // Otherwise, get all cats
    // Only admins can see deleted cats
    if (includeDeleted) {
      const isAdmin = await adminCheck(request)
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    const cats = await getAllCats(includeDeleted)
    return NextResponse.json(cats)
  } catch (error: any) {
    console.error("Error in cats API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
