"use server"

import { getServerStorage } from "@/lib/firebase/server-only"

export async function deleteFileFromStorage(url: string): Promise<boolean> {
  if (!url || url.includes("placeholder")) return false

  try {
    // Extract the file path from the URL
    const urlObj = new URL(url)
    const path = decodeURIComponent(urlObj.pathname)

    // Get only the file path portion after /o/
    const filePathIndex = path.indexOf("/o/") + 3
    if (filePathIndex > 3) {
      const filePath = path.substring(filePathIndex)

      console.log("Attempting to delete file:", filePath)

      // Get storage instance
      const storage = await getServerStorage()

      // Delete the file
      await storage.bucket().file(filePath).delete()

      console.log("Successfully deleted file:", filePath)
      return true
    }

    console.error("Could not extract file path from URL:", url)
    return false
  } catch (error) {
    console.error("Error deleting file:", error)

    // If the file is already deleted, consider it a success
    if (error instanceof Error && error.message && error.message.includes("No such object")) {
      console.log("File already deleted:", url)
      return true
    }

    return false
  }
}

export async function uploadFileAndGetURL(
  file: Buffer,
  path: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  try {
    // Get storage instance
    const storage = await getServerStorage()

    // Create full path
    const fullPath = `${path}/${fileName}`

    // Upload the file
    const fileRef = storage.bucket().file(fullPath)
    await fileRef.save(file, {
      contentType,
      metadata: {
        contentType,
      },
    })

    // Get the download URL
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "01-01-2100",
    })

    return url
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}
