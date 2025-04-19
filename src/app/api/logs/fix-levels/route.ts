import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/firebaseConfig"
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"

export async function GET() {
    try {
        // Get all logs
        const logsRef = collection(db, "logs")
        const snapshot = await getDocs(logsRef)

        let updated = 0
        let errors = 0

        // Process each log
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data()

            // Check if level is valid
            if (!data.level || !["info", "warn", "error", "debug"].includes(data.level)) {
                try {
                    // Determine appropriate level based on message content
                    let newLevel = "info" // Default

                    const message = (data.message || "").toLowerCase()

                    if (message.includes("error") || message.includes("failed") || message.includes("exception")) {
                        newLevel = "error"
                    } else if (
                        message.includes("warn") ||
                        message.includes("attempt") ||
                        message.includes("delet") ||
                        message.includes("remove")
                    ) {
                        newLevel = "warn"
                    }

                    // Update the document
                    await updateDoc(doc(db, "logs", docSnap.id), {
                        level: newLevel,
                    })

                    updated++
                } catch (err) {
                    console.error(`Error updating log ${docSnap.id}:`, err)
                    errors++
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: snapshot.size,
            updated,
            errors,
        })
    } catch (error) {
        console.error("Error fixing log levels:", error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}
