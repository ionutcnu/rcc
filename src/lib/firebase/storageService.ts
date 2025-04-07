// /lib/firebase/storageService.ts
import { storage } from "./firebaseConfig"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"

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

