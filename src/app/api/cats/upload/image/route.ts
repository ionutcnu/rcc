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
        { error: "Unauthorized", message: "Admin privileges required to upload images" },
        { status: 403 },
      )
    }

    // Handle file upload
    const formData = await request.formData()
    const file = formData.get("file") as File
    const catId = formData.get("catId") as string
    const type = (formData.get("type") as string) || "image"
    const isMainImage = formData.get("isMainImage") === "true"

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

    devLog(`Uploading ${type} for cat ${catId}, isMainImage: ${isMainImage}`)

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(buffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || "jpg"
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`

    // Define the storage path
    const storagePath = `cats/${catId}/images/${fileName}`

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

    // Update cat in Firestore if this is the main image
    if (isMainImage) {
      await admin.db.collection("cats").doc(catId).update({
        mainImage: url,
        updatedAt: new Date(),
      })

      devLog(`Updated cat ${catId} with new main image: ${url}`)
    } else {
      // Add to images array if not main image
      // Use FieldValue directly from firebase-admin/firestore
      await admin.db
        .collection("cats")
        .doc(catId)
        .update({
          images: FieldValue.arrayUnion(url),
          updatedAt: new Date(),
        })

      devLog(`Added image to cat ${catId} images array: ${url}`)
    }

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: url,
      isMainImage,
    })
  } catch (error: any) {
    devError("Error in cats/upload/image API:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
