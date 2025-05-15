import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { adminDb } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

const SETTINGS_DOC_ID = "app_settings"

/**
 * GET /api/settings
 * Retrieves application settings
 * Optional query param: type=seo|firebase
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin - pass the request parameter
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get settings from Firestore
    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID)
    const settingsDoc = await settingsRef.get()

    if (!settingsDoc.exists) {
      // Create default settings if they don't exist
      const defaultSettings = {
        seo: {
          metaTitle: "",
          metaDescription: "",
          ogImage: "",
          googleAnalyticsId: "",
          updatedAt: FieldValue.serverTimestamp(),
        },
        firebase: {
          enableImageCompression: true,
          imageQuality: "medium",
          maxImageSize: 5,
          maxVideoSize: 20,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      }

      await settingsRef.set(defaultSettings)

      // Return the default settings (without the server timestamp)
      return NextResponse.json({
        seo: {
          metaTitle: "",
          metaDescription: "",
          ogImage: "",
          googleAnalyticsId: "",
        },
        firebase: {
          enableImageCompression: true,
          imageQuality: "medium",
          maxImageSize: 5,
          maxVideoSize: 20,
        },
      })
    }

    // Get settings data
    const settingsData = settingsDoc.data()

    // Log the data for debugging
    console.log("Settings data from Firestore:", settingsData)

    // Return the settings
    return NextResponse.json(settingsData)
  } catch (error) {
    console.error("Error getting settings:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}

/**
 * POST /api/settings
 * Updates application settings
 * Body: { type: "seo" | "firebase" | "all", data: any }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin - pass the request parameter
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate type
    if (!["seo", "firebase", "all"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'seo', 'firebase', or 'all'" }, { status: 400 })
    }

    // Get settings reference
    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID)

    // Update settings based on type
    if (type === "seo") {
      await settingsRef.update({
        "seo.metaTitle": data.metaTitle || "",
        "seo.metaDescription": data.metaDescription || "",
        "seo.ogImage": data.ogImage || "",
        "seo.googleAnalyticsId": data.googleAnalyticsId || "",
        "seo.updatedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else if (type === "firebase") {
      await settingsRef.update({
        "firebase.enableImageCompression": !!data.enableImageCompression,
        "firebase.imageQuality": data.imageQuality || "medium",
        "firebase.maxImageSize": Number(data.maxImageSize) || 5,
        "firebase.maxVideoSize": Number(data.maxVideoSize) || 20,
        "firebase.updatedAt": FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else if (type === "all") {
      // Update all settings
      await settingsRef.update({
        seo: {
          metaTitle: data.seo?.metaTitle || "",
          metaDescription: data.seo?.metaDescription || "",
          ogImage: data.seo?.ogImage || "",
          googleAnalyticsId: data.seo?.googleAnalyticsId || "",
          updatedAt: FieldValue.serverTimestamp(),
        },
        firebase: {
          enableImageCompression: !!data.firebase?.enableImageCompression,
          imageQuality: data.firebase?.imageQuality || "medium",
          maxImageSize: Number(data.firebase?.maxImageSize) || 5,
          maxVideoSize: Number(data.firebase?.maxVideoSize) || 20,
          updatedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({ success: true, type })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
