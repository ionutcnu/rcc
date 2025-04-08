// /lib/firebase/storageService.ts
import { storage } from "./firebaseConfig"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * @param file The file to upload
 * @param folder The folder path in storage
 * @returns Promise with the download URL
 */
export async function uploadFileAndGetURL(file: File, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Create a unique file name
            const uniqueName = `${uuidv4()}-${file.name}`

            // Create a reference to the file location
            const storageRef = ref(storage, `${folder}/${uniqueName}`)

            console.log(`Starting upload for ${file.name} to ${folder}/${uniqueName}`)

            // Upload the file with metadata
            const metadata = {
                contentType: file.type,
            }

            const uploadTask = uploadBytesResumable(storageRef, file, metadata)

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

                    reject(error)
                },
                async () => {
                    // Handle successful uploads
                    console.log(`Upload completed successfully for ${file.name}!`)

                    try {
                        // Get the download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                        console.log(`Download URL for ${file.name}:`, downloadURL)
                        resolve(downloadURL)
                    } catch (urlError) {
                        console.error(`Error getting download URL for ${file.name}:`, urlError)
                        reject(urlError)
                    }
                },
            )
        } catch (error) {
            console.error("Error initializing upload:", error)
            reject(error)
        }
    })
}

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

            // Create a reference to the file
            const fileRef = ref(storage, filePath)

            // Delete the file
            await deleteObject(fileRef)
            console.log(`Successfully deleted file: ${filePath}`)
            return true
        }

        console.error(`Could not extract file path from URL: ${fileUrl}`)
        return false
    } catch (error) {
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
