import { type NextRequest, NextResponse } from "next/server"
import { getCatByName } from "@/lib/firebase/catService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "Name parameter is required" }, { status: 400 })
    }

    const cat = await getCatByName(name)
    if (!cat) {
      return NextResponse.json({ error: "Cat not found" }, { status: 404 })
    }

    return NextResponse.json(cat)
  } catch (error: any) {
    console.error("Error in cats/by-name API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
