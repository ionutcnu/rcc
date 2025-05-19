import { type NextRequest, NextResponse } from "next/server"
import { getAllCats, getCatById } from "@/lib/server/catService"
import { adminCheck } from "@/lib/auth/admin-check"

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/cats - Request received")

    // Check for ID parameter
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const includeDeleted = searchParams.get("includeDeleted") === "true"

    console.log(`GET /api/cats - Parameters: id=${id}, includeDeleted=${includeDeleted}`)

    // If ID is provided, get specific cat
    if (id) {
      console.log(`GET /api/cats - Fetching cat with ID: ${id}`)
      const cat = await getCatById(id)
      if (!cat) {
        console.log(`GET /api/cats - Cat not found with ID: ${id}`)
        return NextResponse.json({ error: "Cat not found" }, { status: 404 })
      }
      return NextResponse.json(cat)
    }

    // Otherwise, get all cats
    // Only admins can see deleted cats
    if (includeDeleted) {
      console.log("GET /api/cats - includeDeleted=true, checking admin status")
      const isAdmin = await adminCheck(request)
      if (!isAdmin) {
        console.log("GET /api/cats - User is not admin, denying access to deleted cats")
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    console.log(`GET /api/cats - Fetching all cats, includeDeleted=${includeDeleted}`)
    const cats = await getAllCats(includeDeleted)
    console.log(`GET /api/cats - Found ${cats.length} cats`)

    return NextResponse.json(cats)
  } catch (error: any) {
    console.error("Error in cats API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
