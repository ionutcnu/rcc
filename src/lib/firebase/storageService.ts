import { storage } from "./firebaseConfig"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"
import { collection, addDoc, getDocs, Timestamp, doc, deleteDoc } from "firebase/firestore"
import { db } from "./firebaseConfig"
import { getSettings } from "./settingsService"

// Add this import at the top of the file
import { mediaLogger } from "@/lib/utils/media-logger"
import { auth } from "@/lib/firebase/firebaseConfig"

// Check if storage is initialized
if (!storage) {
    throw new Error("Firebase Storage is not initialized. Make sure you're running in a browser environment.")
}

// Define media item type
export interface MediaItem {
    id: string
    name: string
    url: string
    type: "image" | "video"
    catId?: string
    catName?: string
    size?: string
    createdAt: Date
    path: string
}

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * @param file The file to upload
 * @param folder The folder path in storage
 * @returns Promise with the download URL
 */
export async function uploadFileAndGetURL(file: File, folder: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            // Fetch current settings to get image quality setting
            const settings = await getSettings()
            const { imageQuality, maxImageSize, maxVideoSize, enableImageCompression } = settings.firebase

            // Check file size based on file type
            const fileSizeInMB = file.size / (1024 * 1024)
            const isImage = file.type.startsWith("image/")
            const isVideo = file.type.startsWith("video/")
            const maxAllowedSize = isImage ? maxImageSize : maxVideoSize

            if (fileSizeInMB > maxAllowedSize) {
                throw new Error(
                    `File size exceeds the maximum allowed size of ${maxAllowedSize}MB for ${isImage ? "images" : "videos"}`,
                )
            }

            // Create a unique file name
            const uniqueName = `${uuidv4()}-${file.name}`

            // Create a reference to the file location
            const storageRef = ref(storage, `${folder}/${uniqueName}`)

            console.log(`Starting upload for ${file.name} to ${folder}/${uniqueName}`)

            let fileToUpload = file

            // Process image if it's an image and compression is enabled
            if (isImage && enableImageCompression) {
                try {
                    // Convert file to array buffer for processing
                    const arrayBuffer = await file.arrayBuffer()

                    // Create a canvas to resize/compress the image
                    const img = new Image()

                    // Create a promise to handle the image loading
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = URL.createObjectURL(file)
                    })

                    // Create canvas with original dimensions
                    const canvas = document.createElement("canvas")
                    canvas.width = img.width
                    canvas.height = img.height

                    // Get compression quality based on settings
                    let quality = 0.8 // default medium quality
                    if (imageQuality === "low") quality = 0.6
                    if (imageQuality === "high") quality = 0.9

                    // Draw and compress
                    const ctx = canvas.getContext("2d")
                    ctx?.drawImage(img, 0, 0)

                    // Convert to blob with quality setting
                    const blob = await new Promise<Blob>((resolve) => {
                        canvas.toBlob((blob) => resolve(blob as Blob), file.type, quality)
                    })

                    // Create new file from blob
                    fileToUpload = new File([blob], file.name, { type: file.type })

                    console.log(
                        `Image compressed: ${file.size} -> ${fileToUpload.size} bytes (${Math.round((fileToUpload.size / file.size) * 100)}% of original)`,
                    )
                } catch (err) {
                    console.warn("Image compression failed, uploading original file:", err)
                    // Continue with original file if compression fails
                }
            }

            // For videos, we'll just upload the original file without compression
            // No video compression code here - removed as requested

            // Upload the file with metadata
            const metadata = {
                contentType: fileToUpload.type,
            }

            const uploadTask = uploadBytesResumable(storageRef, fileToUpload, metadata)

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    // Track upload progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    console.log(`Upload progress for ${file.name}: ${progress.toFixed(2)}%`)
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error(`Error uploading ${file.name}:`, error)
                    console.error("Error code:", error.code)
                    console.error("Error message:", error.message)

                    // Check for specific error types
                    if (error.code === "storage/unauthorized") {
                        console.error("PERMISSION ERROR: Make sure your Firebase Storage rules allow write access")
                        console.error("Go to Firebase Console > Storage > Rules and set: allow read, write;")
                    }

                    // Log the error
                    const currentUser = auth.currentUser
                    mediaLogger.error(
                        `Upload failed for ${file.name}`,
                        {
                            error,
                            userEmail: currentUser?.email, // Include email directly in details
                        },
                        currentUser?.uid,
                    )

                    reject(error)
                },
                async () => {
                    // Handle successful uploads
                    console.log(`Upload completed successfully for ${file.name}!`)

                    try {
                        // Get the download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                        console.log(`Download URL for ${file.name}:`, downloadURL)

                        // Determine file type
                        const fileType = file.type.startsWith("image/") ? "image" : "video"

                        // Log the successful upload
                        const currentUser = auth.currentUser
                        const userId = currentUser?.uid || undefined
                        const userEmail = currentUser?.email || undefined

                        mediaLogger.info(
                            `Uploaded ${fileType}: ${file.name}`,
                            {
                                path: `${folder}/${uniqueName}`,
                                size: formatFileSize(file.size),
                                type: fileType,
                                userEmail: currentUser?.email, // Include email directly in details
                            },
                            currentUser?.uid,
                        )

                        // Add record to media collection
                        await addDoc(collection(db, "media"), {
                            name: file.name,
                            url: downloadURL,
                            type: fileType,
                            size: formatFileSize(file.size),
                            path: `${folder}/${uniqueName}`,
                            createdAt: Timestamp.now(),
                        })

                        resolve(downloadURL)
                    } catch (urlError) {
                        // Log the error
                        const currentUser = auth.currentUser
                        mediaLogger.error(
                            `Failed to get download URL for ${file.name}`,
                            {
                                urlError,
                                userEmail: currentUser?.email, // Include email directly in details
                            },
                            currentUser?.uid,
                        )

                        console.error(`Error getting download URL for ${file.name}:`, urlError)
                        reject(urlError)
                    }
                },
            )
        } catch (error) {
            // Log the error
            const currentUser = auth.currentUser
            mediaLogger.error(
                `Failed to initialize upload for ${file.name}`,
                {
                    error,
                    userEmail: currentUser?.email, // Include email directly in details
                },
                currentUser?.uid,
            )

            console.error("Error initializing upload:", error)
            reject(error)
        }
    })
}

// Add this function to safely check URLs without triggering cleanup
export async function validateMediaUrl(url: string): Promise<boolean> {
    if (!url || url.includes("placeholder")) {
        return true // Skip placeholder images
    }

    try {
        // Use a more reliable method to check if file exists
        // For Firebase Storage URLs, we can check if the file exists directly
        if (url.includes("firebasestorage.googleapis.com")) {
            // Extract the path and check if the file exists in storage
            const urlObj = new URL(url)
            const pathStartIndex = urlObj.pathname.indexOf("/o/") + 3

            if (pathStartIndex > 3) {
                let filePath = urlObj.pathname.substring(pathStartIndex)
                filePath = decodeURIComponent(filePath)

                // Check if file exists without trying to fetch the URL
                const fileRef = ref(storage, filePath)
                try {
                    // Just get metadata instead of full download
                    await getMetadata(fileRef)
                    return true
                } catch (error: any) {
                    // Only return false for "object-not-found" errors
                    return error.code !== "storage/object-not-found"
                }
            }
        }

        // For other URLs, assume they're valid without checking
        return true
    } catch (error) {
        console.error(`Error validating URL ${url}:`, error)
        // Assume URL is valid if we can't check it
        return true
    }
}

// Removed getSupportedVideoMimeType function as it's no longer needed

/**
 * Uploads a cat image to Firebase Storage with progress tracking
 * @param file The file to upload
 * @param catId The ID of the cat
 * @param type Optional type identifier (main, additional_1, etc.)
 * @returns Promise with the download URL
 */
export async function uploadCatImage(file: File, catId: string, type = "image"): Promise<string> {
    try {
        // Use the existing upload function with the cats folder
        return await uploadFileAndGetURL(file, `cats/${catId}/images`)
    } catch (error) {
        console.error("Error uploading cat image:", error)
        throw error
    }
}

/**
 * Uploads a cat video to Firebase Storage with progress tracking
 * @param file The file to upload
 * @param catId The ID of the cat
 * @param type Optional type identifier
 * @returns Promise with the download URL
 */
export async function uploadCatVideo(file: File, catId: string, type = "video"): Promise<string> {
    try {
        // Use the existing upload function with the cats/videos folder
        return await uploadFileAndGetURL(file, `cats/${catId}/videos`)
    } catch (error) {
        console.error("Error uploading cat video:", error)
        throw error
    }
}

/**
 * Deletes a file from Firebase Storage
 * @param fileUrl The URL of the file to delete
 * @returns Promise<boolean> indicating success
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<boolean> {
    if (!fileUrl || fileUrl.includes("placeholder")) {
        return false // Skip placeholder images or empty URLs
    }

    try {
        // Extract the file path from the URL
        const urlObj = new URL(fileUrl)

        // The path is in the pathname after "/o/"
        const pathStartIndex = urlObj.pathname.indexOf("/o/") + 3
        if (pathStartIndex > 3) {
            let filePath = urlObj.pathname.substring(pathStartIndex)

            // Decode the URL-encoded path
            filePath = decodeURIComponent(filePath)

            console.log(`Attempting to delete file: ${filePath}`)

            // Get user info for logging
            const currentUser = auth.currentUser
            const userId = currentUser?.uid || undefined
            const userEmail = currentUser?.email || undefined

            mediaLogger.warn(
                `Attempting to delete file from storage`,
                {
                    path: filePath,
                    userEmail, // Include email directly in details
                },
                userId,
            )

            try {
                // Create a reference to the file
                const fileRef = ref(storage, filePath)

                // Delete the file
                await deleteObject(fileRef)
                console.log(`Successfully deleted file: ${filePath}`)

                // Log the successful deletion
                mediaLogger.info(
                    `Successfully deleted file from storage`,
                    {
                        path: filePath,
                        userEmail, // Include email directly in details
                    },
                    userId,
                )

                return true
            } catch (deleteError: any) {
                // If the file doesn't exist, consider it a success
                if (deleteError.code === "storage/object-not-found") {
                    console.log(`File already deleted: ${filePath}`)

                    // Log the already deleted state
                    mediaLogger.info(
                        `File already deleted from storage`,
                        {
                            path: filePath,
                            userEmail, // Include email directly in details
                        },
                        userId,
                    )

                    return true
                }

                // Log the error
                mediaLogger.error(
                    `Failed to delete file from storage`,
                    {
                        path: filePath,
                        error: deleteError,
                        userEmail, // Include email directly in details
                    },
                    userId,
                )

                throw deleteError
            }
        }

        console.error(`Could not extract file path from URL: ${fileUrl}`)
        return false
    } catch (error) {
        // Get user info for logging
        const currentUser = auth.currentUser
        const userId = currentUser?.uid || undefined
        const userEmail = currentUser?.email || undefined

        // Log the error
        mediaLogger.error(
            `Error deleting file from URL`,
            {
                url: fileUrl,
                error,
                userEmail, // Include email directly in details
            },
            userId,
        )

        console.error(`Error deleting file ${fileUrl}:`, error)
        return false
    }
}

/**
 * Batch uploads multiple files and returns their URLs
 * @param files Array of files to upload
 * @param folder The folder path in storage
 * @returns Promise with array of download URLs
 */
export async function uploadMultipleFiles(files: File[], folder: string): Promise<string[]> {
    try {
        const uploadPromises = files.map((file) => uploadFileAndGetURL(file, folder))
        return await Promise.all(uploadPromises)
    } catch (error) {
        console.error("Error uploading multiple files:", error)
        throw error
    }
}

/**
 * Batch uploads multiple cat images
 * @param files Array of files to upload
 * @param catId The ID of the cat
 * @returns Promise with array of download URLs
 */
export async function uploadCatImages(files: File[], catId: string): Promise<string[]> {
    try {
        return await uploadMultipleFiles(files, `cats/${catId}/images`)
    } catch (error) {
        console.error(`Error uploading images for cat ${catId}:`, error)
        throw error
    }
}

/**
 * Batch uploads multiple cat videos
 * @param files Array of files to upload
 * @param catId The ID of the cat
 * @returns Promise with array of download URLs
 */
export async function uploadCatVideos(files: File[], catId: string): Promise<string[]> {
    try {
        return await uploadMultipleFiles(files, `cats/${catId}/videos`)
    } catch (error) {
        console.error(`Error uploading videos for cat ${catId}:`, error)
        throw error
    }
}

/**
 * Gets statistics about media files in storage
 * @returns Promise with media statistics
 */
export async function getMediaStats(): Promise<{ totalFiles: number; totalViews: number }> {
    try {
        // Get a reference to the media collection to count files
        const mediaRef = collection(db, "media")
        const mediaSnapshot = await getDocs(mediaRef)

        const totalFiles = mediaSnapshot.size

        // Get a reference to the cats collection to count views
        const catsRef = collection(db, "cats")
        const catsSnapshot = await getDocs(catsRef)

        let totalViews = 0
        catsSnapshot.forEach((doc) => {
            const cat = doc.data()
            if (cat.views) {
                totalViews += cat.views
            }
        })

        return { totalFiles, totalViews }
    } catch (error) {
        console.error("Error getting media stats:", error)
        return { totalFiles: 0, totalViews: 0 }
    }
}

/**
 * Gets all media files from Firestore
 * @returns Promise with array of media items
 */
export async function getAllMedia(): Promise<MediaItem[]> {
    try {
        // Get media from Firestore collection
        const mediaRef = collection(db, "media")
        const mediaSnapshot = await getDocs(mediaRef)

        if (mediaSnapshot.empty) {
            console.log("No media found in Firestore, fetching from Storage")
            return await fetchMediaFromStorage()
        }

        const mediaItems: MediaItem[] = []

        mediaSnapshot.forEach((doc) => {
            const data = doc.data()

            // Determine file type based on data or URL extension
            let fileType: "image" | "video" = "image"
            if (data.type) {
                fileType = data.type as "image" | "video"
            } else if (data.url) {
                // Fallback to checking URL extension
                const url = data.url.toLowerCase()
                if (url.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i)) {
                    fileType = "video"
                }
            }

            mediaItems.push({
                id: doc.id,
                name: data.name || "Unnamed file",
                url: data.url,
                type: fileType,
                catId: data.catId,
                catName: data.catName,
                size: data.size || "Unknown",
                createdAt: data.createdAt?.toDate() || new Date(),
                path: data.path || "",
            })
        })

        // Sort by creation date, newest first
        return mediaItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
        console.error("Error getting media:", error)
        return []
    }
}

/**
 * Fetches media directly from Firebase Storage
 * This is a fallback if the media collection doesn't exist
 */
async function fetchMediaFromStorage(): Promise<MediaItem[]> {
    try {
        // List all files in the cats directory
        const storageRef = ref(storage, "cats")
        const result = await listAll(storageRef)

        const mediaItems: MediaItem[] = []

        // Process each cat folder
        for (const catFolder of result.prefixes) {
            const catId = catFolder.name

            // List images
            const imagesRef = ref(storage, `cats/${catId}/images`)
            try {
                const imagesResult = await listAll(imagesRef)

                for (const imageRef of imagesResult.items) {
                    const url = await getDownloadURL(imageRef)
                    mediaItems.push({
                        id: imageRef.name,
                        name: imageRef.name,
                        url,
                        type: "image",
                        catId,
                        createdAt: new Date(),
                        path: `cats/${catId}/images/${imageRef.name}`,
                    })
                }
            } catch (e) {
                // Images folder might not exist, continue
            }

            // List videos
            const videosRef = ref(storage, `cats/${catId}/videos`)
            try {
                const videosResult = await listAll(videosRef)

                for (const videoRef of videosResult.items) {
                    const url = await getDownloadURL(videoRef)
                    mediaItems.push({
                        id: videoRef.name,
                        name: videoRef.name,
                        url,
                        type: "video",
                        catId,
                        createdAt: new Date(),
                        path: `cats/${catId}/videos/${videoRef.name}`,
                    })
                }
            } catch (e) {
                // Videos folder might not exist, continue
            }
        }

        // Also check the general images and videos folders
        try {
            const imagesRef = ref(storage, "images")
            const imagesResult = await listAll(imagesRef)

            for (const imageRef of imagesResult.items) {
                const url = await getDownloadURL(imageRef)
                mediaItems.push({
                    id: imageRef.name,
                    name: imageRef.name,
                    url,
                    type: "image",
                    createdAt: new Date(),
                    path: `images/${imageRef.name}`,
                })
            }
        } catch (e) {
            // Images folder might not exist
        }

        try {
            const videosRef = ref(storage, "videos")
            const videosResult = await listAll(videosRef)

            for (const videoRef of videosResult.items) {
                const url = await getDownloadURL(videoRef)
                mediaItems.push({
                    id: videoRef.name,
                    name: videoRef.name,
                    url,
                    type: "video",
                    createdAt: new Date(),
                    path: `videos/${videoRef.name}`,
                })
            }
        } catch (e) {
            // Videos folder might not exist
        }

        return mediaItems
    } catch (error) {
        console.error("Error fetching media from storage:", error)
        return []
    }
}

/**
 * Deletes a media item by ID
 * @param mediaId The ID of the media item to delete
 * @returns Promise<boolean> indicating success
 */
export async function deleteMedia(mediaItem: MediaItem): Promise<boolean> {
    try {
        const currentUser = auth.currentUser
        const userId = currentUser?.uid || undefined

        // Delete from Storage if path exists
        if (mediaItem.path) {
            try {
                const fileRef = ref(storage, mediaItem.path)
                await deleteObject(fileRef)
                console.log(`Deleted file from storage: ${mediaItem.path}`)

                // Log successful deletion
                mediaLogger.info(
                    `Deleted file from storage: ${mediaItem.path}`,
                    {
                        id: mediaItem.id,
                        name: mediaItem.name,
                    },
                    userId,
                )
            } catch (storageError: any) {
                // If the file doesn't exist (already deleted), just log and continue
                if (storageError.code === "storage/object-not-found") {
                    console.log(`File already deleted from storage: ${mediaItem.path}`)

                    // Log already deleted state
                    mediaLogger.info(
                        `File already deleted from storage: ${mediaItem.path}`,
                        {
                            id: mediaItem.id,
                            name: mediaItem.name,
                        },
                        userId,
                    )
                } else {
                    console.error(`Error deleting from storage: ${mediaItem.path}`, storageError)

                    // Log error
                    mediaLogger.error(`Error deleting from storage: ${mediaItem.path}`, storageError, userId)
                    // Continue with Firestore deletion even if Storage deletion fails
                }
            }
        } else if (mediaItem.url) {
            try {
                await deleteFileFromStorage(mediaItem.url)
            } catch (urlError) {
                console.log(`File may already be deleted or URL invalid: ${mediaItem.url}`)
                // Continue with Firestore deletion
            }
        }

        // Delete from Firestore
        try {
            const mediaDoc = doc(db, "media", mediaItem.id)
            await deleteDoc(mediaDoc)
            console.log(`Deleted media record from Firestore: ${mediaItem.id}`)

            // Log successful Firestore deletion
            mediaLogger.info(
                `Deleted media record from Firestore: ${mediaItem.id}`,
                {
                    name: mediaItem.name,
                    type: mediaItem.type,
                },
                userId,
            )

            return true
        } catch (firestoreError) {
            console.error(`Error deleting media from Firestore: ${mediaItem.id}`, firestoreError)

            // Log Firestore deletion error
            mediaLogger.error(`Error deleting media from Firestore: ${mediaItem.id}`, firestoreError, userId)

            return false
        }
    } catch (error) {
        console.error("Error in deleteMedia:", error)
        return false
    }
}

/**
 * Helper function to format file size
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
}
