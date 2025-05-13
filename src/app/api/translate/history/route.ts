import { NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"
import type { NextRequest } from "next/server"

const USAGE_HISTORY_COLLECTION = "translation_usage_history"

export async function GET(request: NextRequest) {
  try {
    // Check if the user is an admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get usage history from Firestore
    const historyRef = admin.db.collection(USAGE_HISTORY_COLLECTION)
    const snapshot = await historyRef.orderBy("date", "desc").limit(30).get()

    const history = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        date: data.date,
        count: data.characterCount || 0,
      }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching translation usage history:", error)
    return NextResponse.json({ error: "Failed to fetch translation usage history" }, { status: 500 })
  }
}
