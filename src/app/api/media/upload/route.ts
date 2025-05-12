import { type NextRequest, NextResponse } from "next/server"
import { adminCheck } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"
import { mediaLogger } from "@/lib/utils/media-logger"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const isAdmin = await adminCheck(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Admin privileges required to upload media" },
        { status: 403 },
      )
    }

    // Handle file upload
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "general"
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other"

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    console.log(`Uploading ${type} to folder ${folder}`)

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || (type === "image" ? "jpg" : "mp4")
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`

    // Define the storage path
    const storagePath = `media/${folder}/${fileName}`

    // Upload to Firebase Storage
    const bucket = admin.storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
    const fileRef = bucket.file(storagePath)

    // Upload the file
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    })

    // Generate a download URL
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""
    const encodedPath = encodeURIComponent(storagePath)

    // Make the file publicly accessible
    await fileRef.makePublic()

    // Generate a download URL in the same format as the client-side SDK
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`

    console.log("Generated download URL:", downloadUrl)

    // Create a media document in Firestore
    const mediaDoc = {
      name: file.name,
      type,
      url: downloadUrl,
      path: storagePath,
      folder,
      size: file.size,
      contentType: file.type,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      locked: false,
    }

    // Add to Firestore
    const mediaRef = await admin.db.collection("media").add(mediaDoc)

    // Log the upload
    mediaLogger.info(`Uploaded media: ${file.name}`, { mediaId: mediaRef.id, type, size: file.size }, "SYSTEM")

    return NextResponse.json({
      success: true,
      message: "Media uploaded successfully",
      mediaId: mediaRef.id,
      mediaUrl: downloadUrl,
      mediaDoc,
    })
  } catch (error: any) {
    console.error("Error in media/upload API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
