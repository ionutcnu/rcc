import { NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { adminDb } from "@/lib/firebase/admin"
import { format } from "date-fns"
import type { NextRequest } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

const USAGE_HISTORY_COLLECTION = "translation_usage_history"

export async function POST(request: NextRequest) {
  try {
    // Check if the user is an admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the current usage from the request body
    const { characterCount } = await request.json()

    if (typeof characterCount !== "number" || characterCount < 0) {
      return NextResponse.json({ error: "Invalid character count" }, { status: 400 })
    }

    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), "yyyy-MM-dd")

    // Check if we already have an entry for today
    const docRef = adminDb.collection(USAGE_HISTORY_COLLECTION).doc(today)
    const docSnap = await docRef.get()

    if (docSnap.exists) {
      // Update the existing entry
      await docRef.update({
        characterCount,
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else {
      // Create a new entry for today
      await docRef.set({
        date: today,
        characterCount,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({ success: true, date: today, characterCount })
  } catch (error) {
    console.error("Error recording translation usage:", error)
    return NextResponse.json({ error: "Failed to record usage" }, { status: 500 })
  }
}
