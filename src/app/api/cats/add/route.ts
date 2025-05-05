import { type NextRequest, NextResponse } from "next/server"
import { admin } from "@/lib/firebase/admin"
import { adminCheck } from "@/lib/auth/admin-check"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)

    if (!isAdmin) {
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
      return NextResponse.json({ error: "Cat name is required" }, { status: 400 })
    }

    // Prepare cat data with timestamps
    const catWithTimestamps = {
      ...catData,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      views: 0,
    }

    // Add cat directly using admin SDK
    const docRef = await admin.db.collection("cats").add(catWithTimestamps)

    return NextResponse.json({
      success: true,
      message: "Cat added successfully",
      catId: docRef.id,
    })
  } catch (error: any) {
    console.error("Error in cats/add API:", error)

    return NextResponse.json(
      {
        error: "Failed to add cat",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
