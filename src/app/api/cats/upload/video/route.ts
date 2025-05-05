import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { getCatById } from "@/lib/firebase/catService"
import { devLog, devError } from "@/lib/utils/debug-logger"
import { admin } from "@/lib/firebase/admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Admin privileges required to upload videos" },
        { status: 403 },
      )
    }

    // Handle file upload
    const formData = await request.formData()
    const file = formData.get("file") as File
    const catId = formData.get("catId") as string

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!catId) {
      return NextResponse.json({ error: "Cat ID is required" }, { status: 400 })
    }

    // Check if cat exists
    const existingCat = await getCatById(catId)
    if (!existingCat) {
      return NextResponse.json({ error: "Cat not found", message: `No cat found with ID: ${catId}` }, { status: 404 })
    }

    devLog(`Uploading video for cat ${catId}`)

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || "mp4"
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`

    // Define the storage path
    const storagePath = `cats/${catId}/videos/${fileName}`

    // Upload to Firebase Storage
    const bucket = admin.storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
    const fileRef = bucket.file(storagePath)

    // Upload the file
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    })

    // Get the public URL
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "01-01-2100", // Far future expiration
    })

    // Add to videos array
    await admin.db
      .collection("cats")
      .doc(catId)
      .update({
        videos: FieldValue.arrayUnion(url),
        updatedAt: new Date(),
      })

    devLog(`Added video to cat ${catId} videos array: ${url}`)

    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      videoUrl: url,
    })
  } catch (error: any) {
    devError("Error in cats/upload/video API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
