import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"

export async function POST(request: NextRequest) {
  try {
    console.log("Processing add cat request")

    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      console.log("Unauthorized access attempt to add cat")
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Admin privileges required to add cats",
        },
        { status: 403 },
      )
    }

    // Parse request body
    const catData = await request.json()

    // Validate required fields
    if (!catData.name) {
      console.log("Missing cat name in add request")
      return NextResponse.json({ error: "Cat name is required" }, { status: 400 })
    }

    console.log(`Adding new cat: ${catData.name}`)

    // Prepare cat data with timestamps
    const catWithTimestamps = {
      ...catData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    }

    // Add cat directly using admin SDK
    const docRef = await admin.db.collection("cats").add(catWithTimestamps)

    console.log(`Cat added successfully with ID: ${docRef.id}`)

    return NextResponse.json({
      success: true,
      message: "Cat added successfully",
      catId: docRef.id,
    })
  } catch (error: any) {
    console.error("Error in cats/add API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.code || "unknown_error",
      },
      { status: 500 },
    )
  }
}
